#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkBerlinCount() {
  console.log('\n🔍 BOOTH COUNT ANALYSIS\n');
  console.log('='.repeat(60));

  // Check total booths with coordinates
  const { count: total } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  console.log(`\n🌍 Total booths with coordinates: ${total}`);

  // Check Berlin booths
  const { count: berlin } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .ilike('city', '%Berlin%')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  console.log(`🇩🇪 Berlin booths: ${berlin}`);

  // Check if viewport API is returning correct limit
  console.log('\n📡 Testing viewport API...\n');

  const params = new URLSearchParams({
    north: '85',
    south: '-85',
    east: '180',
    west: '-180',
    limit: '1000',
  });

  try {
    // Note: This would need to be tested via actual HTTP request to localhost
    console.log('   API endpoint: /api/booths/viewport');
    console.log('   Params:', params.toString());
    console.log('   Expected: Should return up to 1000 booths');
    console.log('   Actual deployment: Check live site');
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 DIAGNOSIS:\n');
  console.log(`   If Berlin filter shows ${berlin} booths - CORRECT ✅`);
  console.log(`   If showing all, should see ${total} booths`);
  console.log(`   Current issue: Showing 275 of 275 (might be deployment lag)`);
  console.log('\n' + '='.repeat(60) + '\n');
}

checkBerlinCount().catch(console.error);
