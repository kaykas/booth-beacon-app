/**
 * BOOTH DATA ENRICHMENT SCRIPT
 *
 * Fills gaps in booth data using Google Places API:
 * - Full street addresses
 * - Phone numbers
 * - Websites
 * - Business hours
 * - Photos from Google
 * - Ratings and reviews
 *
 * IMPROVED VERSION: Handles tricky booth names with smart search strategies
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BoothEnrichment {
  booth_id: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  photos?: string[];
  google_rating?: number;
  google_place_id?: string;
  enrichment_confidence: number;
  enriched_at: string;
}

/**
 * Normalize booth name by removing common suffixes and cleaning up
 */
function normalizeBoothName(name: string): string[] {
  const variations: string[] = [];

  // Original name
  variations.push(name);

  // Strip common suffixes: " I", " II", " III", " 2", " #2", " (2)", etc.
  const suffixPatterns = [
    / (I{1,3})$/i,           // Roman numerals at end
    / #?\d+$/,               // Numbers with optional #
    / \(\d+\)$/,             // Numbers in parentheses
    / \d+$/,                 // Just numbers at end
  ];

  let cleanedName = name;
  for (const pattern of suffixPatterns) {
    const match = cleanedName.match(pattern);
    if (match) {
      cleanedName = cleanedName.replace(pattern, '').trim();
      variations.push(cleanedName);
      break; // Only remove one suffix
    }
  }

  // Strip location indicators from name
  const locationPatterns = [
    / Hotel (Lobby|Entrance)?$/i,
    / Station$/i,
    / Gallery(\s+\+?\s*Museum)?$/i,
    / Club$/i,
    / House$/i,
  ];

  let withoutLocation = cleanedName;
  for (const pattern of locationPatterns) {
    if (pattern.test(withoutLocation)) {
      withoutLocation = withoutLocation.replace(pattern, '').trim();
      variations.push(withoutLocation);
    }
  }

  // Fix common name issues
  const fixedName = name
    .replace(/&eacute;/g, 'é')  // HTML entities
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')        // Multiple spaces
    .trim();

  if (fixedName !== name) {
    variations.push(fixedName);
  }

  // Return unique variations, ordered from most specific to least
  return [...new Set(variations)];
}

/**
 * Generate venue type hint from booth name
 */
function inferVenueType(name: string): string[] {
  const nameLower = name.toLowerCase();
  const types: string[] = [];

  if (nameLower.includes('hotel')) types.push('hotel');
  if (nameLower.includes('bar') || nameLower.includes('pub')) types.push('bar');
  if (nameLower.includes('club')) types.push('night club');
  if (nameLower.includes('cafe') || nameLower.includes('coffee')) types.push('cafe');
  if (nameLower.includes('restaurant')) types.push('restaurant');
  if (nameLower.includes('museum') || nameLower.includes('gallery')) types.push('museum');
  if (nameLower.includes('station')) types.push('transit station');
  if (nameLower.includes('mall') || nameLower.includes('shopping')) types.push('shopping mall');
  if (nameLower.includes('park')) types.push('park');

  return types;
}

/**
 * Search Google Places with multiple strategies
 */
async function searchGooglePlacesWithStrategies(
  boothName: string,
  city: string,
  state: string | null,
  country: string,
  latitude: number | null,
  longitude: number | null
): Promise<{ result: any; strategy: string; searchQuery: string } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY!;
  const locationParts = [city, state, country].filter(part => part && part !== 'null');
  const locationString = locationParts.join(', ');

  // Generate name variations
  const nameVariations = normalizeBoothName(boothName);
  const venueTypes = inferVenueType(boothName);

  const strategies: Array<{ query: string; strategy: string }> = [];

  // Strategy 1: Exact booth name + location
  strategies.push({
    query: `${boothName} ${locationString}`,
    strategy: 'exact'
  });

  // Strategy 2: Try each name variation
  for (let i = 1; i < nameVariations.length; i++) {
    strategies.push({
      query: `${nameVariations[i]} ${locationString}`,
      strategy: `variation-${i}`
    });
  }

  // Strategy 3: Add venue type hints for ambiguous names
  if (venueTypes.length > 0) {
    for (const type of venueTypes) {
      strategies.push({
        query: `${nameVariations[0]} ${type} ${locationString}`,
        strategy: `typed-${type}`
      });
    }
  }

  // Strategy 4: For location-based names, try "bar in [location]" or "venue in [location]"
  const isLocationName = boothName.toLowerCase().includes('straße') ||
                        boothName.toLowerCase().includes('strasse') ||
                        boothName.toLowerCase().includes('allee') ||
                        boothName.toLowerCase().includes('brücke') ||
                        boothName.toLowerCase().includes('platz') ||
                        boothName.toLowerCase().includes('park') && !boothName.toLowerCase().includes('parking');

  if (isLocationName) {
    strategies.push({
      query: `photo booth ${boothName} ${locationString}`,
      strategy: 'location-based-photobooth'
    });
    strategies.push({
      query: `bar ${boothName} ${locationString}`,
      strategy: 'location-based-bar'
    });
  }

  // Strategy 5: Nearby search if we have coordinates
  if (latitude && longitude) {
    strategies.push({
      query: `photo booth near ${latitude},${longitude}`,
      strategy: 'nearby-coords'
    });
  }

  // Try each strategy
  for (const { query, strategy } of strategies) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        // Return first result with metadata
        return {
          result: data.results[0],
          strategy,
          searchQuery: query
        };
      }

      // Small delay between attempts to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`   Strategy "${strategy}" failed:`, error);
    }
  }

  return null;
}

