import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get top 12 SF sources
  const { data: sources, error } = await supabase
    .from('crawl_sources')
    .select('id, source_name, source_url, priority')
    .in('source_name', [
      'Do The Bay Photo Booths',
      'Photomatica SF Crawl',
      'LocalWiki SF Photo Booths',
      'Bold Italic SF Photo Booths',
      'Photomatica Oakland',
      'Photo Booth Museum SF',
      'SF Chronicle Photo Booth',
      'Foursquare Mission SF',
      'Emporium Oakland',
      'Yelp Oakland Photo Booths',
      'TimeOut SF Photo Booth',
      'Tinybeans SF'
    ])
    .eq('enabled', true)
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching sources:', error);
    return;
  }

  console.log(`\n📊 Found ${sources.length} SF Bay Area sources\n`);

  // Simply call the edge function with a simple "crawl_source" action for each
  for (const source of sources) {
    console.log(`Queueing: ${source.source_name} (Priority ${source.priority})`);
    console.log(`  URL: ${source.source_url}`);
    console.log(`  ID: ${source.id}\n`);
  }

  console.log('\n🎯 To manually trigger these crawls, you can:');
  console.log('1. Go to Supabase Dashboard > Edge Functions');
  console.log('2. Open unified-crawler function');
  console.log('3. Click "Invoke" and use this payload for each source:\n');
  console.log('   {"action": "crawl_source", "source_id": "<SOURCE_ID>"}\n');

  console.log('Or use this curl command for each:\n');
  console.log('curl -X POST \\');
  console.log('  "https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/unified-crawler" \\');
  console.log('  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"action": "crawl_source", "source_id": "SOURCE_ID"}\'\n');
}

main();
