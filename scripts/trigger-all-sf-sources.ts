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
        force_crawl: true,  // Force re-crawl with new prompt
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
  // Get all SF Bay Area sources
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('source_name')
    .eq('enabled', true)
    .or('source_name.ilike.%SF%,source_name.ilike.%San Francisco%,source_name.ilike.%Oakland%,source_name.ilike.%Berkeley%,source_name.ilike.%Marin%,source_name.ilike.%Santa Rosa%,source_name.ilike.%Photomatica%,source_name.ilike.%Bay%')
    .order('source_name');

  if (!sources || sources.length === 0) {
    console.log('No SF Bay Area sources found');
    return;
  }

  console.log(`\n🌉 Triggering ${sources.length} SF Bay Area Sources with Fixed Prompt\n`);

  let succeeded = 0;
  let failed = 0;

  for (const source of sources) {
    const success = await triggerCrawl(source.source_name);
    if (success) succeeded++;
    else failed++;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Triggered: ${succeeded} | ❌ Failed: ${failed}`);
  console.log(`${'='.repeat(60)}`);
  console.log('\n⏳ Crawls will complete in 5-10 minutes...');
  console.log('\n💡 Check status with:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/check-sf-status.ts\n');
}

main();
