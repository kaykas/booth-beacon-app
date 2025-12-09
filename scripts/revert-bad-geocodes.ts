#!/usr/bin/env npx tsx

/**
 * Revert coordinates that moved >100km
 *
 * Restores old coordinates for booths that had large, suspicious movements
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface GeocodeUpdate {
  boothId: string;
  boothName: string;
  oldLatitude?: number;
  oldLongitude?: number;
  newLatitude: number;
  newLongitude: number;
  confidence: string;
  provider: string;
  status: string;
}

interface GeocodeReport {
  updates: GeocodeUpdate[];
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function run() {
  console.log('='.repeat(80));
  console.log('REVERTING BAD GEOCODES (>100km movement)');
  console.log('='.repeat(80));
  console.log('');

  // Read the geocoding report
  const reportContent = await fs.readFile(
    '/Users/jkw/Projects/booth-beacon-app/scripts/geocoding-report-2025-12-09.json',
    'utf-8'
  );
  const report: GeocodeReport = JSON.parse(reportContent);

  // Find booths that moved >100km
  const toRevert: Array<{ boothId: string; boothName: string; oldLat: number; oldLng: number; distance: number }> = [];

  for (const update of report.updates) {
    if (!update.oldLatitude || !update.oldLongitude) continue;
    if (update.status === 'failed') continue;

    const distance = calculateDistance(
      update.oldLatitude,
      update.oldLongitude,
      update.newLatitude,
      update.newLongitude
    );

    if (distance > 100) {
      toRevert.push({
        boothId: update.boothId,
        boothName: update.boothName,
        oldLat: update.oldLatitude,
        oldLng: update.oldLongitude,
        distance
      });
    }
  }

  console.log(`Found ${toRevert.length} booths that moved >100km\n`);

  if (toRevert.length === 0) {
    console.log('Nothing to revert!');
    return;
  }

  // Revert in batches
  let reverted = 0;
  let failed = 0;

  for (const booth of toRevert) {
    console.log(`Reverting: ${booth.boothName} (moved ${booth.distance.toFixed(1)}km)`);

    const { error } = await supabase
      .from('booths')
      .update({
        latitude: booth.oldLat,
        longitude: booth.oldLng,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booth.boothId);

    if (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      failed++;
    } else {
      console.log(`   ✅ Reverted to ${booth.oldLat}, ${booth.oldLng}`);
      reverted++;
    }
  }

  console.log('');
  console.log('='.repeat(80));
  console.log(`✅ Reverted: ${reverted}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(80));
}

run().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
