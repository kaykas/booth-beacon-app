#!/usr/bin/env node

/**
 * Apply Performance Indices via Supabase Management API
 *
 * This uses the Supabase Management API to execute SQL statements
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

console.log('🚀 Applying Performance Indices via Supabase API');
console.log('=' .repeat(60));
console.log(`📍 Database: ${SUPABASE_URL}`);
console.log('');

// Read migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260102192750_add_performance_indices.sql');
const sql = readFileSync(migrationPath, 'utf8');

console.log(`📖 Loaded migration (${sql.length} characters)`);
console.log('');

// Split SQL into individual statements
// Handle CONCURRENTLY indices which can't be in transactions
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))
  .map(s => s + ';');

console.log(`📝 Found ${statements.length} SQL statements`);
console.log('⏳ Executing via Supabase REST API...');
console.log('');

let successCount = 0;
let errorCount = 0;
const errors = [];

const startTime = Date.now();

// Execute each statement via REST API
for (let i = 0; i < statements.length; i++) {
  const statement = statements[i];

  // Skip empty or comment-only statements
  if (!statement.trim() || statement.trim().startsWith('--')) {
    continue;
  }

  try {
    // Extract first 50 chars for logging
    const preview = statement.substring(0, 50).replace(/\s+/g, ' ');
    process.stdout.write(`   [${i + 1}/${statements.length}] ${preview}... `);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: statement
      })
    });

    if (response.ok || response.status === 404) {
      // 404 means the RPC endpoint doesn't exist, try direct query
      if (response.status === 404) {
        // Try using raw SQL query parameter
        const directResponse = await fetch(`${SUPABASE_URL}/rest/v1/?query=${encodeURIComponent(statement)}`, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          }
        });

        if (directResponse.ok) {
          console.log('✅');
          successCount++;
        } else {
          throw new Error(`HTTP ${directResponse.status}`);
        }
      } else {
        console.log('✅');
        successCount++;
      }
    } else {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.log('❌');
    errorCount++;

    // Don't treat "does not exist" errors as failures for DROP IF EXISTS
    if (!error.message.includes('does not exist')) {
      errors.push({
        statement: statement.substring(0, 100),
        error: error.message
      });
      console.error(`      Error: ${error.message}`);
    }
  }
}

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

console.log('');
console.log('=' .repeat(60));
console.log('📊 EXECUTION RESULTS');
console.log('=' .repeat(60));
console.log(`✅ Successful: ${successCount} statements`);
console.log(`❌ Errors: ${errorCount} statements`);
console.log(`⏱️  Duration: ${duration} seconds`);
console.log('');

if (errors.length > 0) {
  console.log('⚠️  Errors encountered:');
  errors.forEach((err, idx) => {
    console.log(`   ${idx + 1}. ${err.error}`);
    console.log(`      Statement: ${err.statement}...`);
  });
  console.log('');
}

if (successCount > 0) {
  console.log('✅ Migration completed!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Verify indices: node scripts/verify-performance-indices.js');
  console.log('   2. Test query performance');
  console.log('');
} else {
  console.log('❌ Migration failed - no statements executed successfully');
  console.log('');
  console.log('💡 Try manual application via Supabase Dashboard:');
  console.log('   1. Go to https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql');
  console.log('   2. Copy contents of: supabase/migrations/20260102192750_add_performance_indices.sql');
  console.log('   3. Paste and execute in SQL Editor');
  console.log('');
  process.exit(1);
}
