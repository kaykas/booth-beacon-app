#!/usr/bin/env npx tsx

/**
 * Diagnostic Script: Parkside Lounge Photo Display Issue
 *
 * Problem: Community photo shows in grid view but "No photo yet" on detail page
 * Investigation: Check all photo fields and community photos
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
  console.log('🔍 Investigating Parkside Lounge Photo Display Issue\n');
  console.log('=' .repeat(80));

  // 1. Find Parkside Lounge booth
  console.log('\n📋 Step 1: Finding Parkside Lounge booth...\n');

  const { data: booth, error: boothError } = await supabase
    .from('booths')
    .select('*')
    .ilike('name', '%parkside%lounge%')
    .single();

  if (boothError || !booth) {
    console.error('❌ Failed to find Parkside Lounge:', boothError);
    process.exit(1);
  }

  console.log(`✅ Found booth: ${booth.name}`);
  console.log(`   ID: ${booth.id}`);
  console.log(`   Slug: ${booth.slug}`);
  console.log(`   City: ${booth.city}`);

  // 2. Check all photo fields
  console.log('\n📸 Step 2: Checking booth photo fields...\n');

  const photoFields = {
    photo_exterior_url: booth.photo_exterior_url,
    photo_interior_url: booth.photo_interior_url,
    ai_generated_image_url: booth.ai_generated_image_url,
    ai_preview_url: booth.ai_preview_url,
  };

  console.log('Photo field values:');
  Object.entries(photoFields).forEach(([field, value]) => {
    if (value) {
      console.log(`   ✅ ${field}:`);
      console.log(`      ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
    } else {
      console.log(`   ❌ ${field}: NULL`);
    }
  });

  // 3. Check community photos
  console.log('\n👥 Step 3: Checking community photos...\n');

  const { data: communityPhotos, error: photosError } = await supabase
    .from('booth_user_photos')
    .select('*')
    .eq('booth_id', booth.id);

  if (photosError) {
    console.error('❌ Failed to fetch community photos:', photosError);
  } else {
    console.log(`Found ${communityPhotos?.length || 0} community photos:`);

    communityPhotos?.forEach((photo, index) => {
      console.log(`\n   Photo ${index + 1}:`);
      console.log(`      ID: ${photo.id}`);
      console.log(`      URL: ${photo.photo_url?.substring(0, 80)}...`);
      console.log(`      Moderation: ${photo.moderation_status}`);
      console.log(`      Created: ${photo.created_at}`);
    });
  }

  // 4. Check enrichment status
  console.log('\n🔧 Step 4: Checking enrichment status...\n');

  console.log('Enrichment dates:');
  console.log(`   google_enriched_at: ${booth.google_enriched_at || 'Never'}`);
  console.log(`   enriched_at: ${booth.enriched_at || 'Never'}`);
  console.log(`   created_at: ${booth.created_at}`);
  console.log(`   updated_at: ${booth.updated_at}`);

  // 5. Determine priority photo (what SHOULD display)
  console.log('\n🎯 Step 5: Photo display priority analysis...\n');

  const priorityPhoto =
    photoFields.photo_exterior_url ? { source: 'photo_exterior_url', url: photoFields.photo_exterior_url } :
    photoFields.ai_generated_image_url ? { source: 'ai_generated_image_url', url: photoFields.ai_generated_image_url } :
    photoFields.ai_preview_url ? { source: 'ai_preview_url', url: photoFields.ai_preview_url } :
    null;

  if (priorityPhoto) {
    console.log(`✅ Priority photo source: ${priorityPhoto.source}`);
    console.log(`   URL: ${priorityPhoto.url.substring(0, 100)}...`);
  } else {
    console.log('❌ No primary photo available (all fields NULL)');
    console.log('   This explains "No photo yet" on detail page');
  }

  // 6. Check if community photos are approved
  const approvedPhotos = communityPhotos?.filter(p => p.moderation_status === 'approved') || [];

  console.log(`\n📊 Community photos summary:`);
  console.log(`   Total: ${communityPhotos?.length || 0}`);
  console.log(`   Approved: ${approvedPhotos.length}`);

  // 7. Root cause analysis
  console.log('\n' + '='.repeat(80));
  console.log('🔬 ROOT CAUSE ANALYSIS');
  console.log('='.repeat(80));

  if (!priorityPhoto && communityPhotos && communityPhotos.length > 0) {
    console.log('\n❌ ISSUE CONFIRMED:');
    console.log('   - Community photos exist in database');
    console.log('   - But ALL primary photo fields (photo_exterior_url, ai_generated_image_url, ai_preview_url) are NULL');
    console.log('   - This causes detail page to show "No photo yet" placeholder');
    console.log('\n💡 EXPECTED BEHAVIOR:');
    console.log('   - If booth has approved community photos but no primary photo');
    console.log('   - Card view shows first community photo (✅ working)');
    console.log('   - Detail page SHOULD show first community photo (❌ broken)');
    console.log('\n🔧 LIKELY CAUSE:');
    console.log('   - BoothImage component on detail page may not be falling back to community photos');
    console.log('   - Card component likely has this fallback logic');
    console.log('   - Need to check component implementation');
  } else if (priorityPhoto) {
    console.log('\n✅ Primary photo exists:');
    console.log(`   Source: ${priorityPhoto.source}`);
    console.log('   If detail page shows "No photo yet", possible causes:');
    console.log('   - Next.js Image component URL validation issue');
    console.log('   - ISR cache not revalidated');
    console.log('   - Component not receiving photo prop correctly');
  }

  console.log('\n');
}

main().catch(console.error);
