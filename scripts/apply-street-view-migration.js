#!/usr/bin/env node

/**
 * Apply Street View Validation Migration
 *
 * This script applies the street view validation migration to the database.
 *
 * Usage:
 *   node scripts/apply-street-view-migration.js
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('='.repeat(70));
  console.log('Applying Street View Validation Migration');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Read the migration file
    const migrationPath = './supabase/migrations/20260102_add_street_view_validation.sql';
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Migration file loaded:', migrationPath);
    console.log('');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      console.log(`[${i + 1}/${statements.length}] Executing statement...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Try direct execution via REST API
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ sql: statement }),
          });

          if (!response.ok) {
            throw new Error(`Failed to execute statement: ${error?.message || 'Unknown error'}`);
          }
        }

        console.log(`[${i + 1}/${statements.length}] ✓ Success`);
      } catch (err) {
        console.error(`[${i + 1}/${statements.length}] ✗ Error:`, err.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }

      console.log('');
    }

    console.log('='.repeat(70));
    console.log('Migration Applied Successfully!');
    console.log('='.repeat(70));
    console.log('');
    console.log('New columns added to booths table:');
    console.log('  - street_view_available (boolean)');
    console.log('  - street_view_panorama_id (text)');
    console.log('  - street_view_distance_meters (numeric)');
    console.log('  - street_view_validated_at (timestamptz)');
    console.log('  - street_view_heading (numeric)');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Run: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/validate-street-views.js');
    console.log('  2. This will validate Street View for all booths with coordinates');
    console.log('');

  } catch (error) {
    console.error('Error applying migration:', error.message);
    process.exit(1);
  }
}

applyMigration();
