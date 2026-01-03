import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyMigration() {
  console.log('\n=== APPLYING CRAWL_RESULTS MIGRATION ===\n');

  // Read the migration SQL file
  const migrationPath = join(__dirname, 'supabase/migrations/20250130_create_crawl_results_table.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('Migration SQL:');
  console.log(migrationSQL.substring(0, 200) + '...\n');

  // Execute the SQL using Supabase
  const { error } = await supabase.rpc('exec_sql', {
    query: migrationSQL
  });

  if (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }

  console.log('✅ Migration applied successfully!\n');

  // Verify the table was created
  const { error: checkError } = await supabase
    .from('crawl_results')
    .select('*')
    .limit(1);

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('⚠️ Could not verify table creation:', checkError);
  } else {
    console.log('✅ crawl_results table exists and is accessible\n');
  }

  // Check the table structure
  const { data: sample } = await supabase
    .from('crawl_results')
    .select('*')
    .limit(1);

  if (sample) {
    console.log('Table columns:', Object.keys(sample[0] || {}).join(', '));
  }

  console.log('\n📋 Migration Summary:');
  console.log('  - Table: crawl_results');
  console.log('  - Purpose: Store raw HTML/JSON from crawls for reprocessing');
  console.log('  - Columns: id, source_id, url, raw_html, raw_json, content_hash, crawled_at, http_status, response_time_ms, error_message');
  console.log('  - Indexes: source_id, url, crawled_at, content_hash');
  console.log('  - RLS: Enabled with public read and service role full access\n');
}

applyMigration().catch(console.error);