/**
 * Legacy function for backward compatibility
 */
async function searchGooglePlaces(
  boothName: string,
  city: string,
  state: string | null,
  country: string
): Promise<any> {
  const result = await searchGooglePlacesWithStrategies(boothName, city, state, country, null, null);
  return result?.result || null;
}

/**
 * Get detailed place information
 */
async function getPlaceDetails(placeId: string): Promise<any> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY!;
  const fields = 'formatted_address,formatted_phone_number,website,opening_hours,photos,rating,price_level';

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    return null;
  }

  return data.result;
}

/**
 * String similarity using Levenshtein-inspired fuzzy matching
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  // Count matching characters
  const longerLower = longer.toLowerCase();
  const shorterLower = shorter.toLowerCase();

  // Check if shorter is completely contained in longer
  if (longerLower.includes(shorterLower)) {
    return 0.8 + (shorterLower.length / longerLower.length) * 0.2;
  }

  // Count matching characters in order
  let matches = 0;
  let lastIndex = 0;

  for (const char of shorterLower) {
    const index = longerLower.indexOf(char, lastIndex);
    if (index !== -1) {
      matches++;
      lastIndex = index + 1;
    }
  }

  return matches / longer.length;
}

/**
 * Calculate confidence score for enrichment (IMPROVED)
 */
function calculateConfidence(
  boothName: string,
  placeName: string,
  city: string,
  placeCity: string,
  strategy?: string
): number {
  let confidence = 0;

  // Normalize names for comparison
  const boothNormalized = boothName.toLowerCase()
    .replace(/&eacute;/g, 'é')
    .replace(/&amp;/g, '&')
    .trim();

  const placeNormalized = placeName.toLowerCase()
    .replace(/&eacute;/g, 'é')
    .replace(/&amp;/g, '&')
    .trim();

  // 1. Exact or very close name match (60 points max)
  if (boothNormalized === placeNormalized) {
    confidence += 60;
  } else {
    // Use string similarity
    const similarity = stringSimilarity(boothNormalized, placeNormalized);
    confidence += similarity * 60;

    // Bonus for substring matches
    if (placeNormalized.includes(boothNormalized) || boothNormalized.includes(placeNormalized)) {
      confidence += 10;
    }

    // Check word-by-word matches (accounts for reordering)
    const boothWords = boothNormalized.split(/\s+/).filter(w => w.length > 2);
    const placeWords = placeNormalized.split(/\s+/).filter(w => w.length > 2);

    if (boothWords.length > 0) {
      const matchingWords = boothWords.filter(bw =>
        placeWords.some(pw => pw.includes(bw) || bw.includes(pw))
      ).length;

      const wordMatchScore = (matchingWords / boothWords.length) * 15;
      confidence += wordMatchScore;
    }
  }

  // 2. City match (30 points)
  if (city && placeCity) {
    const cityLower = city.toLowerCase();
    const placeCityLower = placeCity.toLowerCase();

    if (cityLower === placeCityLower) {
      confidence += 30;
    } else if (placeCityLower.includes(cityLower) || cityLower.includes(placeCityLower)) {
      confidence += 20;
    }
  }

  // 3. Business type match bonus (10 points)
  const boothTypes = inferVenueType(boothName);
  const placeTypes = inferVenueType(placeName);

  const typeOverlap = boothTypes.filter(t => placeTypes.includes(t)).length;
  if (typeOverlap > 0) {
    confidence += Math.min(typeOverlap * 5, 10);
  }

  // 4. Strategy bonus/penalty
  if (strategy) {
    if (strategy === 'exact') {
      confidence += 5; // Bonus for exact match strategy
    } else if (strategy.startsWith('variation-')) {
      // Small penalty for variations (less confident)
      confidence -= 3;
    } else if (strategy.startsWith('location-based')) {
      // Larger penalty for location-based guesses
      confidence -= 10;
    } else if (strategy === 'nearby-coords') {
      // Penalty for coordinate-based search (could be anything nearby)
      confidence -= 15;
    }
  }

  return Math.max(0, Math.min(confidence, 100));
}

/**
 * Enrich a single booth (IMPROVED)
 */
