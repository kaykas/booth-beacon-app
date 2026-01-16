import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('\n🚀 Triggering Priority 90+ Source Crawls\n');
  console.log('='.repeat(60));

  // Get all priority 90+ enabled sources
  const { data: sources, error } = await supabase
    .from('crawl_sources')
    .select('id, source_name, priority, source_type, extraction_mode')
    .gte('priority', 90)
    .eq('enabled', true)
    .order('priority', { ascending: false });

  if (error) {
    console.error('❌ Error fetching sources:', error);
    return;
  }

  if (!sources || sources.length === 0) {
    console.log('No priority 90+ sources found');
    return;
  }

  console.log(`\n📊 Found ${sources.length} high-priority sources to crawl\n`);

  let triggered = 0;
  let failed = 0;

  for (const source of sources) {
    try {
      console.log(`🔄 Triggering: ${source.source_name} (Priority ${source.priority})`);

      // Call the unified-crawler edge function
      const response = await fetch(
        'https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/unified-crawler',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            source_id: source.id,
            force_crawl: true,
            async_mode: true,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log(`  ✅ Triggered successfully`);
        triggered++;
      } else {
        const errorText = await response.text();
        console.log(`  ❌ Failed: ${response.status} - ${errorText.substring(0, 100)}`);
        failed++;
      }

      // Stagger requests to avoid overwhelming the edge function
      await new Promise(resolve => setTimeout(resolve, 15000));

    } catch (e: any) {
      console.log(`  ❌ Error: ${e.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Triggered: ${triggered} | ❌ Failed: ${failed}`);
  console.log('='.repeat(60) + '\n');
  console.log('💡 Monitor progress with: npm run check-crawl-status\n');
}

main();
