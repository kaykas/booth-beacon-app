/**
 * Google Maps URL Generation API
 *
 * Generates shareable Google Maps URLs for city-based photo booth tours.
 * Endpoint: /api/maps/city/[city]
 *
 * Example: /api/maps/city/san-francisco
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateCityTourMapUrl, getMapTitle, getMapDescription } from '@/lib/googleMapsUtils';
import { Booth } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface RouteParams {
  params: Promise<{
    city: string;
  }>;
}

/**
 * GET /api/maps/city/[city]
 *
 * Returns Google Maps URL and metadata for a city's booth tour
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { city: citySlug } = await params;

    // Convert slug to city name (e.g., "san-francisco" -> "San Francisco")
    const cityName = citySlug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Fetch active booths for this city
    const { data: booths, error } = await supabase
      .from('booths')
      .select('*')
      .eq('city', cityName)
      .eq('status', 'active')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch booth data' },
        { status: 500 }
      );
    }

    if (!booths || booths.length === 0) {
      return NextResponse.json(
        {
          error: 'No booths found',
          city: cityName,
          count: 0,
        },
        { status: 404 }
      );
    }

    // Generate the Google Maps URL
    const mapUrl = generateCityTourMapUrl({
      booths: booths as Booth[],
      city: cityName,
    });

    // Get editorial content
    const title = getMapTitle(cityName, booths.length);
    const description = getMapDescription(cityName, booths.length);

    // Return comprehensive response
    return NextResponse.json({
      success: true,
      city: cityName,
      boothCount: booths.length,
      mapUrl,
      title,
      description,
      attribution: 'Curated by Booth Beacon',
      booths: booths.map((booth: Booth) => ({
        id: booth.id,
        name: booth.name,
        address: booth.address,
        latitude: booth.latitude,
        longitude: booth.longitude,
      })),
    });
  } catch (error: unknown) {
    console.error('Error generating map URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}