async function enrichBooth(booth: any): Promise<BoothEnrichment | null> {
  const location = [booth.city, booth.state, booth.country].filter(Boolean).join(', ');
  console.log(`\n📍 ${booth.name} (${location})`);

  // Show name variations for debugging
  const variations = normalizeBoothName(booth.name);
  if (variations.length > 1) {
    console.log(`   Name variations: ${variations.slice(1, 3).map(v => `"${v}"`).join(', ')}`);
  }

  // Search Google Places with improved strategies
  const searchResult = await searchGooglePlacesWithStrategies(
    booth.name,
    booth.city,
    booth.state,
    booth.country,
    booth.latitude,
    booth.longitude
  );

  if (!searchResult) {
    console.log(`   ❌ No results found (tried ${variations.length} name variations)`);
    return null;
  }

  const { result: place, strategy, searchQuery } = searchResult;

  // Calculate confidence
  const placeCity = place.formatted_address.split(',').slice(-2)[0]?.trim() || '';
  const confidence = calculateConfidence(
    booth.name,
    place.name,
    booth.city,
    placeCity,
    strategy
  );

  console.log(`   Matched: "${place.name}" (Confidence: ${Math.round(confidence)}%)`);
  console.log(`   Strategy: "${strategy}" | Query: "${searchQuery}"`);

  // Adjusted threshold based on strategy
  let confidenceThreshold = 60; // Lower threshold from 70

  // Be more lenient with certain strategies
  if (strategy.startsWith('variation-') || strategy.startsWith('typed-')) {
    confidenceThreshold = 55;
  }

  if (confidence < confidenceThreshold) {
    console.log(`   ⚠️  Low confidence (${Math.round(confidence)}% < ${confidenceThreshold}%) - skipping`);
    return null;
  }

  // Get detailed information
  const details = await getPlaceDetails(place.place_id);

  if (!details) {
    console.log(`   ❌ Failed to get details`);
    return null;
  }

  // Extract photos
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  const photos = details.photos?.slice(0, 5).map((photo: any) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`;
  }) || [];

  // Build enrichment data
  const enrichment: BoothEnrichment = {
    booth_id: booth.id,
    address: details.formatted_address,
    phone: details.formatted_phone_number,
    website: details.website,
    hours: details.opening_hours?.weekday_text?.join('\n'),
    photos: photos.length > 0 ? photos : undefined,
    google_rating: details.rating,
    google_place_id: place.place_id,
    enrichment_confidence: Math.round(confidence),
    enriched_at: new Date().toISOString()
  };

  console.log(`   ✅ Enriched:`);
  if (enrichment.address) console.log(`      Address: ${enrichment.address}`);
  if (enrichment.phone) console.log(`      Phone: ${enrichment.phone}`);
  if (enrichment.website) console.log(`      Website: ${enrichment.website}`);
  if (enrichment.photos) console.log(`      Photos: ${enrichment.photos.length}`);
  if (enrichment.google_rating) console.log(`      Rating: ${enrichment.google_rating}/5`);

  return enrichment;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 BOOTH DATA ENRICHMENT\n');
  console.log('='.repeat(60));

  const BATCH_SIZE = parseInt(process.argv[2] || '50');
  console.log(`Batch size: ${BATCH_SIZE} booths\n`);

  // Get booths needing enrichment
  const { data: booths, error } = await supabase
    .from('booths')
    .select('*')
    .eq('status', 'active')
    .or('address.is.null,photos.is.null,phone.is.null,website.is.null')
    .limit(BATCH_SIZE);

  if (error) {
    console.error('Error fetching booths:', error);
    return;
  }

  if (!booths || booths.length === 0) {
    console.log('No booths need enrichment!');
    return;
  }

  console.log(`Found ${booths.length} booths needing enrichment\n`);

  let enriched = 0;
  let skipped = 0;
  let errors = 0;

  for (const booth of booths) {
    try {
      const enrichment = await enrichBooth(booth);

      if (!enrichment) {
        skipped++;
        continue;
      }

      // Update database
      const { error: updateError } = await supabase
        .from('booths')
        .update({
          address: enrichment.address || booth.address,
          phone: enrichment.phone || booth.phone,
          website: enrichment.website || booth.website,
          hours: enrichment.hours || booth.hours,
          photos: enrichment.photos || booth.photos,
          google_rating: enrichment.google_rating,
          google_place_id: enrichment.google_place_id,
          enrichment_confidence: enrichment.enrichment_confidence,
          enriched_at: enrichment.enriched_at
        })
        .eq('id', booth.id);

      if (updateError) {
        console.error(`   ❌ Update failed: ${updateError.message}`);
        errors++;
      } else {
        enriched++;
      }

      // Rate limiting: 10 requests per second
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Enriched: ${enriched}`);
  console.log(`⚠️  Skipped: ${skipped} (low confidence)`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(60));
  console.log('\n✨ Done!');
}

main().catch(console.error);
