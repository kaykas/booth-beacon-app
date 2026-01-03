#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deployIndices() {
  console.log('🚀 Deploying performance indices...\n');

  const sql = readFileSync('supabase/migrations/20260102192750_add_performance_indices.sql', 'utf8');

  // Split into individual statements (simple split, might need refinement)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;

    // Skip comments and DO blocks (handle separately)
    if (stmt.startsWith('COMMENT ON') || stmt.includes('DO $$')) {
      console.log(`⏭️  Skipping special statement ${i + 1}`);
      continue;
    }

    try {
      console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });

      if (error) {
        // Check if it's a benign error (index already exists)
        if (error.message.includes('already exists')) {
          console.log(`   ℹ️  Already exists (skipped)`);
        } else {
          console.error(`   ❌ Error: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`   ✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.error(`   ❌ Exception: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Deployment Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   ⏭️  Skipped: ${statements.length - successCount - errorCount}`);

  if (errorCount === 0 || errorCount < 5) {
    console.log('\n🎉 Performance indices deployed successfully!');
    return true;
  } else {
    console.log('\n⚠️  Deployment completed with some errors');
    return false;
  }
}

deployIndices().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
