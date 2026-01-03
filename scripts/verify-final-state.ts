#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  FINAL DATABASE STATE VERIFICATION                   ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Total booth count
  const { count: totalBooths } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total Booths: ${totalBooths}\n`);

  // Booths added in last 2 hours
  const twoHoursAgo = new Date(Date.now() - 7200000).toISOString();
  const { data: recentBooths } = await supabase
    .from('booths')
    .select('id, name, city, country, created_at')
    .gte('created_at', twoHoursAgo)
    .order('created_at', { ascending: false });

  if (recentBooths && recentBooths.length > 0) {
    console.log(`✅ Booths added in last 2 hours: ${recentBooths.length}\n`);
    console.log('Recent additions:');
    recentBooths.forEach((booth, idx) => {
      const time = new Date(booth.created_at).toLocaleTimeString();
      console.log(`  ${idx + 1}. ${booth.name}`);
      console.log(`     Location: ${booth.city || 'Unknown'}, ${booth.country || 'Unknown'}`);
      console.log(`     Added: ${time}\n`);
    });
  } else {
    console.log('ℹ️  No booths added in last 2 hours (but updates may have occurred)\n');
  }

  // Check enabled sources
  const { data: enabledSources } = await supabase
    .from('crawl_sources')
    .select('source_name, priority')
    .eq('enabled', true)
    .order('priority', { ascending: false });

  console.log(`\n📋 Enabled Sources: ${enabledSources?.length}\n`);

  // Target sources status
  console.log('Target Sources Status:\n');
  const targetSources = ['photobooth.net', 'lomography.com', 'photomatica.com', 'autophoto.org', 'photoautomat.de'];

  for (const sourceName of targetSources) {
    const { data: source } = await supabase
      .from('crawl_sources')
      .select('source_name, enabled, priority, last_crawl_timestamp')
      .eq('source_name', sourceName)
      .single();

    if (source) {
      const status = source.enabled ? '✅' : '❌';
      const lastCrawl = source.last_crawl_timestamp
        ? new Date(source.last_crawl_timestamp).toLocaleString()
        : 'Never';
      console.log(`${status} ${source.source_name}`);
      console.log(`   Priority: ${source.priority}`);
      console.log(`   Last crawl: ${lastCrawl}\n`);
    }
  }

  console.log('\n✅ Verification complete!\n');
}

main();
