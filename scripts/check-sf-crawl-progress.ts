import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get recent crawl metrics for SF sources
  const { data: metrics, error } = await supabase
    .from('crawler_metrics')
    .select('source_name, status, booths_found, booths_added, booths_updated, started_at, completed_at, error_message')
    .or('source_name.ilike.%SF%,source_name.ilike.%Oakland%,source_name.ilike.%Bay%,source_name.ilike.%Santa Rosa%,source_name.ilike.%Photomatica%')
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📊 SF Bay Area Crawl Progress:\n');

  if (!metrics || metrics.length === 0) {
    console.log('⏳ No crawls have started yet. They should begin processing shortly...\n');
    return;
  }

  const running = metrics.filter(m => m.status === 'running' || m.status === 'started');
  const completed = metrics.filter(m => m.status === 'completed' || m.status === 'success');
  const failed = metrics.filter(m => m.status === 'error' || m.status === 'failed');

  console.log(`✅ Completed: ${completed.length}`);
  console.log(`🔄 Running: ${running.length}`);
  console.log(`❌ Failed: ${failed.length}\n`);

  if (completed.length > 0) {
    console.log('📦 Recently Completed:');
    completed.slice(0, 5).forEach(m => {
      const duration = m.completed_at ? Math.round((new Date(m.completed_at).getTime() - new Date(m.started_at).getTime()) / 1000) : 0;
      console.log(`  ✓ ${m.source_name}`);
      console.log(`    Found: ${m.booths_found} | Added: ${m.booths_added} | Updated: ${m.booths_updated} | Duration: ${duration}s`);
    });
    console.log();
  }

  if (running.length > 0) {
    console.log('⏳ Currently Running:');
    running.slice(0, 5).forEach(m => {
      const elapsed = Math.round((Date.now() - new Date(m.started_at).getTime()) / 1000);
      console.log(`  🔄 ${m.source_name} (${elapsed}s elapsed)`);
    });
    console.log();
  }

  if (failed.length > 0) {
    console.log('❌ Failed:');
    failed.slice(0, 3).forEach(m => {
      console.log(`  ✗ ${m.source_name}`);
      console.log(`    Error: ${m.error_message?.substring(0, 80) || 'Unknown error'}`);
    });
    console.log();
  }

  // Check total SF booths
  const { count: totalBooths, error: countError } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .or('city.ilike.%San Francisco%,city.ilike.%Oakland%,city.ilike.%Berkeley%,city.ilike.%Santa Rosa%');

  if (!countError && totalBooths !== null) {
    console.log(`🌉 Total SF Bay Area Booths in Database: ${totalBooths}\n`);
  }
}

main();
