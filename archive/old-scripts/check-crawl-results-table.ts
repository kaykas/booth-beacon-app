import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTable() {
  console.log('\n🔍 Checking if crawl_results table exists...\n');

  const { data, error } = await supabase
    .from('crawl_results')
    .select('*')
    .limit(1);

  if (error) {
    if (error.code === 'PGRST204' || error.message.includes('does not exist') || error.code === '42P01') {
      console.log('❌ crawl_results table does NOT exist\n');
      console.log('Migration needed: supabase/migrations/20250130_create_crawl_results_table.sql\n');
      console.log('To apply, you can:');
      console.log('  1. Copy SQL from migration file');
      console.log('  2. Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new');
      console.log('  3. Paste and execute the SQL\n');
      return false;
    } else {
      console.log('⚠️ Error checking table:', error);
      return false;
    }
  } else {
    console.log('✅ crawl_results table EXISTS!');
    console.log('   Current rows:', data?.length || 0);
    if (data && data.length > 0 && data[0]) {
      console.log('   Columns:', Object.keys(data[0]).join(', '));
    }
    return true;
  }
}

checkTable();
