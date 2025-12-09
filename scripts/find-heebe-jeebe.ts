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
  console.log('SEARCHING FOR HEEBE JEEBE BOOTH');
  console.log('='.repeat(80));
  console.log('');

  const variations = ['heebe', 'heebie', 'jeebie', 'jeebe', 'petaluma'];

  for (const term of variations) {
    const { data } = await supabase
      .from('booths')
      .select('id, name, slug, address, city, state, latitude, longitude')
      .ilike('name', `%${term}%`)
      .limit(5);

    if (data && data.length > 0) {
      console.log(`Results for '${term}':`);
      for (const booth of data) {
        console.log(`  - ${booth.name} (${booth.slug})`);
        console.log(`    ${booth.address}, ${booth.city}, ${booth.state}`);
        console.log(`    Coords: ${booth.latitude}, ${booth.longitude}`);
        console.log(`    URL: https://boothbeacon.org/booth/${booth.slug}`);
      }
      console.log('');
    }
  }
}

run().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
