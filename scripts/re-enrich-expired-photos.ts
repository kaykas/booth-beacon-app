#!/usr/bin/env npx tsx

/**
 * Re-enrich booths with expired Google photo references
 *
 * This script:
 * 1. Finds booths with Google Maps photo URLs (temporary, may be expired)
 * 2. Calls the enrich-booth Edge Function to re-fetch data from Google Places
 * 3. The function will automatically download and host photos permanently
 *
 * Run after updating enrich-booth function with photo hosting logic.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/enrich-booth`;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function enrichBooth(boothId: string, boothName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log(`\n🔄 Re-enriching: ${boothName}`);
    console.log(`   Booth ID: ${boothId}`);

    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ boothId }),
    });

    const result = await response.json();

    if (result.success) {
      if (result.skipped) {
        console.log(`   ⏭️  Skipped: ${result.reason}`);
      } else {
        console.log(`   ✅ Success!`);
        if (result.enriched) {
          console.log(`      Photos: ${result.enriched.photos}`);
          console.log(`      Phone: ${result.enriched.phone ? 'Yes' : 'No'}`);
          console.log(`      Website: ${result.enriched.website ? 'Yes' : 'No'}`);
        }
      }
      return { success: true };
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔄 RE-ENRICH BOOTHS WITH EXPIRED PHOTOS\n');
  console.log('This will fetch fresh data from Google Places and download/host photos permanently.\n');
  console.log('='.repeat(80) + '\n');

  // Find booths with Google Maps photo URLs (these may have expired references)
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, slug, photo_exterior_url, city, country')
    .like('photo_exterior_url', '%maps.googleapis.com%')
    .not('photo_exterior_url', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }

  if (!booths || booths.length === 0) {
    console.log('✅ No booths with Google Maps URLs found. All good!');
    return;
  }

  console.log(`📊 Found ${booths.length} booths with Google Maps photo URLs\n`);
  console.log(`These will be re-enriched to get fresh photos from Google Places API.\n`);

  const limit = parseInt(process.env.LIMIT || '50');
  const boothsToProcess = booths.slice(0, limit);

  console.log(`Processing first ${boothsToProcess.length} booths...\n`);
  console.log('(Set LIMIT env var to process more or fewer)\n');

  let succeeded = 0;
  let skipped = 0;
  let failed = 0;
  const errors: Array<{ booth: string; error: string }> = [];

  for (const booth of boothsToProcess) {
    const result = await enrichBooth(booth.id, booth.name);

    if (result.success) {
      succeeded++;
    } else if (result.error?.includes('Recently enriched')) {
      skipped++;
    } else {
      failed++;
      if (result.error) {
        errors.push({ booth: booth.name, error: result.error });
      }
    }

    // Rate limit: 2 seconds between requests (Google API quota)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 RE-ENRICHMENT SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Succeeded: ${succeeded}`);
  console.log(`⏭️  Skipped (recently enriched): ${skipped}`);
  console.log(`❌ Failed: ${failed}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.slice(0, 10).forEach(({ booth, error }) => {
      console.log(`   - ${booth}: ${error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more`);
    }
  }

  console.log('\n✨ Re-enriched booths now have permanently hosted photos!');
  console.log('📝 Photos downloaded from Google and uploaded to Supabase Storage.\n');

  if (boothsToProcess.length < booths.length) {
    const remaining = booths.length - boothsToProcess.length;
    console.log(`⚠️  ${remaining} booths remaining. Run again with LIMIT=${booths.length} to process all.\n`);
  }
}

main().catch(console.error);
