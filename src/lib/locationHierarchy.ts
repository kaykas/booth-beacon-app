/**
 * Location Hierarchy Library
 * Provides utilities for geographic booth organization with country/state/city hierarchy
 * Extends the collections.ts approach to include states and support the location pages
 */

import { createPublicServerClient } from '@/lib/supabase/client';
import { Booth } from '@/types';

export interface LocationStats {
  country: string;
  state?: string;
  city?: string;
  boothCount: number;
  operationalCount: number;
  geocodedCount: number;
  slug: string;
}

export interface LocationBooths {
  booths: Booth[];
  totalCount: number;
  hasMore: boolean;
  operationalCount?: number;
  geocodedCount?: number;
}

/**
 * Generate a URL-safe slug from location names
 */
export function generateLocationSlug(
  country: string,
  state?: string,
  city?: string
): string {
  const slugify = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const parts = [slugify(country)];
  if (state) parts.push(slugify(state));
  if (city) parts.push(slugify(city));

  return parts.join('/');
}

/**
 * Parse location from URL path segments
 */
export function parseLocationPath(segments: string[]): {
  country?: string;
  state?: string;
  city?: string;
} {
  const deslugify = (str: string) =>
    str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  if (!segments || segments.length === 0) {
    return {};
  }

  const result: { country?: string; state?: string; city?: string } = {
    country: deslugify(segments[0]),
  };

  if (segments.length > 1) {
    result.state = deslugify(segments[1]);
  }

  if (segments.length > 2) {
    result.city = deslugify(segments[2]);
  }

  return result;
}

/**
 * Get all countries with booth counts
 * Used for /locations index page
 */
export async function getCountries(): Promise<LocationStats[]> {
  try {
    const supabase = createPublicServerClient();

    const { data, error } = await supabase
      .from('booths')
      .select('country, status, is_operational, latitude, longitude')
      .not('country', 'is', null);

    if (error) {
      console.error('Error fetching countries:', error);
      return [];
    }

    // Aggregate stats per country
    const countryMap = new Map<
      string,
      { count: number; operational: number; geocoded: number }
    >();

    data?.forEach((booth: Booth) => {
      const stats = countryMap.get(booth.country) || {
        count: 0,
        operational: 0,
        geocoded: 0,
      };
      stats.count++;
      if (booth.status === 'active' && booth.is_operational) {
        stats.operational++;
      }
      if (booth.latitude && booth.longitude) {
        stats.geocoded++;
      }
      countryMap.set(booth.country, stats);
    });

    // Convert to array and sort by booth count
    return Array.from(countryMap.entries())
      .map(([country, stats]) => ({
        country,
        boothCount: stats.count,
        operationalCount: stats.operational,
        geocodedCount: stats.geocoded,
        slug: generateLocationSlug(country),
      }))
      .sort((a, b) => b.boothCount - a.boothCount);
  } catch (error) {
    console.error('Error in getCountries:', error);
    return [];
  }
}

/**
 * Get states for a specific country
 * Used for /locations/[country] page
 * Returns empty array if country has no states (e.g., Germany, UK)
 */
export async function getStates(country: string): Promise<LocationStats[]> {
  try {
    const supabase = createPublicServerClient();

    const { data, error } = await supabase
      .from('booths')
      .select('state, country, status, is_operational, latitude, longitude')
      .ilike('country', country)
      .not('state', 'is', null);

    if (error) {
      console.error('Error fetching states:', error);
      return [];
    }

    // If no results or all states are null, return empty array
    if (!data || data.length === 0) {
      return [];
    }

    // Aggregate stats per state
    const stateMap = new Map<
      string,
      { count: number; operational: number; geocoded: number }
    >();

    data?.forEach((booth: Booth) => {
      if (!booth.state) return; // Skip booths without state

      const stats = stateMap.get(booth.state) || {
        count: 0,
        operational: 0,
        geocoded: 0,
      };
      stats.count++;
      if (booth.status === 'active' && booth.is_operational) {
        stats.operational++;
      }
      if (booth.latitude && booth.longitude) {
        stats.geocoded++;
      }
      stateMap.set(booth.state, stats);
    });

    // Convert to array and sort by booth count
    return Array.from(stateMap.entries())
      .map(([state, stats]) => ({
        country,
        state,
        boothCount: stats.count,
        operationalCount: stats.operational,
        geocodedCount: stats.geocoded,
        slug: generateLocationSlug(country, state),
      }))
      .sort((a, b) => b.boothCount - a.boothCount);
  } catch (error) {
    console.error('Error in getStates:', error);
    return [];
  }
}

