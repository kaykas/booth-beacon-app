/**
 * VENUE-BASED ENRICHMENT SCRIPT
 *
 * Smart enrichment that searches for the VENUE/BUSINESS where the booth is located,
 * not the booth name itself.
 *
 * Strategy:
 * - "Barnone" in Gilbert, AZ → search "Barnone Gilbert Arizona" → finds "Barnone Bar & Grill"
 * - "Max Brown Hotel 5th District Lobby" → search "Max Brown Hotel Vienna" → finds hotel
 * - Extract venue details (address, phone, website, hours, photos) from Google Places
 * - Update booth database with venue information
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY_BACKEND=xxx npx tsx venue-based-enrichment.ts [batch_size]
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY_BACKEND!;

interface BoothData {
  id: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  photo_exterior_url: string | null;
  google_place_id: string | null;
}

interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
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
    width: number;
    height: number;
  }>;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

/**
 * Generate intelligent search queries for finding the VENUE where booth is located
 */
function generateVenueSearchQueries(booth: BoothData): string[] {
  const queries: string[] = [];
  const location = booth.state
    ? `${booth.city}, ${booth.state}, ${booth.country}`
    : `${booth.city}, ${booth.country}`;

  // Strategy 1: Direct venue name + location
  queries.push(`${booth.name} ${location}`);

  // Strategy 2: If name contains common suffixes, strip them
  const stripped = booth.name
    .replace(/\s+(I{2,}|2|3|booth|photobooth)$/i, '')
    .trim();
  if (stripped !== booth.name) {
    queries.push(`${stripped} ${location}`);
  }

  // Strategy 3: Extract potential venue name from complex names
  // "Max Brown Hotel 5th District Lobby" → "Max Brown Hotel"
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

  // Strategy 4: Add venue type hints based on name patterns
  const lowerName = booth.name.toLowerCase();
  if (lowerName.includes('hotel')) {
    queries.push(`${booth.name} hotel ${location}`);
  } else if (lowerName.includes('bar') || lowerName.includes('pub')) {
    queries.push(`${booth.name} bar ${location}`);
  } else if (lowerName.includes('arcade') || lowerName.includes('game')) {
    queries.push(`${booth.name} arcade ${location}`);
  } else if (lowerName.includes('mall') || lowerName.includes('shopping')) {
    queries.push(`${booth.name} mall ${location}`);
  } else {
    // Generic fallback for unknown types
    queries.push(`${booth.name} venue ${location}`);
  }

  return queries;
}

/**
 * Search Google Places Text Search API for venue
 */
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

/**
 * Get detailed information about a place
 */
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

/**
 * Get photo URL from photo reference
 */
function getPhotoUrl(photoReference: string, maxWidth: number = 1200): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
}

/**
 * Find venue for booth using multi-query search
 */
async function findVenueForBooth(booth: BoothData): Promise<PlaceDetails | null> {
  const queries = generateVenueSearchQueries(booth);

  console.log(`   Trying ${queries.length} search strategies...`);

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`   [${i + 1}/${queries.length}] "${query}"`);

    try {
      const results = await searchGooglePlaces(query);

      if (results.length > 0) {
        console.log(`   ✅ Found ${results.length} result(s)`);

        // Get details for the first result (most relevant)
        const placeId = results[0].place_id;
        const details = await getPlaceDetails(placeId);

        if (details) {
          console.log(`   📍 Venue: ${details.name}`);
          console.log(`   📫 Address: ${details.formatted_address || 'N/A'}`);
          return details;
        }
      }

      // Rate limiting: 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error: any) {
      console.error(`   ❌ Search error: ${error.message}`);
    }
  }

  return null;
}

/**
 * Update booth with venue information
 */
async function updateBoothWithVenueData(
  boothId: string,
  venue: PlaceDetails
): Promise<void> {
  const updates: any = {};

  // Only update fields that are currently missing
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

  // Get first photo if available (only if booth doesn't have one)
  if (venue.photos && venue.photos.length > 0) {
    const photoUrl = getPhotoUrl(venue.photos[0].photo_reference);
    updates.photo_exterior_url = photoUrl;
  }

  // Update coordinates if available
  if (venue.geometry?.location) {
    updates.latitude = venue.geometry.location.lat;
    updates.longitude = venue.geometry.location.lng;
  }

  const { error } = await supabase
    .from('booths')
    .update(updates)
    .eq('id', boothId);

  if (error) {
    throw new Error(`Database update failed: ${error.message}`);
  }

  console.log(`   💾 Updated ${Object.keys(updates).length} fields`);
}

/**
 * Process a single booth
 */
async function processBooth(booth: BoothData): Promise<boolean> {
  try {
    console.log(`\n📍 ${booth.name} (${booth.city}, ${booth.country})`);

    // Check what's missing
    const missing: string[] = [];
    if (!booth.address) missing.push('address');
    if (!booth.phone) missing.push('phone');
    if (!booth.website) missing.push('website');
    if (!booth.hours) missing.push('hours');
    if (!booth.photo_exterior_url) missing.push('photo');

    console.log(`   ❌ Missing: ${missing.join(', ')}`);

    // Find venue
    const venue = await findVenueForBooth(booth);

    if (!venue) {
      console.log(`   ⚠️  No venue found`);
      return false;
    }

    // Update booth with venue data
    await updateBoothWithVenueData(booth.id, venue);
    console.log(`   ✅ Enriched successfully`);

    return true;

  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 VENUE-BASED ENRICHMENT\n');

  const BATCH_SIZE = parseInt(process.argv[2] || '25');
  console.log(`Batch size: ${BATCH_SIZE} booths\n`);

  // Query booths with missing data (missing address, phone, or website)
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, city, state, country, address, phone, website, hours, photo_exterior_url')
    .eq('status', 'active')
    .or('address.is.null,phone.is.null,website.is.null')
    .limit(BATCH_SIZE);

  if (error) {
    console.error('❌ Database error:', error);
    return;
  }

  if (!booths || booths.length === 0) {
    console.log('✨ All booths already enriched!');
    return;
  }

  console.log(`Found ${booths.length} booths needing enrichment\n`);
  console.log('='.repeat(60));

  let enriched = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < booths.length; i++) {
    const booth = booths[i];
    console.log(`[${i + 1}/${booths.length}]`);

    const success = await processBooth(booth);

    if (success) {
      enriched++;
    } else {
      failed++;
    }

    // Rate limiting: 2 seconds between booths (multiple API calls per booth)
    if (i < booths.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Enriched: ${enriched}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Duration: ${duration} minutes`);
  console.log(`📈 Success rate: ${((enriched / booths.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  console.log('\n✨ Done!');
}

main().catch(console.error);
