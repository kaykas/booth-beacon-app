import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Booth } from '@/types';

export const runtime = 'edge';

interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse viewport bounds
    const north = parseFloat(searchParams.get('north') || '');
    const south = parseFloat(searchParams.get('south') || '');
    const east = parseFloat(searchParams.get('east') || '');
    const west = parseFloat(searchParams.get('west') || '');

    // Validate bounds
    if (isNaN(north) || isNaN(south) || isNaN(east) || isNaN(west)) {
      return NextResponse.json(
        { error: 'Invalid viewport bounds. Required: north, south, east, west' },
        { status: 400 }
      );
    }

    // Validate logical bounds
    if (north <= south) {
      return NextResponse.json(
        { error: 'Invalid viewport: north must be greater than south' },
        { status: 400 }
      );
    }

    // Parse optional filters
    const status = searchParams.get('status') || 'all';
    const photoType = searchParams.get('photoType');
    const machineModel = searchParams.get('machineModel');
    const payment = searchParams.get('payment');
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500); // Max 500 booths per request

    // Build query with spatial filter
    let query = supabase
      .from('booths')
      .select('*')
      .gte('latitude', south)
      .lte('latitude', north)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(limit);

    // Handle longitude wrapping around dateline
    // If east < west, we're crossing the dateline (e.g., 170 to -170)
    if (east < west) {
      // Query for booths in either longitude >= west OR longitude <= east
      query = query.or(`longitude.gte.${west},longitude.lte.${east}`);
    } else {
      // Normal case: west < east
      query = query.gte('longitude', west).lte('longitude', east);
    }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply photo type filter
    if (photoType && photoType !== 'both') {
      query = query.eq('photo_type', photoType);
    }

    // Apply machine model filter
    if (machineModel) {
      query = query.eq('machine_model', machineModel);
    }

    // Apply payment filter
    if (payment === 'cash') {
      query = query.eq('accepts_cash', true);
    } else if (payment === 'card') {
      query = query.eq('accepts_card', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching booths by viewport:', error);
      return NextResponse.json(
        { error: 'Failed to fetch booths' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      booths: data as Booth[],
      count: data?.length || 0,
      viewport: { north, south, east, west },
      limit,
      hasMore: (data?.length || 0) >= limit,
    });

  } catch (error) {
    console.error('Error in viewport API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
