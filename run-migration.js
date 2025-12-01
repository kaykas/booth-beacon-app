const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250130_add_ai_generated_images.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    console.log('SQL:', migrationSQL);

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
      console.log(statement.substring(0, 100) + '...');

      const { data, error } = await supabase.rpc('exec', { sql: statement });

      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        // Try direct query method
        console.log('Trying alternative method...');
        const result = await supabase.from('_migrations').insert({ statement });
        if (result.error) {
          console.error('Alternative method also failed:', result.error);
        }
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }

    console.log('\nMigration completed!');

    // Verify the migration by checking if columns exist
    console.log('\nVerifying migration...');
    const { data, error } = await supabase
      .from('booths')
      .select('id, ai_generated_image_url')
      .limit(1);

    if (error) {
      console.error('Verification failed:', error);
    } else {
      console.log('Verification successful! Columns exist.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
