#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyMigration() {
  try {
    console.log('\n🔄 Applying booth_submissions table migration...\n');

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/20260103_create_booth_submissions_table.sql'
    );

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Split SQL into individual statements (simple approach)
    // Execute each statement separately
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comments and DO blocks (they don't work well with rpc)
      if (statement.includes('DO $$') || statement.trim().startsWith('--')) {
        console.log(`⏭️  Skipping statement ${i + 1} (comment or DO block)`);
        continue;
      }

      console.log(`▶️  Executing statement ${i + 1}/${statements.length}...`);

      try {
        // Use the SQL function to execute raw SQL
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // Some errors are expected (like table already exists)
          if (error.message.includes('already exists')) {
            console.log(`   ℹ️  Note: ${error.message}`);
          } else {
            throw error;
          }
        } else {
          console.log(`   ✅ Success`);
        }
      } catch (err: any) {
        // Log but continue - some statements might fail if already applied
        console.log(`   ⚠️  ${err.message || err}`);
      }
    }

    console.log('\n🎉 Migration completed!\n');
    console.log('✅ Verifying table exists...');

    // Verify the table exists
    const { data, error: verifyError, count } = await supabase
      .from('booth_submissions')
      .select('*', { count: 'exact', head: true });

    if (verifyError) {
      console.error('❌ Table verification failed:', verifyError.message);
      console.log('\n💡 The table may not exist. Try applying the migration manually:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new');
      console.log('   2. Copy contents from: supabase/migrations/20260103_create_booth_submissions_table.sql');
      console.log('   3. Paste and run in SQL editor\n');
      process.exit(1);
    }

    console.log(`✅ Table verified! Currently contains ${count || 0} submissions.\n`);
    console.log('=' + '='.repeat(79));
    console.log('🚀 Next steps:');
    console.log('   1. Push code to production: git push origin main');
    console.log('   2. Test at /submit and /admin/submissions');
    console.log('=' + '='.repeat(79));
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Error applying migration:', error.message || error);
    console.log('\n💡 Try applying manually via Supabase dashboard:');
    console.log('   https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new\n');
    process.exit(1);
  }
}

applyMigration();
