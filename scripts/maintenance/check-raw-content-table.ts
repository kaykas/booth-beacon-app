import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTable() {
  console.log('🔍 Checking for crawl_raw_content table...\n');

  // Try to query the table
  const { data, error } = await supabase
    .from('crawl_raw_content')
    .select('id')
    .limit(1);

  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.log('❌ Table crawl_raw_content does NOT exist');
      console.log('   Error:', error.message);
      console.log('\n📋 Next step: Need to apply migration 005_add_raw_content_storage.sql');
      console.log('   via Supabase dashboard SQL editor or supabase CLI');
      return false;
    } else {
      console.log('⚠️  Unexpected error:', error);
      return false;
    }
  }

  console.log('✅ Table crawl_raw_content EXISTS!');
  console.log(`   Records found: ${data?.length || 0}`);
  return true;
}

checkTable().catch(console.error);
