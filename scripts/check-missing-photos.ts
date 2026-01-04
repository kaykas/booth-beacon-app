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

async function checkMissingPhotos() {
  console.log('\n🔍 INVESTIGATING HEEBE JEEBE BOOTH PHOTOS\n');
  console.log('='.repeat(70));

  // Find the booth
  const { data: booth, error } = await supabase
    .from('booths')
    .select('*')
    .ilike('name', '%heebe%jeebe%')
    .single();

  if (error) {
    console.error('Error finding booth:', error);
    return;
  }

  console.log('\n📍 BOOTH FOUND:');
  console.log(`   ID: ${booth.id}`);
  console.log(`   Name: ${booth.name}`);
  console.log(`   Slug: ${booth.slug}`);
  console.log(`   Address: ${booth.address}`);

  console.log('\n📸 PHOTO FIELDS:');
  console.log(`   photo_exterior_url: ${booth.photo_exterior_url || 'NULL'}`);
  console.log(`   ai_generated_image_url: ${booth.ai_generated_image_url || 'NULL'}`);
  console.log(`   ai_preview_url: ${booth.ai_preview_url || 'NULL'}`);
  console.log(`   google_place_id: ${booth.google_place_id || 'NULL'}`);
  console.log(`   google_photo_reference: ${booth.google_photo_reference || 'NULL'}`);

  // Check community photos
  const { data: photos } = await supabase
    .from('booth_user_photos')
    .select('*')
    .eq('booth_id', booth.id);

  console.log(`\n👥 COMMUNITY PHOTOS: ${photos?.length || 0}`);
  if (photos && photos.length > 0) {
    photos.forEach((photo, i) => {
      console.log(`   ${i + 1}. ${photo.photo_url} (${photo.moderation_status})`);
    });
  }

  // Check how many booths have lost their photos
  console.log('\n📊 OVERALL PHOTO LOSS ANALYSIS:\n');

  const { count: totalBooths } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  const { count: withExteriorPhoto } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .not('photo_exterior_url', 'is', null);

  const { count: withAIPhoto } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .not('ai_generated_image_url', 'is', null);

  const { count: withAIPreview } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .not('ai_preview_url', 'is', null);

  const { count: withGooglePhoto } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .not('google_photo_reference', 'is', null);

  const { count: withAnyPhoto } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .or('photo_exterior_url.not.is.null,ai_generated_image_url.not.is.null,google_photo_reference.not.is.null');

  console.log(`   Total booths: ${totalBooths}`);
  console.log(`   With exterior photo: ${withExteriorPhoto} (${((withExteriorPhoto! / totalBooths!) * 100).toFixed(1)}%)`);
  console.log(`   With AI generated image: ${withAIPhoto} (${((withAIPhoto! / totalBooths!) * 100).toFixed(1)}%)`);
  console.log(`   With AI preview: ${withAIPreview} (${((withAIPreview! / totalBooths!) * 100).toFixed(1)}%)`);
  console.log(`   With Google photo ref: ${withGooglePhoto} (${((withGooglePhoto! / totalBooths!) * 100).toFixed(1)}%)`);
  console.log(`   With ANY photo: ${withAnyPhoto} (${((withAnyPhoto! / totalBooths!) * 100).toFixed(1)}%)`);
  console.log(`   WITHOUT any photo: ${totalBooths! - withAnyPhoto!} (${(((totalBooths! - withAnyPhoto!) / totalBooths!) * 100).toFixed(1)}%)`);

  console.log('\n' + '='.repeat(70) + '\n');
}

checkMissingPhotos().catch(console.error);
