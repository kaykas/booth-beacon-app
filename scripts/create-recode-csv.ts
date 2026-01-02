#!/usr/bin/env npx tsx

import * as fs from 'fs';
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
  // Read the country fix log
  const log = JSON.parse(fs.readFileSync('/Users/jkw/Projects/booth-beacon-app/country-fix-log.json', 'utf-8'));
  
  console.log(`Found ${log.length} booths that need re-geocoding\n`);

  // Fetch current data for these booths
  const boothIds = log.map((entry: { id: string }) => entry.id);
  
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, city, country, address')
    .in('id', boothIds);

  if (error) {
    console.error('Error fetching booths:', error);
    process.exit(1);
  }

  // Create CSV
  const csvRows = ['id,name,city,country,address'];
  
  for (const booth of booths || []) {
    const address = booth.address || '';
    const row = `"${booth.id}","${booth.name}","${booth.city}","${booth.country}","${address}"`;
    csvRows.push(row);
  }

  const csvPath = '/Users/jkw/Projects/booth-beacon-app/booths-to-recode.csv';
  fs.writeFileSync(csvPath, csvRows.join('\n'));

  console.log(`✅ Created CSV with ${booths?.length} booths`);
  console.log(`📝 Saved to: ${csvPath}`);
  console.log('');
  console.log('Next: Run geocoding with Nominatim (free):');
  console.log('SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/geocode-from-csv.ts --csv booths-to-recode.csv');
}

run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
