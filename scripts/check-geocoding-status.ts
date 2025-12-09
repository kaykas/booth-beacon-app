#!/usr/bin/env npx tsx

/**
 * Check geocoding status across all booths
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
  console.log('GEOCODING STATUS CHECK');
  console.log('='.repeat(80));
  console.log('');

  // Get total booths
  const { count: totalCount, error: totalError } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    console.error('Error getting total count:', totalError);
    process.exit(1);
  }

  // Get booths with coordinates
  const { count: geocodedCount, error: geocodedError } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (geocodedError) {
    console.error('Error getting geocoded count:', geocodedError);
    process.exit(1);
  }

  // Get booths without coordinates
  const { count: missingCount, error: missingError } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .or('latitude.is.null,longitude.is.null');

  if (missingError) {
    console.error('Error getting missing count:', missingError);
    process.exit(1);
  }

  const percentage = totalCount ? ((geocodedCount || 0) / totalCount * 100).toFixed(1) : '0.0';

  console.log('📊 Overall Status:');
  console.log(`   Total Booths: ${totalCount}`);
  console.log(`   ✅ With Coordinates: ${geocodedCount} (${percentage}%)`);
  console.log(`   ❌ Missing Coordinates: ${missingCount}`);
  console.log('');

  // Get breakdown by country
  const { data: countryBreakdown, error: countryError } = await supabase
    .from('booths')
    .select('country')
    .or('latitude.is.null,longitude.is.null');

  if (countryError) {
    console.error('Error getting country breakdown:', countryError);
  } else if (countryBreakdown) {
    const countryCounts = countryBreakdown.reduce((acc: Record<string, number>, booth: { country?: string }) => {
      const country = booth.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    console.log('📍 Booths Missing Coordinates by Country:');
    const sortedCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    for (const [country, count] of sortedCountries) {
      console.log(`   ${country}: ${count}`);
    }
  }

  console.log('');
  console.log('='.repeat(80));
}

run().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
