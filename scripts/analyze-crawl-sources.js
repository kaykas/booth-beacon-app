const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

(async () => {
  const { data: allSources, error } = await supabase
    .from('crawl_sources')
    .select('source_name, enabled, status, extractor_type, last_crawl_timestamp, total_booths_found')
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching sources:', error);
    process.exit(1);
  }

  console.log('=== CRAWL SOURCES ANALYSIS ===\n');

  const enabled = allSources.filter(s => s.enabled);
  const active = allSources.filter(s => s.status === 'active');
  const hasExtractor = allSources.filter(s => s.extractor_type);

  console.log('Total sources:', allSources.length);
  console.log('Enabled sources:', enabled.length);
  console.log('Active status:', active.length);
  console.log('Has extractor_type:', hasExtractor.length);
  console.log();

  const readyToCrawl = allSources.filter(s => s.enabled && s.status === 'active');
  console.log('Ready to crawl (enabled + active):', readyToCrawl.length);
  console.log();

  console.log('=== READY TO CRAWL SOURCES ===');
  readyToCrawl.forEach(s => {
    const lastCrawl = s.last_crawl_timestamp ? new Date(s.last_crawl_timestamp).toISOString().split('T')[0] : 'never';
    console.log(`- ${s.source_name} (${s.extractor_type}) - Last: ${lastCrawl}, Found: ${s.total_booths_found || 0}`);
  });

  console.log('\n=== DISABLED/INACTIVE SOURCES ===');
  const disabled = allSources.filter(s => !s.enabled || s.status !== 'active');
  disabled.slice(0, 15).forEach(s => {
    console.log(`- ${s.source_name} (enabled: ${s.enabled}, status: ${s.status})`);
  });
  if (disabled.length > 15) {
    console.log(`... and ${disabled.length - 15} more disabled sources`);
  }
})();
