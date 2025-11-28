/**
 * Verify and create crawl_job_queue table if needed
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyJobQueue() {
  console.log('🔍 Checking if crawl_job_queue table exists...\n');

  // Try to query the table
  const { data, error } = await supabase
    .from('crawl_job_queue')
    .select('id')
    .limit(1);

  if (error) {
    if (error.message.includes('does not exist')) {
      console.log('⚠️  Table does not exist. Creating it now...\n');

      // Read and execute the migration
      const migration = fs.readFileSync('supabase/migrations/006_crawl_job_queue.sql', 'utf8');

      // Execute via Supabase SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        query: migration
      });

      if (createError) {
        console.error('❌ Failed to create table:', createError);
        console.log('\nYou may need to apply this migration manually via Supabase Dashboard > SQL Editor');
        process.exit(1);
      }

      console.log('✅ Table created successfully!\n');
    } else {
      console.error('❌ Error checking table:', error);
      process.exit(1);
    }
  } else {
    console.log('✅ Table exists!');
    console.log(`   Current jobs in queue: ${data?.length || 0}\n`);
  }
}

verifyJobQueue()
  .then(() => {
    console.log('✅ Verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
