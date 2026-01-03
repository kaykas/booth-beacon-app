/**
 * AUTONOMOUS IMAGE GENERATOR
 *
 * Continuously launches batch image generation until ALL booths have images.
 *
 * Features:
 * - Checks remaining booths needing images
 * - Launches batches of 100 automatically
 * - Reports progress after each batch
 * - Continues until completion
 * - Smart rate limiting (10 seconds between images)
 *
 * Usage:
 *   OPENAI_API_KEY=sk-xxx npx tsx autonomous-image-generator.ts
 */

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface BatchStats {
  batchNumber: number;
  succeeded: number;
  failed: number;
  duration: number;
  cost: number;
}

async function getBoothsNeedingImages(): Promise<number> {
  const { count } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('ai_preview_url', null)
    .is('photo_exterior_url', null);

  return count || 0;
}

async function runBatch(batchNumber: number): Promise<BatchStats> {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Launching Batch ${batchNumber}...`);
    console.log('━'.repeat(60));

    const startTime = Date.now();
    let succeeded = 0;
    let failed = 0;

    const child = spawn('npx', ['tsx', 'batch-generate-booth-images.ts', '100'], {
      env: {
        ...process.env,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let lastOutput = '';

    child.stdout?.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      lastOutput = output;
    });

    child.stderr?.on('data', (data) => {
      process.stderr.write(data.toString());
    });

    child.on('close', (code) => {
      const duration = (Date.now() - startTime) / 1000 / 60;

      // Parse results from output
      const succeededMatch = lastOutput.match(/✅ Succeeded: (\d+)/);
      const failedMatch = lastOutput.match(/❌ Failed: (\d+)/);

      if (succeededMatch) succeeded = parseInt(succeededMatch[1]);
      if (failedMatch) failed = parseInt(failedMatch[1]);

      const cost = succeeded * 0.04;

      if (code === 0) {
        resolve({ batchNumber, succeeded, failed, duration, cost });
      } else {
        reject(new Error(`Batch ${batchNumber} failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  console.log('🤖 AUTONOMOUS IMAGE GENERATOR');
  console.log('============================');
  console.log('Running until all booths have images\n');

  let batchNumber = 0;
  const batches: BatchStats[] = [];
  let totalSucceeded = 0;
  let totalFailed = 0;
  let totalCost = 0;

  while (true) {
    // Check remaining booths
    const remaining = await getBoothsNeedingImages();

    if (remaining === 0) {
      console.log('\n\n🎉 MISSION COMPLETE!');
      console.log('='.repeat(60));
      console.log('All booths now have images!');
      break;
    }

    console.log(`\n📊 Status: ${remaining} booths still need images`);
    console.log(`Progress: ${(1263 - remaining) / 1263 * 100}%`);
    console.log(`Estimated cost remaining: $${(remaining * 0.04).toFixed(2)}\n`);

    // Launch next batch
    batchNumber++;

    try {
      const stats = await runBatch(batchNumber);
      batches.push(stats);

      totalSucceeded += stats.succeeded;
      totalFailed += stats.failed;
      totalCost += stats.cost;

      console.log('\n✅ Batch Complete!');
      console.log(`   Succeeded: ${stats.succeeded}`);
      console.log(`   Failed: ${stats.failed}`);
      console.log(`   Duration: ${stats.duration.toFixed(1)} min`);
      console.log(`   Cost: $${stats.cost.toFixed(2)}`);

      // Brief pause between batches (10 seconds)
      console.log('\n⏸️  Pausing 10 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error) {
      console.error(`\n❌ Batch ${batchNumber} encountered an error:`, error);
      console.log('   Continuing with next batch after 30-second pause...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  // Final summary
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Batches: ${batches.length}`);
  console.log(`Total Images Generated: ${totalSucceeded}`);
  console.log(`Total Failures: ${totalFailed}`);
  console.log(`Total Cost: $${totalCost.toFixed(2)}`);
  console.log('═'.repeat(60));
  console.log('\n✨ All done! Every booth now has an image.');
}

main().catch(console.error);
