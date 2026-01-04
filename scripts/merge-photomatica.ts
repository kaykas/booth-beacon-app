#!/usr/bin/env npx tsx

/**
 * Manually merge the 5 Photomatica entries at 2275 Market Street
 * These are all the same photo booth museum, despite having different names
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// The 5 Photomatica booth IDs (from check-duplicate-addresses output)
const PHOTOMATICA_IDS = [
  'fc206ba9-d032-47be-aef2-fa21dfb2769b', // Photoworks
  '9104f3c4-0490-4200-82c9-2e509c9512ad', // Club Photomatica
  '2846a0c0-0e4b-426d-88f6-c7d12cdb60e4', // Photo Booth Museum by Photomatica
  '342d2324-7e30-4893-9e00-6175ecf3e13d', // Photo Booth Museum (Photomatica)
  '9d633a34-b483-403b-9213-fb819aeb11ac', // Photomatica
];

// We'll keep the "Photo Booth Museum by Photomatica" entry as it has the most complete data
const KEEP_ID = '2846a0c0-0e4b-426d-88f6-c7d12cdb60e4';

async function run() {
  console.log('\n🔄 Merging 5 Photomatica entries at 2275 Market Street, San Francisco\n');

  // Fetch all 5 entries
  const { data: booths, error: fetchError } = await supabase
    .from('booths')
    .select('*')
    .in('id', PHOTOMATICA_IDS);

  if (fetchError || !booths) {
    console.error('❌ Error fetching booths:', fetchError);
    process.exit(1);
  }

  console.log(`✅ Found ${booths.length} Photomatica entries\n`);

  // Find the one we're keeping
  const keepBooth = booths.find(b => b.id === KEEP_ID);
  if (!keepBooth) {
    console.error('❌ Could not find the booth to keep');
    process.exit(1);
  }

  console.log(`📌 Keeping: "${keepBooth.name}" (${keepBooth.slug})`);
  console.log(`   ID: ${keepBooth.id}\n`);

  // Collect all unique data from duplicates
  const allDescriptions = booths
    .map(b => b.description)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  const allSourceNames = Array.from(
    new Set(booths.flatMap(b => b.source_names || []))
  );

  const allSourceUrls = Array.from(
    new Set(booths.flatMap(b => b.source_urls || []).filter(Boolean))
  );

  // Get best data from all entries
  const bestPhoto = booths.find(b => b.photo_exterior_url)?.photo_exterior_url;
  const bestAiImage = booths.find(b => b.ai_generated_image_url)?.ai_generated_image_url;
  const bestHours = booths.find(b => b.hours)?.hours || keepBooth.hours;
  const bestCost = booths.find(b => b.cost)?.cost || keepBooth.cost;

  // Merge descriptions
  const mergedDescription = allDescriptions.join('\n\n').trim();

  console.log('📝 Merged data:');
  console.log(`   Source names: ${allSourceNames.join(', ')}`);
  console.log(`   Source URLs: ${allSourceUrls.length} unique`);
  console.log(`   Descriptions merged: ${allDescriptions.length}`);
  console.log(`   Has photo: ${!!bestPhoto}`);
  console.log(`   Hours: ${bestHours || 'N/A'}`);
  console.log(`   Cost: ${bestCost || 'N/A'}\n`);

  // Update the keeper with merged data
  const { error: updateError } = await supabase
    .from('booths')
    .update({
      name: 'Photo Booth Museum (Photomatica)',
      description: mergedDescription,
      source_names: allSourceNames,
      source_urls: allSourceUrls,
      photo_exterior_url: bestPhoto,
      ai_generated_image_url: bestAiImage,
      hours: bestHours,
      cost: bestCost,
      updated_at: new Date().toISOString(),
    })
    .eq('id', KEEP_ID);

  if (updateError) {
    console.error('❌ Error updating keeper booth:', updateError);
    process.exit(1);
  }

  console.log('✅ Updated keeper booth with merged data\n');

  // Delete the other 4 entries
  const deleteIds = PHOTOMATICA_IDS.filter(id => id !== KEEP_ID);

  console.log(`🗑️  Deleting ${deleteIds.length} duplicate entries:`);
  for (const id of deleteIds) {
    const booth = booths.find(b => b.id === id);
    console.log(`   - ${booth?.name} (${booth?.slug})`);
  }
  console.log('');

  const { error: deleteError } = await supabase
    .from('booths')
    .delete()
    .in('id', deleteIds);

  if (deleteError) {
    console.error('❌ Error deleting duplicates:', deleteError);
    process.exit(1);
  }

  console.log('✅ Successfully deleted 4 duplicate Photomatica entries\n');
  console.log('=' .repeat(80));
  console.log('🎉 Photomatica merge complete!');
  console.log('   Kept 1 booth with merged data from all 5 entries');
  console.log('   Deleted 4 duplicate entries');
  console.log('=' .repeat(80));
  console.log('');
}

run().catch(console.error);
