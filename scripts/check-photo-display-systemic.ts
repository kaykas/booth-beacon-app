#!/usr/bin/env npx tsx

/**
 * Systemic Photo Display Issue Check
 *
 * Checks if recently enriched booths have photos that might not be displaying
 * due to ISR cache issues or other systemic problems.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('🔍 SYSTEMIC PHOTO DISPLAY ISSUE CHECK');
  console.log('=' .repeat(80));
  console.log('\n📊 Checking recently enriched booths for photo display issues...\n');

  // Get booths enriched in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, slug, photo_exterior_url, ai_generated_image_url, ai_preview_url, enriched_at, created_at')
    .gte('enriched_at', sevenDaysAgo)
    .order('enriched_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }

  if (!booths || booths.length === 0) {
    console.log('⚠️  No recently enriched booths found in the last 7 days.');
    process.exit(0);
  }

  console.log(`✅ Found ${booths.length} recently enriched booths\n`);
  console.log('=' .repeat(80));

  let withPhotos = 0;
  let withoutPhotos = 0;
  const problematicBooths: Array<{
    name: string;
    slug: string;
    enriched_at: string;
    has_photo_exterior: boolean;
    has_ai_generated: boolean;
    has_ai_preview: boolean;
  }> = [];

  for (const booth of booths) {
    const hasAnyPhoto = !!(booth.photo_exterior_url || booth.ai_generated_image_url || booth.ai_preview_url);

    if (hasAnyPhoto) {
      withPhotos++;
    } else {
      withoutPhotos++;
      problematicBooths.push({
        name: booth.name,
        slug: booth.slug,
        enriched_at: booth.enriched_at,
        has_photo_exterior: !!booth.photo_exterior_url,
        has_ai_generated: !!booth.ai_generated_image_url,
        has_ai_preview: !!booth.ai_preview_url,
      });
    }
  }

  console.log('\n📊 SUMMARY');
  console.log('=' .repeat(80));
  console.log(`Total recently enriched: ${booths.length}`);
  console.log(`✅ With photos: ${withPhotos} (${Math.round(withPhotos / booths.length * 100)}%)`);
  console.log(`❌ Without photos: ${withoutPhotos} (${Math.round(withoutPhotos / booths.length * 100)}%)`);

  if (problematicBooths.length > 0) {
    console.log('\n⚠️  BOOTHS ENRICHED BUT STILL WITHOUT PHOTOS:');
    console.log('=' .repeat(80));

    problematicBooths.forEach(booth => {
      console.log(`\n${booth.name}`);
      console.log(`   Slug: ${booth.slug}`);
      console.log(`   Enriched: ${booth.enriched_at}`);
      console.log(`   URL: https://boothbeacon.org/booth/${booth.slug}`);
    });

    console.log('\n💡 POSSIBLE CAUSES:');
    console.log('   1. Google Photos API returned no photos');
    console.log('   2. Photo download/upload to Supabase Storage failed');
    console.log('   3. Enrichment process incomplete');
  }

  // Check for ISR cache timing issues
  console.log('\n🔍 ISR CACHE TIMING ANALYSIS');
  console.log('=' .repeat(80));
  console.log('Note: Pages revalidate every 1 hour (3600 seconds)\n');

  const now = Date.now();
  let likelyCacheIssues = 0;

  for (const booth of booths.slice(0, 10)) {
    if (!booth.photo_exterior_url && !booth.ai_generated_image_url && !booth.ai_preview_url) {
      continue; // Skip booths without any photos
    }

    const enrichedTime = new Date(booth.enriched_at).getTime();
    const minutesSinceEnrichment = Math.floor((now - enrichedTime) / (1000 * 60));

    if (minutesSinceEnrichment < 60) {
      likelyCacheIssues++;
      console.log(`⚠️  ${booth.name}`);
      console.log(`   Enriched ${minutesSinceEnrichment} minutes ago`);
      console.log(`   Likely showing cached version without photo`);
      console.log(`   Will auto-revalidate in ${60 - minutesSinceEnrichment} minutes\n`);
    }
  }

  if (likelyCacheIssues > 0) {
    console.log(`\n🎯 CACHE ISSUE IDENTIFIED:`);
    console.log(`   ${likelyCacheIssues} booths enriched within last hour`);
    console.log(`   These may still show old cached pages without photos`);
    console.log(`   Pages will automatically revalidate on next visit after 1 hour`);
  } else {
    console.log(`✅ No cache timing issues detected`);
    console.log(`   All enriched booths are past the 1-hour revalidation window`);
  }

  console.log('\n');
}

main().catch(console.error);
