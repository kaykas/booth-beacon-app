#!/usr/bin/env npx tsx

/**
 * Download Google Maps photos and host them permanently on Supabase Storage
 *
 * This script fixes the core issue: Google photo_reference values expire after a few months.
 * Solution: Download the actual images and host them ourselves.
 *
 * Process:
 * 1. Find booths with Google Maps photo URLs (maps.googleapis.com)
 * 2. Download each photo from Google
 * 3. Upload to Supabase Storage (booth-images bucket)
 * 4. Update booth record with permanent Supabase URL
 *
 * This ensures photos never expire and reduces dependency on Google APIs.
 */

import { createClient } from '@supabase/supabase-js';
import { createWriteStream, unlinkSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import * as path from 'path';
import * as crypto from 'crypto';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface BoothPhoto {
  id: string;
  name: string;
  slug: string;
  photo_exterior_url: string;
}

/**
 * Download image from URL and save to temporary file
 */
async function downloadImage(url: string, tempPath: string): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const fileStream = createWriteStream(tempPath);
  // @ts-ignore - Node.js stream types
  await pipeline(Readable.fromWeb(response.body), fileStream);
}

/**
 * Upload image to Supabase Storage
 */
async function uploadToSupabase(
  tempPath: string,
  storagePath: string,
  contentType: string
): Promise<string> {
  // Read file as buffer
  const fs = await import('fs/promises');
  const fileBuffer = await fs.readFile(tempPath);

  const { data, error } = await supabase.storage
    .from('booth-images')
    .upload(storagePath, fileBuffer, {
      contentType,
      cacheControl: '31536000', // 1 year cache
      upsert: true, // Overwrite if exists
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('booth-images')
    .getPublicUrl(storagePath);

  return publicUrlData.publicUrl;
}

/**
 * Process a single booth photo
 */
async function processBoothPhoto(booth: BoothPhoto): Promise<{
  success: boolean;
  oldUrl?: string;
  newUrl?: string;
  error?: string;
}> {
  console.log(`\n📸 Processing: ${booth.name}`);
  console.log(`   Booth ID: ${booth.id}`);

  const oldUrl = booth.photo_exterior_url;

  // Check if it's a Google Maps URL that needs replacing
  if (!oldUrl.includes('maps.googleapis.com')) {
    console.log('   ⏭️  Not a Google Maps URL, skipping');
    return { success: true };
  }

  // Check if already hosted on Supabase
  if (oldUrl.includes('supabase.co/storage')) {
    console.log('   ✅ Already hosted on Supabase, skipping');
    return { success: true };
  }

  try {
    // Generate unique filename
    const hash = crypto.createHash('md5').update(booth.id).digest('hex').substring(0, 8);
    const filename = `booth-${hash}-exterior.jpg`;
    const storagePath = `booth-photos/${filename}`;
    const tempPath = path.join('/tmp', filename);

    console.log('   ⬇️  Downloading from Google...');
    await downloadImage(oldUrl, tempPath);

    console.log('   ⬆️  Uploading to Supabase Storage...');
    const newUrl = await uploadToSupabase(tempPath, storagePath, 'image/jpeg');

    console.log('   💾 Updating database...');
    const { error: updateError } = await supabase
      .from('booths')
      .update({
        photo_exterior_url: newUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booth.id);

    if (updateError) {
      throw updateError;
    }

    // Clean up temp file
    unlinkSync(tempPath);

    console.log(`   ✅ Success! Hosted at: ${newUrl.substring(0, 80)}...`);

    return {
      success: true,
      oldUrl,
      newUrl,
    };

  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
    return {
      success: false,
      oldUrl,
      error: error.message,
    };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 DOWNLOAD AND HOST BOOTH PHOTOS\n');
  console.log('This will replace temporary Google Maps URLs with permanent Supabase Storage URLs.\n');
  console.log('=' .repeat(80) + '\n');

  // Find all booths with Google Maps photo URLs
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, slug, photo_exterior_url')
    .like('photo_exterior_url', '%maps.googleapis.com%')
    .not('photo_exterior_url', 'is', null);

  if (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }

  if (!booths || booths.length === 0) {
    console.log('✅ No Google Maps URLs found. All photos already hosted!');
    return;
  }

  console.log(`📊 Found ${booths.length} booths with Google Maps photo URLs\n`);

  // Process each booth
  let succeeded = 0;
  let failed = 0;
  const errors: Array<{ booth: string; error: string }> = [];

  for (const booth of booths) {
    const result = await processBoothPhoto(booth);

    if (result.success) {
      succeeded++;
    } else {
      failed++;
      if (result.error) {
        errors.push({ booth: booth.name, error: result.error });
      }
    }

    // Rate limiting: small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Succeeded: ${succeeded}`);
  console.log(`❌ Failed: ${failed}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(({ booth, error }) => {
      console.log(`   - ${booth}: ${error}`);
    });
  }

  console.log('\n✨ Photos are now permanently hosted on Supabase Storage!');
  console.log('📝 No more expiration issues - photos will work forever.\n');
}

main().catch(console.error);
