#!/usr/bin/env node
/**
 * Check which sources are enabled and their status
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkSources() {
  console.log('🔍 Checking enabled crawl sources...\n');

  // Get enabled sources
  const { data: sources, error } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!sources || sources.length === 0) {
    console.log('⚠️  No enabled sources found');
    return;
  }

  console.log(`✅ Found ${sources.length} enabled sources:\n`);
  console.log('='.repeat(100));

  // Group by tier
  const phaseOneSources = sources.filter(s => s.source_name && (
                                              s.source_name.includes('Time Out') ||
                                              s.source_name.includes('Locale') ||
                                              s.source_name.includes('Block Club') ||
                                              s.source_name.includes('DesignMyNight') ||
                                              s.source_name.includes('Roxy') ||
                                              s.source_name.includes('Airial')));

  console.log('\n📍 PHASE 1 SOURCES (New City Guides):');
  phaseOneSources.forEach(s => {
    console.log(`   • ${s.source_name} (${s.extractor_type})`);
    console.log(`     URL: ${s.source_url}`);
    console.log(`     Priority: ${s.priority}, Batch size: ${s.pages_per_batch || 3}`);
    if (s.last_crawl_timestamp) {
      const lastCrawl = new Date(s.last_crawl_timestamp);
      console.log(`     Last crawl: ${lastCrawl.toLocaleString()}`);
    }
    console.log('');
  });

  console.log('\n📚 OTHER SOURCES:');
  const otherSources = sources.filter(s => !phaseOneSources.includes(s));
  otherSources.forEach(s => {
    console.log(`   • ${s.source_name} (${s.extractor_type})`);
    console.log(`     Priority: ${s.priority}`);
  });

  console.log('\n='.repeat(100));

  // Get recent booth counts
  const { data: booths, error: boothsError } = await supabase
    .from('booths')
    .select('id, created_at, name, city, country, source_names')
    .order('created_at', { ascending: false })
    .limit(20);

  if (boothsError) {
    console.error('Error fetching booths:', boothsError);
  } else if (booths) {
    console.log(`\n📊 Recent booth additions (last 20):\n`);
    booths.forEach(booth => {
      const sources = Array.isArray(booth.source_names) ? booth.source_names.join(', ') : booth.source_names;
      console.log(`   ${new Date(booth.created_at).toLocaleString()}: ${booth.name} (${booth.city}, ${booth.country})`);
      console.log(`      Sources: ${sources}`);
    });
  }

  // Count booths by source
  const { data: allBooths } = await supabase
    .from('booths')
    .select('source_names');

  if (allBooths) {
    const sourceCounts = new Map<string, number>();
    allBooths.forEach(booth => {
      if (Array.isArray(booth.source_names)) {
        booth.source_names.forEach(sourceName => {
          sourceCounts.set(sourceName, (sourceCounts.get(sourceName) || 0) + 1);
        });
      }
    });

    console.log(`\n📈 Booth counts by source:\n`);
    const sorted = Array.from(sourceCounts.entries()).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([source, count]) => {
      console.log(`   ${source}: ${count} booths`);
    });
  }
}

checkSources().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
