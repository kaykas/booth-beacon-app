#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkStatus() {
  console.log('\n=== DATABASE STATUS CHECK ===\n');

  // Get total booth count
  const { count: totalBooths } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  console.log('Total booths in database:', totalBooths);

  // Get enabled sources
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('enabled', true)
    .order('priority');

  console.log('Enabled sources:', sources?.length || 0);

  // Check Phase 1 sources
  const phase1Sources = [
    'https://classicphotobooth.net/locations-2/',
    'https://photomatica.com/locations',
    'https://louiedespres.com/photobooth-project',
    'https://www.autofoto.org/locations',
    'https://www.fotoautomatica.com/',
    'https://automatfoto.se/'
  ];

  const { data: phase1 } = await supabase
    .from('crawl_sources')
    .select('source_name, source_url, enabled, priority, last_crawled_at')
    .in('source_url', phase1Sources);

  console.log('\n=== PHASE 1 CRITICAL SOURCES (Should be 6) ===');
  console.log('Found:', phase1?.length || 0, '/ 6 sources in database');

  if (phase1 && phase1.length > 0) {
    phase1.forEach(s => {
      console.log('  ✓', s.source_name);
      console.log('    URL:', s.source_url);
      console.log('    Enabled:', s.enabled);
      console.log('    Last crawled:', s.last_crawled_at || 'Never');
    });
  } else {
    console.log('  ❌ PROBLEM: Phase 1 sources NOT in database!');
    console.log('  The SQL script may not have been executed.');
  }

  // Get recent booth additions
  const { data: recentBooths } = await supabase
    .from('booths')
    .select('name, created_at, source_id')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('\n=== RECENT BOOTH ADDITIONS (Last 10) ===');
  if (recentBooths && recentBooths.length > 0) {
    recentBooths.forEach(b => {
      const date = new Date(b.created_at);
      console.log('  -', b.name, '(' + date.toLocaleString() + ')');
    });
  } else {
    console.log('  No recent booths found');
  }

  // Show first 10 enabled sources
  console.log('\n=== FIRST 10 ENABLED SOURCES ===');
  if (sources && sources.length > 0) {
    sources.slice(0, 10).forEach((s, i) => {
      const lastCrawled = s.last_crawled_at ? new Date(s.last_crawled_at).toLocaleString() : 'Never';
      console.log(`${i+1}. ${s.source_name} (Priority: ${s.priority})`);
      console.log(`   Last crawled: ${lastCrawled}`);
    });
  }

  console.log('\n=== DIAGNOSIS ===');
  if (!phase1 || phase1.length === 0) {
    console.log('❌ CRITICAL: Phase 1 sources are MISSING from database');
    console.log('   Action: Run scripts/phase1-add-critical-sources.sql');
  } else if (phase1.length < 6) {
    console.log('⚠️  WARNING: Only', phase1.length, '/ 6 Phase 1 sources found');
    console.log('   Action: Check which sources are missing');
  } else {
    const disabledPhase1 = phase1.filter(s => !s.enabled);
    if (disabledPhase1.length > 0) {
      console.log('⚠️  WARNING:', disabledPhase1.length, 'Phase 1 sources are DISABLED');
      disabledPhase1.forEach(s => console.log('   -', s.source_name));
    } else {
      console.log('✓ All 6 Phase 1 sources are in database and enabled');
    }
  }

  if (totalBooths && totalBooths < 1000) {
    console.log('⚠️  WARNING: Low booth count (', totalBooths, ')');
    console.log('   Expected: 1,000+ booths after Phase 1');
  }
}

checkStatus().catch(console.error);
