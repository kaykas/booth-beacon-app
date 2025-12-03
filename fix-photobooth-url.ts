/**
 * Fix photobooth.net URL in crawl_sources
 * Changes from landing page to browse page that actually contains booth listings
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixPhotoboothURL() {
  console.log('\n🔧 Fixing photobooth.net URL...\n');

  // Check current value
  const { data: before, error: beforeError } = await supabase
    .from('crawl_sources')
    .select('name, source_url')
    .eq('name', 'photobooth.net')
    .single();

  if (beforeError || !before) {
    console.error('❌ Error fetching current URL:', beforeError);
    return;
  }

  console.log('📋 Current configuration:');
  console.log(`   Name: ${before.name}`);
  console.log(`   URL: ${before.source_url}\n`);

  // Update to correct URL
  const newURL = 'http://www.photobooth.net/locations/browse.php?ddState=0';

  const { error: updateError } = await supabase
    .from('crawl_sources')
    .update({
      source_url: newURL,
    })
    .eq('name', 'photobooth.net');

  if (updateError) {
    console.error('❌ Error updating URL:', updateError);
    return;
  }

  console.log('✅ Successfully updated URL!');
  console.log(`   New URL: ${newURL}\n`);

  // Verify change
  const { data: after } = await supabase
    .from('crawl_sources')
    .select('name, source_url')
    .eq('name', 'photobooth.net')
    .single();

  console.log('📋 Verified new configuration:');
  console.log(`   Name: ${after?.name}`);
  console.log(`   URL: ${after?.source_url}\n`);

  console.log('🎉 Fix complete! The crawler will now extract booths from the browse page.');
  console.log('   Run crawl-all-sources.ts to test the extraction.\n');
}

fixPhotoboothURL().catch(console.error);
