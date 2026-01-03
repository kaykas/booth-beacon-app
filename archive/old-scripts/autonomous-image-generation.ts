/**
 * AUTONOMOUS AI IMAGE GENERATION - COMPLETE ALL BOOTHS
 *
 * This script runs autonomously until ALL active booths have images.
 * Features:
 * - Continuous execution with progress tracking
 * - Error handling with exponential backoff
 * - Rate limiting (50 images per minute max)
 * - Detailed logging and statistics
 * - Auto-retry on failures
 *
 * Usage:
 *   OPENAI_API_KEY=xxx npx tsx autonomous-image-generation.ts
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

interface BatchStats {
  totalProcessed: number;
  succeeded: number;
  failed: number;
  startTime: number;
  costAccumulated: number;
}

const stats: BatchStats = {
  totalProcessed: 0,
  succeeded: 0,
  failed: 0,
  startTime: Date.now(),
  costAccumulated: 0
};

const BATCH_SIZE = 100;
const DELAY_BETWEEN_IMAGES = 9000; // ms (7 per minute - OpenAI rate limit)
const MAX_RETRIES = 3;

/**
 * Construct prompt for booth location
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
 * Generate image with retry logic
 */
async function generateImageWithRetry(booth: BoothData, attempt: number = 1): Promise<string | null> {
  try {
    const prompt = constructPrompt(booth);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    });

    if (!response.data || !response.data[0]?.url) {
      throw new Error('No image URL returned');
    }

    const imageUrl = response.data[0].url;

    return imageUrl;
  } catch (error: any) {
    if (attempt < MAX_RETRIES) {
      const backoffDelay = Math.pow(2, attempt) * 1000;
      console.log(`   ⚠️  Retry ${attempt}/${MAX_RETRIES} after ${backoffDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      return generateImageWithRetry(booth, attempt + 1);
    }

    console.error(`   ❌ Failed after ${MAX_RETRIES} attempts: ${error.message}`);
    return null;
  }
}

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: ${response.statusCode}`));
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
 * Upload to Supabase storage
 */
async function uploadToSupabase(imageBuffer: Buffer, boothId: string): Promise<string> {
  const fileName = `booth-${boothId}-ai-${Date.now()}.png`;
  const filePath = `ai-previews/${fileName}`;

  const { error } = await supabase.storage
    .from('booth-images')
    .upload(filePath, imageBuffer, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('booth-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Update booth record
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
 * Process single booth
 */
async function processBooth(booth: BoothData, index: number, total: number): Promise<boolean> {
  try {
    console.log(`\n[${index}/${total}] 📍 ${booth.name} (${booth.city}, ${booth.country})`);

    const tempImageUrl = await generateImageWithRetry(booth);
    if (!tempImageUrl) return false;
    console.log('   ✅ Generated');

    const imageBuffer = await downloadImage(tempImageUrl);
    console.log(`   ✅ Downloaded (${(imageBuffer.length / 1024).toFixed(1)} KB)`);

    const permanentUrl = await uploadToSupabase(imageBuffer, booth.id);
    console.log('   ✅ Uploaded');

    await updateBooth(booth.id, permanentUrl);
    console.log('   ✅ Complete');

    return true;
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Get count of booths needing images
 */
async function getRemainingCount(): Promise<number> {
  const { count } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('photo_exterior_url', null)
    .is('ai_preview_url', null);

  return count || 0;
}

/**
 * Process one batch
 */
async function processBatch(): Promise<{ success: boolean; processed: number }> {
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, city, state, country, address, photo_exterior_url, ai_preview_url')
    .eq('status', 'active')
    .is('photo_exterior_url', null)
    .is('ai_preview_url', null)
    .limit(BATCH_SIZE);

  if (error) {
    console.error('❌ Database error:', error);
    return { success: false, processed: 0 };
  }

  if (!booths || booths.length === 0) {
    return { success: true, processed: 0 };
  }

  console.log(`\n📦 Processing batch of ${booths.length} booths...`);

  let batchSucceeded = 0;
  let batchFailed = 0;

  for (let i = 0; i < booths.length; i++) {
    const booth = booths[i];
    const success = await processBooth(booth, stats.totalProcessed + 1, stats.totalProcessed + booths.length);

    stats.totalProcessed++;

    if (success) {
      batchSucceeded++;
      stats.succeeded++;
      stats.costAccumulated += 0.04;
    } else {
      batchFailed++;
      stats.failed++;
    }

    // Progress update every 10 images
    if ((stats.totalProcessed % 10) === 0) {
      const elapsed = (Date.now() - stats.startTime) / 1000 / 60;
      const rate = stats.totalProcessed / elapsed;
      console.log(`\n📊 Progress: ${stats.totalProcessed} processed, ${stats.succeeded} succeeded, ${stats.failed} failed`);
      console.log(`   Rate: ${rate.toFixed(1)} images/min, Cost: $${stats.costAccumulated.toFixed(2)}`);
    }

    // Rate limiting delay
    if (i < booths.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_IMAGES));
    }
  }

  return { success: true, processed: booths.length };
}

/**
 * Main autonomous execution loop
 */
async function main() {
  console.log('🤖 AUTONOMOUS AI IMAGE GENERATION');
  console.log('=' .repeat(60));
  console.log('Mission: Generate images for ALL booths without images');
  console.log('=' .repeat(60));

  const initialRemaining = await getRemainingCount();
  console.log(`\n🎯 Found ${initialRemaining} booths needing images`);
  console.log(`💰 Estimated cost: $${(initialRemaining * 0.04).toFixed(2)}`);
  console.log(`⏱️  Estimated time: ${Math.ceil(initialRemaining * 1.2 / 60)} minutes\n`);

  if (initialRemaining === 0) {
    console.log('✨ All booths already have images!');
    return;
  }

  console.log('🚀 Starting autonomous execution...\n');

  let batchNumber = 1;

  while (true) {
    const remaining = await getRemainingCount();

    if (remaining === 0) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 MISSION COMPLETE!');
      console.log('='.repeat(60));
      console.log(`✅ All booths now have images!`);
      break;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📦 BATCH ${batchNumber}`);
    console.log(`   Remaining: ${remaining} booths`);
    console.log('='.repeat(60));

    const result = await processBatch();

    if (!result.success) {
      console.error('\n❌ Batch failed. Waiting 30s before retry...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      continue;
    }

    if (result.processed === 0) {
      break;
    }

    batchNumber++;

    // Short break between batches
    console.log('\n⏸️  Batch complete. Waiting 5s before next batch...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Final statistics
  const totalTime = (Date.now() - stats.startTime) / 1000 / 60;

  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL STATISTICS');
  console.log('='.repeat(60));
  console.log(`Total processed:    ${stats.totalProcessed}`);
  console.log(`✅ Succeeded:       ${stats.succeeded} (${((stats.succeeded / stats.totalProcessed) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed:          ${stats.failed} (${((stats.failed / stats.totalProcessed) * 100).toFixed(1)}%)`);
  console.log(`⏱️  Total time:      ${totalTime.toFixed(1)} minutes`);
  console.log(`💰 Total cost:      $${stats.costAccumulated.toFixed(2)}`);
  console.log(`⚡ Average rate:    ${(stats.totalProcessed / totalTime).toFixed(1)} images/minute`);
  console.log('='.repeat(60));

  console.log('\n✨ Autonomous execution complete!');
}

main().catch(console.error);
