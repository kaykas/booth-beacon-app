#!/usr/bin/env npx tsx

/**
 * Delete duplicate Heebe Jeebe booth
 * Keep: heebe-jeebe-general-store-petaluma (original)
 * Delete: heebe-jeebe-general-store-petaluma-1 (duplicate)
 */

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
  console.log('DELETING DUPLICATE HEEBE JEEBE BOOTH');
  console.log('='.repeat(80));
  console.log('');

  // Fetch both booths to confirm
  const { data: booths, error: fetchError } = await supabase
    .from('booths')
    .select('id, name, slug, address, city, latitude, longitude')
    .ilike('name', '%heebe%jeebe%');

  if (fetchError) {
    console.error('Error fetching booths:', fetchError);
    process.exit(1);
  }

  if (!booths || booths.length === 0) {
    console.log('No Heebe Jeebe booths found');
    return;
  }

  console.log(`Found ${booths.length} Heebe Jeebe booth(s):\n`);
  for (const booth of booths) {
    console.log(`  - ${booth.name} (${booth.slug})`);
    console.log(`    ID: ${booth.id}`);
    console.log(`    Address: ${booth.address}, ${booth.city}`);
    console.log(`    Coords: ${booth.latitude}, ${booth.longitude}`);
    console.log('');
  }

  if (booths.length < 2) {
    console.log('Only one booth found, no duplicate to delete');
    return;
  }

  // Find the duplicate (one with -1 suffix)
  const duplicate = booths.find(b => b.slug.includes('-1'));
  const original = booths.find(b => !b.slug.includes('-1'));

  if (!duplicate) {
    console.log('Could not identify duplicate booth with -1 suffix');
    return;
  }

  console.log('🗑️  Deleting duplicate booth:');
  console.log(`   Name: ${duplicate.name}`);
  console.log(`   Slug: ${duplicate.slug}`);
  console.log(`   ID: ${duplicate.id}`);
  console.log('');

  const { error: deleteError } = await supabase
    .from('booths')
    .delete()
    .eq('id', duplicate.id);

  if (deleteError) {
    console.error('❌ Error deleting booth:', deleteError);
    process.exit(1);
  }

  console.log('✅ Duplicate deleted successfully!');
  console.log('');
  console.log('📍 Keeping original booth:');
  console.log(`   Name: ${original?.name}`);
  console.log(`   Slug: ${original?.slug}`);
  console.log(`   URL: https://boothbeacon.org/booth/${original?.slug}`);
  console.log('');
  console.log('='.repeat(80));
}

run().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
