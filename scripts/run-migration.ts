import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(
      process.cwd(),
      'supabase/migrations/20251208_add_geocode_validation_fields.sql'
    );

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    console.log('Migration SQL loaded successfully');
    console.log('---');

    console.log('Executing migration...');
    const { data: _data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Migration failed:', error);

      // Try alternative approach: execute via REST API directly
      console.log('\nTrying alternative approach: splitting SQL statements...');
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.startsWith('COMMENT ON')) {
          // Skip comments for now, they're not critical
          console.log('Skipping comment statement');
          continue;
        }

        console.log(`Executing: ${statement.substring(0, 60)}...`);
        const { error: stmtError } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (stmtError) {
          console.error(`Statement failed: ${stmtError.message}`);
        } else {
          console.log('Statement executed successfully');
        }
      }
    } else {
      console.log('Migration executed successfully!');
    }

    // Verify the columns were added
    console.log('\n---');
    console.log('Verifying columns were added...');

    const { data: tableInfo, error: infoError } = await supabase
      .from('booths')
      .select('*')
      .limit(1);

    if (infoError) {
      console.error('Failed to query booths table:', infoError);
    } else {
      console.log('\nSuccessfully queried booths table');
      if (tableInfo && tableInfo.length > 0) {
        const columns = Object.keys(tableInfo[0]);
        const newColumns = [
          'geocode_match_score',
          'geocode_validation_issues',
          'geocode_validated_at',
          'needs_geocode_review'
        ];

        console.log('\nChecking for new columns:');
        newColumns.forEach(col => {
          const exists = columns.includes(col);
          console.log(`  ${col}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
        });
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

runMigration();
