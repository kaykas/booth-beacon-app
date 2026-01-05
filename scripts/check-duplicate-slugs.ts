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
  console.log('🔍 Checking for duplicate slugs...\n');

  // Check for photomatica-san-francisco duplicates
  const { data: photomatica } = await supabase
    .from('booths')
    .select('id, name, slug, city, address, created_at')
    .eq('slug', 'photomatica-san-francisco')
    .order('created_at', { ascending: true });

  if (photomatica && photomatica.length > 0) {
    console.log(`Found ${photomatica.length} booth(s) with slug 'photomatica-san-francisco':\n`);
    photomatica.forEach((b, i) => {
      console.log(`  [${i + 1}] ID: ${b.id}`);
      console.log(`      Name: ${b.name}`);
      console.log(`      Address: ${b.address}`);
      console.log(`      Created: ${b.created_at}\n`);
    });
  }

  // Check for all duplicate slugs in database
  const { data: allBooths } = await supabase
    .from('booths')
    .select('slug');

  const slugCounts: Record<string, number> = {};
  allBooths?.forEach(b => {
    slugCounts[b.slug] = (slugCounts[b.slug] || 0) + 1;
  });

  const duplicates = Object.entries(slugCounts).filter(([_, count]) => count > 1);

  console.log(`\n📊 Total duplicate slugs in database: ${duplicates.length}\n`);

  if (duplicates.length > 0) {
    console.log('Top 10 duplicate slugs:');
    duplicates
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([slug, count]) => {
        console.log(`  - ${slug}: ${count} occurrences`);
      });
  }
}

main().catch(console.error);
