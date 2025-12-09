#!/usr/bin/env npx tsx

/**
 * Fix country data for international booths
 *
 * Corrects country field for booths that are clearly in other countries
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

// Map of cities to correct countries
const CITY_COUNTRY_MAP: Record<string, string> = {
  // Canada
  'toronto': 'Canada',
  'montreal': 'Canada',
  'vancouver': 'Canada',
  'calgary': 'Canada',
  'ottawa': 'Canada',
  'new glasgow': 'Canada',

  // UK
  'london': 'United Kingdom',
  'manchester': 'United Kingdom',
  'glasgow': 'United Kingdom',
  'liverpool': 'United Kingdom',
  'birmingham': 'United Kingdom',

  // Germany
  'berlin': 'Germany',
  'munich': 'Germany',
  'hamburg': 'Germany',
  'cologne': 'Germany',
  'frankfurt': 'Germany',

  // Austria
  'vienna': 'Austria',
  'salzburg': 'Austria',

  // France
  'paris': 'France',
  'lyon': 'France',
  'marseille': 'France',

  // Italy
  'rome': 'Italy',
  'milan': 'Italy',
  'florence': 'Italy',

  // Latvia
  'riga': 'Latvia',

  // Spain
  'madrid': 'Spain',
  'barcelona': 'Spain',

  // Sweden
  'stockholm': 'Sweden',
  'gothenburg': 'Sweden',
  'malmö': 'Sweden',
  'malmo': 'Sweden',

  // Czech Republic
  'prague': 'Czech Republic',
  'praha': 'Czech Republic',

  // Netherlands
  'amsterdam': 'Netherlands',
  'rotterdam': 'Netherlands',

  // Belgium
  'brussels': 'Belgium',
  'antwerp': 'Belgium',
};

async function run() {
  console.log('='.repeat(80));
  console.log('FIXING COUNTRY DATA');
  console.log('='.repeat(80));
  console.log('');

  // Fetch all booths with country="United States" or country ILIKE 'united states'
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, city, state, country')
    .ilike('country', '%united states%');

  if (error) {
    console.error('Error fetching booths:', error);
    process.exit(1);
  }

  if (!booths || booths.length === 0) {
    console.log('No booths found with United States country');
    return;
  }

  console.log(`Checking ${booths.length} booths...\n`);

  let fixed = 0;
  let skipped = 0;

  for (const booth of booths) {
    const city = (booth.city || '').toLowerCase().trim();

    // Check if city is in our map
    const correctCountry = CITY_COUNTRY_MAP[city];

    if (correctCountry) {
      console.log(`Fixing: ${booth.name}`);
      console.log(`   City: ${booth.city}`);
      console.log(`   Old Country: ${booth.country}`);
      console.log(`   New Country: ${correctCountry}`);

      const { error: updateError } = await supabase
        .from('booths')
        .update({
          country: correctCountry,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booth.id);

      if (updateError) {
        console.log(`   ❌ Failed: ${updateError.message}`);
      } else {
        console.log(`   ✅ Fixed`);
        fixed++;
      }
      console.log('');
    } else {
      // Check if it's actually a US city (has a state)
      if (booth.state && booth.state.length === 2) {
        skipped++;
      } else {
        console.log(`⚠️  Unknown city: ${booth.city} - Keeping as United States`);
        skipped++;
      }
    }
  }

  console.log('');
  console.log('='.repeat(80));
  console.log(`✅ Fixed: ${fixed}`);
  console.log(`⊘ Skipped: ${skipped}`);
  console.log('='.repeat(80));
}

run().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
