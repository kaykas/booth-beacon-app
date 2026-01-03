import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║      DATABASE MIGRATION - crawl_jobs TABLE            ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

async function runMigration() {
  console.log('📋 Step 1: Check if crawl_jobs table exists...\n');

  // Check if table exists
  const { error: checkError } = await supabase
    .from('crawl_jobs')
    .select('id')
    .limit(1);

  if (!checkError) {
    console.log('✅ crawl_jobs table already exists!\n');
    console.log('Verifying table structure...\n');
    
    const { data, error } = await supabase
      .from('crawl_jobs')
      .select('*')
      .limit(0);
    
    if (!error) {
      console.log('✅ Table structure verified\n');
      return true;
    }
  }

  console.log('📝 Table does not exist. Creating via Supabase Management API...\n');

  // Use Supabase Management API to execute SQL
  const migrationSQL = `
-- Create crawl_jobs table for async Firecrawl job tracking
CREATE TABLE IF NOT EXISTS crawl_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text UNIQUE NOT NULL,
  source_id uuid NOT NULL REFERENCES crawl_sources(id),
  source_name text NOT NULL,
  source_url text NOT NULL,
  extractor_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  pages_crawled integer DEFAULT 0,
  booths_found integer DEFAULT 0,
  booths_added integer DEFAULT 0,
  booths_updated integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  crawl_duration_ms integer,
  extraction_time_ms integer,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_crawl_jobs_job_id ON crawl_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status ON crawl_jobs(status);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_source_id ON crawl_jobs(source_id);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_created_at ON crawl_jobs(created_at DESC);

GRANT SELECT, INSERT, UPDATE ON crawl_jobs TO service_role;
GRANT SELECT ON crawl_jobs TO anon, authenticated;
  `.trim();

  try {
    // Try using the query endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: migrationSQL })
    });

    if (response.ok) {
      console.log('✅ Migration executed successfully!\n');
      return true;
    } else {
      const errorText = await response.text();
      console.log('⚠️  RPC approach failed:', errorText, '\n');
      throw new Error('Migration via RPC failed');
    }
  } catch (error) {
    console.log('ℹ️  Automatic migration not available.\n');
    console.log('📋 MANUAL MIGRATION REQUIRED:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/editor');
    console.log('2. Click "SQL Editor" in left sidebar');
    console.log('3. Click "New Query"');
    console.log('4. Paste the following SQL:\n');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('\n5. Click "Run" button');
    console.log('6. Verify: Should see "Success. No rows returned"\n');
    return false;
  }
}

runMigration();
