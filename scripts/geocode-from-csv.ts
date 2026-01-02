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

interface CSVRow {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
}

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

// Nominatim API - free, rate limit 1 req/sec
async function geocode(query: string): Promise<GeocodeResult | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.append('q', query);
    url.searchParams.append('format', 'json');
    url.searchParams.append('limit', '1');
    url.searchParams.append('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'BoothBeacon/1.0 (contact@boothbeacon.org)',
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return data[0];
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  // Parse command line args
  const csvArg = process.argv.find(arg => arg.startsWith('--csv='));
  if (!csvArg) {
    console.error('Usage: npx tsx geocode-from-csv.ts --csv=filename.csv');
    process.exit(1);
  }

  const csvFile = csvArg.split('=')[1];
  const csvPath = csvFile.startsWith('/') ? csvFile : `/Users/jkw/Projects/booth-beacon-app/${csvFile}`;

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`📁 Reading CSV: ${csvPath}\n`);

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  const _headers = lines[0].split(',');
  
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parsing (handles quoted fields)
    const matches = lines[i].match(/"([^"]+)"/g);
    if (matches && matches.length >= 5) {
      rows.push({
        id: matches[0].replace(/"/g, ''),
        name: matches[1].replace(/"/g, ''),
        city: matches[2].replace(/"/g, ''),
        country: matches[3].replace(/"/g, ''),
        address: matches[4].replace(/"/g, ''),
      });
    }
  }

  console.log(`Found ${rows.length} booths to geocode\n`);
  console.log('═══════════════════════════════════════\n');

  let successCount = 0;
  let failCount = 0;
  const skipCount = 0;

  for (const [index, row] of rows.entries()) {
    console.log(`[${index + 1}/${rows.length}] ${row.name} (${row.city}, ${row.country})`);

    // Build query
    let query = '';
    if (row.address) {
      query = `${row.address}, ${row.city}, ${row.country}`;
    } else {
      query = `${row.name}, ${row.city}, ${row.country}`;
    }

    console.log(`  Query: "${query}"`);

    // Geocode
    const result = await geocode(query);

    if (result) {
      console.log(`  ✅ Found: (${result.lat}, ${result.lon})`);
      console.log(`  Location: ${result.display_name}`);

      // Update database
      const { error } = await supabase
        .from('booths')
        .update({
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
        })
        .eq('id', row.id);

      if (error) {
        console.log(`  ❌ Database error: ${error.message}`);
        failCount++;
      } else {
        successCount++;
      }
    } else {
      console.log(`  ❌ No results found`);
      failCount++;
    }

    console.log('');

    // Rate limit: 1 request per second
    if (index < rows.length - 1) {
      await sleep(1100);
    }
  }

  console.log('═══════════════════════════════════════');
  console.log(`✅ Successfully geocoded: ${successCount} booths`);
  console.log(`❌ Failed: ${failCount} booths`);
  console.log(`⏭️  Skipped: ${skipCount} booths`);
  console.log('═══════════════════════════════════════');
}

run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
