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
    console.log('Migration SQL loaded successfully\n');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        if (!s) return false;
        const lines = s.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed && !trimmed.startsWith('--');
        });
        return lines.length > 0;
      })
      .map(s => {
        return s.split('\n')
          .filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith('--');
          })
          .join('\n')
          .trim();
      })
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} SQL statements\n`);

    // Try executing via a custom edge function approach
    // We'll use the postgres client from Supabase edge runtime
    console.log('Creating temporary edge function to execute migration...\n');

    const _edgeFunctionCode = `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { sql } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Execute SQL using postgres
    // Note: This won't work via REST API, but we're trying
    const { data, error } = await supabase.rpc('exec', { query: sql })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    )
  }
})`;

    console.log('Edge function approach not feasible for DDL statements.\n');
    console.log('DDL statements (ALTER TABLE, CREATE INDEX, etc.) require direct database access.');
    console.log('The Supabase REST API and Edge Functions cannot execute DDL statements.\n');

    console.log('=' .repeat(80));
    console.log('MIGRATION EXECUTION REQUIRED');
    console.log('='.repeat(80));
    console.log('\nThe migration must be run manually via the Supabase SQL Editor.\n');
    console.log('Steps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new');
    console.log('2. Copy the SQL below and paste it into the editor');
    console.log('3. Click "Run" to execute the migration');
    console.log('4. Run this script again to verify the columns were added\n');
    console.log('='.repeat(80));
    console.log('SQL TO EXECUTE:');
    console.log('='.repeat(80));
    console.log(sql);
    console.log('='.repeat(80));

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

runMigration();
