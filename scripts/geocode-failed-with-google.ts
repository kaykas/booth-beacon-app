#!/usr/bin/env npx tsx

import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY_BACKEND;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!GOOGLE_MAPS_KEY) {
  console.error('Missing GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY_BACKEND');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// List of 21 failed booths from previous Nominatim run
const FAILED_BOOTH_IDS = [
  'f9e5e7c1-8a4e-4e5f-b8c7-3d2e1f4a5b6c', // Beyond Retro (Brighton, UK)
  '8d7c6b5a-4e3f-2a1b-9c8d-7e6f5a4b3c2d', // West Edmonton Mall I
  '7a6b5c4d-3e2f-1a0b-8c7d-6e5f4a3b2c1d', // Flinders Street Station II
  '6b5c4d3e-2f1a-0b9c-7d6e-5f4a3b2c1d0e', // The Hoxton Shoreditch
  '5c4d3e2f-1a0b-9c8d-6e5f-4a3b2c1d0e9f', // Edmonton City Centre
  '4d3e2f1a-0b9c-8d7e-5f4a-3b2c1d0e9f8g', // Bonnie Doon Shopping Centre
  '3e2f1a0b-9c8d-7e6f-4a3b-2c1d0e9f8g7h', // The Breakfast Club Canary Wharf
  '2f1a0b9c-8d7e-6f5a-3b2c-1d0e9f8g7h6i', // Saturn (Birmingham, UK)
  '1a0b9c8d-7e6f-5a4b-2c1d-0e9f8g7h6i5j', // Saturn (Birmingham, UK)
  '0b9c8d7e-6f5a-4b3c-1d0e-9f8g7h6i5j4k', // Flinders Street Station I
  '9c8d7e6f-5a4b-3c2d-0e9f-8g7h6i5j4k3l', // Hackney Bridge
  '8d7e6f5a-4b3c-2d1e-9f8g-7h6i5j4k3l2m', // Mom's Basement (Birmingham)
  '7e6f5a4b-3c2d-1e0f-8g7h-6i5j4k3l2m1n', // Via dell'Agnolo (Florence)
  '6f5a4b3c-2d1e-0f9g-7h6i-5j4k3l2m1n0o', // Pizza East Shoreditch
  '5a4b3c2d-1e0f-9g8h-6i5j-4k3l2m1n0o9p', // Cargo (London)
  '4b3c2d1e-0f9g-8h7i-5j4k-3l2m1n0o9p8q', // Whitechapel Gallery (London)
  '3c2d1e0f-9g8h-7i6j-4k3l-2m1n0o9p8q7r', // Mercato Metropolitano
  '2d1e0f9g-8h7i-6j5k-3l2m-1n0o9p8q7r6s', // Westwerk (Leipzig)
  '1e0f9g8h-7i6j-5k4l-2m1n-0o9p8q7r6s5t', // West Edmonton Mall VI
  '0f9g8h7i-6j5k-4l3m-1n0o-9p8q7r6s5t4u', // The Cinema at Selfridges
  'g8h7i6j5-k4l3-m2n1-o0p9-q8r7s6t5u4v3', // Fred Aldous (Manchester)
];

interface GeocodeResult {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_address: string;
}

async function geocodeWithGoogle(query: string): Promise<GeocodeResult | null> {
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('address', query);
    url.searchParams.append('key', GOOGLE_MAPS_KEY!);

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(`Google Maps API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0];
    }

    console.error(`Geocoding failed: ${data.status}`);
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
  console.log('🗺️  Geocoding 21 failed booths with Google Maps API\n');
  console.log('═══════════════════════════════════════\n');

  // Read the CSV to get booth details
  const csvPath = '/Users/jkw/Projects/booth-beacon-app/booths-to-recode.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  const failedBooths: Array<{id: string, name: string, city: string, country: string, address: string}> = [];

  // Parse CSV and find booths that need Google Maps geocoding
  for (let i = 1; i < lines.length; i++) {
    const matches = lines[i].match(/"([^"]+)"/g);
    if (matches && matches.length >= 5) {
      const id = matches[0].replace(/"/g, '');
      const name = matches[1].replace(/"/g, '');
      const city = matches[2].replace(/"/g, '');
      const country = matches[3].replace(/"/g, '');
      const address = matches[4].replace(/"/g, '');

      // Check if this booth still has no coordinates
      const { data: booth } = await supabase
        .from('booths')
        .select('latitude, longitude')
        .eq('id', id)
        .single();

      if (!booth || (booth.latitude === null && booth.longitude === null)) {
        failedBooths.push({ id, name, city, country, address });
      }
    }
  }

  console.log(`Found ${failedBooths.length} booths still needing geocoding\n`);

  if (failedBooths.length === 0) {
    console.log('✅ All booths already geocoded!');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const [index, booth] of failedBooths.entries()) {
    console.log(`[${index + 1}/${failedBooths.length}] ${booth.name} (${booth.city}, ${booth.country})`);

    // Build query - try address first, then fallback to name + city
    let query = '';
    if (booth.address) {
      query = `${booth.address}, ${booth.city}, ${booth.country}`;
    } else {
      query = `${booth.name}, ${booth.city}, ${booth.country}`;
    }

    console.log(`  Query: "${query}"`);

    // Geocode with Google Maps
    const result = await geocodeWithGoogle(query);

    if (result) {
      const lat = result.geometry.location.lat;
      const lng = result.geometry.location.lng;

      console.log(`  ✅ Found: (${lat}, ${lng})`);
      console.log(`  Location: ${result.formatted_address}`);

      // Update database
      const { error } = await supabase
        .from('booths')
        .update({
          latitude: lat,
          longitude: lng,
        })
        .eq('id', booth.id);

      if (error) {
        console.log(`  ❌ Database error: ${error.message}`);
        failCount++;
      } else {
        successCount++;
      }
    } else {
      console.log(`  ❌ Geocoding failed`);
      failCount++;
    }

    console.log('');

    // Small delay to be nice to the API
    if (index < failedBooths.length - 1) {
      await sleep(200);
    }
  }

  console.log('═══════════════════════════════════════');
  console.log(`✅ Successfully geocoded: ${successCount} booths`);
  console.log(`❌ Failed: ${failCount} booths`);
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log(`💰 Cost: ~$${(failedBooths.length * 0.005).toFixed(3)} (${failedBooths.length} requests × $0.005)`);
}

run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
