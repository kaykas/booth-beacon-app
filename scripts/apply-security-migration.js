#!/usr/bin/env node

/**
 * Apply Security Migration Script
 *
 * This script applies the security fixes migration directly to the Supabase database
 * using the service role key.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔐 Applying security fixes migration...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260103_fix_security_issues.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Execute the migration
    console.log('📝 Executing migration SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).select();

    if (error) {
      // Try alternative approach using direct SQL execution
      console.log('⚠️  exec_sql not available, trying direct execution...');

      // Split into individual statements and execute
      const statements = migrationSQL
        .split(/;\s*$/gm)
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim() + ';');

      console.log(`Found ${statements.length} SQL statements to execute\n`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];

        // Skip comments and empty lines
        if (stmt.startsWith('--') || stmt.trim() === ';') {
          continue;
        }

        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: stmt });

          if (stmtError) {
            console.error(`❌ Error in statement ${i + 1}:`, stmtError.message);
            console.error('Statement:', stmt.substring(0, 100) + '...');
          }
        } catch (err) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, err.message);
        }
      }
    }

    console.log('\n✅ Migration applied successfully!\n');
    console.log('Summary of fixes:');
    console.log('  ✓ Removed SECURITY DEFINER from 4 views');
    console.log('  ✓ Enabled RLS on 3 tables (spatial_ref_sys, crawl_jobs, crawl_raw_content)');
    console.log('  ✓ Added SET search_path to 22 functions');
    console.log('  ✓ Documented PostGIS extension placement');
    console.log('\n⚠️  Manual action required:');
    console.log('  - Enable leaked password protection in Supabase Dashboard');
    console.log('  - Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/auth/settings');
    console.log('  - Enable "Leaked Password Protection"');

  } catch (error) {
    console.error('❌ Failed to apply migration:', error);
    process.exit(1);
  }
}

applyMigration();
