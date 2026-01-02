#!/usr/bin/env node

/**
 * Apply booth_issues table migration
 * This script executes the SQL migration to create the booth_issues table
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('Applying booth_issues table migration...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251220_create_booth_issues_table.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error(`Error: Migration file not found at ${migrationPath}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try direct query approach if RPC doesn't exist
      console.log('Trying direct SQL execution...');

      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.length === 0) continue;

        console.log(`Executing: ${statement.substring(0, 60)}...`);

        const { error: stmtError } = await supabase
          .from('_migrations')
          .select('*')
          .limit(0); // This won't work for CREATE TABLE, we need a different approach

        if (stmtError) {
          console.error(`Error: ${stmtError.message}`);
        }
      }

      console.log('\n⚠️  Unable to apply migration automatically.');
      console.log('Please apply the migration manually using one of these methods:\n');
      console.log('1. Via Supabase Dashboard:');
      console.log('   - Go to https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new');
      console.log(`   - Copy and paste the contents of: ${migrationPath}`);
      console.log('   - Click "Run"\n');
      console.log('2. Via CLI:');
      console.log('   - Run: supabase db push --linked\n');

      process.exit(1);
    }

    console.log('✓ Migration applied successfully!\n');
    console.log('The booth_issues table has been created with:');
    console.log('  - Issue type tracking (closed, incorrect_info, inappropriate_photo, other)');
    console.log('  - User reporting with authentication');
    console.log('  - Status management (pending, reviewed, resolved, dismissed)');
    console.log('  - Row Level Security policies');
    console.log('  - Automated timestamp updates\n');

    // Verify the table was created
    const { data: tables, error: verifyError } = await supabase
      .from('booth_issues')
      .select('*')
      .limit(0);

    if (verifyError) {
      console.log('⚠️  Note: Unable to verify table creation, but migration may have succeeded.');
    } else {
      console.log('✓ Verified: booth_issues table is accessible\n');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

applyMigration();
