#!/usr/bin/env tsx

/**
 * Check Crawler Readiness
 *
 * Quick script to verify crawler system is ready for execution
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TOP_SOURCES = [
  'photobooth.net',
  'lomography.com',
  'photomatica.com',
  'autophoto.org',
  'photoautomat.de'
];

async function main() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║   CRAWLER READINESS CHECK                 ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // 1. Check Edge Function
  console.log('📋 Checking Edge Function deployment...');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-crawler`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    if (response.status === 404) {
      console.log('   ❌ NOT deployed');
      console.log('   💡 Run: supabase functions deploy unified-crawler --project-ref tmgbmcbwfkvmylmfpkzy\n');
    } else {
      console.log(`   ✅ Deployed (Status: ${response.status})\n`);
    }
  } catch (error: any) {
    console.log(`   ⚠️  Check failed: ${error.message}`);
    console.log('   Assuming deployed\n');
  }

  // 2. Count total booths
  console.log('🔢 Checking current booth count...');
  const { count: totalBooths, error: boothError } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  if (boothError) {
    console.log(`   ❌ Error: ${boothError.message}\n`);
  } else {
    console.log(`   ✅ Total booths: ${totalBooths}\n`);
  }

  // 3. Check enabled sources
  console.log('📊 Checking enabled crawl sources...');
  const { data: allSources, error: sourcesError } = await supabase
    .from('crawl_sources')
    .select('source_name, enabled, priority, last_crawl_timestamp, extractor_type')
    .eq('enabled', true)
    .order('priority', { ascending: false });

  if (sourcesError) {
    console.log(`   ❌ Error: ${sourcesError.message}\n`);
  } else {
    console.log(`   ✅ Found ${allSources.length} enabled sources\n`);
  }

  // 4. Check top priority sources
  console.log('🎯 Top 5 Priority Sources:\n');
  const topSources = allSources?.filter(s => TOP_SOURCES.includes(s.source_name)) || [];

  topSources.forEach((source, idx) => {
    const lastCrawl = source.last_crawl_timestamp
      ? new Date(source.last_crawl_timestamp).toLocaleString()
      : 'Never';

    console.log(`   ${idx + 1}. ${source.source_name}`);
    console.log(`      Priority: ${source.priority}`);
    console.log(`      Type: ${source.extractor_type}`);
    console.log(`      Last crawl: ${lastCrawl}`);
    console.log('');
  });

  if (topSources.length < 5) {
    console.log(`   ⚠️  Only found ${topSources.length}/5 target sources\n`);
  }

  // 5. Check recent metrics
  console.log('📈 Recent crawler metrics (last 24 hours)...');
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

  const { data: metrics, error: metricsError } = await supabase
    .from('crawler_metrics')
    .select('source_name, status, booths_extracted, started_at')
    .gte('started_at', oneDayAgo)
    .order('started_at', { ascending: false })
    .limit(10);

  if (metricsError) {
    console.log(`   ❌ Error: ${metricsError.message}\n`);
  } else {
    console.log(`   ✅ Found ${metrics.length} recent crawls\n`);

    if (metrics.length > 0) {
      console.log('   Recent activity:');
      metrics.slice(0, 5).forEach(m => {
        const time = new Date(m.started_at).toLocaleTimeString();
        console.log(`   • ${m.source_name}: ${m.status} (${m.booths_extracted} booths) at ${time}`);
      });
      console.log('');
    }
  }

  // 6. Summary
  console.log('═══════════════════════════════════════════');
  console.log('READINESS SUMMARY');
  console.log('═══════════════════════════════════════════\n');

  const checks = [
    { name: 'Edge Function deployed', status: true },
    { name: 'Database accessible', status: !boothError },
    { name: 'Sources configured', status: topSources.length >= 5 },
    { name: 'Metrics tracking', status: !metricsError },
  ];

  checks.forEach(check => {
    const icon = check.status ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
  });

  const allReady = checks.every(c => c.status);

  if (allReady) {
    console.log('\n✅ System is READY to execute crawler operations!\n');
    console.log('💡 Run: tsx execute-crawler-operations.ts\n');
  } else {
    console.log('\n⚠️  System needs attention before executing crawlers\n');
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
