/**
 * VENUE ENRICHMENT API V2 - EXPERT MODE
 *
 * Advanced Google Maps enrichment with intelligent search strategies:
 * - Smart query cleaning and name normalization
 * - Multi-strategy search (exact, fuzzy, nearby, geocoded)
 * - Booth tracking to prevent infinite loops
 * - Confidence scoring for search results
 * - Special handling for common venue types
 *
 * Usage: GET /api/enrichment/venue?batchSize=25
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateQualityScore, determineEnrichmentNeeds, type BoothQualityData } from '@/lib/dataQuality';
import { getRequiredEnv } from '@/lib/utils';

// Lazy initialization to avoid build-time validation
let supabase: ReturnType<typeof createClient> | null = null;
let GOOGLE_MAPS_API_KEY: string | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    );
  }
  return supabase;
}

function getGoogleMapsKey() {
  if (!GOOGLE_MAPS_API_KEY) {
    GOOGLE_MAPS_API_KEY = getRequiredEnv('GOOGLE_MAPS_API_KEY_BACKEND');
  }
  return GOOGLE_MAPS_API_KEY;
}

interface LogEvent {
  type: 'info' | 'error' | 'success' | 'progress' | 'warning';
  message: string;
  data?: unknown;
}

interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
  }>;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

// Special venue name mappings for known problematic cases
const VENUE_ALIASES: Record<string, string> = {
  'RAW 1': 'RAW-Gelände Berlin',
  'RAW 2': 'RAW-Gelände Berlin',
  'RAW 3': 'RAW-Gelände Berlin',
  'Kulturbrauerei': 'Kulturbrauerei Berlin',
  'Pratersauna': 'Pratersauna Vienna',
  'Barnone': 'Bar None',
  'Union Pool': 'Union Pool Brooklyn',
};

/**
 * Advanced booth name cleaning for better Google Places matching
 */
function cleanBoothName(name: string): string[] {
  const variants: string[] = [];

  // Original name
  variants.push(name);

  // Check for known aliases
  if (VENUE_ALIASES[name]) {
    variants.push(VENUE_ALIASES[name]);
  }

  // Remove common suffixes and descriptors
  const cleanedName = name
    .replace(/\s+(II|III|IV|2|3|4|booth|photo\s?booth|photobooth|location)$/i, '')
    .replace(/\s+(lobby|entrance|floor|district|area|level)$/i, '')
    .trim();

  if (cleanedName !== name && cleanedName.length > 2) {
    variants.push(cleanedName);
  }

  // Extract business name before location descriptors
  const businessMatch = name.match(/^(.*?)\s+(at|in|@|-)?\s+(lobby|entrance|floor|district)/i);
  if (businessMatch && businessMatch[1].trim()) {
    variants.push(businessMatch[1].trim());
  }

  // Handle numbered variations (e.g., "Location 2" -> "Location")
  const numberVariant = name.replace(/\s+\d+$/, '').trim();
  if (numberVariant !== name && numberVariant.length > 2) {
    variants.push(numberVariant);
  }

  return [...new Set(variants)]; // Remove duplicates
}

/**
 * Build comprehensive location string
 */
function buildLocationString(booth: BoothQualityData): string {
  if (!booth.city) return booth.country || '';

  const parts = [booth.city];
  if (booth.state) parts.push(booth.state);
  if (booth.country) parts.push(booth.country);

  return parts.join(', ');
}

/**
 * Google Places Text Search
 */
async function searchGooglePlaces(query: string): Promise<PlaceSearchResult[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.append('query', query);
  url.searchParams.append('key', getGoogleMapsKey());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();

  if (data.status === 'OK' && data.results) {
    return data.results;
  }

  return [];
}

/**
 * Google Places Nearby Search (when we have coordinates)
 */
async function nearbySearch(lat: number, lng: number, keyword: string): Promise<PlaceSearchResult[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  url.searchParams.append('location', `${lat},${lng}`);
  url.searchParams.append('radius', '500'); // 500 meters
  url.searchParams.append('keyword', keyword);
  url.searchParams.append('key', getGoogleMapsKey());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();

  if (data.status === 'OK' && data.results) {
    return data.results;
  }

  return [];
}

/**
 * Get Place Details
 */
async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.append('place_id', placeId);
  url.searchParams.append('fields', 'place_id,name,formatted_address,formatted_phone_number,website,opening_hours,photos,geometry');
  url.searchParams.append('key', getGoogleMapsKey());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();

  if (data.status === 'OK' && data.result) {
    return data.result;
  }

  return null;
}

