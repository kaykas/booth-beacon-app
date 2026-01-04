#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('🚀 Applying Street View Migration to Production...\n');

  // Read the migration file
  const migrationPath = '/Users/jkw/Projects/booth-beacon-app/supabase/migrations/20260102_add_street_view_validation.sql';
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration SQL:');
  console.log(sql);
  console.log('\n' + '='.repeat(80) + '\n');

  // Execute each statement separately
  const statements = [
    'ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_available BOOLEAN DEFAULT NULL',
    'ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_panorama_id TEXT',
    'ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_distance_meters NUMERIC(10, 2)',
    'ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_validated_at TIMESTAMPTZ',
    'ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_heading NUMERIC(5, 2)',
  ];

  console.log('Executing ALTER TABLE statements...\n');

  for (const stmt of statements) {
    console.log(`Executing: ${stmt.substring(0, 80)}...`);
    const { error } = await supabase.rpc('exec_sql', { sql: stmt }).single();

    if (error) {
      console.error(`❌ Error:`, error);
    } else {
      console.log('   ✅ Success');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 Verification - Checking if columns exist...\n');

  // Verify columns were added
  const { data, error } = await supabase
    .from('booths')
    .select('id, street_view_available, street_view_panorama_id, street_view_distance_meters, street_view_validated_at, street_view_heading')
    .limit(1);

  if (error) {
    console.error('❌ Verification failed:', error.message);
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('\n⚠️  Migration needs to be applied via Supabase SQL Editor:');
      console.log('   1. Go to https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new');
      console.log('   2. Copy and paste the migration SQL above');
      console.log('   3. Click "Run" to apply');
    }
  } else {
    console.log('✅ Migration applied successfully!');
    console.log('   New Street View columns are now available in booths table\n');
    console.log('📋 Column Status:');
    console.log('   • street_view_available: boolean');
    console.log('   • street_view_panorama_id: text');
    console.log('   • street_view_distance_meters: numeric');
    console.log('   • street_view_validated_at: timestamptz');
    console.log('   • street_view_heading: numeric');
  }
}

main().catch(console.error);
