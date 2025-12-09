#!/usr/bin/env npx tsx

/**
 * Create CSV of booth IDs that need geocoding
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

async function run() {
  console.log('Creating CSV of booths needing geocoding...\n');

  // Get all booths without coordinates
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, address, city, country')
    .or('latitude.is.null,longitude.is.null')
    .order('country', { ascending: true })
    .order('city', { ascending: true });

  if (error) {
    console.error('Error fetching booths:', error);
    process.exit(1);
  }

  if (!booths || booths.length === 0) {
    console.log('✅ All booths have coordinates!');
    return;
  }

  console.log(`Found ${booths.length} booths needing geocoding\n`);

  // Create CSV content
  const csvLines = [
    'booth_id,name,address,city,country'
  ];

  for (const booth of booths) {
    const line = `"${booth.id}","${booth.name}","${booth.address}","${booth.city}","${booth.country}"`;
    csvLines.push(line);
  }

  const csvContent = csvLines.join('\n');
  const outputPath = '/Users/jkw/Projects/booth-beacon-app/missing-coordinates.csv';

  await fs.writeFile(outputPath, csvContent);

  console.log(`✅ CSV created: ${outputPath}`);
  console.log(`   Contains ${booths.length} booth IDs`);
}

run().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
