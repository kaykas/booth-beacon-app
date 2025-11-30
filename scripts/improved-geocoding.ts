import { createClient } from '@supabase/supabase-js';
import { decode } from 'html-entities';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface Booth {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address?: string;
  provider: string;
  confidence: 'high' | 'medium' | 'low';
}

// HTML entity decoder
function cleanAddress(text: string): string {
  // Decode HTML entities like &eacute; &szlig; &amp;
  const decoded = decode(text);
  // Normalize whitespace
  return decoded.replace(/\s+/g, ' ').trim();
}

// Enrich address with city and country context
function enrichAddress(booth: Booth): string {
  const cleanAddr = cleanAddress(booth.address);
  const cleanCity = cleanAddress(booth.city);
  const cleanCountry = cleanAddress(booth.country);

  // If address doesn't contain city, add it
  const hasCity = cleanAddr.toLowerCase().includes(cleanCity.toLowerCase());
  const hasCountry = cleanAddr.toLowerCase().includes(cleanCountry.toLowerCase());

  let enriched = cleanAddr;
  if (!hasCity) {
    enriched += `, ${cleanCity}`;
  }
  if (!hasCountry) {
    enriched += `, ${cleanCountry}`;
  }

  return enriched;
}

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on 400 errors (bad request)
      if (error.status === 400 || error.message?.includes('ZERO_RESULTS')) {
        throw error;
      }

      const delay = initialDelay * Math.pow(2, i);
      console.log(`  Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
}

// Provider 1: Google Maps Geocoding API
async function geocodeWithGoogle(address: string): Promise<GeocodeResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results?.[0]) {
      const result = data.results[0];
      const location = result.geometry.location;

      // Determine confidence based on location_type
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      if (result.geometry.location_type === 'ROOFTOP') {
        confidence = 'high';
      } else if (result.geometry.location_type === 'APPROXIMATE') {
        confidence = 'low';
      }

      return {
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: result.formatted_address,
        provider: 'google',
        confidence,
      };
    }

    return null;
  } catch (error) {
    console.error('  Google Geocoding error:', error);
    return null;
  }
}

// Provider 2: Nominatim (OpenStreetMap)
async function geocodeWithNominatim(address: string): Promise<GeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BoothBeacon/1.0 (contact@boothbeacon.org)',
      },
    });

    const data = await response.json();

    if (data?.[0]) {
      const result = data[0];

      // Determine confidence based on importance and type
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      if (result.importance > 0.6) {
        confidence = 'high';
      } else if (result.importance < 0.3) {
        confidence = 'low';
      }

      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formatted_address: result.display_name,
        provider: 'nominatim',
        confidence,
      };
    }

    return null;
  } catch (error) {
    console.error('  Nominatim error:', error);
    return null;
  }
}

// Fallback: City centroid
async function geocodeCityCentroid(city: string, country: string): Promise<GeocodeResult | null> {
  const searchQuery = `${cleanAddress(city)}, ${cleanAddress(country)}`;

  // Try Google first for city
  let result = await geocodeWithGoogle(searchQuery);
  if (result) {
    return {
      ...result,
      confidence: 'low', // City centroid is always low confidence
    };
  }

  // Try Nominatim for city
  result = await geocodeWithNominatim(searchQuery);
  if (result) {
    return {
      ...result,
      confidence: 'low',
    };
  }

  return null;
}

// Main geocoding function with cascade
async function geocodeBooth(booth: Booth): Promise<GeocodeResult | null> {
  const enrichedAddress = enrichAddress(booth);

  console.log(`  Trying: "${enrichedAddress}"`);

  // Try Google Maps
  if (GOOGLE_MAPS_API_KEY) {
    console.log('    → Google Maps...');
    const result = await retryWithBackoff(() => geocodeWithGoogle(enrichedAddress));
    if (result) {
      console.log(`    ✓ Google (${result.confidence}): ${result.latitude}, ${result.longitude}`);
      return result;
    }
  }

  // Try Nominatim (with rate limiting)
  console.log('    → Nominatim...');
  await sleep(1000); // Nominatim requires 1 req/sec
  const nominatimResult = await retryWithBackoff(() => geocodeWithNominatim(enrichedAddress));
  if (nominatimResult) {
    console.log(`    ✓ Nominatim (${nominatimResult.confidence}): ${nominatimResult.latitude}, ${nominatimResult.longitude}`);
    return nominatimResult;
  }

  // Fallback to city centroid
  console.log('    → City centroid fallback...');
  const centroidResult = await geocodeCityCentroid(booth.city, booth.country);
  if (centroidResult) {
    console.log(`    ✓ City centroid (low): ${centroidResult.latitude}, ${centroidResult.longitude}`);
    return centroidResult;
  }

  return null;
}

// Update booth in database
async function updateBoothCoordinates(boothId: string, result: GeocodeResult): Promise<void> {
  const { error } = await supabase
    .from('booths')
    .update({
      latitude: result.latitude,
      longitude: result.longitude,
      geocoded_at: new Date().toISOString(),
      geocode_provider: result.provider,
      geocode_confidence: result.confidence,
      updated_at: new Date().toISOString(),
    })
    .eq('id', boothId);

  if (error) {
    throw error;
  }
}

// Save progress to file
async function saveProgress(processedIds: Set<string>): Promise<void> {
  const fs = await import('fs/promises');
  const path = '/Users/jkw/Projects/booth-beacon-app/.geocoding-progress.json';
  await fs.writeFile(path, JSON.stringify(Array.from(processedIds), null, 2));
}

// Load progress from file
async function loadProgress(): Promise<Set<string>> {
  try {
    const fs = await import('fs/promises');
    const path = '/Users/jkw/Projects/booth-beacon-app/.geocoding-progress.json';
    const content = await fs.readFile(path, 'utf-8');
    return new Set(JSON.parse(content));
  } catch {
    return new Set();
  }
}

// Main runner
async function run() {
  console.log('🗺️  Starting Improved Geocoding Script\n');

  // Load progress
  const processedIds = await loadProgress();
  console.log(`📂 Loaded progress: ${processedIds.size} booths already processed\n`);

  // Get booths without coordinates
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, address, city, country, latitude, longitude')
    .is('latitude', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching booths:', error);
    return;
  }

  // Filter out already processed
  const unprocessedBooths = booths?.filter(b => !processedIds.has(b.id)) || [];

  console.log(`📍 Found ${unprocessedBooths.length} booths to geocode`);
  console.log(`📊 Total in database: ${booths?.length || 0} without coordinates\n`);

  if (unprocessedBooths.length === 0) {
    console.log('✅ All booths processed!');
    return;
  }

  let successful = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < unprocessedBooths.length; i++) {
    const booth = unprocessedBooths[i];
    console.log(`\n[${i + 1}/${unprocessedBooths.length}] ${booth.name} - ${booth.city}, ${booth.country}`);

    try {
      // Skip if already has coordinates (edge case)
      if (booth.latitude && booth.longitude) {
        console.log('  ⊘ Already has coordinates, skipping');
        skipped++;
        processedIds.add(booth.id);
        continue;
      }

      const result = await geocodeBooth(booth);

      if (result) {
        await updateBoothCoordinates(booth.id, result);
        successful++;
        processedIds.add(booth.id);
        console.log(`  ✅ Success!`);
      } else {
        failed++;
        processedIds.add(booth.id); // Mark as processed even if failed
        console.log(`  ❌ Failed to geocode`);
      }

      // Save progress every 10 booths
      if ((i + 1) % 10 === 0) {
        await saveProgress(processedIds);
        console.log(`\n💾 Progress saved (${processedIds.size} total processed)`);
      }

      // Rate limiting: 1 request per second minimum
      await sleep(1000);

    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
      failed++;
      processedIds.add(booth.id); // Mark as processed to avoid retry loops
    }
  }

  // Save final progress
  await saveProgress(processedIds);

  console.log('\n' + '='.repeat(60));
  console.log('📊 Final Results:');
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⊘ Skipped: ${skipped}`);
  console.log(`   📈 Success rate: ${Math.round((successful / (successful + failed)) * 100)}%`);
  console.log('='.repeat(60));

  // Get updated statistics
  const { data: stats } = await supabase
    .from('booths')
    .select('latitude')
    .not('latitude', 'is', null);

  const { count: total } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📍 Total geocoded: ${stats?.length || 0}/${total || 0} (${Math.round(((stats?.length || 0) / (total || 1)) * 100)}%)`);
}

run().catch(console.error);
