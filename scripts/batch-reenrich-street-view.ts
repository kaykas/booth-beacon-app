#!/usr/bin/env tsx
/**
 * Batch Re-enrichment Script - Apply source=outdoor Fix
 *
 * Re-enriches booths with Street View to apply the new source=outdoor parameter.
 * This ensures all booths get the best (newest) Street View panoramas.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/batch-reenrich-street-view.ts
 *
 * Options:
 *   --limit N     Only re-enrich N booths (for testing)
 *   --dry-run     Show what would be done without making changes
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null;
const dryRun = args.includes('--dry-run');

interface BoothToReenrich {
  id: string;
  name: string;
  city: string;
  street_view_validated_at: string;
  enriched_at: string;
}

async function main() {
  console.log('🔄 Batch Re-enrichment for Street View Improvements\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Step 1: Find booths that need re-enrichment
  console.log('📊 Finding booths to re-enrich...\n');

  // Get booths with Street View that were enriched (to apply source=outdoor fix)
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, city, street_view_validated_at, enriched_at')
    .eq('status', 'active')
    .eq('street_view_available', true)
    .not('enriched_at', 'is', null)
    .order('enriched_at', { ascending: true }) // Oldest first
    .limit(limit || 1000);

  if (error) {
    console.error('❌ Error fetching booths:', error);
    process.exit(1);
  }

  if (!booths || booths.length === 0) {
    console.log('✅ No booths need re-enrichment');
    return;
  }

  console.log(`Found ${booths.length} booths to re-enrich`);
  if (limit) {
    console.log(`Limited to ${limit} booths for testing`);
  }
  console.log('');

  // Show sample
  console.log('📋 Sample booths:');
  booths.slice(0, 5).forEach(b => {
    console.log(`  - ${b.name} (${b.city}) - Last enriched: ${new Date(b.enriched_at).toLocaleDateString()}`);
  });
  if (booths.length > 5) {
    console.log(`  ... and ${booths.length - 5} more`);
  }
  console.log('');

  if (dryRun) {
    console.log('✅ Dry run complete - no changes made');
    console.log('');
    console.log('To run for real, remove --dry-run flag');
    return;
  }

  // Step 2: Clear enrichment timestamps
  console.log('🧹 Clearing enrichment timestamps...\n');

  const boothIds = booths.map(b => b.id);

  const { error: clearError } = await supabase
    .from('booths')
    .update({
      enriched_at: null,
      street_view_validated_at: null,
      updated_at: new Date().toISOString()
    })
    .in('id', boothIds);

  if (clearError) {
    console.error('❌ Error clearing timestamps:', clearError);
    process.exit(1);
  }

  console.log(`✅ Cleared timestamps for ${booths.length} booths\n`);

  // Step 3: Trigger batch enrichment in chunks
  console.log('🚀 Triggering batch enrichment via Edge Function...\n');
  console.log('This will use the new source=outdoor parameter for better Street View.\n');
  console.log('Processing in chunks of 50 booths to avoid timeout...\n');

  const CHUNK_SIZE = 50;
  const chunks = [];
  for (let i = 0; i < boothIds.length; i += CHUNK_SIZE) {
    chunks.push(boothIds.slice(i, i + CHUNK_SIZE));
  }

  console.log(`Processing ${chunks.length} chunks of ~${CHUNK_SIZE} booths each\n`);

  const allResults: any[] = [];
  let totalSuccessful = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`📦 Processing chunk ${i + 1}/${chunks.length} (${chunk.length} booths)...`);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/enrich-booth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        batch: true,
        limit: chunk.length
      })
    });

    if (!response.ok) {
      console.error(`❌ Chunk ${i + 1} failed:`, response.status);
      continue;
    }

    const result = await response.json();
    allResults.push(...(result.results || []));
    totalSuccessful += result.successful || 0;
    totalSkipped += result.skipped || 0;
    totalFailed += result.failed || 0;

    console.log(`   ✅ ${result.successful || 0} successful, ${result.skipped || 0} skipped, ${result.failed || 0} failed\n`);

    // Wait 2 seconds between chunks to avoid rate limits
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const result = {
    processed: allResults.length,
    successful: totalSuccessful,
    skipped: totalSkipped,
    failed: totalFailed,
    results: allResults
  };

  console.log('📊 Batch Enrichment Results:\n');
  console.log(`  Total processed: ${result.processed || 0}`);
  console.log(`  Successful: ${result.successful || 0}`);
  console.log(`  Skipped: ${result.skipped || 0}`);
  console.log(`  Failed: ${result.failed || 0}`);
  console.log('');

  // Show sample results
  if (result.results && result.results.length > 0) {
    console.log('📋 Sample results:');
    result.results.slice(0, 5).forEach((r: any) => {
      const status = r.success && !r.skipped ? '✅' : r.skipped ? '⏭️' : '❌';
      const booth = booths.find(b => b.id === r.boothId);
      console.log(`  ${status} ${booth?.name || r.boothId}`);
      if (r.enriched?.streetView) {
        console.log(`     Street View: Found with source=outdoor`);
      }
    });
    if (result.results.length > 5) {
      console.log(`  ... and ${result.results.length - 5} more`);
    }
  }
  console.log('');

  // Summary
  console.log('🎉 Batch re-enrichment complete!\n');
  console.log('Next steps:');
  console.log('1. Check a few booths to verify Street View improved');
  console.log('2. Monitor for any failed enrichments');
  console.log('3. Booths will show updated Street View on next page visit\n');

  // Estimate cost
  const cost = (result.successful || 0) * 0.04;
  console.log(`💰 Estimated cost: $${cost.toFixed(2)} (${result.successful || 0} × $0.04)`);
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
