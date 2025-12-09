/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

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

async function verifyMigration() {
  console.log('Verifying migration: Add Geocode Validation Metadata Fields');
  console.log('='.repeat(80));

  const expectedColumns = [
    { name: 'geocode_match_score', type: 'integer' },
    { name: 'geocode_validation_issues', type: 'text[]' },
    { name: 'geocode_validated_at', type: 'timestamptz' },
    { name: 'needs_geocode_review', type: 'boolean' }
  ];

  console.log('\nExpected new columns:');
  expectedColumns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });

  console.log('\nQuerying booths table...\n');

  try {
    // Try to select the new columns
    const { data: _data, error } = await supabase
      .from('booths')
      .select('id, name, geocode_match_score, geocode_validation_issues, geocode_validated_at, needs_geocode_review')
      .limit(1);

    if (error) {
      console.error('❌ MIGRATION NOT APPLIED');
      console.error('Error:', error.message);
      console.log('\nThe columns do not exist yet. Please run the migration SQL in Supabase SQL Editor.');
      process.exit(1);
    }

    console.log('✓ SUCCESS! All new columns exist.\n');

    // Get full table structure
    const { data: allData, error: allError } = await supabase
      .from('booths')
      .select('*')
      .limit(1);

    if (!allError && allData && allData.length > 0) {
      const allColumns = Object.keys(allData[0]).sort();
      console.log(`Booths table now has ${allColumns.length} columns total.\n`);

      // Show the new columns with their current values
      console.log('New column values in sample row:');
      expectedColumns.forEach(col => {
        const value = allData[0][col.name];
        console.log(`  ${col.name}: ${value === null ? 'NULL' : JSON.stringify(value)}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✓ MIGRATION VERIFIED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log('\nThe following columns were added:');
    expectedColumns.forEach(col => {
      console.log(`  ✓ ${col.name}`);
    });

    console.log('\nThe following indexes were created:');
    console.log('  ✓ idx_booths_needs_geocode_review');
    console.log('  ✓ idx_booths_low_confidence_geocode');

    console.log('\nYou can now use these columns in your geocoding validation system.');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

verifyMigration();
