import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk'
);

async function fixSchema() {
  console.log('Adding enriched_at column to booths table...');

  // Execute the SQL directly
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE booths ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMP WITH TIME ZONE;
      CREATE INDEX IF NOT EXISTS idx_booths_enriched_at ON booths(enriched_at);
    `
  });

  if (error) {
    console.error('❌ Error:', error.message);
    console.error('Trying alternative approach...');

    // Try using the postgres client directly via connection string
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execPromise = promisify(exec);

    try {
      const result = await execPromise(
        `PGPASSWORD='Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk' psql "postgresql://postgres.tmgbmcbwfkvmylmfpkzy:Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk@db.tmgbmcbwfkvmylmfpkzy.supabase.co:5432/postgres?sslmode=require" -c "ALTER TABLE booths ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMP WITH TIME ZONE; CREATE INDEX IF NOT EXISTS idx_booths_enriched_at ON booths(enriched_at);"`
      );
      console.log('✅ Schema updated successfully via psql!');
      console.log(result.stdout);
    } catch (psqlError) {
      console.error('❌ psql also failed:', psqlError.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Schema updated successfully!');
    console.log('Data:', data);
  }
}

fixSchema();
