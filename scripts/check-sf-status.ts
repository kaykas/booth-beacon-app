import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('crawl_sources')
    .select('source_name, status, last_crawl_timestamp, total_booths_found, total_booths_added, consecutive_failures')
    .or('source_name.ilike.%SF%,source_name.ilike.%Oakland%,source_name.ilike.%Photomatica%,source_name.ilike.%Bay%')
    .order('updated_at', { ascending: false })
    .limit(40);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📊 SF Bay Area Crawl Status:\n');

  if (!data) {
    console.log('No sources found');
    return;
  }

  const active = data.filter(d => d.status === 'active' || d.status === 'running');
  const idle = data.filter(d => d.status === 'idle' || !d.status);
  const errorStatus = data.filter(d => d.status === 'error');

  console.log('📈 Status Summary:');
  console.log(`  🔄 Active/Running: ${active.length}`);
  console.log(`  ⏸️  Idle: ${idle.length}`);
  console.log(`  ❌ Error: ${errorStatus.length}\n`);

  const crawled = data.filter(d => d.last_crawl_timestamp);
  console.log(`✅ Crawled: ${crawled.length}/${data.length} sources\n`);

  if (crawled.length > 0) {
    console.log('📦 Recent Crawl Results:');
    crawled.slice(0, 10).forEach(d => {
      const found = d.total_booths_found || 0;
      const added = d.total_booths_added || 0;
      console.log(`  ${found > 0 ? '✓' : '•'} ${d.source_name}: ${found} found, ${added} added`);
    });
  } else {
    console.log('⏳ Crawls are being processed in the background.');
    console.log('   Edge functions can take 2-5 minutes to start...');
  }

  // Check total SF booths
  const { count } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .or('city.ilike.%San Francisco%,city.ilike.%Oakland%,city.ilike.%Berkeley%,city.ilike.%Santa Rosa%');

  if (count !== null) {
    console.log(`\n🌉 Total SF Bay Area Booths: ${count}`);
  }
}

main();
