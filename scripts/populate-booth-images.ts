/**
 * COMPREHENSIVE BOOTH IMAGE POPULATION
 *
 * Multi-strategy approach to get images for all booths:
 * 1. Extract from crawler's photos array to photo_exterior_url
 * 2. Fetch from Google Places API for booths with addresses
 * 3. Use existing ai_preview_url as fallback
 *
 * Priority: Real photos > Google Photos > AI previews
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=xxx SUPABASE_SERVICE_ROLE_KEY=xxx \
 *   npx tsx scripts/populate-booth-images.ts [batch_size] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import * as https from 'https';
import * as http from 'http';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY_BACKEND;

interface BoothData {
  id: string;
  name: string;
  address: string | null;
  city: string;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  photos: string[] | null;
  photo_exterior_url: string | null;
  ai_preview_url: string | null;
  google_place_id: string | null;
}

/**
 * Download image from URL and return buffer
 */
function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Upload image buffer to Supabase storage
 */
async function uploadToSupabase(imageBuffer: Buffer, boothId: string, source: string): Promise<string> {
  const fileName = `booth-${boothId}-${source}-${Date.now()}.jpg`;
  const filePath = `exterior-photos/${fileName}`;

  const { data, error } = await supabase.storage
    .from('booth-images')
    .upload(filePath, imageBuffer, {
      contentType: 'image/jpeg',
      cacheControl: '31536000', // 1 year
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: publicUrlData } = supabase.storage
    .from('booth-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Strategy 1: Extract from photos array
 */
async function extractFromPhotosArray(booth: BoothData): Promise<string | null> {
  if (!booth.photos || booth.photos.length === 0) return null;

  // Try to use first photo from array
  const firstPhoto = booth.photos[0];
  if (!firstPhoto) return null;

  // If it's already a full URL, use it directly
  if (firstPhoto.startsWith('http')) {
    console.log(`   ✅ Using photo from crawler: ${firstPhoto.substring(0, 60)}...`);
    return firstPhoto;
  }

  return null;
}

/**
 * Strategy 2: Fetch from Google Places API
 */
async function fetchFromGooglePlaces(booth: BoothData): Promise<string | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.log('   ⚠️  No Google Maps API key available');
    return null;
  }

  // Try Place ID first if available
  if (booth.google_place_id) {
    try {
      const placeUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${booth.google_place_id}&fields=photos&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(placeUrl);
      const data = await response.json();

      if (data.result?.photos && data.result.photos.length > 0) {
        const photoReference = data.result.photos[0].photo_reference;
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
        console.log(`   ✅ Found Google Place photo`);
        return photoUrl;
      }
    } catch (error: any) {
      console.log(`   ⚠️  Google Place API error: ${error.message}`);
    }
  }

  // Try text search if we have an address
  if (booth.address && booth.city) {
    try {
      const query = encodeURIComponent(`${booth.name} ${booth.address} ${booth.city}`);
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.results && data.results.length > 0 && data.results[0].photos) {
        const photoReference = data.results[0].photos[0].photo_reference;
        const placeId = data.results[0].place_id;
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;

        // Update place_id for future use
        await supabase
          .from('booths')
          .update({ google_place_id: placeId })
          .eq('id', booth.id);

        console.log(`   ✅ Found Google Maps photo via search`);
        return photoUrl;
      }
    } catch (error: any) {
      console.log(`   ⚠️  Google Search API error: ${error.message}`);
    }
  }

  return null;
}

/**
 * Process a single booth
 */
async function processBooth(booth: BoothData, dryRun: boolean): Promise<boolean> {
  console.log(`\n📍 ${booth.name} (${booth.city}, ${booth.country})`);

  // Try Strategy 1: Photos array
  let imageUrl = await extractFromPhotosArray(booth);
  let source = 'crawler';

  // Try Strategy 2: Google Places
  if (!imageUrl) {
    imageUrl = await fetchFromGooglePlaces(booth);
    source = 'google';
  }

  if (!imageUrl) {
    console.log(`   ⚠️  No image source found`);
    return false;
  }

  if (dryRun) {
    console.log(`   DRY RUN: Would set photo_exterior_url to ${source} image`);
    return true;
  }

  try {
    // Update database with photo URL
    const { error } = await supabase
      .from('booths')
      .update({
        photo_exterior_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', booth.id);

    if (error) throw error;

    console.log(`   ✅ Updated with ${source} photo`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 COMPREHENSIVE BOOTH IMAGE POPULATION\n');

  const BATCH_SIZE = parseInt(process.argv[2] || '50');
  const DRY_RUN = process.argv[3] === '--dry-run';

  console.log(`Batch size: ${BATCH_SIZE} booths`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'PRODUCTION'}\n`);

  // Query booths without photo_exterior_url
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, address, city, state, country, latitude, longitude, photos, photo_exterior_url, ai_preview_url, google_place_id')
    .eq('status', 'active')
    .is('photo_exterior_url', null)
    .limit(BATCH_SIZE);

  if (error) {
    console.error('❌ Database error:', error);
    return;
  }

  if (!booths || booths.length === 0) {
    console.log('✨ All active booths already have exterior photos!');
    return;
  }

  console.log(`Found ${booths.length} booths needing photos\n`);

  if (DRY_RUN) {
    console.log('DRY RUN: Would process these booths:');
    booths.slice(0, 5).forEach((booth, i) => {
      const hasPhotos = booth.photos && booth.photos.length > 0;
      const hasAddress = !!booth.address;
      console.log(`${i + 1}. ${booth.name} - photos array: ${hasPhotos ? 'YES' : 'NO'}, address: ${hasAddress ? 'YES' : 'NO'}`);
    });
    if (booths.length > 5) {
      console.log(`... and ${booths.length - 5} more`);
    }
    console.log('\nRun without --dry-run to execute.');
    return;
  }

  console.log('='.repeat(60));
  console.log('Starting image population...\n');

  let succeeded = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < booths.length; i++) {
    const booth = booths[i];
    console.log(`[${i + 1}/${booths.length}]`);

    const success = await processBooth(booth, DRY_RUN);
    if (success) succeeded++;
    else failed++;

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('COMPLETE!\n');
  console.log(`✅ Success: ${succeeded}/${booths.length} booths`);
  console.log(`❌ Failed: ${failed}/${booths.length} booths`);
  console.log(`⏱️  Duration: ${duration}s\n`);
}

main().catch(console.error);
