import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Calculate distance between two points using Haversine formula (in meters)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Score booth by data completeness
function scoreBooth(booth: any): number {
  let score = 0;
  if (booth.latitude && booth.longitude) score += 10;
  if (booth.description) score += 20;
  if (booth.photo_exterior_url) score += 15;
  if (booth.photo_interior_url) score += 10;
  if (booth.booth_type) score += 8;
  if (booth.machine_model) score += 8;
  if (booth.hours) score += 7;
  if (booth.cost) score += 5;
  if (!booth.slug.match(/-\d+$/)) score += 12; // Original slug (no -2, -3 suffix)
  if (booth.source_names?.length) score += Math.min(booth.source_names.length * 3, 10);
  if (booth.postal_code) score += 3;
  if (booth.state) score += 2;
  return score;
}

async function deduplicateByProximity() {
  console.log('🔍 Fetching all booths with coordinates...\n');

  const { data: booths, error } = await supabase
    .from('booths')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .eq('status', 'active');

  if (error || !booths) {
    console.error('Error fetching booths:', error);
    return;
  }

  console.log(`Found ${booths.length} booths with coordinates\n`);

  // Group booths by proximity (within 10 meters)
  const PROXIMITY_THRESHOLD = 10; // meters
  const duplicateGroups: any[][] = [];
  const processed = new Set<string>();

  for (let i = 0; i < booths.length; i++) {
    if (processed.has(booths[i].id)) continue;

    const group = [booths[i]];
    processed.add(booths[i].id);

    for (let j = i + 1; j < booths.length; j++) {
      if (processed.has(booths[j].id)) continue;

      const distance = calculateDistance(
        booths[i].latitude,
        booths[i].longitude,
        booths[j].latitude,
        booths[j].longitude
      );

      if (distance <= PROXIMITY_THRESHOLD) {
        // Additional check: names should be similar
        const name1 = booths[i].name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const name2 = booths[j].name.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Check if names are similar (one contains the other or Levenshtein distance < 3)
        if (name1.includes(name2) || name2.includes(name1) ||
            Math.abs(name1.length - name2.length) <= 3) {
          group.push(booths[j]);
          processed.add(booths[j].id);
        }
      }
    }

    if (group.length > 1) {
      duplicateGroups.push(group);
    }
  }

  console.log(`🚨 Found ${duplicateGroups.length} proximity-based duplicate groups:\n`);

  const mergePlan: any[] = [];

  for (const group of duplicateGroups) {
    // Score each booth
    const scored = group.map(booth => ({
      booth,
      score: scoreBooth(booth)
    })).sort((a, b) => b.score - a.score);

    const keeper = scored[0].booth;
    const toDelete = scored.slice(1).map(s => s.booth);

    console.log(`📍 ${keeper.name} (${keeper.city})`);
    console.log(`   Distance between duplicates: ${calculateDistance(
      keeper.latitude, keeper.longitude,
      toDelete[0].latitude, toDelete[0].longitude
    ).toFixed(1)}m`);
    console.log(`   Keeping: ${keeper.slug} (score: ${scored[0].score})`);
    toDelete.forEach((b, idx) => {
      console.log(`   Deleting: ${b.slug} (score: ${scored[idx + 1].score})`);
    });
    console.log();

    // Merge data
    const mergedData: any = { ...keeper };

    // Merge descriptions
    const descriptions = [keeper.description, ...toDelete.map(b => b.description)]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i); // unique
    if (descriptions.length > 0) {
      mergedData.description = descriptions.join('\n\n');
    }

    // Fill missing fields from duplicates
    for (const dup of toDelete) {
      if (!mergedData.photo_exterior_url && dup.photo_exterior_url) {
        mergedData.photo_exterior_url = dup.photo_exterior_url;
      }
      if (!mergedData.photo_interior_url && dup.photo_interior_url) {
        mergedData.photo_interior_url = dup.photo_interior_url;
      }
      if (!mergedData.booth_type && dup.booth_type) {
        mergedData.booth_type = dup.booth_type;
      }
      if (!mergedData.machine_model && dup.machine_model) {
        mergedData.machine_model = dup.machine_model;
      }
      if (!mergedData.hours && dup.hours) {
        mergedData.hours = dup.hours;
      }
      if (!mergedData.cost && dup.cost) {
        mergedData.cost = dup.cost;
      }
      if (!mergedData.postal_code && dup.postal_code) {
        mergedData.postal_code = dup.postal_code;
      }
      if (!mergedData.state && dup.state) {
        mergedData.state = dup.state;
      }
    }

    // Merge source arrays
    const allSourceNames = [
      ...(keeper.source_names || []),
      ...toDelete.flatMap(b => b.source_names || [])
    ].filter((v, i, arr) => arr.indexOf(v) === i);

    const allSourceUrls = [
      ...(keeper.source_urls || []),
      ...toDelete.flatMap(b => b.source_urls || [])
    ].filter((v, i, arr) => arr.indexOf(v) === i);

    if (allSourceNames.length > 0) mergedData.source_names = allSourceNames;
    if (allSourceUrls.length > 0) mergedData.source_urls = allSourceUrls;

    mergePlan.push({
      keep: keeper.id,
      delete: toDelete.map(b => b.id),
      mergedData
    });
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`SUMMARY: ${mergePlan.length} groups, keeping ${mergePlan.length}, deleting ${mergePlan.reduce((sum, p) => sum + p.delete.length, 0)} duplicates`);
  console.log(`${'='.repeat(80)}\n`);

  console.log('🔄 Executing merges...\n');

  let updated = 0;
  let deleted = 0;
  let failed = 0;

  for (const plan of mergePlan) {
    // Update keeper with merged data
    const { error: updateError } = await supabase
      .from('booths')
      .update(plan.mergedData)
      .eq('id', plan.keep);

    if (updateError) {
      console.error(`❌ Failed to update ${plan.keep}:`, updateError.message);
      failed++;
      continue;
    }
    updated++;

    // Delete duplicates
    for (const deleteId of plan.delete) {
      const { error: deleteError } = await supabase
        .from('booths')
        .delete()
        .eq('id', deleteId);

      if (deleteError) {
        console.error(`❌ Failed to delete ${deleteId}:`, deleteError.message);
        failed++;
      } else {
        deleted++;
      }
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('DEDUPLICATION COMPLETE');
  console.log(`${'='.repeat(80)}`);
  console.log(`✅ Updated: ${updated} booths with merged data`);
  console.log(`✅ Deleted: ${deleted} duplicate booths`);
  console.log(`❌ Failed: ${failed} operations`);
  console.log(`${'='.repeat(80)}\n`);
}

deduplicateByProximity();
