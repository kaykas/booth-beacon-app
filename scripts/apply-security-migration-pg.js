#!/usr/bin/env node

/**
 * Apply Security Migration Script using node-postgres
 *
 * This script applies the security fixes migration directly to the Supabase database
 * using the postgres driver and service role credentials.
 */

const { Client } = require('pg');
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

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

// Connection string (using the service role key as password)
const connectionString = `postgresql://postgres.${projectRef}:${supabaseServiceKey}@db.${projectRef}.supabase.co:5432/postgres`;

async function applyMigration() {
  console.log('🔐 Applying security fixes migration...\n');
  console.log(`📡 Connecting to database: db.${projectRef}.supabase.co\n`);

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260103_fix_security_issues.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing migration SQL...\n');

    // Execute the migration as a single transaction
    await client.query('BEGIN');
    try {
      await client.query(migrationSQL);
      await client.query('COMMIT');

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
      console.log('  - This can also be done via Supabase CLI: supabase secrets set GOTRUE_SECURITY_LEAKED_PASSWORD_CHECK_ENABLED=true\n');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Failed to apply migration:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
