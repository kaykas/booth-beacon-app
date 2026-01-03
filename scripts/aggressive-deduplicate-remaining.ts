#!/usr/bin/env npx tsx

/**
 * Aggressive Deduplication Script - Second Pass
 *
 * This script handles remaining duplicates that were filtered out in the first pass.
 * It's more aggressive and will merge duplicates even when they have numbered names,
 * but ONLY when they're clearly duplicates (same exact address, no distinguishing features).
 *
 * Use cases:
 * - RAW venue in Berlin with 9 entries at same address
 * - Venues with "I, II, III" naming but actually duplicates
 * - Empty city entries (just "Berlin", "Chicago")
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
  description?: string;
  photo_exterior_url?: string;
  photo_interior_url?: string;
  photo_sample_strips?: string[];
  ai_preview_url?: string;
  hours?: string;
  cost?: string;
  booth_type?: string;
  photo_type?: string;
  machine_model?: string;
  machine_manufacturer?: string;
  features?: string[];
  source_urls?: string[];
  source_names?: string[];
  source_primary?: string;
  created_at?: string;
  geocoded_at?: string;
}

// Normalize address for comparison
function normalizeAddress(address: string): string {
  if (!address) return '';
  return address
    .toLowerCase()
    .replace(/[,\.]/g, '')
    .replace(/street/g, 'st')
    .replace(/avenue/g, 'ave')
    .replace(/boulevard/g, 'blvd')
    .replace(/drive/g, 'dr')
    .replace(/straße/g, 'strasse')
    .replace(/strasse/g, 'strasse')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if booths are TRULY distinct or just duplicates with numbered names
function areTrulyDistinct(booths: Booth[]): boolean {
  // If booth addresses are just city names (no street address), they're duplicates
  const hasCityOnlyAddresses = booths.some(b => {
    const normalized = normalizeAddress(b.address);
    const cityNormalized = normalizeAddress(b.city);
    return normalized === cityNormalized || normalized.length < 10;
  });

  if (hasCityOnlyAddresses) return false;

  // Check if there are actual differences in booth_type or machine_model
  const uniqueTypes = new Set(
    booths.map(b => b.booth_type).filter(Boolean)
  );
  const uniqueModels = new Set(
    booths.map(b => b.machine_model).filter(Boolean)
  );

  // If they have different types/models explicitly stated, they're distinct
  if (uniqueTypes.size > 1 || uniqueModels.size > 1) {
    // But only if those are actually different, not just one having null
    const nonNullTypes = Array.from(uniqueTypes).filter(t => t !== null && t !== '');
    const nonNullModels = Array.from(uniqueModels).filter(m => m !== null && m !== '');

    if (nonNullTypes.length > 1 || nonNullModels.length > 1) {
      return true;
    }
  }

  // If descriptions are substantively different (>50% difference), they might be distinct
  const descriptions = booths.map(b => b.description).filter(Boolean);
  if (descriptions.length > 1) {
    const firstDesc = descriptions[0] || '';
    const allSimilar = descriptions.every(desc => {
      const shorter = Math.min(firstDesc.length, (desc || '').length);
      const longer = Math.max(firstDesc.length, (desc || '').length);
      return longer - shorter < shorter * 0.5;
    });
    if (!allSimilar) return true;
  }

  // Otherwise, they're duplicates
  return false;
}

// Score a booth based on data completeness (higher = better)
function scoreBooth(booth: Booth): number {
  let score = 0;

  if (booth.latitude && booth.longitude) score += 10;
  if (booth.postal_code) score += 3;
  if (booth.state) score += 2;

  const hasNumber = /\d+/.test(booth.address || '');
  if (hasNumber) score += 15;
  if (booth.address && booth.address.toLowerCase() !== booth.name.toLowerCase()) {
    score += 10;
  }
  if (booth.address) score += Math.min((booth.address.length / 10), 10);

  if (booth.description) score += 20;
  if (booth.photo_exterior_url) score += 15;
  if (booth.photo_interior_url) score += 10;
  if (booth.photo_sample_strips && booth.photo_sample_strips.length > 0) score += 15;

  if (booth.booth_type) score += 8;
  if (booth.photo_type) score += 5;
  if (booth.machine_model) score += 8;
  if (booth.machine_manufacturer) score += 5;

  if (booth.hours) score += 7;
  if (booth.cost) score += 5;
  if (booth.features && booth.features.length > 0) score += 5;

  if (booth.source_urls && booth.source_urls.length > 0) {
    score += Math.min(booth.source_urls.length * 3, 10);
  }
  if (booth.geocoded_at) score += 5;

  const hasSlugNumber = /-\d+$/.test(booth.slug);
  if (!hasSlugNumber) score += 12;

  return score;
}

// Merge data from multiple booths into the best one
function mergeBooth(best: Booth, duplicates: Booth[]): Booth {
  const merged = { ...best };

  const descriptions = [best.description, ...duplicates.map(d => d.description)]
    .filter(Boolean)
    .filter((desc, idx, arr) => arr.indexOf(desc) === idx);
  if (descriptions.length > 1) {
    merged.description = descriptions.join('\n\n');
  } else if (!merged.description && descriptions.length > 0) {
    merged.description = descriptions[0];
  }

  if (!merged.photo_exterior_url) {
    merged.photo_exterior_url = duplicates.find(d => d.photo_exterior_url)?.photo_exterior_url;
  }
  if (!merged.photo_interior_url) {
    merged.photo_interior_url = duplicates.find(d => d.photo_interior_url)?.photo_interior_url;
  }
  if (!merged.ai_preview_url) {
    merged.ai_preview_url = duplicates.find(d => d.ai_preview_url)?.ai_preview_url;
  }

  const allStrips = [
    ...(merged.photo_sample_strips || []),
    ...duplicates.flatMap(d => d.photo_sample_strips || [])
  ].filter(Boolean);
  const uniqueStrips = Array.from(new Set(allStrips));
  if (uniqueStrips.length > 0) {
    merged.photo_sample_strips = uniqueStrips;
  }

  const allSourceNames = [
    ...(merged.source_names || []),
    ...duplicates.flatMap(d => d.source_names || [])
  ].filter(Boolean);
  merged.source_names = Array.from(new Set(allSourceNames));

  const allSourceUrls = [
    ...(merged.source_urls || []),
    ...duplicates.flatMap(d => d.source_urls || [])
  ].filter(Boolean);
  merged.source_urls = Array.from(new Set(allSourceUrls));

  if (!merged.booth_type) {
    merged.booth_type = duplicates.find(d => d.booth_type)?.booth_type;
  }
  if (!merged.photo_type) {
    merged.photo_type = duplicates.find(d => d.photo_type)?.photo_type;
  }
  if (!merged.machine_model) {
    merged.machine_model = duplicates.find(d => d.machine_model)?.machine_model;
  }
  if (!merged.machine_manufacturer) {
    merged.machine_manufacturer = duplicates.find(d => d.machine_manufacturer)?.machine_manufacturer;
  }

  const allFeatures = [
    ...(merged.features || []),
    ...duplicates.flatMap(d => d.features || [])
  ].filter(Boolean);
  merged.features = Array.from(new Set(allFeatures));

  if (!merged.hours) {
    merged.hours = duplicates.find(d => d.hours)?.hours;
  }
  if (!merged.cost) {
    merged.cost = duplicates.find(d => d.cost)?.cost;
  }

  return merged;
}

async function run() {
  console.log('='.repeat(100));
  console.log('AGGRESSIVE DEDUPLICATION SCRIPT - SECOND PASS');
  console.log('='.repeat(100));
  console.log('');

  console.log('📚 Fetching all booths from database...');
  const { data: allBooths, error } = await supabase
    .from('booths')
    .select('*')
    .order('created_at');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`   Found ${allBooths.length} total booths\n`);

  // Group by normalized address
  const addressGroups = new Map<string, Booth[]>();

  for (const booth of allBooths) {
    if (!booth.address || booth.address.trim() === '') continue;

    const normalized = normalizeAddress(booth.address);
    const key = `${normalized}|${booth.city.toLowerCase().trim()}`;

    if (!addressGroups.has(key)) {
      addressGroups.set(key, []);
    }
    addressGroups.get(key)!.push(booth);
  }

  // Find duplicates
  let duplicates = Array.from(addressGroups.entries())
    .filter(([_, booths]) => booths.length > 1)
    .map(([key, booths]) => {
      const [address, city] = key.split('|');
      return { address, city, booths };
    });

  // This time, be more aggressive - only filter out if TRULY distinct
  duplicates = duplicates.filter(group => !areTrulyDistinct(group.booths));

  // Sort by number of duplicates (most first)
  duplicates.sort((a, b) => b.booths.length - a.booths.length);

  console.log(`🚨 Found ${duplicates.length} groups of duplicates\n`);

  if (duplicates.length === 0) {
    console.log('✅ No more duplicates to clean up!');
    return;
  }

  // Show preview
  console.log('Preview of top 10 duplicate groups:\n');
  for (const { address, city, booths } of duplicates.slice(0, 10)) {
    console.log(`  ${booths.length}x ${city}: ${address.substring(0, 60)}...`);
  }
  console.log('');

  // Process each duplicate set
  const deduplicationPlan: Array<{
    keep: Booth;
    merged: Booth;
    delete: Booth[];
    reason: string;
    city: string;
  }> = [];

  for (const { address, city, booths } of duplicates) {
    const scored = booths.map(booth => ({
      booth,
      score: scoreBooth(booth),
    })).sort((a, b) => b.score - a.score);

    const best = scored[0].booth;
    const toDelete = scored.slice(1).map(s => s.booth);
    const merged = mergeBooth(best, toDelete);

    deduplicationPlan.push({
      keep: best,
      merged,
      delete: toDelete,
      reason: `Best score: ${scored[0].score}`,
      city,
    });
  }

  console.log('='.repeat(100));
  console.log(`DEDUPLICATION PLAN:`);
  console.log(`  Keep: ${deduplicationPlan.length} booths (with merged data)`);
  console.log(`  Delete: ${deduplicationPlan.reduce((sum, p) => sum + p.delete.length, 0)} duplicates`);
  console.log('='.repeat(100));
  console.log('');

  const planPath = '/Users/jkw/Projects/booth-beacon-app/scripts/deduplication-plan-pass2.json';
  await fs.writeFile(planPath, JSON.stringify(deduplicationPlan, null, 2));
  console.log(`📄 Deduplication plan saved: ${planPath}\n`);

  console.log('🔄 Executing updates and deletions...\n');

  let updatedCount = 0;
  let deletedCount = 0;
  let failedCount = 0;

  for (const plan of deduplicationPlan) {
    const { error: updateError } = await supabase
      .from('booths')
      .update({
        description: plan.merged.description,
        photo_exterior_url: plan.merged.photo_exterior_url,
        photo_interior_url: plan.merged.photo_interior_url,
        photo_sample_strips: plan.merged.photo_sample_strips,
        ai_preview_url: plan.merged.ai_preview_url,
        source_names: plan.merged.source_names,
        source_urls: plan.merged.source_urls,
        booth_type: plan.merged.booth_type,
        photo_type: plan.merged.photo_type,
        machine_model: plan.merged.machine_model,
        machine_manufacturer: plan.merged.machine_manufacturer,
        features: plan.merged.features,
        hours: plan.merged.hours,
        cost: plan.merged.cost,
      })
      .eq('id', plan.keep.id);

    if (updateError) {
      console.error(`   ❌ Failed to update ${plan.keep.name}: ${updateError.message}`);
      failedCount++;
      continue;
    } else {
      updatedCount++;
    }

    for (const booth of plan.delete) {
      const { error: deleteError } = await supabase
        .from('booths')
        .delete()
        .eq('id', booth.id);

      if (deleteError) {
        console.error(`   ❌ Failed to delete ${booth.name} (${booth.id}): ${deleteError.message}`);
        failedCount++;
      } else {
        deletedCount++;
      }
    }
  }

  console.log('');
  console.log('='.repeat(100));
  console.log('AGGRESSIVE DEDUPLICATION COMPLETE');
  console.log('='.repeat(100));
  console.log(`✅ Successfully updated: ${updatedCount} booths with merged data`);
  console.log(`✅ Successfully deleted: ${deletedCount} duplicate booths`);
  console.log(`❌ Failed operations: ${failedCount}`);
  console.log(`📊 Net reduction: ${deletedCount} booths removed from database`);
  console.log(`📊 Total cleaned in both passes: ${74 + deletedCount} duplicates`);
  console.log('');
  console.log(`📄 Full deduplication plan saved to: ${planPath}`);
  console.log('='.repeat(100));
}

run().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
