import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCrawlerStatus() {
  console.log('\n=== CRAWLER STATUS CHECK ===\n');

  // Check all crawler sources (enabled and disabled)
  const { data: allSources, error: allSourcesError } = await supabase
    .from('crawl_sources')
    .select('source_name, enabled, last_crawl_timestamp, status, total_booths_found')
    .order('priority');

  if (allSourcesError) {
    console.error('Error fetching crawler sources:', allSourcesError);
  } else {
    const enabled = allSources?.filter((s) => s.enabled) || [];
    const disabled = allSources?.filter((s) => !s.enabled) || [];

    console.log(`📡 Crawler Sources: ${allSources?.length || 0} total (${enabled.length} enabled, ${disabled.length} disabled)\n`);

    if (enabled.length > 0) {
      console.log('✅ ENABLED Sources:\n');
      enabled.forEach((source) => {
        const lastCrawl = source.last_crawl_timestamp
          ? new Date(source.last_crawl_timestamp).toLocaleString()
          : 'Never';
        console.log(`  - ${source.source_name}`);
        console.log(`    Last crawled: ${lastCrawl}`);
        console.log(`    Status: ${source.status || 'unknown'}`);
        console.log(`    Booths found: ${source.total_booths_found || 0}\n`);
      });
    }

    if (disabled.length > 0) {
      console.log(`❌ DISABLED Sources (${disabled.length}):\n`);
      disabled.slice(0, 5).forEach((source) => {
        console.log(`  - ${source.source_name} (${source.total_booths_found || 0} booths)`);
      });
      if (disabled.length > 5) {
        console.log(`  ... and ${disabled.length - 5} more\n`);
      }
    }
  }

  // Check recent crawler metrics (last 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { data: metrics, error: metricsError } = await supabase
    .from('crawler_metrics')
    .select('created_at, status, booths_extracted, duration_ms, source_id')
    .gte('created_at', oneDayAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  if (metricsError) {
    console.error('Error fetching crawler metrics:', metricsError);
  } else {
    console.log(`\n📈 Recent Crawler Runs (Last 24h): ${metrics?.length || 0}\n`);
    if (metrics && metrics.length > 0) {
      metrics.forEach((m) => {
        const date = new Date(m.created_at).toLocaleString();
        console.log(`  ${date}: ${m.status} - Extracted: ${m.booths_extracted || 0} booths`);
      });
    } else {
      console.log('  No crawler runs in the last 24 hours');
    }
  }

  // Check recent booth additions
  const { data: recentBooths, error: boothsError } = await supabase
    .from('booths')
    .select('created_at, name, city, country')
    .order('created_at', { ascending: false })
    .limit(5);

  if (boothsError) {
    console.error('Error fetching recent booths:', boothsError);
  } else {
    console.log('\n\n🆕 Most Recent Booth Additions:\n');
    recentBooths?.forEach((b) => {
      const date = new Date(b.created_at).toLocaleString();
      console.log(`  - ${b.name} (${b.city}, ${b.country}) - ${date}`);
    });
  }

  // Get total booth count
  const { count, error: countError } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error fetching booth count:', countError);
  } else {
    console.log(`\n\n📊 Total Booths in Database: ${count?.toLocaleString() || 0}\n`);
  }
}

checkCrawlerStatus();
