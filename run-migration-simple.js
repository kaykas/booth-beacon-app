const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('Running migration...');

    // Execute the ALTER TABLE statement
    console.log('\n1. Adding columns to booths table...');
    const { data: alterData, error: alterError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE booths
ADD COLUMN IF NOT EXISTS ai_generated_image_url TEXT,
ADD COLUMN IF NOT EXISTS ai_image_prompt TEXT,
ADD COLUMN IF NOT EXISTS ai_image_generated_at TIMESTAMPTZ;`
    });

    if (alterError && alterError.code !== 'PGRST202') {
      console.log('Direct SQL execution not available, trying query method...');

      // Alternative: Verify columns exist by querying
      const { data: verifyData, error: verifyError } = await supabase
        .from('booths')
        .select('id')
        .limit(1);

      if (verifyError) {
        console.error('Cannot access booths table:', verifyError);
      } else {
        console.log('Booths table is accessible');
      }
    }

    console.log('\nMigration execution attempted.');
    console.log('\nNote: Direct SQL execution via REST API may not be available.');
    console.log('Please use Supabase Dashboard SQL Editor or psql with database password.');
    console.log('\nTo run manually:');
    console.log('1. Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new');
    console.log('2. Copy and paste the migration SQL');
    console.log('3. Click Run');

  } catch (error) {
    console.error('Error:', error);
  }
}

runMigration();
