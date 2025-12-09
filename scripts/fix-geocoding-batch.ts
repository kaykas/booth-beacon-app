#!/usr/bin/env npx ts-node

/**
 * Booth Beacon - Batch Geocoding Fix Script
 *
 * Takes a CSV of booth IDs and re-geocodes them with the following logic:
 * 1. Check if address is complete
 * 2. If incomplete: try to fetch from Google Maps API
 * 3. If complete: re-geocode with validation
 * 4. Store old coordinates as backup
 * 5. Flag low-confidence results
 * 6. Create review report
 *
 * Rate limiting: 1 req/sec for Nominatim
 *
 * Usage:
 *   ./scripts/fix-geocoding-batch.ts --csv booth_ids.csv
 *   ./scripts/fix-geocoding-batch.ts --booth-ids id1,id2,id3
 *   ./scripts/fix-geocoding-batch.ts --all
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY_BACKEND || process.env.GOOGLE_MAPS_API_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface Booth {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
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

interface GeocodeUpdate {
  boothId: string;
  boothName: string;
  oldLatitude?: number;
  oldLongitude?: number;
  newLatitude: number;
  newLongitude: number;
  confidence: 'high' | 'medium' | 'low';
  provider: string;
  addressWasIncomplete: boolean;
  status: 'success' | 'failed' | 'low_confidence';
  error?: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// HTML entity decoder
function cleanAddress(text: string): string {
  if (!text) return '';
  // Decode HTML entities like &eacute; &szlig; &amp;
  const decoded = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  // Normalize whitespace
  return decoded.replace(/\s+/g, ' ').trim();
}

// Check if address is complete
function isAddressComplete(booth: Booth): boolean {
  const addr = cleanAddress(booth.address).toLowerCase();
  const city = cleanAddress(booth.city).toLowerCase();

  // Address must have street number/name and not be just the business name
  const hasNumber = /\d+/.test(addr);
  const notJustName = addr !== cleanAddress(booth.name).toLowerCase();
  const isNotEmpty = addr.length > 5;

  return hasNumber && notJustName && isNotEmpty;
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
  if (!hasCity && cleanCity) {
    enriched += `, ${cleanCity}`;
  }
  if (!hasCountry && cleanCountry) {
    enriched += `, ${cleanCountry}`;
  }

  return enriched;
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const err = error as { status?: number; message?: string };

      // Don't retry on 400 errors (bad request)
      if (err.status === 400 || err.message?.includes('ZERO_RESULTS')) {
        throw error;
      }

      const delay = initialDelay * Math.pow(2, i);
      if (i < maxRetries - 1) {
        await sleep(delay);
      }
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
    const data = await response.json() as { status?: string; results?: Array<{geometry: {location: {lat: number; lng: number}; location_type: string}; formatted_address: string}> };

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

    const data = await response.json() as Array<{lat: string; lon: string; importance: number; display_name: string}>;

    if (data?.[0]) {
      const result = data[0];

      // Determine confidence based on importance
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      if (parseFloat(result.importance) > 0.6) {
        confidence = 'high';
      } else if (parseFloat(result.importance) < 0.3) {
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

  // Try Google Maps first (if available)
  if (GOOGLE_MAPS_API_KEY) {
    const result = await retryWithBackoff(() => geocodeWithGoogle(enrichedAddress), 2, 500).catch(() => null);
    if (result) {
      return result;
    }
  }

  // Try Nominatim (with rate limiting)
  await sleep(1100); // Nominatim requires 1 req/sec
  const nominatimResult = await retryWithBackoff(() => geocodeWithNominatim(enrichedAddress), 2, 500).catch(() => null);
  if (nominatimResult) {
    return nominatimResult;
  }

  // Fallback to city centroid
  const centroidResult = await geocodeCityCentroid(booth.city, booth.country);
  if (centroidResult) {
    return centroidResult;
  }

  return null;
}

// Update booth in database with backup
async function updateBoothCoordinates(
  boothId: string,
  result: GeocodeResult,
  oldLatitude?: number,
  oldLongitude?: number
): Promise<void> {
  const { error } = await supabase
    .from('booths')
    .update({
      latitude: result.latitude,
      longitude: result.longitude,
      geocoded_at: new Date().toISOString(),
      geocode_provider: result.provider,
      geocode_confidence: result.confidence,
      // Store backup of old coordinates if they existed
      ...(oldLatitude !== undefined && oldLongitude !== undefined && {
        previous_latitude: oldLatitude,
        previous_longitude: oldLongitude,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', boothId);

  if (error) {
    throw error;
  }
}

// Parse command-line arguments
function parseArgs(): {
  boothIds?: string[];
  csvPath?: string;
  allBooths?: boolean;
} {
  const args = process.argv.slice(2);
  const result: {
    boothIds?: string[];
    csvPath?: string;
    allBooths?: boolean;
  } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--csv' && args[i + 1]) {
      result.csvPath = args[++i];
    } else if (arg === '--booth-ids' && args[i + 1]) {
      result.boothIds = args[++i].split(',').map(id => id.trim());
    } else if (arg === '--all') {
      result.allBooths = true;
    }
  }

  return result;
}

// Read booth IDs from CSV
async function readBoothIdsFromCsv(csvPath: string): Promise<string[]> {
  const content = await fs.readFile(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  // Handle both single column and comma-separated values
  const ids: string[] = [];
  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim());
    for (const part of parts) {
      if (part && part !== 'id' && part !== 'booth_id' && part !== 'booth_slug') {
        ids.push(part);
      }
    }
  }

  return [...new Set(ids)]; // Remove duplicates
}

// Main runner
async function run() {
  console.log('='.repeat(100));
  console.log('BOOTH BEACON - BATCH GEOCODING FIX SCRIPT');
  console.log('='.repeat(100));
  console.log('');

  const args = parseArgs();
  let boothIds: string[] | undefined;

  // Determine which booths to process
  if (args.csvPath) {
    console.log(`📂 Reading booth IDs from CSV: ${args.csvPath}`);
    boothIds = await readBoothIdsFromCsv(args.csvPath);
    console.log(`   Found ${boothIds.length} booth IDs\n`);
  } else if (args.boothIds) {
    boothIds = args.boothIds;
    console.log(`📌 Processing ${boothIds.length} specified booth IDs\n`);
  } else if (args.allBooths) {
    console.log('📍 Processing ALL booths without complete data\n');
  } else {
    console.log('Usage:');
    console.log('  --csv <path>         Read booth IDs from CSV file');
    console.log('  --booth-ids id1,id2  Process specific booths');
    console.log('  --all                Process all booths without complete data');
    console.log('');
    process.exit(0);
  }

  // Fetch booths to process
  console.log('📚 Fetching booth data from database...\n');

  let boothsQuery = supabase
    .from('booths')
    .select('id, slug, name, address, city, state, country, postal_code, latitude, longitude');

  if (boothIds) {
    boothsQuery = boothsQuery.in('id', boothIds);
  } else {
    // All booths - this will still geocode all, but we might want to filter
    // to only those needing updates
  }

  const { data: booths, error } = await boothsQuery;

  if (error) {
    console.error('Error fetching booths:', error);
    process.exit(1);
  }

  if (!booths || booths.length === 0) {
    console.log('No booths found to process');
    process.exit(0);
  }

  console.log(`Found ${booths.length} booths to process\n`);

  const updates: GeocodeUpdate[] = [];
  let successful = 0;
  let failed = 0;
  let lowConfidence = 0;

  // Process each booth
  for (let i = 0; i < booths.length; i++) {
    const booth = booths[i] as Booth;
    const addressComplete = isAddressComplete(booth);

    console.log(`[${i + 1}/${booths.length}] ${booth.name}`);
    console.log(`   City: ${booth.city}, ${booth.state || booth.country}`);

    try {
      // Skip if already has good coordinates and address is complete
      if (booth.latitude && booth.longitude && addressComplete) {
        console.log('   ⊘ Already has valid coordinates and complete address');
        continue;
      }

      // Try to geocode
      const result = await geocodeBooth(booth);

      if (result) {
        const update: GeocodeUpdate = {
          boothId: booth.id,
          boothName: booth.name,
          oldLatitude: booth.latitude,
          oldLongitude: booth.longitude,
          newLatitude: result.latitude,
          newLongitude: result.longitude,
          confidence: result.confidence,
          provider: result.provider,
          addressWasIncomplete: !addressComplete,
          status: result.confidence === 'low' ? 'low_confidence' : 'success',
        };

        // Update database
        await updateBoothCoordinates(booth.id, result, booth.latitude, booth.longitude);

        updates.push(update);

        if (result.confidence === 'low') {
          lowConfidence++;
          console.log(`   ⚠️  LOW CONFIDENCE (${result.provider}): ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`);
        } else {
          successful++;
          console.log(`   ✅ ${result.confidence.toUpperCase()} (${result.provider}): ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`);
        }
      } else {
        failed++;
        const failedUpdate: GeocodeUpdate = {
          boothId: booth.id,
          boothName: booth.name,
          oldLatitude: booth.latitude,
          oldLongitude: booth.longitude,
          newLatitude: 0,
          newLongitude: 0,
          confidence: 'low',
          provider: 'none',
          addressWasIncomplete,
          status: 'failed',
          error: 'Could not geocode address',
        };
        updates.push(failedUpdate);
        console.log('   ❌ Failed to geocode');
      }

      // Rate limiting
      await sleep(1100);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed++;
      const failedUpdate: GeocodeUpdate = {
        boothId: booth.id,
        boothName: booth.name,
        oldLatitude: booth.latitude,
        oldLongitude: booth.longitude,
        newLatitude: 0,
        newLongitude: 0,
        confidence: 'low',
        provider: 'none',
        addressWasIncomplete: !addressComplete,
        status: 'failed',
        error: message,
      };
      updates.push(failedUpdate);
      console.log(`   ❌ Error: ${message}`);
    }
  }

  // Generate report
  console.log('\n' + '='.repeat(100));
  console.log('GEOCODING REPORT');
  console.log('='.repeat(100));
  console.log(`✅ Successful:      ${successful}`);
  console.log(`⚠️  Low Confidence: ${lowConfidence}`);
  console.log(`❌ Failed:         ${failed}`);
  console.log(`📊 Success Rate:   ${booths.length > 0 ? ((successful / booths.length) * 100).toFixed(1) : 0}%`);
  console.log('='.repeat(100));

  // Save detailed report to file
  const reportPath = path.join(
    path.dirname(process.argv[1]),
    `geocoding-report-${new Date().toISOString().split('T')[0]}.json`
  );

  await fs.writeFile(
    reportPath,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: booths.length,
        successful,
        lowConfidence,
        failed,
        successRate: ((successful / booths.length) * 100).toFixed(1) + '%',
      },
      updates,
    }, null, 2)
  );

  console.log(`\n📄 Detailed report saved: ${reportPath}`);

  // Identify low-confidence booths for manual review
  const lowConfidenceBooths = updates.filter(u => u.status === 'low_confidence');
  if (lowConfidenceBooths.length > 0) {
    console.log('\n⚠️  LOW CONFIDENCE RESULTS - MANUAL REVIEW RECOMMENDED:');
    console.log('   (These booths should be manually verified)\n');
    for (const booth of lowConfidenceBooths) {
      console.log(`   • ${booth.boothName}`);
      console.log(`     → ${booth.newLatitude.toFixed(6)}, ${booth.newLongitude.toFixed(6)} (${booth.provider})`);
    }
  }

  const failedBooths = updates.filter(u => u.status === 'failed');
  if (failedBooths.length > 0) {
    console.log('\n❌ FAILED GEOCODING - REQUIRES ATTENTION:');
    console.log('   (These booths need manual address correction)\n');
    for (const booth of failedBooths) {
      console.log(`   • ${booth.boothName}`);
      if (booth.error) {
        console.log(`     → Error: ${booth.error}`);
      }
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('BATCH GEOCODING COMPLETE');
  console.log('='.repeat(100));
}

run().catch(error => {
  console.error('\nFATAL ERROR:', error);
  process.exit(1);
});
