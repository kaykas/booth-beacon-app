import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTable() {
  const { error } = await supabase
    .from('crawl_jobs')
    .select('id')
    .limit(1);

  if (error) {
    console.log('❌ crawl_jobs table does not exist');
    console.log('Error:', error.message);
    console.log('\nPlease run the migration manually:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Paste contents of: supabase/migrations/20260103_add_crawl_jobs_table.sql');
    console.log('3. Click Run');
  } else {
    console.log('✅ crawl_jobs table exists');
  }
}

checkTable();
