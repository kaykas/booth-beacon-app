import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get all SF Bay Area sources
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('source_name, status, total_booths_found, total_booths_added, last_crawl_timestamp, last_error_message')
    .or('source_name.ilike.%SF%,source_name.ilike.%San Francisco%,source_name.ilike.%Oakland%,source_name.ilike.%Berkeley%,source_name.ilike.%Santa Rosa%,source_name.ilike.%Photomatica%,source_name.ilike.%Bay%')
    .order('total_booths_found', { ascending: false });

  if (!sources || sources.length === 0) {
    console.log('No SF Bay Area sources found');
    return;
  }

  console.log('\n🌉 SF Bay Area Comprehensive Status\n');
  console.log(`${'='.repeat(60)}\n`);

  const active = sources.filter(s => s.status === 'active' || s.status === 'running');
  const completed = sources.filter(s => s.last_crawl_timestamp && (s.status === 'idle' || !s.status));
  const withResults = sources.filter(s => (s.total_booths_found || 0) > 0);
  const errors = sources.filter(s => s.last_error_message);

  console.log('📈 Status Summary:');
  console.log(`  🔄 Active/Running: ${active.length}`);
  console.log(`  ✅ Completed: ${completed.length}`);
  console.log(`  📦 Found Booths: ${withResults.length}`);
  console.log(`  ❌ Errors: ${errors.length}\n`);

  // Aggregate totals
  const totalFound = sources.reduce((sum, s) => sum + (s.total_booths_found || 0), 0);
  const totalAdded = sources.reduce((sum, s) => sum + (s.total_booths_added || 0), 0);

  console.log(`${'='.repeat(60)}`);
  console.log(`📊 TOTAL: ${totalFound} booths found, ${totalAdded} booths added`);
  console.log(`${'='.repeat(60)}\n`);

  // Show top performers
  if (withResults.length > 0) {
    console.log('🏆 Top Performing Sources:\n');
    withResults.slice(0, 15).forEach(s => {
      const found = s.total_booths_found || 0;
      const added = s.total_booths_added || 0;
      console.log(`  ${found > 0 ? '✅' : '⏳'} ${s.source_name}`);
      console.log(`     Found: ${found} | Added: ${added}`);
    });
    console.log();
  }

  // Show errors
  if (errors.length > 0) {
    console.log('❌ Sources with Errors:\n');
    errors.slice(0, 5).forEach(s => {
      console.log(`  ✗ ${s.source_name}`);
      console.log(`    ${s.last_error_message?.substring(0, 100) || 'Unknown error'}\n`);
    });
  }

  // Show sources still running
  if (active.length > 0) {
    console.log(`⏳ ${active.length} sources still processing...\n`);
  }

  // Get total SF booths in database
  const { count } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .or('city.ilike.%San Francisco%,city.ilike.%Oakland%,city.ilike.%Berkeley%,city.ilike.%Santa Rosa%');

  if (count !== null) {
    console.log(`🗺️  Total SF Bay Area Booths in Database: ${count}\n`);
  }
}

main();