/**
 * Get cities for a specific country (and optionally state)
 * Used for /locations/[country] page (if no states) or /locations/[country]/[state] page
 */
export async function getCities(
  country: string,
  state?: string
): Promise<LocationStats[]> {
  try {
    const supabase = createPublicServerClient();

    let query = supabase
      .from('booths')
      .select('city, state, country, status, is_operational, latitude, longitude')
      .ilike('country', country)
      .not('city', 'is', null);

    // Add state filter if provided
    if (state) {
      query = query.ilike('state', state);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cities:', error);
      return [];
    }

    // Aggregate stats per city
    const cityMap = new Map<
      string,
      { count: number; operational: number; geocoded: number }
    >();

    data?.forEach((booth: Booth) => {
      const stats = cityMap.get(booth.city) || {
        count: 0,
        operational: 0,
        geocoded: 0,
      };
      stats.count++;
      if (booth.status === 'active' && booth.is_operational) {
        stats.operational++;
      }
      if (booth.latitude && booth.longitude) {
        stats.geocoded++;
      }
      cityMap.set(booth.city, stats);
    });

    // Convert to array and sort by booth count
    return Array.from(cityMap.entries())
      .map(([city, stats]) => ({
        country,
        state,
        city,
        boothCount: stats.count,
        operationalCount: stats.operational,
        geocodedCount: stats.geocoded,
        slug: generateLocationSlug(country, state, city),
      }))
      .sort((a, b) => b.boothCount - a.boothCount);
  } catch (error) {
    console.error('Error in getCities:', error);
    return [];
  }
}

/**
 * Get booths for a specific location (country, state, or city)
 * Used for all location pages to display actual booths
 */
