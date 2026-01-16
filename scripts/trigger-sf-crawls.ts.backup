import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function triggerCrawl(sourceId: string, sourceName: string) {
  try {
    console.log(`🚀 Triggering crawl for: ${sourceName}`);

    const response = await fetch('https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/unified-crawler', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'trigger_async_crawl',
        source_id: sourceId
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    console.log(`   ✅ Success: ${data.message || 'Crawl triggered'}`);
    return true;
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
    return false;
  }
}

async function main() {
  const { data: sources, error } = await supabase
    .from('crawl_sources')
    .select('id, source_name, priority')
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

  console.log(`\n📊 Found ${sources.length} sources to crawl\n`);

  let succeeded = 0;
  let failed = 0;

  for (const source of sources) {
    const success = await triggerCrawl(source.id, source.source_name);
    if (success) succeeded++;
    else failed++;

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Successfully triggered: ${succeeded} crawls`);
  console.log(`❌ Failed: ${failed} crawls`);
  console.log(`${'='.repeat(60)}\n`);
}

main();
