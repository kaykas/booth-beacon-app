#!/usr/bin/env npx tsx

/**
 * Booth Beacon - Batch Geocoding Fix Script
 *
 * Uses the new cascade geocoding system with Nominatim → Mapbox → Google fallback
 *
 * Features:
 * 1. Automatic provider cascade (free → generous free → premium)
 * 2. Address completeness validation
 * 3. Confidence scoring for manual review flagging
 * 4. Backup of old coordinates
 * 5. Detailed reporting
 *
 * Usage:
 *   npx tsx scripts/fix-geocoding-batch.ts --csv booth_ids.csv
 *   npx tsx scripts/fix-geocoding-batch.ts --booth-ids id1,id2,id3
 *   npx tsx scripts/fix-geocoding-batch.ts --all
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { geocodeWithCascade, getDefaultCascadeConfig, type GeocodeResult as CascadeGeocodeResult } from '../src/lib/geocoding-cascade';
import type { BoothAddressData } from '../src/lib/geocoding-validation';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Initialize cascade configuration
const cascadeConfig = getDefaultCascadeConfig();

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
  matchScore: number;
  validationIssues: string[];
  needsReview: boolean;
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

// Utility function for rate limiting - not currently used as cascade handles this internally
const _sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

  // Address must have street number/name and not be just the business name
  const hasNumber = /\d+/.test(addr);
  const notJustName = addr !== cleanAddress(booth.name).toLowerCase();
  const isNotEmpty = addr.length > 5;

  return hasNumber && notJustName && isNotEmpty;
}

// Enrich address with city and country context - not currently used but may be needed
function _enrichAddress(booth: Booth): string {
  const cleanAddr = cleanAddress(booth.address);
  const cleanCity = cleanAddress(booth.city);
  const cleanCountry = cleanAddress(booth.country);

  // If address doesn't contain city: _city, add it
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

// Main geocoding function using cascade system
async function geocodeBooth(booth: Booth): Promise<GeocodeResult | null> {
  // Convert Booth to BoothAddressData for cascade
  const boothData: BoothAddressData = {
    name: booth.name,
    address: cleanAddress(booth.address),
    city: cleanAddress(booth.city),
    state: booth.state || null,
    country: cleanAddress(booth.country),
  };

  try {
    // Use the cascade system which handles provider fallback automatically
    const cascadeResult: CascadeGeocodeResult | null = await geocodeWithCascade(boothData, cascadeConfig);

    if (!cascadeResult) {
      return null;
    }

    // Convert CascadeGeocodeResult to GeocodeResult format for this script
    return {
      latitude: cascadeResult.lat,
      longitude: cascadeResult.lng,
      formatted_address: cascadeResult.displayName,
      provider: cascadeResult.provider,
      confidence: cascadeResult.confidence,
      matchScore: cascadeResult.matchScore,
      validationIssues: cascadeResult.validationIssues,
      needsReview: cascadeResult.needsReview,
    };
  } catch (error) {
    console.error(`   Error geocoding: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

// Update booth in database with backup
async function updateBoothCoordinates(
  boothId: string,
  result: GeocodeResult,
  oldLatitude?: number,
  oldLongitude?: number
): Promise<void> {
  // Update coordinates and validation metadata
  const { error } = await supabase
    .from('booths')
    .update({
      latitude: result.latitude,
      longitude: result.longitude,
      geocoded_at: new Date().toISOString(),
      geocode_confidence: result.confidence,
      geocode_match_score: result.matchScore,
      geocode_validation_issues: result.validationIssues,
      geocode_validated_at: new Date().toISOString(),
      needs_geocode_review: result.needsReview,
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

  // Skip header row and extract only first column (booth_id)
  const ids: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Extract first column (booth_id), handling quoted values
    const match = line.match(/^"([^"]+)"|^([^,]+)/);
    if (match) {
      const boothId = (match[1] || match[2]).trim();
      if (boothId) {
        ids.push(boothId);
      }
    }
  }

  return Array.from(new Set(ids)); // Remove duplicates
}

// Main runner
async function run() {
  console.log('='.repeat(100));
  console.log('BOOTH BEACON - BATCH GEOCODING FIX SCRIPT');
  console.log('Using Cascade System: Nominatim (Free) → Mapbox (100k/mo) → Google (Premium)');
  console.log('='.repeat(100));
  console.log('');

  // Log provider availability
  console.log('Provider Status:');
  console.log(`  Nominatim (OSM): ${cascadeConfig.enableNominatim ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  Mapbox: ${cascadeConfig.enableMapbox ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  Google Maps: ${cascadeConfig.enableGoogle ? '✅ Enabled' : '❌ Disabled'}`);
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

  let booths: Booth[] = [];

  if (boothIds) {
    // Fetch in batches of 100 to avoid headers overflow
    const batchSize = 100;
    const totalBatches = Math.ceil(boothIds.length / batchSize);

    console.log(`   Fetching ${boothIds.length} booths in ${totalBatches} batches...`);

    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, boothIds.length);
      const batchIds = boothIds.slice(start, end);

      const { data, error } = await supabase
        .from('booths')
        .select('id, slug, name, address, city, state, country, postal_code, latitude, longitude')
        .in('id', batchIds);

      if (error) {
        console.error(`Error fetching batch ${i + 1}:`, error);
        process.exit(1);
      }

      if (data) {
        booths.push(...data);
      }

      console.log(`   Batch ${i + 1}/${totalBatches}: Fetched ${data?.length || 0} booths`);
    }
  } else {
    // All booths
    const { data, error } = await supabase
      .from('booths')
      .select('id, slug, name, address, city, state, country, postal_code, latitude, longitude');

    if (error) {
      console.error('Error fetching booths:', error);
      process.exit(1);
    }

    booths = data || [];
  }

  if (booths.length === 0) {
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
          addressWasIncomplete: !addressComplete,
          status: 'failed',
          error: 'Could not geocode address',
        };
        updates.push(failedUpdate);
        console.log('   ❌ Failed to geocode');
      }

      // Note: Rate limiting is now handled internally by the cascade system

    } catch (_error) {
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
