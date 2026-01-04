#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('🔍 Checking Heebe Jeebe booth Street View data...\n');

  const { data: booth, error } = await supabase
    .from('booths')
    .select('name, slug, latitude, longitude, street_view_available, street_view_panorama_id, street_view_distance_meters, street_view_heading, photo_exterior_url, ai_preview_url')
    .ilike('name', '%heebe%jeebe%')
    .single();

  if (error || !booth) {
    console.error('Error fetching booth:', error);
    return;
  }

  console.log('📍 Booth:', booth.name);
  console.log('   Slug:', booth.slug);
  console.log('   Coordinates:', booth.latitude, booth.longitude);
  console.log('\n📸 PHOTO FIELDS:');
  console.log('   photo_exterior_url:', booth.photo_exterior_url ? 'EXISTS' : 'NULL');
  if (booth.photo_exterior_url) {
    console.log('   URL:', booth.photo_exterior_url.substring(0, 100) + '...');
    if (booth.photo_exterior_url.includes('supabase.co')) {
      console.log('   ✅ Permanent Supabase Storage URL');
    }
  }
  console.log('   ai_preview_url:', booth.ai_preview_url ? 'EXISTS' : 'NULL');

  console.log('\n🗺️  STREET VIEW FIELDS:');
  console.log('   street_view_available:', booth.street_view_available);
  console.log('   street_view_panorama_id:', booth.street_view_panorama_id || 'NULL');
  console.log('   street_view_distance_meters:', booth.street_view_distance_meters || 'NULL');
  console.log('   street_view_heading:', booth.street_view_heading || 'NULL');

  console.log('\n🔗 Street View URL Being Used:');
  if (booth.street_view_panorama_id) {
    console.log('   ✅ Using panorama ID (most reliable)');
    console.log('   Panorama:', booth.street_view_panorama_id);
  } else {
    console.log('   ⚠️  Using coordinates (may show wrong location!)');
    console.log('   Coords:', booth.latitude + ', ' + booth.longitude);
    console.log('   This means Street View will show whatever panorama is closest to these coords');
    console.log('   Which may be a different business entirely!');
  }

  console.log('\n📋 DIAGNOSIS:');

  // Photo issue
  if (!booth.photo_exterior_url) {
    console.log('   ❌ No photo_exterior_url - photo should not display');
  } else if (booth.photo_exterior_url.includes('supabase.co')) {
    console.log('   ✅ Has permanent Supabase photo URL');
    console.log('   ℹ️  If photo not showing, possible Next.js Image optimization issue');
  }

  // Street View issue
  if (!booth.street_view_panorama_id) {
    console.log('   ❌ No street_view_panorama_id stored');
    console.log('   ⚠️  This means Street View uses generic coordinates');
    console.log('   ⚠️  Google will show nearest panorama, which might be wrong business');
    console.log('   🔧 FIX: Need to fetch and store correct panorama ID from Google Street View API');
  }

  console.log('\n🏪 Street View URL (what user sees):');
  const apiKey = 'AIzaSyD8EsT8nSCCtkkShAbRwHg67hrPMXPoeHo';
  if (booth.street_view_panorama_id) {
    const url = `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&pano=${booth.street_view_panorama_id}`;
    console.log('   Using panorama:', url.substring(0, 100) + '...');
  } else {
    const url = `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${booth.latitude},${booth.longitude}`;
    console.log('   Using coords:', url);
    console.log('   ⚠️  Google will pick closest panorama, which may be wrong!');
  }
}

main().catch(console.error);
