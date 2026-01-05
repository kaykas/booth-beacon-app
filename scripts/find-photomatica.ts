#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('🔍 Searching for Photomatica booth...\n');

  // Search by name
  const { data: byName } = await supabase
    .from('booths')
    .select('id, name, slug, city, country, address')
    .ilike('name', '%photomatica%');

  console.log('Booths with "photomatica" in name:');
  if (byName && byName.length > 0) {
    byName.forEach(b => {
      console.log(`  - ${b.name}`);
      console.log(`    Slug: ${b.slug}`);
      console.log(`    Location: ${b.city}, ${b.country}`);
      console.log(`    Address: ${b.address}\n`);
    });
  } else {
    console.log('  (none found)\n');
  }

  // Search San Francisco booths
  const { data: sfBooths } = await supabase
    .from('booths')
    .select('name, slug')
    .eq('city', 'San Francisco')
    .order('name', { ascending: true });

  console.log(`\nAll San Francisco booths (${sfBooths?.length || 0}):`);
  sfBooths?.forEach(b => {
    console.log(`  - ${b.name} (${b.slug})`);
  });
}

main().catch(console.error);
