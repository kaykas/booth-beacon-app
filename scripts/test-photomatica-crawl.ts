import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('🚀 Testing Photomatica SF Crawl...\n');

  const response = await fetch('https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/unified-crawler', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_name: 'Photomatica SF Crawl',
      force_crawl: true
    }),
    signal: AbortSignal.timeout(120000) // 2 minute timeout
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  // Check if booths were added
  const { data: source } = await supabase
    .from('crawl_sources')
    .select('source_name, total_booths_found, total_booths_added, pattern_learning_status, last_error_message')
    .eq('source_name', 'Photomatica SF Crawl')
    .single();

  console.log('\n📊 Post-Crawl Status:');
  console.log(`  Booths Found: ${source?.total_booths_found || 0}`);
  console.log(`  Booths Added: ${source?.total_booths_added || 0}`);
  console.log(`  Pattern Learning: ${source?.pattern_learning_status || 'unknown'}`);
  if (source?.last_error_message) {
    console.log(`  Error: ${source.last_error_message}`);
  }
}

main().catch(console.error);
