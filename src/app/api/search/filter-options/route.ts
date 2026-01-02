import { NextResponse } from 'next/server';
import { createPublicServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

interface FilterOptions {
  cities: string[];
  countries: string[];
  machineModels: string[];
}

/**
 * GET /api/search/filter-options
 * Returns unique filter options for the search page
 * This endpoint uses a single query with DISTINCT to avoid multiple table scans
 */
export async function GET() {
  try {
    const supabase = createPublicServerClient();

    // Use a single query with aggregation to get all unique values at once
    // This is MUCH more efficient than 3 separate queries
    const { data, error } = await supabase.rpc('get_filter_options');

    if (error) {
      // Fallback to separate queries if RPC doesn't exist
      console.warn('RPC get_filter_options not found, using fallback queries');
      return await getFallbackFilterOptions(supabase);
    }

    return NextResponse.json(data as FilterOptions, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}

/**
 * Fallback function that uses separate queries
 * This is still better than client-side queries because:
 * 1. It runs on the server (faster connection to DB)
 * 2. It can be cached with Next.js cache headers
 * 3. It runs in parallel
 */
async function getFallbackFilterOptions(supabase: ReturnType<typeof createPublicServerClient>): Promise<NextResponse> {
  try {
    // Run all three queries in parallel
    const [citiesResult, countriesResult, modelsResult] = await Promise.all([
      supabase
        .from('booths')
        .select('city')
        .not('city', 'is', null)
        .order('city'),
      supabase
        .from('booths')
        .select('country')
        .not('country', 'is', null)
        .order('country'),
      supabase
        .from('booths')
        .select('machine_model')
        .not('machine_model', 'is', null)
        .order('machine_model'),
    ]);

    if (citiesResult.error) throw citiesResult.error;
    if (countriesResult.error) throw countriesResult.error;
    if (modelsResult.error) throw modelsResult.error;

    // Get unique values
    const cities = Array.from(
      new Set(
        (citiesResult.data as Array<{ city: string }>)
          ?.map((b) => b.city)
          .filter(Boolean) || []
      )
    );

    const countries = Array.from(
      new Set(
        (countriesResult.data as Array<{ country: string }>)
          ?.map((b) => b.country)
          .filter(Boolean) || []
      )
    );

    const machineModels = Array.from(
      new Set(
        (modelsResult.data as Array<{ machine_model: string }>)
          ?.map((b) => b.machine_model)
          .filter(Boolean) || []
      )
    );

    const filterOptions: FilterOptions = {
      cities,
      countries,
      machineModels,
    };

    return NextResponse.json(filterOptions, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error in fallback filter options:', error);
    throw error;
  }
}
