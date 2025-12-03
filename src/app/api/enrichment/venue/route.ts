/**
 * VENUE ENRICHMENT API
 *
 * Server-Sent Events (SSE) endpoint for enriching booth data with Google Places API
 * Searches for the venue where the booth is located and adds:
 * - Address, phone, website, hours
 * - Photos, coordinates, Google Place ID
 *
 * Only processes booths with quality score < 80%
 *
 * Usage: GET /api/enrichment/venue?batchSize=25
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateQualityScore, determineEnrichmentNeeds, type BoothQualityData } from '@/lib/dataQuality';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY_BACKEND!;

interface LogEvent {
  type: 'info' | 'error' | 'success' | 'progress';
  message: string;
  data?: unknown;
}

interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address?: string;
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

async function searchGooglePlaces(query: string): Promise<PlaceSearchResult[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.append('query', query);
  url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status === 'OK' && data.results) {
    return data.results;
  }

  return [];
}

async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.append('place_id', placeId);
  url.searchParams.append('fields', 'place_id,name,formatted_address,formatted_phone_number,website,opening_hours,photos,geometry');
  url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status === 'OK' && data.result) {
    return data.result;
  }

  return null;
}

function getPhotoUrl(photoReference: string): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
}

function generateVenueSearchQueries(booth: BoothQualityData): string[] {
  const queries: string[] = [];
  const location = booth.state
    ? `${booth.city}, ${booth.state}, ${booth.country}`
    : `${booth.city}, ${booth.country}`;

  queries.push(`${booth.name} ${location}`);

  // Strip common suffixes
  const stripped = booth.name.replace(/\s+(II|2|3|booth|photobooth)$/i, '').trim();
  if (stripped !== booth.name) {
    queries.push(`${stripped} ${location}`);
  }

  // Extract venue name from complex names
  const venuePatterns = [
    /^(.*?)(lobby|entrance|floor|district|location|area)$/i,
    /^(.*?)(photo\s?booth|booth)$/i,
  ];

  for (const pattern of venuePatterns) {
    const match = booth.name.match(pattern);
    if (match && match[1].trim()) {
      const venueName = match[1].trim();
      if (venueName !== booth.name) {
        queries.push(`${venueName} ${location}`);
      }
    }
  }

  return queries;
}

async function findVenueForBooth(booth: BoothQualityData): Promise<PlaceDetails | null> {
  const queries = generateVenueSearchQueries(booth);

  for (const query of queries) {
    try {
      const results = await searchGooglePlaces(query);

      if (results.length > 0) {
        const placeId = results[0].place_id;
        const details = await getPlaceDetails(placeId);

        if (details) {
          return details;
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (_error) {
      // Continue to next query
    }
  }

  return null;
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

  // Note: google_place_id column doesn't exist in database yet
  // if (venue.place_id) {
  //   updates.google_place_id = venue.place_id;
  // }

  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('booths')
    .update(updates)
    .eq('id', boothId);

  if (error) {
    throw new Error(`Database update failed: ${error.message}`);
  }
}

async function processBooth(booth: BoothQualityData, log: (event: LogEvent) => void): Promise<boolean> {
  try {
    const score = calculateQualityScore(booth);
    const needs = determineEnrichmentNeeds(booth);

    log({
      type: 'info',
      message: `${booth.name} (${booth.city}) - Quality: ${score.score}%`,
    });

    if (!needs.needsVenueData) {
      log({
        type: 'info',
        message: 'No venue data needed, skipping',
      });
      return false;
    }

    // Find venue
    const venue = await findVenueForBooth(booth);

    if (!venue) {
      log({
        type: 'error',
        message: 'No venue found',
      });
      return false;
    }

    // Update booth
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
        message: `Enriched: ${venue.name} (${score.score}% → ${newScore.score}%)`,
      });
    }

    return true;
  } catch (error: unknown) {
    log({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchSize = parseInt(searchParams.get('batchSize') || '25');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const log = (event: LogEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        log({ type: 'info', message: 'Starting venue enrichment...' });

        // Query booths needing enrichment (missing critical fields)
        const { data: booths, error } = await supabase
          .from('booths')
          .select('id, name, city, state, country, address, phone, website, hours, photo_exterior_url, ai_preview_url, photos, latitude, longitude, status')
          .eq('status', 'active')
          .or('address.is.null,phone.is.null,website.is.null')
          .limit(batchSize);

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        if (!booths || booths.length === 0) {
          log({ type: 'success', message: 'All booths already enriched!' });
          controller.close();
          return;
        }

        log({ type: 'info', message: `Found ${booths.length} booths needing enrichment` });

        let enriched = 0;
        let skipped = 0;

        for (let i = 0; i < booths.length; i++) {
          log({ type: 'progress', message: `Processing ${i + 1}/${booths.length}` });

          const success = await processBooth(booths[i] as BoothQualityData, log);

          if (success) {
            enriched++;
          } else {
            skipped++;
          }

          // Rate limiting between booths
          if (i < booths.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        log({
          type: 'success',
          message: `Completed: ${enriched} enriched, ${skipped} skipped`,
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
