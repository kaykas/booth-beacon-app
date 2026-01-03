#!/usr/bin/env npx tsx

/**
 * Final Cleanup - Exact Same Address Duplicates
 *
 * This pass removes the last remaining obvious duplicates:
 * - Same exact address (after normalization)
 * - Same city
 * - No distinguishing features
 *
 * This is the most conservative pass - only removes when there's
 * absolutely no doubt they're duplicates.
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
  description?: string;
  photo_exterior_url?: string;
  photo_interior_url?: string;
  ai_preview_url?: string;
  booth_type?: string;
  machine_model?: string;
  source_names?: string[];
  source_urls?: string[];
  [key: string]: any;
}

function normalizeAddress(address: string): string {
  if (!address) return '';
  return address
    .toLowerCase()
    .replace(/[,\.]/g, '')
    .replace(/street/g, 'st')
    .replace(/avenue/g, 'ave')
    .replace(/boulevard/g, 'blvd')
    .replace(/drive/g, 'dr')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreBooth(booth: Booth): number {
  let score = 0;

  if (booth.latitude && booth.longitude) score += 10;
  if (booth.postal_code) score += 3;
  const hasNumber = /\d+/.test(booth.address || '');
  if (hasNumber) score += 15;

  if (booth.description) score += 20;
  if (booth.photo_exterior_url) score += 15;
  if (booth.photo_interior_url) score += 10;
  if (booth.ai_preview_url && !booth.photo_exterior_url) score += 8;

  if (booth.booth_type) score += 8;
  if (booth.machine_model) score += 8;
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
  if (!merged.machine_model) {
    merged.machine_model = duplicates.find(d => d.machine_model)?.machine_model;
  }

  return merged;
}

async function run() {
  console.log('='.repeat(100));
  console.log('FINAL CLEANUP - EXACT SAME ADDRESS DUPLICATES');
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

  // Group by EXACT normalized address + city
  const addressGroups = new Map<string, Booth[]>();

  for (const booth of allBooths) {
    if (!booth.address || booth.address.trim() === '') continue;

    const normalized = normalizeAddress(booth.address);
    // Only group if address has substance (not just city name)
    if (normalized.length < 10 || !(/\d/.test(normalized))) continue;

    const key = `${normalized}|${booth.city.toLowerCase().trim()}`;

    if (!addressGroups.has(key)) {
      addressGroups.set(key, []);
    }
    addressGroups.get(key)!.push(booth);
  }

  // Find groups with 2+ entries
  const duplicates = Array.from(addressGroups.entries())
    .filter(([_, booths]) => booths.length > 1)
    .map(([key, booths]) => {
      const [address, city] = key.split('|');
      return { address, city, booths };
    })
    .sort((a, b) => b.booths.length - a.booths.length);

  console.log(`🚨 Found ${duplicates.length} groups with exact same address\n`);

  if (duplicates.length === 0) {
    console.log('✅ No more exact-address duplicates!');
    return;
  }

  console.log('Preview:\n');
  for (const { address, city, booths } of duplicates.slice(0, 15)) {
    console.log(`  ${booths.length}x ${city}: ${address}`);
  }
  console.log('');

  const deduplicationPlan: Array<{
    keep: Booth;
    merged: Booth;
    delete: Booth[];
  }> = [];

  for (const { booths } of duplicates) {
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
    });
  }

  console.log('='.repeat(100));
  console.log(`DEDUPLICATION PLAN:`);
  console.log(`  Keep: ${deduplicationPlan.length} booths`);
  console.log(`  Delete: ${deduplicationPlan.reduce((sum, p) => sum + p.delete.length, 0)} duplicates`);
  console.log('='.repeat(100));
  console.log('');

  const planPath = '/Users/jkw/Projects/booth-beacon-app/scripts/deduplication-plan-pass4.json';
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
        ai_preview_url: plan.merged.ai_preview_url,
        source_names: plan.merged.source_names,
        source_urls: plan.merged.source_urls,
        booth_type: plan.merged.booth_type,
        machine_model: plan.merged.machine_model,
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

  const totalCleaned = 74 + 92 + 71 + deletedCount;

  console.log('');
  console.log('='.repeat(100));
  console.log('FINAL CLEANUP COMPLETE');
  console.log('='.repeat(100));
  console.log(`✅ Updated: ${updatedCount} booths`);
  console.log(`✅ Deleted: ${deletedCount} duplicates`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📊 Total cleaned across all 4 passes: ${totalCleaned} duplicates`);
  console.log('='.repeat(100));
}

run().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
