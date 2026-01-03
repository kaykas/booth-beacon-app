#!/usr/bin/env node

/**
 * Apply new performance indices to Supabase database
 * Executes SQL statements one by one to avoid conflicts
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

// Read the SQL file
const sqlPath = path.join(__dirname, 'apply-new-indices.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

// Split into individual statements (basic approach)
const statements = sqlContent
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && s !== '');

async function executeSQL(sql) {
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Try to execute using raw SQL
  const { data, error } = await supabase.rpc('exec', { sql });

  if (error) {
    console.error('Error executing SQL:', error);
    return { success: false, error };
  }

  return { success: true, data };
}

async function applyIndices() {
  console.log('🚀 Starting index application...\n');
  console.log(`Found ${statements.length} SQL statements to execute\n`);

  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  });

  // For now, let's just output the SQL that needs to be run
  console.log('📝 SQL to execute:');
  console.log('='=repeat(60));
  console.log(sqlContent);
  console.log('='=repeat(60));
  console.log('\n');
  console.log('⚠️  Note: Supabase REST API does not support arbitrary SQL execution.');
  console.log('You can apply these indices using one of these methods:\n');
  console.log('1. Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql');
  console.log('2. Run: supabase db execute -f scripts/apply-new-indices.sql --project-ref tmgbmcbwfkvmylmfpkzy');
  console.log('3. Use psql with direct connection to database\n');
}

applyIndices().catch(console.error);
