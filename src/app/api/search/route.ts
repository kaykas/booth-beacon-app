import { NextRequest, NextResponse } from 'next/server';
import { createPublicServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

const RESULTS_PER_PAGE = 50;

interface SearchParams {
  query?: string;
  city?: string;
  country?: string;
  machineModel?: string;
  status?: string[];
  hasPhotos?: boolean | null;
  acceptsCash?: boolean | null;
  acceptsCard?: boolean | null;
  page?: number;
}

/**
 * GET /api/search
 * Performs paginated search on booths with filters
 *
 * Query parameters:
 * - q: Text search query
 * - city: Filter by city
 * - country: Filter by country
 * - model: Filter by machine model
 * - status: Comma-separated list of statuses
 * - hasPhotos: Filter by photo availability (true/false)
 * - cash: Filter by cash acceptance (true)
 * - card: Filter by card acceptance (true)
 * - page: Page number (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse search parameters
    const params: SearchParams = {
      query: searchParams.get('q') || undefined,
      city: searchParams.get('city') || undefined,
      country: searchParams.get('country') || undefined,
      machineModel: searchParams.get('model') || undefined,
      status: searchParams.get('status')?.split(',').filter(Boolean) || undefined,
      hasPhotos: searchParams.get('hasPhotos') === 'true' ? true :
                 searchParams.get('hasPhotos') === 'false' ? false : null,
      acceptsCash: searchParams.get('cash') === 'true' ? true : null,
      acceptsCard: searchParams.get('card') === 'true' ? true : null,
      page: parseInt(searchParams.get('page') || '1', 10),
    };

    // Validate page number
    const page = Math.max(1, params.page || 1);
    const from = (page - 1) * RESULTS_PER_PAGE;
    const to = from + RESULTS_PER_PAGE - 1;

    const supabase = createPublicServerClient();

    // Build query
    let query = supabase
      .from('booths')
      .select('*', { count: 'exact' });

    // Text search - search across name, city, country, address, description
    if (params.query?.trim()) {
      const searchTerm = params.query.trim();
      query = query.or(
        `name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
    }

    // City filter
    if (params.city) {
      query = query.eq('city', params.city);
    }

    // Country filter
    if (params.country) {
      query = query.eq('country', params.country);
    }

    // Machine model filter
    if (params.machineModel) {
      query = query.eq('machine_model', params.machineModel);
    }

    // Status filter (multiple)
    if (params.status && params.status.length > 0) {
      query = query.in('status', params.status);
    }

    // Photo availability filter
    if (params.hasPhotos === true) {
      query = query.or(
        'photo_exterior_url.not.is.null,photo_interior_url.not.is.null,ai_preview_url.not.is.null'
      );
    } else if (params.hasPhotos === false) {
      query = query
        .is('photo_exterior_url', null)
        .is('photo_interior_url', null)
        .is('ai_preview_url', null);
    }

    // Payment method filters
    if (params.acceptsCash === true) {
      query = query.eq('accepts_cash', true);
    }
    if (params.acceptsCard === true) {
      query = query.eq('accepts_card', true);
    }

    // Execute query with pagination
    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    // Calculate pagination metadata
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / RESULTS_PER_PAGE);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      booths: data || [],
      pagination: {
        page,
        perPage: RESULTS_PER_PAGE,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
        from: from + 1,
        to: Math.min(to + 1, totalCount),
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
