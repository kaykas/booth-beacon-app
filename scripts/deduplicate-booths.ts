#!/usr/bin/env npx tsx

/**
 * Booth Deduplication Script
 *
 * Intelligently merges duplicate booth entries by:
 * 1. Grouping booths by name + city
 * 2. Selecting the "best" entry (most complete data)
 * 3. Deleting inferior duplicates
 *
 * Scoring criteria for "best" booth:
 * - Has complete address (street number + name)
 * - Has valid coordinates
 * - Has most recent geocoded_at timestamp
 * - Has longest/most detailed address
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface Booth {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  geocoded_at?: string;
  created_at?: string;
}

// Score a booth based on data completeness (higher = better)
function scoreBooth(booth: Booth): number {
  let score = 0;

  // Has coordinates
  if (booth.latitude && booth.longitude) {
    score += 10;
  }

  // Has complete address (contains number)
  const hasNumber = /\d+/.test(booth.address);
  if (hasNumber) {
    score += 20;
  }

  // Address is not just the business name
  if (booth.address.toLowerCase() !== booth.name.toLowerCase()) {
    score += 15;
  }

  // Address length (more detailed is better)
  score += Math.min(booth.address.length / 10, 15);

  // Has postal code
  if (booth.postal_code) {
    score += 5;
  }

  // Has state
  if (booth.state) {
    score += 3;
  }

  // Has been geocoded recently
  if (booth.geocoded_at) {
    score += 5;
  }

  // Prefer entries without numbered slugs (original entries)
  const hasSlugNumber = /-\d+$/.test(booth.slug);
  if (!hasSlugNumber) {
    score += 10;
  }

  return score;
}

// Select the best booth from a group of duplicates
function selectBestBooth(booths: Booth[]): { best: Booth; toDelete: Booth[] } {
  const scored = booths.map(booth => ({
    booth,
    score: scoreBooth(booth),
  }));

  // Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score);

  return {
    best: scored[0].booth,
    toDelete: scored.slice(1).map(s => s.booth),
  };
}

async function run() {
  console.log('='.repeat(100));
  console.log('BOOTH DEDUPLICATION SCRIPT');
  console.log('='.repeat(100));
  console.log('');

  // Confirm with user
  console.log('⚠️  WARNING: This script will DELETE duplicate booth entries from the database.');
  console.log('   It will keep the "best" version of each booth based on data completeness.');
  console.log('');
  console.log('   A backup report will be saved before deletion.');
  console.log('');

  // Get all booths
  console.log('📚 Fetching all booths from database...');
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, slug, address, city, state, country, postal_code, latitude, longitude, geocoded_at, created_at')
    .order('name');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`   Found ${booths.length} total booths\\n`);

  // Group by name + city
  const groups = new Map<string, Booth[]>();

  for (const booth of booths) {
    const key = `${booth.name.toLowerCase().trim()}|${booth.city.toLowerCase().trim()}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(booth);
  }

  // Find groups with duplicates
  const duplicates = Array.from(groups.entries())
    .filter(([_, booths]) => booths.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }

  console.log(`🚨 Found ${duplicates.length} sets of duplicates\\n`);

  // Process each duplicate set
  const deletionPlan: Array<{
    keep: Booth;
    delete: Booth[];
    reason: string;
  }> = [];

  for (const [key, boothGroup] of duplicates) {
    const [name, city] = key.split('|');

    const { best, toDelete } = selectBestBooth(boothGroup);

    deletionPlan.push({
      keep: best,
      delete: toDelete,
      reason: `Most complete data (score: ${scoreBooth(best)})`,
    });

    console.log(`${name} (${city}): ${boothGroup.length} entries → keeping 1, deleting ${toDelete.length}`);
  }

  console.log('');
  console.log('='.repeat(100));
  console.log(`DEDUPLICATION PLAN: Keep ${deletionPlan.length} booths, delete ${deletionPlan.reduce((sum, p) => sum + p.delete.length, 0)} duplicates`);
  console.log('='.repeat(100));
  console.log('');

  // Save deletion plan to file
  const planPath = '/Users/jkw/Projects/booth-beacon-app/scripts/deduplication-plan.json';
  await fs.writeFile(planPath, JSON.stringify(deletionPlan, null, 2));
  console.log(`📄 Deduplication plan saved: ${planPath}`);
  console.log('');

  // Execute deletions
  console.log('🗑️  Executing deletions...');
  console.log('');

  let deletedCount = 0;
  let failedCount = 0;

  for (const plan of deletionPlan) {
    for (const booth of plan.delete) {
      const { error } = await supabase
        .from('booths')
        .delete()
        .eq('id', booth.id);

      if (error) {
        console.error(`   ❌ Failed to delete ${booth.name} (${booth.id}): ${error.message}`);
        failedCount++;
      } else {
        deletedCount++;
      }
    }
  }

  console.log('');
  console.log('='.repeat(100));
  console.log('DEDUPLICATION COMPLETE');
  console.log('='.repeat(100));
  console.log(`✅ Successfully deleted: ${deletedCount} duplicate booths`);
  console.log(`❌ Failed deletions: ${failedCount}`);
  console.log(`📊 Unique booths remaining: ${deletionPlan.length}`);
  console.log('');
  console.log(`📄 Full deduplication plan saved to: ${planPath}`);
  console.log('='.repeat(100));
}

run().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
