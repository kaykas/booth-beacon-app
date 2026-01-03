import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for direct database updates
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ValidationRequest {
  boothId: string;
  latitude: number;
  longitude: number;
}

interface ValidationResult {
  available: boolean;
  panoramaId?: string;
  distanceMeters?: number;
  heading?: number;
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Calculate heading (bearing) from point 1 to point 2
 * Returns heading in degrees (0-360)
 */
function calculateHeading(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360; // Normalize to 0-360
}

/**
 * Validate Street View availability using Google Street View Static API
 * This approach checks if a valid Street View image exists at the location
 */
async function validateStreetView(
  lat: number,
  lng: number
): Promise<ValidationResult> {
  const MAX_DISTANCE_METERS = 50;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY_BACKEND || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  try {
    // Use Street View Metadata API to check availability
    // This is more efficient than loading the full image
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=${MAX_DISTANCE_METERS}&source=outdoor&key=${apiKey}`;

    const response = await fetch(metadataUrl);
    const data = await response.json();

    // Check if Street View is available
    if (data.status === 'OK') {
      const panoLocation = data.location;
      const distance = calculateDistance(
        lat,
        lng,
        panoLocation.lat,
        panoLocation.lng
      );

      // Calculate optimal heading from panorama toward booth
      const heading = calculateHeading(
        panoLocation.lat,
        panoLocation.lng,
        lat,
        lng
      );

      return {
        available: distance <= MAX_DISTANCE_METERS,
        panoramaId: data.pano_id,
        distanceMeters: Math.round(distance * 100) / 100, // Round to 2 decimals
        heading: Math.round(heading * 100) / 100, // Round to 2 decimals
        location: {
          lat: panoLocation.lat,
          lng: panoLocation.lng,
        },
      };
    }

    // Street View not available
    return { available: false };
  } catch (error) {
    console.error('Error validating Street View:', error);
    throw new Error('Failed to validate Street View availability');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidationRequest = await request.json();
    const { boothId, latitude, longitude } = body;

    // Validate input
    if (!boothId || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields: boothId, latitude, longitude' },
        { status: 400 }
      );
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Validate Street View availability
    const result = await validateStreetView(latitude, longitude);

    // Store result in database
    const { error: updateError } = await supabase
      .from('booths')
      .update({
        street_view_available: result.available,
        street_view_panorama_id: result.panoramaId || null,
        street_view_distance_meters: result.distanceMeters || null,
        street_view_heading: result.heading || null,
        street_view_validated_at: new Date().toISOString(),
      })
      .eq('id', boothId);

    if (updateError) {
      console.error('Error updating booth:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booth validation data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      boothId,
      validation: result,
    });
  } catch (error) {
    console.error('Error in Street View validation API:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check validation status for a booth
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const boothId = searchParams.get('boothId');

  if (!boothId) {
    return NextResponse.json(
      { error: 'Missing boothId parameter' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('booths')
      .select(
        'id, name, street_view_available, street_view_panorama_id, street_view_distance_meters, street_view_heading, street_view_validated_at'
      )
      .eq('id', boothId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Booth not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      boothId: data.id,
      boothName: data.name,
      validation: {
        available: data.street_view_available,
        panoramaId: data.street_view_panorama_id,
        distanceMeters: data.street_view_distance_meters,
        heading: data.street_view_heading,
        validatedAt: data.street_view_validated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching validation status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validation status' },
      { status: 500 }
    );
  }
}
