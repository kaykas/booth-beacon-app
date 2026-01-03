#!/usr/bin/env npx tsx

/**
 * Final Targeted Deduplication - Third Pass
 *
 * This script handles specific remaining duplicates:
 * 1. Entries with just city name as address (no street) - clear duplicates
 * 2. Exact same venue name + address but with slight variations
 *
 * This preserves legitimate multiple booths at venues like:
 * - RAW 1, RAW 2, RAW 3 at Revaler Straße 99 (these have different names, keep them)
 * - Circus Circus #1, #2 (if they're truly different booths)
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
  description?: string;
  photo_exterior_url?: string;
  photo_interior_url?: string;
  photo_sample_strips?: string[];
  ai_preview_url?: string;
  booth_type?: string;
  source_names?: string[];
  source_urls?: string[];
  [key: string]: any;
}

// Normalize name for comparison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^the\s+/i, '') // Remove "The" prefix
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if address is just a city name (no street address)
function isCityOnlyAddress(address: string, city: string): boolean {
  const normalized = address.toLowerCase().trim();
  const cityNormalized = city.toLowerCase().trim();

  return (
    normalized === cityNormalized ||
    normalized.length < 15 || // Very short addresses are likely just city names
    !(/\d/.test(normalized)) // No numbers = no street address
  );
}

function scoreBooth(booth: Booth): number {
  let score = 0;

  if (booth.latitude && booth.longitude) score += 10;
  if (booth.postal_code) score += 3;
  const hasNumber = /\d+/.test(booth.address || '');
  if (hasNumber) score += 15;
  if (booth.address && booth.address.length > 20) score += 10;

  if (booth.description) score += 20;
  if (booth.photo_exterior_url) score += 15;
  if (booth.photo_interior_url) score += 10;
  if (booth.photo_sample_strips && booth.photo_sample_strips.length > 0) score += 15;

  if (booth.booth_type) score += 8;
  if (booth.source_urls && booth.source_urls.length > 0) {
    score += Math.min(booth.source_urls.length * 3, 10);
  }

  const hasSlugNumber = /-\d+$/.test(booth.slug);
  if (!hasSlugNumber) score += 12;

  return score;
}

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
  merged.photo_sample_strips = Array.from(new Set(allStrips));

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

  return merged;
}

async function run() {
  console.log('='.repeat(100));
  console.log('FINAL TARGETED DEDUPLICATION - THIRD PASS');
  console.log('='.repeat(100));
  console.log('');

  const { data: allBooths, error } = await supabase
    .from('booths')
    .select('*')
    .order('created_at');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`📚 Found ${allBooths.length} total booths\n`);

  // Group by name + city for booths with city-only addresses
  const cityOnlyGroups = new Map<string, Booth[]>();
  const sameNameGroups = new Map<string, Booth[]>();

  for (const booth of allBooths) {
    // Strategy 1: Group city-only addresses by name + city
    if (isCityOnlyAddress(booth.address, booth.city)) {
      const key = `${normalizeName(booth.name)}|${booth.city.toLowerCase()}`;
      if (!cityOnlyGroups.has(key)) {
        cityOnlyGroups.set(key, []);
      }
      cityOnlyGroups.get(key)!.push(booth);
    }

    // Strategy 2: Group by exact normalized name + city (for "The Knockout" vs "Knockout")
    const nameKey = `${normalizeName(booth.name)}|${booth.city.toLowerCase()}`;
    if (!sameNameGroups.has(nameKey)) {
      sameNameGroups.set(nameKey, []);
    }
    sameNameGroups.get(nameKey)!.push(booth);
  }

  // Find city-only duplicates
  const cityOnlyDuplicates = Array.from(cityOnlyGroups.entries())
    .filter(([_, booths]) => booths.length > 1)
    .map(([key, booths]) => {
      const [name, city] = key.split('|');
      return { name, city, booths, reason: 'City-only address' };
    });

  // Find same-name duplicates (only if they have valid addresses at same location)
  const sameNameDuplicates = Array.from(sameNameGroups.entries())
    .filter(([_, booths]) => {
      if (booths.length <= 1) return false;

      // Only if they have similar addresses (same street)
      const addresses = booths.map(b => b.address.toLowerCase().replace(/[^\w\s]/g, ''));
      const firstAddr = addresses[0];

      // Check if all addresses start with same street number/name
      const sameStreet = addresses.every(addr => {
        const firstWords = firstAddr.split(' ').slice(0, 3).join(' ');
        return addr.includes(firstWords) && firstWords.length > 5;
      });

      return sameStreet;
    })
    .map(([key, booths]) => {
      const [name, city] = key.split('|');
      return { name, city, booths, reason: 'Same name + similar address' };
    });

  // Combine and deduplicate
  const allDuplicates = [...cityOnlyDuplicates, ...sameNameDuplicates];

  // Remove overlaps (booths that appear in both lists)
  const seen = new Set<string>();
  const uniqueDuplicates = allDuplicates.filter(group => {
    const key = group.booths.map(b => b.id).sort().join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`🚨 Found ${uniqueDuplicates.length} groups of targeted duplicates\n`);

  if (uniqueDuplicates.length === 0) {
    console.log('✅ No more obvious duplicates!');
    return;
  }

  console.log('Preview:\n');
  for (const { name, city, booths, reason } of uniqueDuplicates.slice(0, 15)) {
    console.log(`  ${booths.length}x ${city}: ${name} (${reason})`);
  }
  console.log('');

  const deduplicationPlan: Array<{
    keep: Booth;
    merged: Booth;
    delete: Booth[];
    reason: string;
  }> = [];

  for (const { booths, reason } of uniqueDuplicates) {
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
      reason,
    });
  }

  console.log('='.repeat(100));
  console.log(`DEDUPLICATION PLAN:`);
  console.log(`  Keep: ${deduplicationPlan.length} booths`);
  console.log(`  Delete: ${deduplicationPlan.reduce((sum, p) => sum + p.delete.length, 0)} duplicates`);
  console.log('='.repeat(100));
  console.log('');

  const planPath = '/Users/jkw/Projects/booth-beacon-app/scripts/deduplication-plan-pass3.json';
  await fs.writeFile(planPath, JSON.stringify(deduplicationPlan, null, 2));
  console.log(`📄 Plan saved: ${planPath}\n`);

  console.log('🔄 Executing...\n');

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
        console.error(`   ❌ Failed to delete ${booth.name}: ${deleteError.message}`);
        failedCount++;
      } else {
        deletedCount++;
      }
    }
  }

  console.log('');
  console.log('='.repeat(100));
  console.log('FINAL DEDUPLICATION COMPLETE');
  console.log('='.repeat(100));
  console.log(`✅ Updated: ${updatedCount} booths`);
  console.log(`✅ Deleted: ${deletedCount} duplicates`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📊 Total cleaned across all passes: ${74 + 92 + deletedCount} duplicates`);
  console.log('='.repeat(100));
}

run().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
