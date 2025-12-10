#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// City to country mapping for known cities
const CITY_COUNTRY_MAP: Record<string, string> = {
  // UK
  'London': 'UK',
  'Brighton': 'UK',
  'Manchester': 'UK',
  'Edinburgh': 'UK',
  'Glasgow': 'UK',
  'Liverpool': 'UK',
  'Bristol': 'UK',
  'Leeds': 'UK',
  'Birmingham': 'UK',

  // Germany
  'Berlin': 'Germany',
  'Munich': 'Germany',
  'Hamburg': 'Germany',
  'Cologne': 'Germany',
  'Köln': 'Germany',
  'Frankfurt': 'Germany',
  'Stuttgart': 'Germany',
  'Düsseldorf': 'Germany',
  'Dortmund': 'Germany',
  'Essen': 'Germany',
  'Leipzig': 'Germany',
  'Bremen': 'Germany',
  'Dresden': 'Germany',
  'Hannover': 'Germany',
  'Nuremberg': 'Germany',
  'Nürnberg': 'Germany',

  // France
  'Paris': 'France',
  'Marseille': 'France',
  'Lyon': 'France',
  'Toulouse': 'France',
  'Nice': 'France',
  'Nantes': 'France',
  'Strasbourg': 'France',
  'Montpellier': 'France',
  'Bordeaux': 'France',

  // Australia
  'Sydney': 'Australia',
  'Melbourne': 'Australia',
  'Brisbane': 'Australia',
  'Perth': 'Australia',
  'Adelaide': 'Australia',
  'Canberra': 'Australia',
  'Hobart': 'Australia',
  'Darwin': 'Australia',

  // Canada
  'Toronto': 'Canada',
  'Vancouver': 'Canada',
  'Montreal': 'Canada',
  'Calgary': 'Canada',
  'Ottawa': 'Canada',
  'Edmonton': 'Canada',
  'Quebec City': 'Canada',
  'Winnipeg': 'Canada',
  'Hamilton': 'Canada',

  // Netherlands
  'Amsterdam': 'Netherlands',
  'Rotterdam': 'Netherlands',
  'The Hague': 'Netherlands',
  'Utrecht': 'Netherlands',

  // Belgium
  'Brussels': 'Belgium',
  'Antwerp': 'Belgium',
  'Ghent': 'Belgium',

  // Italy
  'Rome': 'Italy',
  'Milan': 'Italy',
  'Naples': 'Italy',
  'Turin': 'Italy',
  'Florence': 'Italy',
  'Venice': 'Italy',

  // Spain
  'Madrid': 'Spain',
  'Barcelona': 'Spain',
  'Valencia': 'Spain',
  'Seville': 'Spain',

  // Austria
  'Vienna': 'Austria',
  'Salzburg': 'Austria',
  'Innsbruck': 'Austria',

  // Switzerland
  'Zurich': 'Switzerland',
  'Geneva': 'Switzerland',
  'Basel': 'Switzerland',
  'Bern': 'Switzerland',

  // Japan
  'Tokyo': 'Japan',
  'Osaka': 'Japan',
  'Kyoto': 'Japan',
  'Yokohama': 'Japan',

  // New Zealand
  'Auckland': 'New Zealand',
  'Wellington': 'New Zealand',
  'Christchurch': 'New Zealand',
};

interface Booth {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface FixLog {
  id: string;
  name: string;
  city: string;
  oldCountry: string;
  newCountry: string;
  coordinatesCleared: boolean;
}

function detectCountry(city: string | null): string | null {
  if (!city) return null;

  // Try exact match first
  if (CITY_COUNTRY_MAP[city]) {
    return CITY_COUNTRY_MAP[city];
  }

  // Try case-insensitive match
  const cityLower = city.toLowerCase();
  for (const [mapCity, country] of Object.entries(CITY_COUNTRY_MAP)) {
    if (mapCity.toLowerCase() === cityLower) {
      return country;
    }
  }

  return null;
}

function needsCountryFix(booth: Booth): boolean {
  if (!booth.city) return false;

  const detectedCountry = detectCountry(booth.city);
  if (!detectedCountry) return false;

  // Normalize current country
  const currentCountry = booth.country?.trim();
  if (!currentCountry) return true; // Missing country

  // Check if current country is wrong
  const currentNormalized = currentCountry === 'United States' ? 'USA' : currentCountry;
  const detectedNormalized = detectedCountry === 'United States' ? 'USA' : detectedCountry;

  return currentNormalized !== detectedNormalized;
}

async function run() {
  console.log('🔍 Scanning for booths with incorrect country data...\n');

  // Fetch all booths
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, city, country, latitude, longitude')
    .order('city');

  if (error) {
    console.error('Error fetching booths:', error);
    process.exit(1);
  }

  if (!booths || booths.length === 0) {
    console.log('No booths found');
    return;
  }

  console.log(`Found ${booths.length} total booths\n`);

  // Find booths needing fixes
  const boothsToFix: Booth[] = [];
  const fixes: FixLog[] = [];

  for (const booth of booths) {
    if (needsCountryFix(booth)) {
      boothsToFix.push(booth);
    }
  }

  console.log(`Found ${boothsToFix.length} booths with incorrect country data\n`);

  if (boothsToFix.length === 0) {
    console.log('✅ No fixes needed!');
    return;
  }

  // Apply fixes
  let successCount = 0;
  let errorCount = 0;

  for (const booth of boothsToFix) {
    const detectedCountry = detectCountry(booth.city);
    if (!detectedCountry) continue;

    const oldCountry = booth.country || '(missing)';

    // Clear coordinates if they exist (they're likely wrong)
    const coordinatesCleared = booth.latitude !== null || booth.longitude !== null;

    console.log(`Fixing: ${booth.name} (${booth.city})`);
    console.log(`  ${oldCountry} → ${detectedCountry}`);
    if (coordinatesCleared) {
      console.log(`  Clearing coordinates: (${booth.latitude}, ${booth.longitude})`);
    }

    const { error: updateError } = await supabase
      .from('booths')
      .update({
        country: detectedCountry,
        latitude: null,
        longitude: null,
      })
      .eq('id', booth.id);

    if (updateError) {
      console.error(`  ❌ Error: ${updateError.message}`);
      errorCount++;
    } else {
      console.log(`  ✅ Fixed`);
      successCount++;

      fixes.push({
        id: booth.id,
        name: booth.name,
        city: booth.city || '',
        oldCountry,
        newCountry: detectedCountry,
        coordinatesCleared,
      });
    }
    console.log('');
  }

  // Save log
  const logPath = '/Users/jkw/Projects/booth-beacon-app/country-fix-log.json';
  fs.writeFileSync(logPath, JSON.stringify(fixes, null, 2));

  console.log('═══════════════════════════════════════');
  console.log(`✅ Successfully fixed: ${successCount} booths`);
  console.log(`❌ Errors: ${errorCount} booths`);
  console.log(`📝 Log saved to: ${logPath}`);
  console.log('═══════════════════════════════════════\n');

  // Summary by country
  const countryCounts: Record<string, number> = {};
  for (const fix of fixes) {
    countryCounts[fix.newCountry] = (countryCounts[fix.newCountry] || 0) + 1;
  }

  console.log('Booths fixed by country:');
  for (const [country, count] of Object.entries(countryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${country}: ${count}`);
  }
  console.log('');

  console.log('⚠️  Next steps:');
  console.log('1. Review country-fix-log.json to verify changes');
  console.log('2. Re-geocode affected booths with correct country data');
  console.log('3. Run audit again to verify fixes');
}

run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
