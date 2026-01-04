import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function triggerCrawl(sourceName: string) {
  try {
    console.log(`🚀 ${sourceName}`);

    const response = await fetch('https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/unified-crawler', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_name: sourceName,
        force_crawl: true,  // Force crawl to bypass caching
        async_mode: true
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      console.log(`   ❌ Failed: ${response.status}`);
      return false;
    }

    console.log(`   ✅ Queued`);
    return true;
  } catch (error: any) {
    console.log(`   ⚠️  ${error.message}`);
    return false;
  }
}

async function main() {
  // Test the 6 highest-priority SF sources
  const sources = [
    'Photomatica SF Crawl',
    'LocalWiki SF Photo Booths',
    'Do The Bay Photo Booths',
    'Photo Booth Network SF',
    'Lomography SF',
    'SFGate Photo Booth Directory'
  ];

  console.log(`\n🧪 Testing Prompt Fix on ${sources.length} High-Priority SF Sources\n`);
  console.log('⏱️  This will take 2-5 minutes for crawls to complete...\n');

  let succeeded = 0;
  let failed = 0;

  for (const sourceName of sources) {
    const success = await triggerCrawl(sourceName);
    if (success) succeeded++;
    else failed++;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Triggered: ${succeeded} | ❌ Failed: ${failed}`);
  console.log(`${'='.repeat(60)}`);
  console.log('\n⏳ Waiting 30 seconds for crawls to start...\n');

  // Wait for crawls to start
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Check initial status
  console.log('📊 Checking Initial Status:\n');

  for (const sourceName of sources) {
    const { data } = await supabase
      .from('crawl_sources')
      .select('source_name, status, total_booths_found, total_booths_added')
      .eq('source_name', sourceName)
      .single();

    if (data) {
      console.log(`  ${data.source_name}`);
      console.log(`    Status: ${data.status || 'idle'} | Found: ${data.total_booths_found || 0} | Added: ${data.total_booths_added || 0}`);
    }
  }

  console.log('\n💡 Run this script again in 2-3 minutes to see final results:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/test-sf-prompt-fix.ts\n');
}

main();
