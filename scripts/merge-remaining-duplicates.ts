#!/usr/bin/env npx tsx

/**
 * Merge the remaining obvious duplicates that the smart script is being too conservative about
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

// Define which duplicate to keep and which to delete for each group
const MERGE_PLAN = [
  {
    name: "Birdy's Brooklyn",
    keep: 'e13f8a1d-58ea-443b-97e7-78c153ec2d96', // Has coords
    delete: ['e1f287d3-84cd-4a25-adc4-a1a20edaa9ff'],
  },
  {
    name: "Marco's Brooklyn",
    keep: '7a4bb05d-06f5-44df-91d9-596891d6e8c3', // Has coords
    delete: ['4fa5cba6-2737-474d-9778-6ac659506aac'],
  },
  {
    name: "Booth By Bryant - San Diego",
    keep: '16f4355d-0539-4fbb-9d73-e4472d28e88d', // Has description
    delete: ['8c083d04-d385-44fa-8987-b4595c46c9e9'],
  },
  {
    name: "The Flamingo Bar - LA",
    keep: '770a3b46-e8e7-4dfe-86ba-20e8e0e66f78', // Has description, photo, cost
    delete: ['9ae53f0b-5b2a-49d6-8879-51e2b576bd00'],
  },
  {
    name: "LOVE HOUR - LA",
    keep: 'b4f7e493-ff79-4007-98ab-9cddfaa59734', // Has description, photo, cost
    delete: ['87c37ef7-9549-4609-a1ee-f5f222a11398'],
  },
  {
    name: "Harriet's Rooftop - West Hollywood",
    keep: '4a0751e7-bffc-4f25-8dac-526cb678bab5', // Has photo
    delete: ['547ae0e7-af36-4fb8-9a0e-a6f224deefd3'],
  },
  {
    name: "The Hawk - Long Beach",
    keep: '1d3fb33e-2b53-41d9-8198-5bad3e45b41e', // Has description and cost
    delete: ['7858a34d-435b-4c91-888c-48660d666210'],
  },
  {
    name: "Camp Out - Costa Mesa",
    keep: 'ed49bc5c-527d-460c-b788-f0e566a2d8e1', // Has description and cost
    delete: ['afcb65c6-b850-47c9-99b5-88059ebf1167'],
  },
  {
    name: "Bubby's - NYC",
    keep: '80e97291-e6f9-44e9-abd6-23cd83ce90b7', // Has description, photo, cost
    delete: ['4ac7de87-4ad0-4bbb-b7eb-6f3f1987359e'],
  },
  {
    name: "Apple Doll - Venice",
    keep: 'f8237a5f-6071-4ab5-bad9-03878bbfbe61', // Has photo
    delete: ['432046fa-c697-443a-9208-30ee45d9fab4'],
  },
];

// Skip the N/A entries and Berlin RAW (those might be legitimate multi-booth venues)

async function mergeDuplicates() {
  console.log('\n🔄 Merging remaining obvious duplicates\n');
  console.log('=' .repeat(80));

  let successCount = 0;
  let errorCount = 0;

  for (const plan of MERGE_PLAN) {
    try {
      console.log(`\n📌 ${plan.name}`);

      // Get all booths in this group
      const allIds = [plan.keep, ...plan.delete];
      const { data: booths, error: fetchError } = await supabase
        .from('booths')
        .select('*')
        .in('id', allIds);

      if (fetchError || !booths || booths.length === 0) {
        console.log(`   ❌ Error fetching booths: ${fetchError?.message || 'No booths found'}`);
        errorCount++;
        continue;
      }

      const keepBooth = booths.find(b => b.id === plan.keep);
      if (!keepBooth) {
        console.log('   ❌ Keep booth not found');
        errorCount++;
        continue;
      }

      // Merge data from all booths
      const allSourceNames = Array.from(
        new Set(booths.flatMap(b => b.source_names || []))
      );

      const allSourceUrls = Array.from(
        new Set(booths.flatMap(b => b.source_urls || []).filter(Boolean))
      );

      const allDescriptions = booths
        .map(b => b.description)
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i);

      const mergedDescription = allDescriptions.join('\n\n').trim() || keepBooth.description;

      // Get best data from all entries
      const bestPhoto = booths.find(b => b.photo_exterior_url)?.photo_exterior_url || keepBooth.photo_exterior_url;
      const bestHours = booths.find(b => b.hours)?.hours || keepBooth.hours;
      const bestCost = booths.find(b => b.cost)?.cost || keepBooth.cost;
      const bestType = booths.find(b => b.booth_type)?.booth_type || keepBooth.booth_type;

      // Update keeper with merged data
      const { error: updateError } = await supabase
        .from('booths')
        .update({
          description: mergedDescription,
          source_names: allSourceNames,
          source_urls: allSourceUrls,
          photo_exterior_url: bestPhoto,
          hours: bestHours,
          cost: bestCost,
          booth_type: bestType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', plan.keep);

      if (updateError) {
        console.log(`   ❌ Error updating: ${updateError.message}`);
        errorCount++;
        continue;
      }

      console.log(`   ✅ Updated keeper with merged data`);
      console.log(`      Sources: ${allSourceNames.length} | Descriptions: ${allDescriptions.length}`);

      // Delete duplicates
      const { error: deleteError } = await supabase
        .from('booths')
        .delete()
        .in('id', plan.delete);

      if (deleteError) {
        console.log(`   ❌ Error deleting: ${deleteError.message}`);
        errorCount++;
        continue;
      }

      console.log(`   🗑️  Deleted ${plan.delete.length} duplicate(s)`);
      successCount++;

    } catch (error: any) {
      console.log(`   ❌ Unexpected error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Deduplication complete!');
  console.log(`   ✅ Successfully merged: ${successCount} groups`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📉 Duplicates removed: ${successCount} booths`);
  console.log('=' .repeat(80));
  console.log('');
}

mergeDuplicates().catch(console.error);
