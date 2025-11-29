import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigration() {
  console.log('📦 Applying raw_content_storage migration...\n');

  // Read the migration file
  const migrationSQL = readFileSync('supabase/migrations/005_add_raw_content_storage.sql', 'utf8');

  try {
    // Execute the migration using rpc to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);

      // Check if table already exists
      console.log('\n🔍 Checking if table already exists...');
      const { data: tables } = await supabase
        .from('crawl_raw_content')
        .select('id')
        .limit(1);

      if (tables !== null) {
        console.log('✅ Table crawl_raw_content already exists - migration not needed!');
        return;
      }

      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log(data);

    // Verify table exists
    console.log('\n🔍 Verifying table creation...');
    const { data: verify, error: verifyError } = await supabase
      .from('crawl_raw_content')
      .select('id')
      .limit(1);

    if (verifyError) {
      console.log('⚠️  Verification warning:', verifyError.message);
    } else {
      console.log('✅ Table verified successfully!');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

applyMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
