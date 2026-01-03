import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCrawlDataStorage() {
  console.log('\n=== CRAWL DATA STORAGE CHECK ===\n');

  // Check crawler_metrics schema and recent entries
  const { data: metrics } = await supabase
    .from('crawler_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (metrics && metrics.length > 0) {
    console.log('📋 crawler_metrics schema:');
    console.log('Columns:', Object.keys(metrics[0]).join(', '));
    console.log('\nSample entry:');
    console.log(JSON.stringify(metrics[0], null, 2));
  } else {
    console.log('⚠️ No crawler_metrics entries found');
  }

  // Check if there's a table for raw crawl data
  const tables = ['crawl_results', 'crawl_data', 'raw_crawl_data', 'crawl_cache'];

  console.log('\n\n🔍 Checking for raw crawl data tables...\n');

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (!error) {
      console.log(`✅ Found table: ${table}`);
      if (data && data.length > 0) {
        console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
      }
    }
  }

  // Check recent successful crawls
  const { data: successfulCrawls } = await supabase
    .from('crawler_metrics')
    .select('source_id, created_at, booths_extracted, status')
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('\n\n✅ Recent Successful Crawls:\n');
  if (successfulCrawls && successfulCrawls.length > 0) {
    successfulCrawls.forEach((c) => {
      const date = new Date(c.created_at).toLocaleString();
      console.log(`  ${date}: source_id ${c.source_id}, extracted ${c.booths_extracted} booths`);
    });
  } else {
    console.log('  No successful crawls in crawler_metrics');
  }

  // Get enabled sources with their configuration
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('id, source_name, source_url, extractor_type, enabled, total_booths_found')
    .eq('enabled', true)
    .order('priority');

  console.log('\n\n📡 ENABLED SOURCES CONFIGURATION:\n');
  console.log(`Total: ${sources?.length || 0}\n`);

  sources?.forEach((source, index) => {
    console.log(`${index + 1}. ${source.source_name || '(unnamed)'}`);
    console.log(`   ID: ${source.id}`);
    console.log(`   URL: ${source.source_url}`);
    console.log(`   Extractor: ${source.extractor_type || 'default'}`);
    console.log(`   Booths found: ${source.total_booths_found || 0}`);
    console.log('');
  });
}

checkCrawlDataStorage();
