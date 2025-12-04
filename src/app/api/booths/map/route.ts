import { NextResponse } from 'next/server';
import { createPublicServerClient } from '@/lib/supabase';

export const revalidate = 900;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 400);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const analogOnly = searchParams.get('analogOnly') === 'true';
  const verifiedSince = searchParams.get('verifiedSince');
  const operator = searchParams.get('operator');
  const machineModel = searchParams.get('machineModel');
  const status = searchParams.get('status');
  const boothType = searchParams.get('boothType');
  const bbox = searchParams
    .get('bbox')
    ?.split(',')
    .map((value) => Number.parseFloat(value.trim()))
    .filter((value) => !Number.isNaN(value));

  try {
    const supabase = createPublicServerClient();

    let query = supabase
      .from('booths')
      .select('*', { count: 'estimated' })
      .order('last_verified', { ascending: false, nullsLast: true })
      .order('updated_at', { ascending: false, nullsLast: true })
      .range(offset, offset + limit - 1);

    if (analogOnly) {
      query = query.in('booth_type', ['analog', 'chemical']);
    }

    if (boothType) {
      query = query.eq('booth_type', boothType);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (machineModel && machineModel !== 'all') {
      query = query.eq('machine_model', machineModel);
    }

    if (operator) {
      query = query.ilike('operator_name', `%${operator}%`);
    }

    if (verifiedSince) {
      query = query.or(
        `last_verified.gte.${verifiedSince},source_verified_date.gte.${verifiedSince},last_checked_at.gte.${verifiedSince}`
      );
    }

    if (bbox && bbox.length === 4) {
      const [south, west, north, east] = bbox;
      query = query
        .gte('latitude', south)
        .lte('latitude', north)
        .gte('longitude', west)
        .lte('longitude', east);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching clustered map booths:', error);
      return NextResponse.json({ data: [], error: error.message }, { status: 500 });
    }

    const hasMore = count ? offset + limit < count : (data?.length || 0) === limit;

    return NextResponse.json({ data, hasMore, count });
  } catch (error) {
    console.error('Unexpected error fetching map booths:', error);
    return NextResponse.json(
      { data: [], error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
