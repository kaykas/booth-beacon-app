#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('Checking recent booth additions...\n');

  // Get booths added in last 24 hours
  const yesterday = new Date(Date.now() - 86400000).toISOString();

  const { data: recentBooths, error: boothError } = await supabase
    .from('booths')
    .select('id, name, source, created_at')
    .gte('created_at', yesterday)
    .order('created_at', { ascending: false })
    .limit(50);

  if (boothError) {
    console.log('❌ Error fetching booths:', boothError.message);
  } else {
    console.log(`✅ Found ${recentBooths.length} booths added in last 24 hours\n`);

    // Group by source
    const bySource: Record<string, number> = {};
    recentBooths.forEach(booth => {
      bySource[booth.source] = (bySource[booth.source] || 0) + 1;
    });

    console.log('Booths by source:');
    Object.entries(bySource).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
      console.log(`  ${source}: ${count} booths`);
    });

    if (recentBooths.length > 0) {
      console.log('\nMost recent booths:');
      recentBooths.slice(0, 10).forEach(booth => {
        console.log(`  - ${booth.name} (${booth.source}) at ${new Date(booth.created_at).toLocaleString()}`);
      });
    }
  }

  console.log('\n\nChecking crawl_sources last_crawl_timestamp...\n');

  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('source_name, last_crawl_timestamp, enabled')
    .in('source_name', [
      'photobooth.net',
      'lomography.com',
      'photomatica.com',
      'autophoto.org',
      'photoautomat.de'
    ])
    .order('last_crawl_timestamp', { ascending: false });

  sources?.forEach(s => {
    const lastCrawl = s.last_crawl_timestamp
      ? new Date(s.last_crawl_timestamp).toLocaleString()
      : 'Never';
    console.log(`${s.source_name}:`);
    console.log(`  Last crawl: ${lastCrawl}`);
    console.log(`  Enabled: ${s.enabled}\n`);
  });

  console.log('\nTotal booths in database...\n');
  const { count } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  console.log(`Total booths: ${count}`);
}

main();
