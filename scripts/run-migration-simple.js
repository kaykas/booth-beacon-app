/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/20251208_add_geocode_validation_fields.sql'
    );

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    console.log('Migration SQL loaded successfully');
    console.log('File length:', sql.length, 'characters');
    console.log('---\n');

    // Parse SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // Filter out empty statements and pure comment lines
        if (!s) return false;
        if (s.startsWith('--') && !s.includes('\n')) return false;
        return true;
      })
      .map(s => {
        // Remove comment-only lines but keep the statement
        return s.split('\n')
          .filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith('--');
          })
          .join('\n')
          .trim();
      })
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
      console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);

      try {
        // Use the postgres REST API endpoint directly
        const response = await fetch(
          `${supabaseUrl}/rest/v1/rpc/exec_sql`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ query: statement + ';' })
          }
        );

        if (!response.ok) {
          // This might fail because exec_sql doesn't exist, which is expected
          // Let's try a different approach - using the PostgREST API directly
          console.log('  exec_sql not available, trying direct SQL execution...');

          // For ALTER TABLE and CREATE INDEX, we need to use Supabase's database API
          // Since we can't execute DDL via REST API, let's document what needs to be done
          console.log('  ✓ Statement prepared (needs manual execution in Supabase SQL Editor)');
        } else {
          const _data = await response.json();
          console.log('  ✓ Statement executed successfully');
        }
      } catch (err) {
        console.log('  ⚠ Statement needs manual execution:', err.message);
      }
    }

    console.log('\n---');
    console.log('Verifying columns by querying booths table...\n');

    // Try to query the booths table to see if columns exist
    const { data: _tableInfo, error: infoError } = await supabase
      .from('booths')
      .select('geocode_match_score, geocode_validation_issues, geocode_validated_at, needs_geocode_review')
      .limit(1);

    if (infoError) {
      console.error('Error querying new columns (they may not exist yet):', infoError.message);
      console.log('\n📋 MANUAL MIGRATION REQUIRED:');
      console.log('Please run the following SQL in Supabase SQL Editor:\n');
      console.log('='.repeat(80));
      console.log(sql);
      console.log('='.repeat(80));
    } else {
      console.log('✓ Successfully queried new columns!');
      console.log('✓ Migration appears to have been applied');

      // Try to get a sample row to show column structure
      const { data: sample } = await supabase
        .from('booths')
        .select('id, name, geocode_match_score, geocode_validation_issues, geocode_validated_at, needs_geocode_review')
        .limit(1);

      if (sample && sample.length > 0) {
        console.log('\nSample row showing new columns:');
        console.log(JSON.stringify(sample[0], null, 2));
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

runMigration();
