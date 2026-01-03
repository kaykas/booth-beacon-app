#!/usr/bin/env node

/**
 * Apply migration via HTTP to Supabase
 * Uses the pg-meta API that Supabase Studio uses
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = 'tmgbmcbwfkvmylmfpkzy';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

async function executeMigration() {
  console.log('🔐 Applying security migration via HTTP...\n');

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260103_fix_security_issues.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Try the pg-meta query endpoint
  const options = {
    hostname: `${projectRef}.supabase.co`,
    port: 443,
    path: '/rest/v1/rpc/exec',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}\n`);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Migration applied!\n');
          resolve();
        } else {
          console.log('❌ Failed to apply via HTTP\n');
          console.log('📋 Please apply manually via Supabase Dashboard:\n');
          console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
          resolve(); // Don't reject, just inform
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ HTTP request failed:', error.message);
      console.log('\n📋 Please apply manually via Supabase Dashboard:\n');
      console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
      resolve();
    });

    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

executeMigration().then(() => {
  console.log('📄 Migration file location:');
  console.log('   ' + path.resolve(__dirname, '../supabase/migrations/20260103_fix_security_issues.sql'));
  console.log('\n⚠️  Don\'t forget to enable leaked password protection:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/auth/settings\n`);
});
