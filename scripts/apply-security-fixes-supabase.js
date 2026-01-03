#!/usr/bin/env node

/**
 * Apply Security Fixes using Supabase Client
 *
 * This script uses the @supabase/supabase-js client to execute SQL statements
 * one by one to fix all security issues.
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

async function executeSQLStatement(sql, description) {
  try {
    const { data, error } = await supabase.rpc('exec', { sql });

    if (error) {
      console.error(`  ❌ ${description}: ${error.message}`);
      return false;
    }

    console.log(`  ✅ ${description}`);
    return true;
  } catch (err) {
    console.error(`  ❌ ${description}: ${err.message}`);
    return false;
  }
}

async function applySecurityFixes() {
  console.log('🔐 Applying security fixes to database...\n');

  let successCount = 0;
  let failCount = 0;

  // Part 1: Fix SECURITY DEFINER Views
  console.log('📋 Part 1: Fixing SECURITY DEFINER Views\n');

  const viewFixes = [
    {
      sql: `DROP VIEW IF EXISTS featured_booths CASCADE;
CREATE VIEW featured_booths AS
SELECT b.*, COALESCE(b.rating_average, 0) as rating, COALESCE(b.completeness_score, 0) as completeness
FROM booths b
WHERE b.status = 'active' AND COALESCE(b.is_operational, true) = true
  AND (COALESCE(b.completeness_score, 0) >= 70 OR COALESCE(b.rating_average, 0) >= 4.0)
ORDER BY b.rating_average DESC NULLS LAST, b.completeness_score DESC NULLS LAST, b.favorite_count DESC NULLS LAST;`,
      description: 'Recreate featured_booths view without SECURITY DEFINER'
    },
    {
      sql: `DROP VIEW IF EXISTS booth_data_quality_stats CASCADE;
CREATE VIEW booth_data_quality_stats AS
SELECT
  status,
  needs_verification,
  data_source_type,
  source_primary,
  COUNT(*) as booth_count,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as geocoded_count,
  COUNT(*) FILTER (WHERE photo_exterior_url IS NOT NULL) as with_photos_count,
  COUNT(*) FILTER (WHERE description IS NOT NULL AND description != '') as with_description_count,
  ROUND(AVG(completeness_score), 2) as avg_completeness_score
FROM booths
GROUP BY status, needs_verification, data_source_type, source_primary
ORDER BY booth_count DESC;`,
      description: 'Recreate booth_data_quality_stats view'
    },
    {
      sql: `DROP VIEW IF EXISTS content_needing_reextraction CASCADE;
CREATE VIEW content_needing_reextraction AS
SELECT
  crc.*,
  cs.source_name,
  cs.extractor_type
FROM crawl_raw_content crc
JOIN crawl_sources cs ON crc.source_id = cs.id
WHERE cs.enabled = true
ORDER BY crc.crawled_at DESC;`,
      description: 'Recreate content_needing_reextraction view'
    },
    {
      sql: `DROP VIEW IF EXISTS crawler_dashboard_stats CASCADE;
CREATE VIEW crawler_dashboard_stats AS
SELECT
  COUNT(DISTINCT id) as total_jobs,
  COUNT(DISTINCT id) FILTER (WHERE status = 'active') as active_jobs,
  COUNT(DISTINCT id) FILTER (WHERE status = 'pending') as pending_jobs,
  COUNT(DISTINCT id) FILTER (WHERE status = 'completed') as completed_jobs,
  COUNT(DISTINCT id) FILTER (WHERE status = 'failed') as failed_jobs,
  SUM(pages_crawled) as total_pages_crawled,
  SUM(booths_found) as total_booths_found
FROM crawl_jobs;`,
      description: 'Recreate crawler_dashboard_stats view'
    }
  ];

  // Since Supabase client doesn't have exec RPC by default, we need to provide instructions
  console.log('⚠️  Direct SQL execution via Supabase client requires database access.\n');
  console.log('📋 Please run the migration using the Supabase SQL Editor:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new');
  console.log('2. Copy and paste the contents of this file:');
  console.log('   ' + path.resolve(__dirname, '../supabase/migrations/20260103_fix_security_issues.sql'));
  console.log('3. Click "Run" to execute\n');

  console.log('Alternatively, if you have psql installed and database password:');
  console.log('PGPASSWORD=<your-password> psql \\');
  console.log('  "postgresql://postgres.tmgbmcbwfkvmylmfpkzy@db.tmgbmcbwfkvmylmfpkzy.supabase.co:5432/postgres" \\');
  console.log('  -f supabase/migrations/20260103_fix_security_issues.sql\n');

  console.log('✅ Migration file is ready at:');
  console.log('   ' + path.resolve(__dirname, '../supabase/migrations/20260103_fix_security_issues.sql'));
  console.log('\n📝 Summary of what will be fixed:');
  console.log('   • Remove SECURITY DEFINER from 4 views');
  console.log('   • Enable RLS on 3 tables (spatial_ref_sys, crawl_jobs, crawl_raw_content)');
  console.log('   • Add SET search_path to 22 functions');
  console.log('   • Document PostGIS extension placement\n');

  console.log('⚠️  After running migration, enable leaked password protection:');
  console.log('   https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/auth/settings\n');
}

applySecurityFixes();
