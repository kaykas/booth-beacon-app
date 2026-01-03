import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDatabaseState() {
  console.log('\n🔍 Checking database state...\n');

  // Get total count
  const { count: total } = await supabase
    .from('crawl_sources')
    .select('*', { count: 'exact', head: true });

  // Get enabled count
  const { count: enabled } = await supabase
    .from('crawl_sources')
    .select('*', { count: 'exact', head: true })
    .eq('enabled', true);

  // Get disabled count
  const { count: disabled } = await supabase
    .from('crawl_sources')
    .select('*', { count: 'exact', head: true })
    .eq('enabled', false);

  console.log('📊 Source Counts:');
  console.log('   Total:', total);
  console.log('   Enabled:', enabled);
  console.log('   Disabled:', disabled);

  // Get sample of enabled sources
  const { data: enabledSources, error } = await supabase
    .from('crawl_sources')
    .select('id, source_name, enabled, status, total_booths_found')
    .eq('enabled', true)
    .limit(10);

  if (error) {
    console.error('\n❌ Error fetching enabled sources:', error.message);
    return;
  }

  console.log('\n✅ Enabled Sources:');
  if (enabledSources && enabledSources.length > 0) {
    enabledSources.forEach((s, i) => {
      console.log(`${i + 1}. ${s.source_name}`);
      console.log(`   Status: ${s.status}`);
      console.log(`   Booths: ${s.total_booths_found || 0}`);
      console.log('');
    });
  } else {
    console.log('  ⚠️ No enabled sources found!');
  }
}

checkDatabaseState().catch(console.error);
