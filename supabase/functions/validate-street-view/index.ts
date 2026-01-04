/**
 * Street View Validation Edge Function
 * Validates Street View availability for booth locations
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ValidationRequest {
  boothId?: string;  // Single booth
  batch?: boolean;   // Batch mode
  limit?: number;    // Max booths to process
}

interface ValidationResult {
  success: boolean;
  boothId: string;
  available: boolean;
  panoramaId?: string;
  distance?: number;
  heading?: number;
  error?: string;
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate heading from panorama toward booth
 */
function calculateHeading(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const φ1 = (fromLat * Math.PI) / 180;
  const φ2 = (toLat * Math.PI) / 180;
  const Δλ = ((toLng - fromLng) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const heading = ((θ * 180) / Math.PI + 360) % 360;

  return Math.round(heading);
}

/**
 * Validate Street View for a single booth
 */
async function validateBooth(
  booth: any,
  supabase: any,
  googleApiKey: string
): Promise<ValidationResult> {
  console.log(`[${booth.id}] Validating: ${booth.name}`);

  if (!booth.latitude || !booth.longitude) {
    return {
      success: false,
      boothId: booth.id,
      available: false,
      error: 'Missing coordinates',
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${booth.latitude},${booth.longitude}&radius=50&key=${googleApiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.pano_id && data.location) {
      const distance = calculateDistance(
        booth.latitude,
        booth.longitude,
        data.location.lat,
        data.location.lng
      );

      const heading = calculateHeading(
        data.location.lat,
        data.location.lng,
        booth.latitude,
        booth.longitude
      );

      console.log(`[${booth.id}] ✅ Panorama: ${data.pano_id} (${Math.round(distance)}m, ${heading}°)`);

      // Update database
      await supabase
        .from('booths')
        .update({
          street_view_available: true,
          street_view_panorama_id: data.pano_id,
          street_view_distance_meters: Math.round(distance * 100) / 100,
          street_view_heading: heading,
          street_view_validated_at: new Date().toISOString(),
        })
        .eq('id', booth.id);

      return {
        success: true,
        boothId: booth.id,
        available: true,
        panoramaId: data.pano_id,
        distance: Math.round(distance),
        heading,
      };
    } else {
      console.log(`[${booth.id}] ⚠️  No Street View (${data.status})`);

      await supabase
        .from('booths')
        .update({
          street_view_available: false,
          street_view_validated_at: new Date().toISOString(),
        })
        .eq('id', booth.id);

      return {
        success: true,
        boothId: booth.id,
        available: false,
      };
    }
  } catch (error: any) {
    console.error(`[${booth.id}] Error:`, error.message);
    return {
      success: false,
      boothId: booth.id,
      available: false,
      error: error.message,
    };
  }
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body: ValidationRequest = await req.json();

    // Single booth validation
    if (body.boothId) {
      const { data: booth, error } = await supabase
        .from('booths')
        .select('*')
        .eq('id', body.boothId)
        .single();

      if (error || !booth) {
        return new Response(
          JSON.stringify({ error: 'Booth not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const result = await validateBooth(booth, supabase, googleApiKey);

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Batch validation
    if (body.batch) {
      const limit = body.limit || 100;

      const { data: booths, error } = await supabase
        .from('booths')
        .select('id, name, slug, latitude, longitude, street_view_validated_at')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('street_view_validated_at', { ascending: true, nullsFirst: true })
        .limit(limit);

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch booths' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const results: ValidationResult[] = [];

      for (const booth of booths || []) {
        const result = await validateBooth(booth, supabase, googleApiKey);
        results.push(result);

        // Rate limit: 1 second between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const summary = {
        processed: results.length,
        successful: results.filter((r) => r.success).length,
        available: results.filter((r) => r.available).length,
        unavailable: results.filter((r) => !r.available && r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };

      return new Response(JSON.stringify(summary), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Missing boothId or batch parameter' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
