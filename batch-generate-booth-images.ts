#!/usr/bin/env tsx
/**
 * Batch script to generate AI images for booths without photos
 *
 * This script:
 * 1. Queries the database for booths that need AI-generated images
 * 2. Calls the generate-booth-art Edge Function in batches
 * 3. Implements rate limiting and error handling
 * 4. Reports statistics on completion
 *
 * Usage:
 *   npx tsx batch-generate-booth-images.ts
 *
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './src/lib/supabase/types';

// Configuration
const EDGE_FUNCTION_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/generate-booth-art';
const BATCH_SIZE = 5; // Process 5 booths at a time
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds delay between batches
const MAX_RETRIES = 3; // Retry failed requests up to 3 times
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set to true to test without calling API

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  console.error('Please set it in your .env.local file or pass it as an environment variable');
  process.exit(1);
}

// Statistics tracking
interface Stats {
  totalFound: number;
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Array<{ booth_id: string; error: string }>;
}

const stats: Stats = {
  totalFound: 0,
  totalProcessed: 0,
  successful: 0,
  failed: 0,
  errors: [],
};

// Initialize Supabase client
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Fetch booths that need AI-generated images
 */
async function fetchBoothsNeedingImages(): Promise<string[]> {
  console.log('🔍 Querying database for booths without images...\n');

  const { data, error } = await supabase
    .from('booths')
    .select('id, name, city, country')
    .is('photo_exterior_url', null)
    .is('ai_preview_url', null)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.log('✅ No booths found that need AI-generated images');
    return [];
  }

  console.log(`📊 Found ${data.length} booths without images:\n`);
  data.forEach((booth, index) => {
    console.log(`   ${index + 1}. ${booth.name} (${booth.city}, ${booth.country})`);
  });
  console.log('');

  stats.totalFound = data.length;
  return data.map(booth => booth.id);
}

/**
 * Generate images for a batch of booths
 */
async function generateImagesForBatch(
  boothIds: string[],
  retryCount = 0
): Promise<{ success: boolean; results: Array<{
  booth_id: string;
  success?: boolean;
  image_url?: string;
  prompt?: string;
  error?: string;
}> }> {
  try {
    if (DRY_RUN) {
      console.log(`🧪 [DRY RUN] Would call Edge Function for ${boothIds.length} booths...`);
      // Simulate successful response
      await delay(1000); // Simulate API delay
      return {
        success: true,
        results: boothIds.map(id => ({
          booth_id: id,
          success: true,
          image_url: `https://example.com/dry-run-image-${id}.png`,
          prompt: 'Dry run - no actual image generated'
        }))
      };
    }

    console.log(`📤 Calling Edge Function for ${boothIds.length} booths...`);

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ booth_ids: boothIds }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge Function returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error calling Edge Function:`, errorMessage);

    // Retry logic
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Retrying batch (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await delay(2000 * (retryCount + 1)); // Exponential backoff
      return generateImagesForBatch(boothIds, retryCount + 1);
    }

    // If all retries failed, mark all booths in batch as failed
    return {
      success: false,
      results: boothIds.map(id => ({
        booth_id: id,
        error: errorMessage,
      })),
    };
  }
}

/**
 * Process batches of booths
 */
async function processBatches(boothIds: string[]): Promise<void> {
  const totalBatches = Math.ceil(boothIds.length / BATCH_SIZE);

  console.log(`🚀 Starting batch processing:`);
  console.log(`   Total booths: ${boothIds.length}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Total batches: ${totalBatches}`);
  console.log(`   Delay between batches: ${DELAY_BETWEEN_BATCHES}ms\n`);

  for (let i = 0; i < boothIds.length; i += BATCH_SIZE) {
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const batch = boothIds.slice(i, i + BATCH_SIZE);

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} booths)`);
    console.log(`${'='.repeat(70)}\n`);

    const result = await generateImagesForBatch(batch);

    // Process results
    if (result.results) {
      for (const item of result.results) {
        stats.totalProcessed++;

        if (item.success) {
          stats.successful++;
          console.log(`✅ Success: ${item.booth_id}`);
          if (item.image_url) {
            console.log(`   Image URL: ${item.image_url}`);
          }
        } else {
          stats.failed++;
          stats.errors.push({
            booth_id: item.booth_id,
            error: item.error || 'Unknown error',
          });
          console.log(`❌ Failed: ${item.booth_id}`);
          console.log(`   Error: ${item.error || 'Unknown error'}`);
        }
      }
    }

    // Delay between batches (except for the last batch)
    if (i + BATCH_SIZE < boothIds.length) {
      console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }
}

/**
 * Print final statistics
 */
function printStatistics(): void {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 FINAL STATISTICS`);
  console.log(`${'='.repeat(70)}\n`);

  console.log(`Total booths found:       ${stats.totalFound}`);
  console.log(`Total booths processed:   ${stats.totalProcessed}`);
  console.log(`✅ Successful:            ${stats.successful}`);
  console.log(`❌ Failed:                ${stats.failed}`);

  if (stats.errors.length > 0) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`❌ ERRORS (${stats.errors.length}):`);
    console.log(`${'─'.repeat(70)}\n`);

    stats.errors.forEach((error, index) => {
      console.log(`${index + 1}. Booth ID: ${error.booth_id}`);
      console.log(`   Error: ${error.error}\n`);
    });
  }

  const successRate = stats.totalProcessed > 0
    ? ((stats.successful / stats.totalProcessed) * 100).toFixed(1)
    : '0.0';

  console.log(`\nSuccess rate: ${successRate}%`);
  console.log(`\n${'='.repeat(70)}\n`);
}

/**
 * Delay helper function
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🎨 Booth Beacon - Batch Image Generator\n');
  if (DRY_RUN) {
    console.log('🧪 DRY RUN MODE - No actual API calls will be made\n');
  }
  console.log(`${'='.repeat(70)}\n`);

  try {
    // Step 1: Fetch booths that need images
    const boothIds = await fetchBoothsNeedingImages();

    if (boothIds.length === 0) {
      console.log('✅ All booths have images! Nothing to do.\n');
      return;
    }

    // Step 2: Process batches
    await processBatches(boothIds);

    // Step 3: Print statistics
    printStatistics();

    // Exit with appropriate code
    process.exit(stats.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}

// Run the script
main();
