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
  console.log('🔍 Testing Parkside Lounge Photo URL Accessibility\n');

  const { data: booth } = await supabase
    .from('booths')
    .select('name, photo_exterior_url, ai_preview_url, enriched_at, updated_at')
    .ilike('name', '%parkside%lounge%')
    .single();

  if (!booth) {
    console.error('❌ Booth not found');
    process.exit(1);
  }

  console.log(`Booth: ${booth.name}\n`);
  console.log('📸 Photo URLs:');
  console.log(`   photo_exterior_url: ${booth.photo_exterior_url || 'NULL'}`);
  console.log(`   ai_preview_url: ${booth.ai_preview_url || 'NULL'}`);
  console.log(`\n📅 Timestamps:`);
  console.log(`   Enriched: ${booth.enriched_at}`);
  console.log(`   Updated: ${booth.updated_at}`);

  // Test photo_exterior_url accessibility
  if (booth.photo_exterior_url) {
    console.log('\n🧪 Testing photo_exterior_url accessibility...');

    try {
      const response = await fetch(booth.photo_exterior_url, { method: 'HEAD' });

      console.log(`   HTTP Status: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   Content-Length: ${response.headers.get('content-length')} bytes`);

      if (response.ok) {
        console.log('\n   ✅ Photo is accessible and should display correctly');
      } else if (response.status === 404) {
        console.log('\n   ❌ Photo NOT FOUND (404)');
        console.log('   This explains why "No photo yet" shows on detail page');
      } else {
        console.log(`\n   ⚠️  Unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      console.error(`\n   ❌ Fetch error: ${error.message}`);
    }
  } else {
    console.log('\n   ℹ️  No photo_exterior_url in database');
  }

  // Test ai_preview_url if exists
  if (booth.ai_preview_url) {
    console.log('\n🧪 Testing ai_preview_url accessibility...');

    try {
      const response = await fetch(booth.ai_preview_url, { method: 'HEAD' });

      console.log(`   HTTP Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        console.log('   ✅ AI preview is accessible');
      } else {
        console.log(`   ❌ AI preview not accessible: ${response.status}`);
      }
    } catch (error: any) {
      console.error(`   ❌ Fetch error: ${error.message}`);
    }
  }

  console.log('\n');
}

main().catch(console.error);
