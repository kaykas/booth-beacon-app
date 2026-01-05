#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  // Get The Smith booth
  const { data: booth } = await supabase
    .from('booths')
    .select('id, name, slug')
    .ilike('name', '%smith%lincoln%')
    .single();

  if (!booth) {
    console.log('❌ Test booth not found');
    process.exit(1);
  }

  console.log('🧪 Testing API key with:', booth.name);
  console.log('   Calling validation Edge Function...\n');

  const response = await fetch('https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/validate-street-view', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_KEY,
    },
    body: JSON.stringify({ boothId: booth.id }),
  });

  const result = await response.json();

  if (result.success && result.available && result.panoramaId) {
    console.log('✅ SUCCESS! API key is working\n');
    console.log('   Panorama ID:', result.panoramaId);
    console.log('   Distance:', result.distance + 'm');
    console.log('   Heading:', result.heading + '°\n');
    process.exit(0);
  } else {
    console.log('❌ FAILED:\n', JSON.stringify(result, null, 2));
    process.exit(1);
  }
}

main().catch(console.error);
