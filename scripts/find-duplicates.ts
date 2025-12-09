#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('='.repeat(80));
  console.log('FINDING DUPLICATE BOOTH ENTRIES');
  console.log('='.repeat(80));
  console.log('');

  // Get all booths
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, slug, address, city, state, latitude, longitude')
    .order('name');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  // Group by name + city to find duplicates
  const groups = new Map<string, typeof booths>();

  for (const booth of booths) {
    const key = `${booth.name.toLowerCase().trim()}|${booth.city.toLowerCase().trim()}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(booth);
  }

  // Find groups with duplicates
  const duplicates = Array.from(groups.entries())
    .filter(([_, booths]) => booths.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }

  console.log(`🚨 Found ${duplicates.length} sets of duplicate booths:\\n`);

  for (const [key, boothGroup] of duplicates) {
    const [name, city] = key.split('|');
    console.log(`${'='.repeat(80)}`);
    console.log(`${boothGroup.length}× ${name} (${city})`);
    console.log('');

    for (const booth of boothGroup) {
      console.log(`  • ID: ${booth.id}`);
      console.log(`    Slug: ${booth.slug}`);
      console.log(`    Address: ${booth.address}`);
      console.log(`    Coords: ${booth.latitude}, ${booth.longitude}`);
      console.log('');
    }
  }

  console.log('='.repeat(80));
  console.log(`SUMMARY: ${duplicates.length} duplicate sets, ${duplicates.reduce((sum, [_, booths]) => sum + booths.length - 1, 0)} extra entries`);
  console.log('='.repeat(80));
}

run().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
