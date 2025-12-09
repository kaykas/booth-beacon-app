/**
 * BATCH AI IMAGE GENERATION
 *
 * Proactively generates AI images for ALL booths without photos.
 * Uses OpenAI DALL-E 3 to create vintage photobooth aesthetic images.
 *
 * Process:
 * 1. Query all booths without photo_exterior_url or ai_preview_url
 * 2. Generate DALL-E 3 image for each booth
 * 3. Download temporary image and upload to Supabase storage
 * 4. Update booth record with permanent image URL
 *
 * Cost: ~$0.04 per image (DALL-E 3 standard quality)
 * Rate limit: ~50 images per minute
 *
 * Usage:
 *   OPENAI_API_KEY=sk-xxx npx tsx batch-generate-booth-images.ts [batch_size] [--dry-run]
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import * as https from 'https';
import * as http from 'http';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BoothData {
  id: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
  address: string | null;
  photo_exterior_url: string | null;
  ai_preview_url: string | null;
}

/**
 * Construct a DALL-E 3 prompt for a booth location
 */
function constructPrompt(booth: BoothData): string {
  let locationDescription = '';

  if (booth.address) {
    locationDescription = `street view of ${booth.address}, ${booth.city}, ${booth.country}`;
  } else {
    locationDescription = `iconic street view of ${booth.city}, ${booth.country}`;
  }

  const styleDirective = `
    Style: Vintage photo booth strip aesthetic.
    The image should have a warm, slightly faded nostalgic look,
    similar to old film photography from the 1960s-1980s.
    Soft edges, slight vignetting, and warm color tones.
    This is a LOCATION VIEW, not a photo booth machine.
  `.trim();

  return `${locationDescription}. ${styleDirective}`;
}

/**
 * Generate image using DALL-E 3
 */
async function generateImage(booth: BoothData): Promise<string | null> {
  try {
    const prompt = constructPrompt(booth);
    console.log(`   Generating with prompt: ${prompt.substring(0, 80)}...`);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    });

    if (!response.data || !response.data[0]?.url) {
      console.error('   ❌ DALL-E returned no image URL');
      return null;
    }

    const imageUrl = response.data[0].url;

    console.log('   ✅ Image generated');
    return imageUrl;
  } catch (error: any) {
    console.error(`   ❌ DALL-E error: ${error.message}`);
    return null;
  }
}

/**
 * Download image from URL to buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Upload image to Supabase storage
 */
async function uploadToSupabase(imageBuffer: Buffer, boothId: string): Promise<string> {
  const fileName = `booth-${boothId}-ai-preview-${Date.now()}.png`;
  const filePath = `ai-previews/${fileName}`;

  const { error } = await supabase.storage
    .from('booth-images')
    .upload(filePath, imageBuffer, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('booth-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Update booth with AI preview URL
 */
async function updateBooth(boothId: string, imageUrl: string): Promise<void> {
  const { error } = await supabase
    .from('booths')
    .update({
      ai_preview_url: imageUrl,
      ai_preview_generated_at: new Date().toISOString(),
    })
    .eq('id', boothId);

  if (error) {
    throw new Error(`Database update failed: ${error.message}`);
  }
}

/**
 * Process a single booth
 */
async function processBooth(booth: BoothData): Promise<boolean> {
  try {
    console.log(`\n📍 ${booth.name} (${booth.city}, ${booth.country})`);

    const tempImageUrl = await generateImage(booth);
    if (!tempImageUrl) return false;

    console.log('   ⬇️  Downloading image...');
    const imageBuffer = await downloadImage(tempImageUrl);
    console.log(`   ✅ Downloaded (${(imageBuffer.length / 1024).toFixed(1)} KB)`);

    console.log('   ⬆️  Uploading to Supabase...');
    const permanentUrl = await uploadToSupabase(imageBuffer, booth.id);
    console.log('   ✅ Uploaded');

    console.log('   💾 Updating database...');
    await updateBooth(booth.id, permanentUrl);
    console.log('   ✅ Complete');

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
  console.log('🎨 BATCH AI IMAGE GENERATION\n');

  const BATCH_SIZE = parseInt(process.argv[2] || '50');
  const DRY_RUN = process.argv[3] === '--dry-run';

  console.log(`Batch size: ${BATCH_SIZE} booths`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no API calls)' : 'PRODUCTION'}\n`);

  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, city, state, country, address, photo_exterior_url, ai_preview_url')
    .eq('status', 'active')
    .is('photo_exterior_url', null)
    .is('ai_preview_url', null)
    .limit(BATCH_SIZE);

  if (error) {
    console.error('❌ Database error:', error);
    return;
  }

  if (!booths || booths.length === 0) {
    console.log('✨ All booths already have images!');
    return;
  }

  console.log(`Found ${booths.length} booths needing images\n`);
  const estimatedCost = booths.length * 0.04;
  console.log(`💰 Estimated cost: $${estimatedCost.toFixed(2)} (${booths.length} × $0.04)\n`);

  if (DRY_RUN) {
    console.log('DRY RUN: Would process these booths:');
    booths.slice(0, 5).forEach((booth, i) => {
      console.log(`${i + 1}. ${booth.name} (${booth.city}, ${booth.country})`);
    });
    if (booths.length > 5) {
      console.log(`... and ${booths.length - 5} more`);
    }
    console.log('\nRun without --dry-run to execute.');
    return;
  }

  console.log('='.repeat(60));
  console.log('Starting image generation...\n');

  let succeeded = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < booths.length; i++) {
    const booth = booths[i];
    console.log(`[${i + 1}/${booths.length}]`);

    const success = await processBooth(booth);

    if (success) {
      succeeded++;
    } else {
      failed++;
    }

    if (i < booths.length - 1) {
      // OpenAI rate limit: 7 images/minute = ~8.6 seconds between images
      // Using 10 seconds to be safe and avoid rate limit errors
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const actualCost = succeeded * 0.04;

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Succeeded: ${succeeded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Duration: ${duration} minutes`);
  console.log(`💰 Actual cost: $${actualCost.toFixed(2)}`);
  console.log('='.repeat(60));
  console.log('\n✨ Done!');
}

main().catch(console.error);
