/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

async function executeMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  console.log('Reading migration file...');
  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/20251208_add_geocode_validation_fields.sql'
  );

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Execute each statement individually using fetch
  const statements = [
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocode_match_score INTEGER",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocode_validation_issues TEXT[]",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocode_validated_at TIMESTAMPTZ",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS needs_geocode_review BOOLEAN DEFAULT FALSE",
    "CREATE INDEX IF NOT EXISTS idx_booths_needs_geocode_review ON booths(needs_geocode_review) WHERE needs_geocode_review = TRUE",
    "CREATE INDEX IF NOT EXISTS idx_booths_low_confidence_geocode ON booths(geocode_confidence) WHERE geocode_confidence IN ('low', 'reject')",
  ];

  console.log(`\nAttempting to execute ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`[${i + 1}/${statements.length}] ${stmt.substring(0, 60)}...`);

    try {
      // Try using pg wire protocol via HTTP tunnel
      // This is a workaround since we can't use psql directly
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ sql: stmt })
        }
      );

      if (response.ok) {
        console.log('  ✓ Success');
      } else {
        const error = await response.text();
        console.log(`  ✗ Failed: ${error}`);
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('MIGRATION CANNOT BE EXECUTED VIA API');
  console.log('='.repeat(80));
  console.log('\nSupabase does not allow DDL execution via REST API for security reasons.');
  console.log('You must execute the migration via one of these methods:\n');
  console.log('1. Supabase SQL Editor (Web UI):');
  console.log('   https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new\n');
  console.log('2. Direct psql connection (if DNS resolves):');
  console.log('   psql <connection-string> < supabase/migrations/20251208_add_geocode_validation_fields.sql\n');
  console.log('3. Supabase CLI:');
  console.log('   supabase db push\n');
  console.log('=' .repeat(80));
  console.log('\nCopy this SQL and paste into Supabase SQL Editor:\n');
  console.log('='.repeat(80));
  console.log(sql);
  console.log('='.repeat(80));
}

executeMigration();
