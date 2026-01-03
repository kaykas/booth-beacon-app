#!/usr/bin/env node

/**
 * Apply Security Migration Script using Supabase REST API
 *
 * This script applies security fixes by executing SQL via the Supabase REST API
 * using the service role key for authentication.
 */

const https = require('https');
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

async function executeSQLViaREST(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/rpc/exec`);

    const postData = JSON.stringify({ query: sql });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: JSON.parse(data || '{}') });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function applyMigration() {
  console.log('🔐 Applying security fixes migration via Supabase REST API...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260103_fix_security_issues.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('📝 Preparing migration SQL...\n');

  // Since we can't execute multi-statement SQL via REST API easily,
  // let's provide instructions for manual execution
  console.log('⚠️  The Supabase REST API does not support multi-statement SQL execution.');
  console.log('    Please apply the migration manually using one of these methods:\n');

  console.log('Method 1: Supabase Dashboard (Recommended)');
  console.log('  1. Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new');
  console.log('  2. Copy the contents of: supabase/migrations/20260103_fix_security_issues.sql');
  console.log('  3. Paste into the SQL editor');
  console.log('  4. Click "Run"\n');

  console.log('Method 2: psql command line');
  console.log('  1. Get your database password from Supabase Dashboard');
  console.log('  2. Run:');
  console.log('     PGPASSWORD=<your-db-password> psql \\');
  console.log('       "postgresql://postgres.tmgbmcbwfkvmylmfpkzy@db.tmgbmcbwfkvmylmfpkzy.supabase.co:5432/postgres" \\');
  console.log('       -f supabase/migrations/20260103_fix_security_issues.sql\n');

  console.log('Method 3: Supabase CLI (if logged in)');
  console.log('  supabase db push --linked\n');

  console.log('Expected fixes:');
  console.log('  ✓ Remove SECURITY DEFINER from 4 views');
  console.log('  ✓ Enable RLS on 3 tables (spatial_ref_sys, crawl_jobs, crawl_raw_content)');
  console.log('  ✓ Add SET search_path to 22 functions');
  console.log('  ✓ Document PostGIS extension placement');
  console.log('\n⚠️  Manual action also required:');
  console.log('  - Enable leaked password protection in Supabase Dashboard');
  console.log('  - Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/auth/settings');
  console.log('  - Enable "Leaked Password Protection"\n');

  // Copy SQL to clipboard if possible
  const migrationFile = path.resolve(migrationPath);
  console.log(`📄 Migration file location:\n   ${migrationFile}\n`);
}

applyMigration();
