import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkEnabledSources() {
  const { data: enabled } = await supabase
    .from('crawl_sources')
    .select('source_name, source_url, extractor_type, total_booths_found, status, last_crawled_at')
    .eq('enabled', true)
    .order('total_booths_found', { ascending: false, nullsFirst: false });

  console.log('\n=== REMAINING ENABLED SOURCES ===\n');
  enabled?.forEach((s, i) => {
    const booths = s.total_booths_found || 0;
    const lastCrawl = s.last_crawled_at ? new Date(s.last_crawled_at).toLocaleDateString() : 'Never';
    console.log(`${i + 1}. ${s.source_name}`);
    console.log(`   URL: ${s.source_url}`);
    console.log(`   Extractor: ${s.extractor_type || 'NULL'}`);
    console.log(`   Booths: ${booths}`);
    console.log(`   Status: ${s.status}`);
    console.log(`   Last Crawled: ${lastCrawl}`);
    console.log('');
  });

  const working = enabled?.filter(s => (s.total_booths_found || 0) > 0).length || 0;
  const needTesting = enabled?.filter(s => (s.total_booths_found || 0) === 0).length || 0;

  console.log(`📊 Summary:`);
  console.log(`   Total enabled: ${enabled?.length || 0}`);
  console.log(`   Working (extracting booths): ${working}`);
  console.log(`   Need testing (0 booths): ${needTesting}`);
}

checkEnabledSources().catch(console.error);
