/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/20251208_add_geocode_validation_fields.sql'
    );

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    console.log('Migration SQL loaded successfully');
    console.log('---\n');

    // Use Supabase's postgres REST extension to execute raw SQL
    // This requires the pg_net extension or using the database REST API
    console.log('Attempting to execute SQL via Supabase REST API...\n');

    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/exec`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          sql: sql
        })
      }
    );

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (!response.ok) {
      console.log('\n⚠️  Unable to execute via REST API');
      console.log('This is expected - DDL statements require direct database access\n');

      // Try using supabase-js with a custom query
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      });

      console.log('Attempting to use Supabase client to query existing columns...');

      // First, let's see what columns currently exist
      const { data: existingData, error: existingError } = await supabase
        .from('booths')
        .select('*')
        .limit(1);

      if (!existingError && existingData && existingData.length > 0) {
        const existingColumns = Object.keys(existingData[0]);
        console.log('\nExisting columns in booths table:');
        existingColumns.sort().forEach(col => {
          console.log('  -', col);
        });

        const newColumns = [
          'geocode_match_score',
          'geocode_validation_issues',
          'geocode_validated_at',
          'needs_geocode_review'
        ];

        const missingColumns = newColumns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length > 0) {
          console.log('\n❌ Missing columns that need to be added:');
          missingColumns.forEach(col => console.log('  -', col));
          console.log('\n📋 SOLUTION: Use Supabase SQL Editor');
          console.log('1. Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/editor');
          console.log('2. Open SQL Editor');
          console.log('3. Copy and paste the following SQL:\n');
          console.log('='.repeat(80));
          console.log(sql);
          console.log('='.repeat(80));
        } else {
          console.log('\n✓ All columns already exist!');
        }
      }
    } else {
      console.log('✓ Migration executed successfully!');
    }

  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  }
}

runMigration();