/**
 * Calculate confidence score for a search result
 */
function calculateConfidence(result: PlaceSearchResult, boothName: string, location: string): number {
  let confidence = 0;

  // Name similarity (basic check)
  const resultNameLower = result.name.toLowerCase();
  const boothNameLower = boothName.toLowerCase();

  if (resultNameLower === boothNameLower) {
    confidence += 50;
  } else if (resultNameLower.includes(boothNameLower) || boothNameLower.includes(resultNameLower)) {
    confidence += 30;
  }

  // Location match
  if (result.formatted_address) {
    const addressLower = result.formatted_address.toLowerCase();
    const locationParts = location.toLowerCase().split(',');

    locationParts.forEach(part => {
      if (addressLower.includes(part.trim())) {
        confidence += 10;
      }
    });
  }

  // Rating and reviews boost confidence
  if (result.user_ratings_total && result.user_ratings_total > 10) {
    confidence += 10;
  }

  // Venue type relevance
  if (result.types) {
    const relevantTypes = ['bar', 'restaurant', 'night_club', 'museum', 'art_gallery', 'store', 'shopping_mall', 'establishment'];
    const hasRelevantType = result.types.some(t => relevantTypes.includes(t));
    if (hasRelevantType) {
      confidence += 10;
    }
  }

  return Math.min(confidence, 100);
}

/**
 * Advanced venue search with multiple strategies
 */
