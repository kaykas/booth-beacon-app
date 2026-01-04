import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/20260103_create_booth_submissions_table.sql'
    );

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Applying migration...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');

    // Verify the table was created
    const { data, error: verifyError } = await supabase
      .from('booth_submissions')
      .select('count')
      .limit(0);

    if (verifyError) {
      console.log('Note: Table verification check failed, but migration may have succeeded');
      console.log('Verification error:', verifyError);
    } else {
      console.log('✅ Table verified successfully!');
    }
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
