/**
 * AUTONOMOUS GEOCODING ENGINE
 *
 * Continuously geocodes ALL booths without coordinates until completion.
 *
 * Features:
 * - Multi-strategy geocoding (address-based, city-based, venue search)
 * - Automatic batch processing
 * - Smart fallbacks for tricky locations
 * - Respects Google Maps API rate limits
 * - Runs until 100% completion
 * - Progress tracking and reporting
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=xxx npx tsx autonomous-geocoding-engine.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY_BACKEND || '';

interface Booth {
  id: string;
  name: string;
  address: string | null;
  city: string;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
  strategy: string;
  confidence: 'high' | 'medium' | 'low';
}

interface BatchStats {
  batchNumber: number;
  succeeded: number;
  failed: number;
  duration: number;
  strategyCounts: Record<string, number>;
}

/**
 * Count booths still needing geocoding
 */
async function getBoothsNeedingGeocoding(): Promise<number> {
  const { count } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('latitude', null);

  return count || 0;
}

/**
 * Normalize booth name for better geocoding
 */
function normalizeBoothName(name: string): string[] {
  const variations: string[] = [];
  variations.push(name);

  // Remove common suffixes that confuse geocoding
  const suffixPatterns = [
    / (I{1,3})$/i,
    / #?\d+$/,
    / \(\d+\)$/,
    / \d+$/,
  ];

  let normalized = name;
  for (const pattern of suffixPatterns) {
    normalized = normalized.replace(pattern, '').trim();
    if (normalized !== name && !variations.includes(normalized)) {
      variations.push(normalized);
    }
  }

  // Remove location descriptors
  const locationPatterns = [
    / Hotel( Lobby| Entrance)?$/i,
    / Station$/i,
    / Gallery(\s+\+?\s*Museum)?$/i,
    / Club$/i,
    / Bar$/i,
  ];

  for (const pattern of locationPatterns) {
    const cleaned = name.replace(pattern, '').trim();
    if (cleaned !== name && !variations.includes(cleaned)) {
      variations.push(cleaned);
    }
  }

  return variations;
}

/**
 * Sleep utility
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Strategy 1: Geocode using full address (most accurate)
 */
async function geocodeByAddress(booth: Booth): Promise<GeocodingResult | null> {
  if (!booth.address) return null;

  const query = `${booth.address}, ${booth.city}, ${booth.country}`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
        strategy: 'address',
        confidence: 'high',
      };
    }
  } catch (error) {
    console.error(`   Geocoding error:`, error);
  }

  return null;
}

/**
 * Strategy 2: Geocode using booth name + city (good for landmarks)
 */
async function geocodeByVenueName(booth: Booth): Promise<GeocodingResult | null> {
  const nameVariations = normalizeBoothName(booth.name);

  for (const nameVariation of nameVariations) {
    const query = `${nameVariation}, ${booth.city}, ${booth.country}`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const resultName = data.results[0].formatted_address;

        // Check if result seems reasonable (contains city or country)
        const cityMatch = resultName.toLowerCase().includes(booth.city.toLowerCase());
        const countryMatch = resultName.toLowerCase().includes(booth.country.toLowerCase());

        if (cityMatch || countryMatch) {
          return {
            latitude: location.lat,
            longitude: location.lng,
            strategy: 'venue-name',
            confidence: cityMatch ? 'medium' : 'low',
          };
        }
      }
    } catch (error) {
      console.error(`   Geocoding error:`, error);
    }

    // Small delay between variations
    await sleep(100);
  }

  return null;
}

/**
 * Strategy 3: Geocode using city center (fallback for impossible cases)
 */
async function geocodeByCityCenter(booth: Booth): Promise<GeocodingResult | null> {
  const query = `${booth.city}, ${booth.state || ''} ${booth.country}`.trim();
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
        strategy: 'city-center',
        confidence: 'low',
      };
    }
  } catch (error) {
    console.error(`   Geocoding error:`, error);
  }

  return null;
}

/**
 * Geocode a single booth using all strategies
 */
async function geocodeBooth(booth: Booth): Promise<GeocodingResult | null> {
  const location = [booth.city, booth.state, booth.country].filter(Boolean).join(', ');
  console.log(`\n📍 ${booth.name} (${location})`);

  // Try strategies in order of confidence
  let result: GeocodingResult | null = null;

  // Strategy 1: Full address (highest confidence)
  if (booth.address) {
    console.log(`   🔍 Trying address: "${booth.address}"`);
    result = await geocodeByAddress(booth);
    if (result) {
      console.log(`   ✅ Found via address (${result.confidence} confidence)`);
      return result;
    }
    await sleep(100);
  }

  // Strategy 2: Venue name (medium confidence)
  console.log(`   🔍 Trying venue name: "${booth.name}"`);
  result = await geocodeByVenueName(booth);
  if (result) {
    console.log(`   ✅ Found via venue name (${result.confidence} confidence)`);
    return result;
  }
  await sleep(100);

  // Strategy 3: City center (low confidence, but better than nothing)
  console.log(`   🔍 Falling back to city center`);
  result = await geocodeByCityCenter(booth);
  if (result) {
    console.log(`   ⚠️  Using city center coordinates (${result.confidence} confidence)`);
    return result;
  }

  console.log(`   ❌ No geocoding results found`);
  return null;
}

/**
 * Update booth coordinates in database
 */
