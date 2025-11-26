/**
 * Example usage of Supabase client and types
 * These examples demonstrate common patterns for querying the database
 */

import { supabase, createServerClient } from './client';
import type { Booth, BoothFilters, NearbyBoothsQuery, Operator, CityGuide } from './types';

// ============================================================================
// Client-Side Examples (use in client components)
// ============================================================================

/**
 * Fetch all active booths
 */
export async function fetchActiveBooths() {
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetch a single booth by ID with operator details
 */
export async function fetchBoothById(boothId: string) {
  const { data, error } = await supabase
    .from('booths')
    .select(`
      *,
      operator:operators(*)
    `)
    .eq('id', boothId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Search booths by city
 */
export async function searchBoothsByCity(city: string) {
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .ilike('city', `%${city}%`)
    .eq('status', 'active');

  if (error) throw error;
  return data;
}

/**
 * Filter booths with advanced criteria
 */
export async function filterBooths(filters: BoothFilters) {
  let query = supabase.from('booths').select('*');

  if (filters.city) {
    query = query.eq('city', filters.city);
  }

  if (filters.country) {
    query = query.eq('country', filters.country);
  }

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters.photo_type && filters.photo_type.length > 0) {
    query = query.in('photo_type', filters.photo_type);
  }

  if (filters.machine_model) {
    query = query.eq('machine_model', filters.machine_model);
  }

  if (filters.operator_id) {
    query = query.eq('operator_id', filters.operator_id);
  }

  if (filters.accepts_cash !== undefined) {
    query = query.eq('accepts_cash', filters.accepts_cash);
  }

  if (filters.accepts_card !== undefined) {
    query = query.eq('accepts_card', filters.accepts_card);
  }

  if (filters.is_operational !== undefined) {
    query = query.eq('is_operational', filters.is_operational);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Create a bookmark for a booth
 */
export async function createBookmark(userId: string, boothId: string) {
  const { data, error } = await supabase
    .from('booth_bookmarks')
    .insert({
      user_id: userId,
      booth_id: boothId,
      visited: false,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch user's bookmarked booths
 */
export async function fetchUserBookmarks(userId: string) {
  const { data, error } = await supabase
    .from('booth_bookmarks')
    .select(`
      *,
      booth:booths(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Add a comment/review to a booth
 */
export async function addBoothComment(
  userId: string,
  boothId: string,
  content: string,
  rating: number
) {
  const { data, error } = await supabase
    .from('booth_comments')
    .insert({
      user_id: userId,
      booth_id: boothId,
      content,
      rating,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch comments for a booth
 */
export async function fetchBoothComments(boothId: string) {
  const { data, error } = await supabase
    .from('booth_comments')
    .select('*')
    .eq('booth_id', boothId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================================================
// Server-Side Examples (use in API routes, server components)
// ============================================================================

/**
 * Fetch nearby booths using PostGIS (server-side only)
 * Note: This requires a custom PostgreSQL function in your database
 */
export async function fetchNearbyBooths(query: NearbyBoothsQuery) {
  const serverClient = createServerClient();

  // This is a placeholder - you'll need to create a custom function in Supabase
  // using PostGIS ST_DWithin to do geospatial queries
  const { data, error } = await serverClient.rpc('nearby_booths', {
    lat: query.latitude,
    lng: query.longitude,
    radius_km: query.radius_km || 5,
    max_results: query.limit || 20,
  } as any);

  if (error) throw error;
  return data;
}

/**
 * Create a new booth (admin/server-side only)
 */
export async function createBooth(booth: Partial<Booth>) {
  const serverClient = createServerClient();

  const { data, error } = await serverClient
    .from('booths')
    .insert(booth as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update booth details (admin/server-side only)
 * Note: This function will work once the database is set up
 */
export async function updateBooth(boothId: string, updates: Partial<Booth>) {
  const serverClient = createServerClient();

  // TODO: Fix type casting once database schema is finalized
  const { data, error } = await (serverClient as any)
    .from('booths')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', boothId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch all operators
 */
export async function fetchOperators() {
  const { data, error } = await supabase
    .from('operators')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

/**
 * Fetch operator with their booths
 */
export async function fetchOperatorWithBooths(operatorSlug: string) {
  const { data: operator, error: operatorError } = await supabase
    .from('operators')
    .select('*')
    .eq('slug', operatorSlug)
    .single();

  if (operatorError) throw operatorError;
  if (!operator) throw new Error('Operator not found');

  const operatorData = operator as Operator;

  const { data: booths, error: boothsError } = await supabase
    .from('booths')
    .select('*')
    .eq('operator_id', operatorData.id);

  if (boothsError) throw boothsError;

  return {
    ...operatorData,
    booths,
  };
}

/**
 * Fetch city guide with booth details
 */
export async function fetchCityGuide(citySlug: string) {
  const { data: guide, error: guideError } = await supabase
    .from('city_guides')
    .select('*')
    .eq('slug', citySlug)
    .eq('published', true)
    .single();

  if (guideError) throw guideError;
  if (!guide) throw new Error('Guide not found');

  const guideData = guide as CityGuide;

  if (guideData.booth_ids && guideData.booth_ids.length > 0) {
    const { data: booths, error: boothsError } = await supabase
      .from('booths')
      .select('*')
      .in('id', guideData.booth_ids);

    if (boothsError) throw boothsError;

    return {
      ...guideData,
      booths,
    };
  }

  return guideData;
}

/**
 * Get booth statistics
 */
export async function getBoothStats() {
  const { count: totalBooths } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  const { count: activeBooths } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { data: countries } = await supabase
    .from('booths')
    .select('country')
    .not('country', 'is', null);

  const uniqueCountries = new Set(countries?.map((b: any) => b.country)).size;

  return {
    totalBooths: totalBooths || 0,
    activeBooths: activeBooths || 0,
    countries: uniqueCountries,
  };
}
