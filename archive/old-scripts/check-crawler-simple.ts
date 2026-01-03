import { createClient } from '@supabase/supabase-js';

async function checkCrawlerStatus() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('\n=== CRAWLER STATUS CHECK ===\n');

  // Get total booth count
  const { count: totalBooths } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  console.log('📊 Total Booths:', totalBooths || 0);

  // Get booths added in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: recentBooths } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString());

  console.log('🆕 Booths Added (Last 7 Days):', recentBooths || 0);

  // Check crawler_metrics table
  const { data: metrics } = await supabase
    .from('crawler_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n📈 Recent Crawler Runs:');
  if (metrics && metrics.length > 0) {
    metrics.forEach((m: any) => {
      const date = new Date(m.created_at).toLocaleString();
      console.log('  -', date, ':', m.status, '- Extracted:', m.booths_extracted || 0, 'booths');
    });
  } else {
    console.log('  No recent crawler metrics found');
  }

  // Check crawl_sources status
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('source_name, enabled, status, last_crawled_at')
    .order('priority');

  console.log('\n📡 Crawler Sources:');
  if (sources && sources.length > 0) {
    const enabled = sources.filter((s: any) => s.enabled);
    const disabled = sources.filter((s: any) => !s.enabled);

    console.log('  Total sources:', sources.length);
    console.log('  Enabled:', enabled.length);
    console.log('  Disabled:', disabled.length);

    console.log('\n  Active Sources:');
    enabled.slice(0, 10).forEach((s: any) => {
      const lastCrawl = s.last_crawled_at ? new Date(s.last_crawled_at).toLocaleDateString() : 'Never';
      console.log('    -', s.source_name, '(Last:', lastCrawl + ')');
    });
  }
}

checkCrawlerStatus();
