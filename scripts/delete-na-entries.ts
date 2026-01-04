#!/usr/bin/env npx tsx

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

async function deleteNAEntries() {
  console.log('\n🗑️  Deleting invalid N/A entries...\n');

  // The two N/A booth IDs
  const naIds = [
    'cfcf12b4-85c3-4a56-95e6-0423bc825672', // N/A (n-a-n-a)
    '5bfca024-32cf-441b-95ef-75c6836fc1fb', // N/A (n-a-surat)
  ];

  // Get the booths first to show what we're deleting
  const { data: booths, error: fetchError } = await supabase
    .from('booths')
    .select('id, name, slug, address, city')
    .in('id', naIds);

  if (fetchError) {
    console.error('❌ Error fetching booths:', fetchError);
    process.exit(1);
  }

  console.log('📋 Found invalid entries to delete:');
  booths?.forEach(b => {
    console.log(`   • ${b.name} (${b.slug})`);
    console.log(`     Address: ${b.address}, ${b.city}`);
  });

  console.log('');

  // Delete them
  const { error: deleteError } = await supabase
    .from('booths')
    .delete()
    .in('id', naIds);

  if (deleteError) {
    console.error('❌ Error deleting:', deleteError);
    process.exit(1);
  }

  console.log('✅ Successfully deleted 2 invalid N/A entries\n');
  console.log('=' + '='.repeat(79));
  console.log('🎉 Database cleanup complete!');
  console.log('   Total invalid entries removed: 2');
  console.log('=' + '='.repeat(79));
  console.log('');
}

deleteNAEntries().catch(console.error);