export async function getLocationBooths(
  country: string,
  state?: string,
  city?: string,
  options: {
    sortBy?: 'recent' | 'alphabetical' | 'status';
    limit?: number;
    offset?: number;
  } = {}
): Promise<LocationBooths> {
  const { sortBy = 'status', limit = 100, offset = 0 } = options;

  try {
    const supabase = createPublicServerClient();

    let query = supabase
      .from('booths')
      .select('*', { count: 'exact' })
      .ilike('country', country);

    // Add state filter if provided
    if (state) {
      query = query.ilike('state', state);
    }

    // Add city filter if provided
    if (city) {
      query = query.ilike('city', city);
    }

    // Apply sorting
    if (sortBy === 'alphabetical') {
      query = query.order('name', { ascending: true });
    } else if (sortBy === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else {
      // Sort by status: active & operational first, then others
      query = query
        .order('is_operational', { ascending: false })
        .order('status', { ascending: true })
        .order('name', { ascending: true });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching location booths:', error);
      return {
        booths: [],
        totalCount: 0,
        hasMore: false,
        operationalCount: 0,
        geocodedCount: 0,
      };
    }

    const totalCount = count || 0;
    const hasMore = offset + limit < totalCount;

    // Calculate operational and geocoded counts separately for accurate stats
    // This is more efficient than fetching all booths
    let operationalQuery = supabase
      .from('booths')
      .select('id', { count: 'exact', head: true })
      .ilike('country', country)
      .eq('status', 'active')
      .eq('is_operational', true);

    if (state) {
      operationalQuery = operationalQuery.ilike('state', state);
    }
    if (city) {
      operationalQuery = operationalQuery.ilike('city', city);
    }

    let geocodedQuery = supabase
      .from('booths')
      .select('id', { count: 'exact', head: true })
      .ilike('country', country)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (state) {
      geocodedQuery = geocodedQuery.ilike('state', state);
    }
    if (city) {
      geocodedQuery = geocodedQuery.ilike('city', city);
    }

    const [{ count: opCount }, { count: geoCount }] = await Promise.all([
      operationalQuery,
      geocodedQuery,
    ]);

    return {
      booths: (data as Booth[]) || [],
      totalCount,
      hasMore,
      operationalCount: opCount || 0,
      geocodedCount: geoCount || 0,
    };
  } catch (error) {
    console.error('Error in getLocationBooths:', error);
    return {
      booths: [],
      totalCount: 0,
      hasMore: false,
      operationalCount: 0,
      geocodedCount: 0,
    };
  }
}

/**
 * Check if a country has states
 * Used to determine routing: should we show states or go directly to cities?
 */
export async function countryHasStates(country: string): Promise<boolean> {
  try {
    const supabase = createPublicServerClient();

    const { data, error } = await supabase
      .from('booths')
      .select('state')
      .ilike('country', country)
      .not('state', 'is', null)
      .limit(1);

    if (error) {
      console.error('Error checking country states:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error in countryHasStates:', error);
    return false;
  }
}

/**
 * Get location breadcrumb data
 * Used for building navigation breadcrumbs on location pages
 */
export function getLocationBreadcrumbs(
  country?: string,
  state?: string,
  city?: string
): Array<{ label: string; href: string }> {
  const breadcrumbs: Array<{ label: string; href: string }> = [
    { label: 'Locations', href: '/locations' },
  ];

  if (country) {
    breadcrumbs.push({
      label: country,
      href: `/locations/${generateLocationSlug(country)}`,
    });
  }

  if (state) {
    breadcrumbs.push({
      label: state,
      href: `/locations/${generateLocationSlug(country!, state)}`,
    });
  }

  if (city) {
    breadcrumbs.push({
      label: city,
      href: `/locations/${generateLocationSlug(country!, state, city)}`,
    });
  }

  return breadcrumbs;
}

/**
 * Get all booths with filtering for browse page
 * Supports comprehensive filtering including coordinates availability
 */
export async function getBrowseBooths(filters: {
  query?: string;
  country?: string;
  state?: string;
  city?: string;
  status?: string[];
  hasCoordinates?: boolean | null;
  acceptsCash?: boolean | null;
  acceptsCard?: boolean | null;
  sortBy?: 'recent' | 'alphabetical' | 'status';
  limit?: number;
  offset?: number;
}): Promise<LocationBooths> {
  const {
    query,
    country,
    state,
    city,
    status = [],
    hasCoordinates = null,
    acceptsCash = null,
    acceptsCard = null,
    sortBy = 'status',
    limit = 100,
    offset = 0,
  } = filters;

  try {
    const supabase = createPublicServerClient();

    let dbQuery = supabase.from('booths').select('*', { count: 'exact' });

    // Text search across name, city, country
    if (query && query.trim()) {
      const searchTerm = query.trim();
      dbQuery = dbQuery.or(
        `name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`
      );
    }

    // Location filters
    if (country) {
      dbQuery = dbQuery.ilike('country', country);
    }
    if (state) {
      dbQuery = dbQuery.ilike('state', state);
    }
    if (city) {
      dbQuery = dbQuery.ilike('city', city);
    }

    // Status filter
    if (status.length > 0) {
      dbQuery = dbQuery.in('status', status);
    }

    // Coordinates filter
    if (hasCoordinates === true) {
      dbQuery = dbQuery
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
    } else if (hasCoordinates === false) {
      dbQuery = dbQuery.or('latitude.is.null,longitude.is.null');
    }

    // Payment filters
    if (acceptsCash === true) {
      dbQuery = dbQuery.eq('accepts_cash', true);
    }
    if (acceptsCard === true) {
      dbQuery = dbQuery.eq('accepts_card', true);
    }

    // Apply sorting
    if (sortBy === 'alphabetical') {
      dbQuery = dbQuery.order('name', { ascending: true });
    } else if (sortBy === 'recent') {
      dbQuery = dbQuery.order('created_at', { ascending: false });
    } else {
      // Sort by status: active & operational first
      dbQuery = dbQuery
        .order('is_operational', { ascending: false })
        .order('status', { ascending: true })
        .order('name', { ascending: true });
    }

    // Apply pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error('Error fetching browse booths:', error);
      return {
        booths: [],
        totalCount: 0,
        hasMore: false,
        operationalCount: 0,
        geocodedCount: 0,
      };
    }

    const totalCount = count || 0;
    const hasMore = offset + limit < totalCount;

    return {
      booths: (data as Booth[]) || [],
      totalCount,
      hasMore,
    };
  } catch (error) {
    console.error('Error in getBrowseBooths:', error);
    return {
      booths: [],
      totalCount: 0,
      hasMore: false,
      operationalCount: 0,
      geocodedCount: 0,
    };
  }
}
