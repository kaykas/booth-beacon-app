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
  console.log('Searching for Club Photomatica...\\n');

  const { data, error } = await supabase
    .from('booths')
    .select('id, name, slug, address, city, state, country, latitude, longitude, geocoded_at')
    .ilike('name', '%photomatica%');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No booths found matching "photomatica"');
    process.exit(0);
  }

  console.log(`Found ${data.length} booth(s):\\n`);

  for (const booth of data) {
    console.log('='.repeat(80));
    console.log(`Name: ${booth.name}`);
    console.log(`Slug: ${booth.slug}`);
    console.log(`Address: ${booth.address}`);
    console.log(`City: ${booth.city}, ${booth.state || booth.country}`);
    console.log(`Current Coordinates: ${booth.latitude}, ${booth.longitude}`);
    console.log(`Geocoded At: ${booth.geocoded_at}`);
    console.log('');

    // Show Google Maps link
    if (booth.latitude && booth.longitude) {
      console.log(`Google Maps: https://www.google.com/maps?q=${booth.latitude},${booth.longitude}`);
    }
    console.log('');
  }
}

run().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
