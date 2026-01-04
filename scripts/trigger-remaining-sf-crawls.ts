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
        async_mode: true,
        force_crawl: false
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
  const sources = [
    'SF Chronicle Photo Booth',
    'Foursquare Mission SF',
    'Emporium Oakland',
    'Yelp Oakland Photo Booths',
    'TimeOut SF Photo Booth',
    'Tinybeans SF',
    'SF Standard Photo Booths',
    'SF Standard Club Photomatica',
    'Hoodline Castro',
    'Hoodline Santa Rosa',
    'TimeOut SF Museums',
    'Wonderful Museums SF',
    'Lucky Strike SF',
    'Dave & Busters Santa Rosa',
    'Temple SF',
    'Hotel Kabuki SF',
    'Hotel Zetta SF',
    'SF Gate Coffee Shops',
    'SF Gate Dive Bars',
    'Analog Forever Photoworks',
    'Harvey Milk Photo Center',
    'EBPCO Oakland',
    'Infatuation SF LGBTQ',
    'QLIST SF',
    'SF Travel Dive Bars',
    'SF Travel LGBTQ',
    'Secret SF Cafes',
    'Oldham Group Hidden Gems',
    'FunCheap SF',
    'Retro Roadmap SF'
  ];

  console.log(`\n📊 Triggering ${sources.length} remaining SF Bay Area crawls\n`);

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
  console.log(`${'='.repeat(60)}\n`);
}

main();
