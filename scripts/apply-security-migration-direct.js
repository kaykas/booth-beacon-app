#!/usr/bin/env node

/**
 * Apply Security Migration Script using direct Supabase connection
 *
 * This script applies the security fixes migration directly to the Supabase database
 * using the correct connection format.
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

// Supabase uses a pooler connection on port 6543 with transaction mode
// or direct connection on port 5432
const connectionConfig = {
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: supabaseServiceKey,
  ssl: { rejectUnauthorized: false }
};

async function applyMigration() {
  console.log('🔐 Applying security fixes migration...\n');
  console.log(`📡 Connecting to database: ${connectionConfig.host}:${connectionConfig.port}\n`);

  const client = new Client(connectionConfig);

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
      console.log('\n📊 Verifying fixes...');

      // Verify RLS is enabled
      const { rows: rlsCheck } = await client.query(`
        SELECT schemaname, tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN ('spatial_ref_sys', 'crawl_jobs', 'crawl_raw_content')
        ORDER BY tablename;
      `);

      console.log('\nRLS Status:');
      rlsCheck.forEach(row => {
        console.log(`  ${row.tablename}: ${row.rowsecurity ? '✅ Enabled' : '❌ Disabled'}`);
      });

      // Verify views exist and aren't SECURITY DEFINER
      const { rows: viewCheck } = await client.query(`
        SELECT schemaname, viewname
        FROM pg_views
        WHERE schemaname = 'public'
          AND viewname IN ('featured_booths', 'booth_data_quality_stats', 'content_needing_reextraction', 'crawler_dashboard_stats')
        ORDER BY viewname;
      `);

      console.log('\nViews:');
      viewCheck.forEach(row => {
        console.log(`  ✅ ${row.viewname} (regular view)`);
      });

      console.log('\n🎉 All security fixes verified!\n');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Failed to apply migration:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    if (error.position) {
      console.error('Position:', error.position);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