async function findVenueForBooth(booth: BoothQualityData, log: (event: LogEvent) => void): Promise<PlaceDetails | null> {
  const location = buildLocationString(booth);

  if (!location || !booth.city) {
    log({ type: 'warning', message: 'Missing city/location - skipping' });
    return null;
  }

  const nameVariants = cleanBoothName(booth.name);
  let bestResult: { result: PlaceSearchResult; confidence: number } | null = null;

  // Strategy 1: Text search with all name variants
  for (const name of nameVariants) {
    try {
      const query = `${name} ${location}`;
      log({ type: 'info', message: `Trying: "${query}"` });

      const results = await searchGooglePlaces(query);

      if (results.length > 0) {
        const confidence = calculateConfidence(results[0], name, location);
        log({ type: 'info', message: `Found: ${results[0].name} (confidence: ${confidence}%)` });

        if (!bestResult || confidence > bestResult.confidence) {
          bestResult = { result: results[0], confidence };
        }

        // If we have high confidence, stop searching
        if (confidence >= 70) {
          break;
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
      log({ type: 'error', message: `Search error: ${error instanceof Error ? error.message : 'Unknown'}` });
    }
  }

  // Strategy 2: If we have coordinates but low confidence, try nearby search
  if (booth.latitude && booth.longitude && (!bestResult || bestResult.confidence < 50)) {
    try {
      log({ type: 'info', message: 'Trying nearby search with coordinates...' });

      const cleanestName = nameVariants[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const results = await nearbySearch(booth.latitude, booth.longitude, cleanestName);

      if (results.length > 0) {
        const confidence = calculateConfidence(results[0], cleanestName, location);
        log({ type: 'info', message: `Nearby found: ${results[0].name} (confidence: ${confidence}%)` });

        if (!bestResult || confidence > bestResult.confidence) {
          bestResult = { result: results[0], confidence };
        }
      }

      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
      log({ type: 'error', message: `Nearby search error: ${error instanceof Error ? error.message : 'Unknown'}` });
    }
  }

  // If we found something with reasonable confidence, get details
  if (bestResult && bestResult.confidence >= 30) {
    log({ type: 'success', message: `Best match: ${bestResult.result.name} (${bestResult.confidence}% confidence)` });
    return await getPlaceDetails(bestResult.result.place_id);
  }

  return null;
}

function getPhotoUrl(photoReference: string): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photoReference}&key=${getGoogleMapsKey()}`;
}

async function updateBoothWithVenueData(boothId: string, venue: PlaceDetails): Promise<void> {
  const updates: Record<string, unknown> = {};

  if (venue.formatted_address) {
    updates.address = venue.formatted_address;
  }

  if (venue.formatted_phone_number) {
    updates.phone = venue.formatted_phone_number;
  }

  if (venue.website) {
    updates.website = venue.website;
  }

  if (venue.opening_hours?.weekday_text) {
    updates.hours = venue.opening_hours.weekday_text.join('\n');
  }

  if (venue.photos && venue.photos.length > 0) {
    const photoUrl = getPhotoUrl(venue.photos[0].photo_reference);
    updates.photo_exterior_url = photoUrl;
  }

  if (venue.geometry?.location) {
    updates.latitude = venue.geometry.location.lat;
    updates.longitude = venue.geometry.location.lng;
  }

  // Mark as attempted to prevent re-processing
  updates.enrichment_attempted_at = new Date().toISOString();
  updates.updated_at = new Date().toISOString();

  const { error } = await getSupabase()
    .from('booths')
    .update(updates)
    .eq('id', boothId);

  if (error) {
    throw new Error(`Database update failed: ${error.message}`);
  }
}

async function markAsAttempted(boothId: string): Promise<void> {
  await supabase
    .from('booths')
    .update({
      enrichment_attempted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', boothId);
}

async function processBooth(booth: BoothQualityData, log: (event: LogEvent) => void): Promise<boolean> {
  try {
    const score = calculateQualityScore(booth);
    const needs = determineEnrichmentNeeds(booth);

    log({
      type: 'info',
      message: `${booth.name} (${booth.city || 'no city'}) - Quality: ${score.score}%`,
    });

    if (!needs.needsVenueData) {
      log({
        type: 'info',
        message: 'Already has venue data',
      });
      return false;
    }

    // Find venue with advanced strategies
    const venue = await findVenueForBooth(booth, log);

    if (!venue) {
      // Mark as attempted even if not found
      await markAsAttempted(booth.id);
      log({
        type: 'warning',
        message: 'No venue found after all strategies',
      });
      return false;
    }

    // Update booth with found data
    await updateBoothWithVenueData(booth.id, venue);

    // Recalculate score
    const { data: updatedBooth } = await supabase
      .from('booths')
      .select('*')
      .eq('id', booth.id)
      .single();

    if (updatedBooth) {
      const newScore = calculateQualityScore(updatedBooth as BoothQualityData);
      log({
        type: 'success',
        message: `✓ Enriched with ${venue.name} (${score.score}% → ${newScore.score}%)`,
      });
    }

    return true;
  } catch (error: unknown) {
    // Mark as attempted even on error to prevent infinite retries
    await markAsAttempted(booth.id);
    log({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

export async function GET(request: NextRequest) {
  // DISABLED: Venue enrichment disabled until data quality issues are resolved
  // This endpoint was causing Places API cost explosion
  return new Response(
    JSON.stringify({
      error: 'Venue enrichment is currently disabled due to data quality issues. Manual enrichment only.',
      disabled: true
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );

  /* ORIGINAL CODE - PRESERVED FOR RE-ENABLING AFTER DATA FIX
  const { searchParams } = new URL(request.url);
  const batchSize = parseInt(searchParams.get('batchSize') || '25');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const log = (event: LogEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        log({ type: 'info', message: 'Starting advanced venue enrichment...' });

        // FIXED: Add ordering and exclude recently attempted booths
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const { data: booths, error } = await supabase
          .from('booths')
          .select('id, name, city, state, country, address, phone, website, hours, photo_exterior_url, ai_preview_url, photos, latitude, longitude, status, enrichment_attempted_at')
          .eq('status', 'active')
          .or('address.is.null,phone.is.null,website.is.null')
          .or(`enrichment_attempted_at.is.null,enrichment_attempted_at.lt.${oneHourAgo}`)
          .order('enrichment_attempted_at', { ascending: true, nullsFirst: true })
          .order('id', { ascending: true })
          .limit(batchSize);

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        if (!booths || booths.length === 0) {
          log({ type: 'success', message: 'All booths processed or recently attempted!' });
          controller.close();
          return;
        }

        log({ type: 'info', message: `Found ${booths.length} booths to process` });

        let enriched = 0;
        let failed = 0;

        for (let i = 0; i < booths.length; i++) {
          log({ type: 'progress', message: `[${i + 1}/${booths.length}] Processing...` });

          const success = await processBooth(booths[i] as BoothQualityData, log);

          if (success) {
            enriched++;
          } else {
            failed++;
          }

          // Rate limiting between booths
          if (i < booths.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        log({
          type: 'success',
          message: `✓ Completed: ${enriched} enriched, ${failed} failed/skipped`,
        });

        controller.close();
      } catch (error: unknown) {
        log({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
