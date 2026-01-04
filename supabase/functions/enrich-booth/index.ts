/**
 * Booth Enrichment Edge Function
 * Enriches booth data with Google Maps/Places API information
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface EnrichmentRequest {
  boothId?: string;        // Single booth
  batch?: boolean;         // Batch mode (processes priority queue)
  limit?: number;          // Max booths to process in batch
}

interface EnrichmentResult {
  success: boolean;
  boothId?: string;
  placeId?: string;
  skipped?: boolean;
  reason?: string;
  enriched?: {
    phone: boolean;
    website: boolean;
    rating: boolean;
    photos: number;
    hours: boolean;
    streetView?: boolean;
  };
  error?: string;
}

async function enrichBooth(
  boothId: string,
  supabase: any,
  googleApiKey: string
): Promise<EnrichmentResult> {
  console.log(`[${boothId}] Starting enrichment...`);

  // 1. Get booth data
  const { data: booth, error: boothError } = await supabase
    .from('booths')
    .select('*')
    .eq('id', boothId)
    .single();

  if (boothError || !booth) {
    console.error(`[${boothId}] Booth not found:`, boothError);
    return {
      success: false,
      boothId,
      error: 'Booth not found',
    };
  }

  console.log(`[${boothId}] Found booth: ${booth.name}`);

  // 2. Check if recently enriched (skip if < 7 days to allow photo recovery)
  if (booth.enriched_at) {
    const lastEnriched = new Date(booth.enriched_at);
    const daysSince = (Date.now() - lastEnriched.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince < 7) {
      console.log(`[${boothId}] Recently enriched ${Math.floor(daysSince)} days ago, skipping`);
      return {
        success: true,
        boothId,
        skipped: true,
        reason: `Recently enriched (${Math.floor(daysSince)} days ago)`,
      };
    }
  }

  // 3. Record attempt in booth_enrichments
  const { error: upsertError } = await supabase
    .from('booth_enrichments')
    .upsert({
      booth_id: boothId,
      google_attempted_at: new Date().toISOString(),
    }, {
      onConflict: 'booth_id',
    });

  if (upsertError) {
    console.error(`[${boothId}] Failed to record attempt:`, upsertError);
  }

  try {
    // 4. Text Search - Find Place ID
    const searchQuery = `"${booth.name}" photo booth near ${booth.address || ''} ${booth.city}, ${booth.country}`.trim();
    console.log(`[${boothId}] Searching Google: ${searchQuery}`);

    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googleApiKey}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' || !searchData.results || searchData.results.length === 0) {
      throw new Error(`No Google Place found: ${searchData.status}`);
    }

    const placeId = searchData.results[0].place_id;
    console.log(`[${boothId}] Found place_id: ${placeId}`);

    // 5. Place Details - Get enrichment data
    const fields = [
      'name',
      'formatted_address',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'opening_hours',
      'rating',
      'user_ratings_total',
      'photos',
      'business_status',
      'url',
    ].join(',');

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${googleApiKey}`;

    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== 'OK' || !detailsData.result) {
      throw new Error(`Place Details failed: ${detailsData.status}`);
    }

    const place = detailsData.result;
    console.log(`[${boothId}] Retrieved place details:`, {
      name: place.name,
      rating: place.rating,
      photos: place.photos?.length || 0,
      hasPhone: !!place.formatted_phone_number,
      hasWebsite: !!place.website,
      hasHours: !!place.opening_hours,
    });

    // 6. Download and host primary photo permanently
    let permanentPhotoUrl: string | null = null;

    if (place.photos && place.photos.length > 0) {
      console.log(`[${boothId}] Downloading primary photo...`);

      try {
        const firstPhoto = place.photos[0];
        const tempPhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${firstPhoto.photo_reference}&key=${googleApiKey}`;

        // Download photo from Google
        const photoResponse = await fetch(tempPhotoUrl);

        if (photoResponse.ok) {
          const photoBlob = await photoResponse.arrayBuffer();
          const photoBuffer = new Uint8Array(photoBlob);

          // Generate unique filename
          const hash = boothId.substring(0, 8);
          const filename = `booth-${hash}-exterior.jpg`;
          const storagePath = `booth-photos/${filename}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('booth-images')
            .upload(storagePath, photoBuffer, {
              contentType: 'image/jpeg',
              cacheControl: '31536000', // 1 year cache
              upsert: true, // Overwrite if exists
            });

          if (uploadError) {
            console.error(`[${boothId}] Failed to upload photo:`, uploadError);
          } else {
            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('booth-images')
              .getPublicUrl(storagePath);

            permanentPhotoUrl = publicUrlData.publicUrl;
            console.log(`[${boothId}] ✅ Photo hosted: ${permanentPhotoUrl.substring(0, 80)}...`);
          }
        } else {
          console.warn(`[${boothId}] Failed to download photo: ${photoResponse.status}`);
        }
      } catch (photoError: any) {
        console.error(`[${boothId}] Photo download error:`, photoError.message);
      }
    }

    // 7. Validate Street View availability
    let streetViewValidation: {
      available: boolean;
      panoramaId?: string;
      distance?: number;
      heading?: number;
    } | null = null;

    if (booth.latitude && booth.longitude) {
      console.log(`[${boothId}] Validating Street View...`);
      try {
        const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${booth.latitude},${booth.longitude}&radius=50&key=${googleApiKey}`;
        const streetViewResponse = await fetch(streetViewUrl);
        const streetViewData = await streetViewResponse.json();

        if (streetViewData.status === 'OK' && streetViewData.pano_id && streetViewData.location) {
          // Calculate distance from booth to panorama
          const R = 6371e3; // Earth radius in meters
          const φ1 = (booth.latitude * Math.PI) / 180;
          const φ2 = (streetViewData.location.lat * Math.PI) / 180;
          const Δφ = ((streetViewData.location.lat - booth.latitude) * Math.PI) / 180;
          const Δλ = ((streetViewData.location.lng - booth.longitude) * Math.PI) / 180;
          const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          // Calculate heading from panorama toward booth
          const y = Math.sin(Δλ) * Math.cos(φ2);
          const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
          const θ = Math.atan2(y, x);
          const heading = Math.round(((θ * 180) / Math.PI + 360) % 360);

          streetViewValidation = {
            available: true,
            panoramaId: streetViewData.pano_id,
            distance: Math.round(distance * 100) / 100,
            heading,
          };

          console.log(`[${boothId}] ✅ Street View: panorama ${streetViewData.pano_id} (${Math.round(distance)}m, ${heading}°)`);
        } else {
          streetViewValidation = { available: false };
          console.log(`[${boothId}] ⚠️  No Street View available`);
        }
      } catch (streetViewError: any) {
        console.error(`[${boothId}] Street View validation error:`, streetViewError.message);
      }
    }

    // 8. Format opening hours
    const formattedHours = place.opening_hours?.weekday_text?.join('\n') || null;

    // 9. Update booth with enrichment data (using only existing columns)
    const updateData: any = {
      phone: place.formatted_phone_number || place.international_phone_number || booth.phone,
      website: place.website || booth.website,
      google_place_id: placeId,
      google_rating: place.rating || null,
      hours: formattedHours || booth.hours,
      enriched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Only set photo_exterior_url if we successfully downloaded and hosted it
    if (permanentPhotoUrl) {
      updateData.photo_exterior_url = permanentPhotoUrl;
    }

    // Add Street View validation results (if columns exist)
    if (streetViewValidation) {
      updateData.street_view_available = streetViewValidation.available;
      updateData.street_view_validated_at = new Date().toISOString();
      if (streetViewValidation.available && streetViewValidation.panoramaId) {
        updateData.street_view_panorama_id = streetViewValidation.panoramaId;
        updateData.street_view_distance_meters = streetViewValidation.distance;
        updateData.street_view_heading = streetViewValidation.heading;
      }
    }

    const { error: updateError } = await supabase
      .from('booths')
      .update(updateData)
      .eq('id', boothId);

    if (updateError) {
      console.error(`[${boothId}] Failed to update booth:`, updateError);
      throw updateError;
    }

    // 10. Store full enrichment data in booth_enrichments
    const { error: enrichmentUpdateError } = await supabase
      .from('booth_enrichments')
      .update({
        google_enriched_at: new Date().toISOString(),
        google_place_id: placeId,
        google_data: place,
        google_error: null,
      })
      .eq('booth_id', boothId);

    if (enrichmentUpdateError) {
      console.error(`[${boothId}] Failed to update enrichment record:`, enrichmentUpdateError);
    }

    console.log(`[${boothId}] ✅ Enrichment complete`);

    // 11. Trigger on-demand ISR revalidation
    const revalidateToken = Deno.env.get('REVALIDATE_TOKEN');
    const appUrl = Deno.env.get('APP_URL') || 'https://boothbeacon.org';

    if (revalidateToken && booth.slug) {
      try {
        console.log(`[${boothId}] Triggering page revalidation...`);

        const revalidateUrl = `${appUrl}/api/revalidate?token=${revalidateToken}&path=/booth/${booth.slug}`;
        const revalidateResponse = await fetch(revalidateUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (revalidateResponse.ok) {
          console.log(`[${boothId}] ✅ Page revalidated successfully`);
        } else {
          const errorText = await revalidateResponse.text();
          console.warn(`[${boothId}] ⚠️  Revalidation failed: ${revalidateResponse.status} - ${errorText}`);
        }
      } catch (revalidateError: any) {
        console.warn(`[${boothId}] ⚠️  Revalidation error: ${revalidateError.message}`);
        // Don't fail enrichment if revalidation fails
      }
    } else {
      if (!revalidateToken) {
        console.log(`[${boothId}] ℹ️  Revalidation skipped (REVALIDATE_TOKEN not set)`);
      }
      if (!booth.slug) {
        console.warn(`[${boothId}] ⚠️  Revalidation skipped (no slug)`);
      }
    }

    return {
      success: true,
      boothId,
      placeId,
      enriched: {
        phone: !!place.formatted_phone_number,
        website: !!place.website,
        rating: !!place.rating,
        photos: permanentPhotoUrl ? 1 : 0,
        hours: !!formattedHours,
        streetView: streetViewValidation?.available || false,
      },
    };
  } catch (error: any) {
    console.error(`[${boothId}] Enrichment failed:`, error.message);

    // Record error in booth_enrichments
    await supabase
      .from('booth_enrichments')
      .update({
        google_error: error.message,
      })
      .eq('booth_id', boothId);

    return {
      success: false,
      boothId,
      error: error.message,
    };
  }
}

serve(async (req) => {
  try {
    // CORS headers
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

    const body: EnrichmentRequest = await req.json();

    // Single booth enrichment
    if (body.boothId) {
      console.log(`Processing single booth: ${body.boothId}`);
      const result = await enrichBooth(body.boothId, supabase, googleApiKey);

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Batch enrichment - process priority queue
    if (body.batch) {
      const limit = body.limit || 100;
      console.log(`Processing batch enrichment (limit: ${limit})`);

      // Get booths needing enrichment (priority order)
      // Priority: active booths with coordinates, not recently enriched
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const { data: booths, error: boothsError } = await supabase
        .from('booths')
        .select('id, name, city')
        .eq('status', 'active')
        .not('latitude', 'is', null)
        .or(`google_enriched_at.is.null,google_enriched_at.lt.${ninetyDaysAgo}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (boothsError) {
        console.error('Failed to fetch booths:', boothsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch booths', details: boothsError }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      console.log(`Found ${booths?.length || 0} booths to enrich`);

      const results: EnrichmentResult[] = [];

      for (const booth of booths || []) {
        console.log(`\n--- Processing ${booth.name} (${booth.city}) ---`);
        const result = await enrichBooth(booth.id, supabase, googleApiKey);
        results.push(result);

        // Rate limit: 1 second between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const summary = {
        processed: results.length,
        successful: results.filter((r) => r.success && !r.skipped).length,
        skipped: results.filter((r) => r.skipped).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };

      console.log('\n=== Batch Summary ===');
      console.log(`Processed: ${summary.processed}`);
      console.log(`Successful: ${summary.successful}`);
      console.log(`Skipped: ${summary.skipped}`);
      console.log(`Failed: ${summary.failed}`);

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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
