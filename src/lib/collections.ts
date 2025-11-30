/**
 * Collection helpers for geographic booth grouping
 * Provides utilities for country/city collections for SEO
 */

import { supabase } from '@/lib/supabase';
import { Booth } from '@/types';

export interface CountryCollection {
  country: string;
  boothCount: number;
  slug: string;
}

export interface CityCollection {
  city: string;
  country: string;
  boothCount: number;
  slug: string;
}

export interface CollectionBooths {
  booths: Booth[];
  country: string;
  city?: string;
  totalCount: number;
}

/**
 * Generate a URL-safe slug from country/city names
 */
export function generateCollectionSlug(country: string, city?: string): string {
  const slugify = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  if (city) {
    return `${slugify(country)}/${slugify(city)}`;
  }
  return slugify(country);
}

/**
 * Parse collection slug from URL params
 */
export function parseCollectionSlug(slug: string[]): {
  country: string;
  city?: string;
} {
  if (!slug || slug.length === 0) {
    throw new Error('Invalid collection slug');
  }

  const country = slug[0]
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (slug.length > 1) {
    const city = slug[1]
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return { country, city };
  }

  return { country };
}

/**
 * Get all country collections with booth counts
 */
export async function getCountryCollections(): Promise<CountryCollection[]> {
  try {
    const { data, error } = await supabase
      .from('booths')
      .select('country')
      .not('country', 'is', null);

    if (error) {
      console.error('Error fetching country collections:', error);
      return [];
    }

    // Count booths per country
    const countryMap = new Map<string, number>();
    data?.forEach((booth: Booth) => {
      const count = countryMap.get(booth.country) || 0;
      countryMap.set(booth.country, count + 1);
    });

    // Convert to array and sort by booth count
    return Array.from(countryMap.entries())
      .map(([country, boothCount]) => ({
        country,
        boothCount,
        slug: generateCollectionSlug(country),
      }))
      .sort((a, b) => b.boothCount - a.boothCount);
  } catch (error) {
    console.error('Error in getCountryCollections:', error);
    return [];
  }
}

/**
 * Get all city collections for a specific country
 */
export async function getCityCollections(
  country: string
): Promise<CityCollection[]> {
  try {
    const { data, error } = await supabase
      .from('booths')
      .select('city, country')
      .ilike('country', country)
      .not('city', 'is', null);

    if (error) {
      console.error('Error fetching city collections:', error);
      return [];
    }

    // Count booths per city
    const cityMap = new Map<string, number>();
    data?.forEach((booth: Booth) => {
      const count = cityMap.get(booth.city) || 0;
      cityMap.set(booth.city, count + 1);
    });

    // Convert to array and sort by booth count
    return Array.from(cityMap.entries())
      .map(([city, boothCount]) => ({
        city,
        country,
        boothCount,
        slug: generateCollectionSlug(country, city),
      }))
      .sort((a, b) => b.boothCount - a.boothCount);
  } catch (error) {
    console.error('Error in getCityCollections:', error);
    return [];
  }
}

/**
 * Get booths for a collection (country or city)
 */
export async function getCollectionBooths(
  country: string,
  city?: string,
  options: {
    sortBy?: 'recent' | 'alphabetical';
    limit?: number;
    offset?: number;
  } = {}
): Promise<CollectionBooths> {
  const { sortBy = 'recent', limit = 100, offset = 0 } = options;

  try {
    let query = supabase
      .from('booths')
      .select('*', { count: 'exact' })
      .ilike('country', country);

    // Add city filter if provided
    if (city) {
      query = query.ilike('city', city);
    }

    // Apply sorting
    if (sortBy === 'alphabetical') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching collection booths:', error);
      return {
        booths: [],
        country,
        city,
        totalCount: 0,
      };
    }

    return {
      booths: (data as Booth[]) || [],
      country,
      city,
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('Error in getCollectionBooths:', error);
    return {
      booths: [],
      country,
      city,
      totalCount: 0,
    };
  }
}

/**
 * Get top cities globally by booth count (for homepage/collection browse)
 */
export async function getTopCities(limit: number = 20): Promise<CityCollection[]> {
  try {
    const { data, error } = await supabase
      .from('booths')
      .select('city, country')
      .not('city', 'is', null)
      .not('country', 'is', null);

    if (error) {
      console.error('Error fetching top cities:', error);
      return [];
    }

    // Count booths per city (with country to avoid collisions)
    const cityMap = new Map<string, { city: string; country: string; count: number }>();
    data?.forEach((booth: Booth) => {
      const key = `${booth.city}-${booth.country}`;
      const existing = cityMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        cityMap.set(key, { city: booth.city, country: booth.country, count: 1 });
      }
    });

    // Convert to array and sort by count
    return Array.from(cityMap.values())
      .map((item) => ({
        city: item.city,
        country: item.country,
        boothCount: item.count,
        slug: generateCollectionSlug(item.country, item.city),
      }))
      .sort((a, b) => b.boothCount - a.boothCount)
      .slice(0, limit);
  } catch (error) {
    console.error('Error in getTopCities:', error);
    return [];
  }
}

/**
 * Get collection stats (total booths, countries, etc.)
 */
export async function getCollectionStats() {
  try {
    const { data, error, count } = await supabase
      .from('booths')
      .select('country', { count: 'exact' })
      .not('country', 'is', null);

    if (error) {
      console.error('Error fetching collection stats:', error);
      return { totalBooths: 0, totalCountries: 0 };
    }

    const uniqueCountries = new Set(data?.map((b) => b.country));

    return {
      totalBooths: count || 0,
      totalCountries: uniqueCountries.size,
    };
  } catch (error) {
    console.error('Error in getCollectionStats:', error);
    return { totalBooths: 0, totalCountries: 0 };
  }
}