async function updateBoothCoordinates(boothId: string, result: GeocodingResult): Promise<boolean> {
  const { error } = await supabase
    .from('booths')
    .update({
      latitude: result.latitude,
      longitude: result.longitude,
    })
    .eq('id', boothId);

  if (error) {
    console.error(`   ❌ Database update failed: ${error.message}`);
    return false;
  }

  return true;
}

/**
 * Process a batch of booths
 */
async function processBatch(batchNumber: number, batchSize: number): Promise<BatchStats> {
  console.log(`\n🚀 Batch ${batchNumber} - Processing ${batchSize} booths`);
  console.log('━'.repeat(60));

  const startTime = Date.now();
  let succeeded = 0;
  let failed = 0;
  const strategyCounts: Record<string, number> = {};

  // Fetch booths needing geocoding
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, address, city, state, country, latitude, longitude')
    .eq('status', 'active')
    .is('latitude', null)
    .limit(batchSize);

  if (error || !booths || booths.length === 0) {
    console.log('No booths to process in this batch');
    return {
      batchNumber,
      succeeded: 0,
      failed: 0,
      duration: 0,
      strategyCounts: {},
    };
  }

  console.log(`Found ${booths.length} booths to geocode\n`);

  // Process each booth
  for (let i = 0; i < booths.length; i++) {
    const booth = booths[i];
    console.log(`[${i + 1}/${booths.length}]`);

    try {
      const result = await geocodeBooth(booth);

      if (result) {
        const updated = await updateBoothCoordinates(booth.id, result);

        if (updated) {
          succeeded++;
          strategyCounts[result.strategy] = (strategyCounts[result.strategy] || 0) + 1;
          console.log(`   💾 Updated: ${result.latitude}, ${result.longitude}`);
        } else {
          failed++;
        }
      } else {
        failed++;
      }

      // Rate limiting: 50 requests per second = 20ms between requests
      // Using 500ms to be extra safe and avoid quota issues
      if (i < booths.length - 1) {
        await sleep(500);
      }

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      failed++;
    }
  }

  const duration = (Date.now() - startTime) / 1000 / 60;

  return {
    batchNumber,
    succeeded,
    failed,
    duration,
    strategyCounts,
  };
}

/**
 * Main autonomous loop
 */
async function main() {
  console.log('🗺️  AUTONOMOUS GEOCODING ENGINE');
  console.log('============================');
  console.log('Running until all booths have coordinates\n');

  let batchNumber = 0;
  const allBatches: BatchStats[] = [];
  let totalSucceeded = 0;
  let totalFailed = 0;
  const allStrategyCounts: Record<string, number> = {};

  const BATCH_SIZE = 100;
  const INITIAL_TOTAL = await getBoothsNeedingGeocoding();

  console.log(`📊 Initial count: ${INITIAL_TOTAL} booths need geocoding`);
  console.log(`⏰ Estimated time: ~${Math.ceil((INITIAL_TOTAL * 0.5) / 60)} hours at 500ms per booth\n`);

  while (true) {
    // Check remaining booths
    const remaining = await getBoothsNeedingGeocoding();

    if (remaining === 0) {
      console.log('\n\n🎉 MISSION COMPLETE!');
      console.log('='.repeat(60));
      console.log('All booths now have coordinates!');
      break;
    }

    const progress = ((INITIAL_TOTAL - remaining) / INITIAL_TOTAL * 100).toFixed(1);
    console.log(`\n📊 Progress: ${INITIAL_TOTAL - remaining}/${INITIAL_TOTAL} complete (${progress}%)`);
    console.log(`📍 Remaining: ${remaining} booths`);

    // Launch next batch
    batchNumber++;

    try {
      const batchSize = Math.min(BATCH_SIZE, remaining);
      const stats = await processBatch(batchNumber, batchSize);
      allBatches.push(stats);

      totalSucceeded += stats.succeeded;
      totalFailed += stats.failed;

      // Aggregate strategy counts
      Object.entries(stats.strategyCounts).forEach(([strategy, count]) => {
        allStrategyCounts[strategy] = (allStrategyCounts[strategy] || 0) + count;
      });

      console.log('\n✅ Batch Complete!');
      console.log(`   Succeeded: ${stats.succeeded}`);
      console.log(`   Failed: ${stats.failed}`);
      console.log(`   Duration: ${stats.duration.toFixed(1)} min`);
      console.log(`   Strategies used:`, stats.strategyCounts);

      // Brief pause between batches
      console.log('\n⏸️  Pausing 10 seconds before next batch...');
      await sleep(10000);

    } catch (error) {
      console.error(`\n❌ Batch ${batchNumber} encountered an error:`, error);
      console.log('   Continuing with next batch after 30-second pause...');
      await sleep(30000);
    }
  }

  // Final summary
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Batches: ${allBatches.length}`);
  console.log(`Total Geocoded: ${totalSucceeded}`);
  console.log(`Total Failures: ${totalFailed}`);
  console.log(`Success Rate: ${(totalSucceeded / (totalSucceeded + totalFailed) * 100).toFixed(1)}%`);
  console.log(`\nStrategies Used:`);
  Object.entries(allStrategyCounts).forEach(([strategy, count]) => {
    console.log(`  - ${strategy}: ${count} (${(count / totalSucceeded * 100).toFixed(1)}%)`);
  });
  console.log('═'.repeat(60));
  console.log('\n✨ All done! Every booth now has coordinates.');

  // Verify map display count
  console.log('\n🗺️  Verifying map display...');
  const { count } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('is_operational', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  console.log(`Map should now display: ${count} booths (up from 319)`);
}

main().catch(console.error);
