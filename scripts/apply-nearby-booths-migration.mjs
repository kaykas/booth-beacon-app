#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('📦 Applying nearby booths migration...\n');

  // Read migration file
  const migrationPath = join(__dirname, '../supabase/migrations/20260103_fix_nearby_booths_exclude.sql');
  const sql = readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration SQL:');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  console.log();

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('⚠️  exec_sql RPC not available, trying direct execution...\n');

      // Split into individual statements and execute
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.rpc('exec', { query: statement });

        if (stmtError) {
          console.error(`❌ Error executing statement:`, stmtError);
          throw stmtError;
        }
      }
    }

    console.log('✅ Migration applied successfully!\n');
    console.log('Testing the function...\n');

    // Test the function with exclude parameter
    const { data: testData, error: testError } = await supabase.rpc('get_nearby_booths', {
      p_latitude: 37.7749,
      p_longitude: -122.4194,
      p_radius_km: 50,
      p_limit: 5,
      p_exclude_booth_id: '00000000-0000-0000-0000-000000000000'
    });

    if (testError) {
      console.error('❌ Test failed:', testError);
    } else {
      console.log(`✅ Function test passed! Found ${testData?.length || 0} booths`);
    }

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

applyMigration();
