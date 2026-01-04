import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function triggerCrawl(sourceName: string) {
  try {
    console.log(`🚀 Triggering: ${sourceName}`);

    const response = await fetch('https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/unified-crawler', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_name: sourceName,
        async_mode: true,
        force_crawl: false
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const text = await response.text();
      console.log(`   ❌ Failed: ${response.status} - ${text}`);
      return false;
    }

    const data = await response.json();
    console.log(`   ✅ Success!`);
    return true;
  } catch (error: any) {
    console.log(`   ⚠️  Error: ${error.message}`);
    return false;
  }
}

async function main() {
  const sources = [
    'Do The Bay Photo Booths',
    'Photomatica SF Crawl',
    'LocalWiki SF Photo Booths',
    'Bold Italic SF Photo Booths',
    'Photomatica Oakland',
    'Photo Booth Museum SF'
  ];

  console.log(`\n📊 Triggering ${sources.length} high-priority SF crawls\n`);

  let succeeded = 0;
  let failed = 0;

  for (const sourceName of sources) {
    const success = await triggerCrawl(sourceName);
    if (success) succeeded++;
    else failed++;

    // Wait 3 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Successfully triggered: ${succeeded} crawls`);
  console.log(`❌ Failed: ${failed} crawls`);
  console.log(`${'='.repeat(60)}\n`);
}

main();
