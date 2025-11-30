/**
 * Standalone Photobooth.net Test Script
 *
 * This script tests the photobooth.net extractor in isolation
 * to validate that the crawler and extraction logic works correctly.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=your-key SUPABASE_SERVICE_ROLE_KEY=your-key npm run tsx test-photobooth-net.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

if (!FIRECRAWL_API_KEY) {
  console.error('❌ FIRECRAWL_API_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testPhotoboothNet() {
  console.log('🧪 Testing Photobooth.net Extractor\n');
  console.log('=' .repeat(60));

  // Step 1: Check database connection
  console.log('\n📊 Step 1: Checking database connection...');
  const { data: boothsBefore, error: beforeError } = await supabase
    .from('booths')
    .select('id, name, source_names')
    .limit(5);

  if (beforeError) {
    console.error('❌ Database connection failed:', beforeError);
    process.exit(1);
  }

  console.log(`✅ Database connected`);
  console.log(`   Current booths in database: ${boothsBefore?.length || 0}`);
  if (boothsBefore && boothsBefore.length > 0) {
    console.log('   Sample booths:');
    boothsBefore.forEach(b => console.log(`   - ${b.name} (source: ${b.source_names})`));
  }

  // Step 2: Get photobooth.net source config
  console.log('\n📋 Step 2: Getting photobooth.net source configuration...');
  const { data: source, error: sourceError } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('source_name', 'Photobooth.net')
    .single();

  if (sourceError || !source) {
    console.error('❌ Could not find Photobooth.net source:', sourceError);
    process.exit(1);
  }

  console.log(`✅ Source found: ${source.source_name}`);
  console.log(`   URL: ${source.source_url}`);
  console.log(`   Priority: ${source.priority}`);
  console.log(`   Status: ${source.status}`);
  console.log(`   Enabled: ${source.enabled}`);

  // Step 3: Call the unified crawler Edge Function
  console.log('\n🚀 Step 3: Calling unified crawler for photobooth.net...');
  console.log('   Note: This may take a few minutes...\n');

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/unified-crawler?source=${encodeURIComponent(source.source_name)}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Crawler request failed: ${response.status} ${response.statusText}`);
    console.error(`   Error: ${errorText}`);
    throw new Error(`Crawler failed with status ${response.status}`);
  }

  const result = await response.json();
  console.log('\n✅ Crawl complete!');
  console.log(`   Total booths extracted: ${result.totalBooths || 0}`);
  console.log(`   Errors: ${result.errors?.length || 0}`);
  if (result.errors && result.errors.length > 0) {
    console.log('   Error details:');
    result.errors.forEach((err: string) => console.log(`   - ${err}`));
  }

  return result;
}

async function verifyResults() {
  console.log('\n📊 Step 4: Verifying results in database...');

  const { data: boothsAfter, error } = await supabase
    .from('booths')
    .select('id, name, city, country, source_names, created_at')
    .contains('source_names', ['Photobooth.net'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error querying booths:', error);
    return;
  }

  console.log(`✅ Photobooth.net booths in database: ${boothsAfter?.length || 0}`);
  if (boothsAfter && boothsAfter.length > 0) {
    console.log('\n   Recently added booths:');
    boothsAfter.forEach((b, i) => {
      console.log(`   ${i + 1}. ${b.name} - ${b.city}, ${b.country}`);
      console.log(`      Created: ${new Date(b.created_at).toLocaleString()}`);
    });
  } else {
    console.log('   ⚠️  No booths found from Photobooth.net');
    console.log('   This indicates the extractor may not be working correctly.');
  }
}

// Run the test
testPhotoboothNet()
  .then(async (result: any) => {
    await verifyResults();
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Test complete!\n');
    if (result.booths > 0) {
      console.log('✅ SUCCESS: Extractor is working!');
      process.exit(0);
    } else {
      console.log('⚠️  WARNING: No booths were extracted. Check the logs above.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
