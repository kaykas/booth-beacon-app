import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const sources = [
    'Photomatica SF Crawl',
    'LocalWiki SF Photo Booths',
    'Do The Bay Photo Booths',
    'Photo Booth Network SF',
    'Lomography SF',
    'SFGate Photo Booth Directory'
  ];

  console.log('\n📊 Final Crawl Results:\n');

  let totalFound = 0;
  let totalAdded = 0;

  for (const sourceName of sources) {
    const { data } = await supabase
      .from('crawl_sources')
      .select('source_name, status, total_booths_found, total_booths_added, pattern_learning_status')
      .eq('source_name', sourceName)
      .single();

    if (data) {
      const found = data.total_booths_found || 0;
      const added = data.total_booths_added || 0;
      totalFound += found;
      totalAdded += added;

      console.log(`  ${found > 0 ? '✅' : '⏳'} ${data.source_name}`);
      console.log(`     Status: ${data.status || 'idle'} | Found: ${found} | Added: ${added}`);
      console.log(`     Pattern Learning: ${data.pattern_learning_status || 'not_started'}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 Total: ${totalFound} booths found, ${totalAdded} booths added`);
  console.log(`${'='.repeat(60)}\n`);

  // Check total SF booths now
  const { count } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .or('city.ilike.%San Francisco%,city.ilike.%Oakland%,city.ilike.%Berkeley%,city.ilike.%Santa Rosa%');

  if (count !== null) {
    console.log(`🌉 Total SF Bay Area Booths in Database: ${count}\n`);
  }
}

main();
