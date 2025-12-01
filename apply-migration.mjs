import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function runMigration() {
  console.log('==================================================');
  console.log('Running AI-Generated Images Migration');
  console.log('==================================================\n');

  try {
    // Step 1: Verify booths table exists
    console.log('Step 1: Verifying booths table...');
    const { data: existingBooths, error: verifyError } = await supabase
      .from('booths')
      .select('id')
      .limit(1);

    if (verifyError) {
      console.error('Error: Cannot access booths table:', verifyError.message);
      console.log('\nPlease run the migration manually using the Supabase Dashboard:');
      console.log('URL: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new');
      return;
    }
    console.log('✓ Booths table accessible\n');

    // Step 2: Check if columns already exist
    console.log('Step 2: Checking if migration is needed...');
    const { data: checkData, error: checkError } = await supabase
      .from('booths')
      .select('ai_generated_image_url, ai_image_prompt, ai_image_generated_at')
      .limit(1);

    if (!checkError) {
      console.log('✓ Migration columns already exist!');
      console.log('✓ ai_generated_image_url column: EXISTS');
      console.log('✓ ai_image_prompt column: EXISTS');
      console.log('✓ ai_image_generated_at column: EXISTS\n');

      // Verify storage bucket
      console.log('Step 3: Verifying storage bucket...');
      const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();

      if (bucketError) {
        console.error('Warning: Cannot verify storage bucket:', bucketError.message);
      } else {
        const boothImagesBucket = buckets.find(b => b.id === 'booth-images');
        if (boothImagesBucket) {
          console.log('✓ booth-images storage bucket: EXISTS');
          console.log(`  Public: ${boothImagesBucket.public}`);
        } else {
          console.log('⚠ booth-images storage bucket: NOT FOUND');
          console.log('  You may need to create it manually');
        }
      }

      console.log('\n==================================================');
      console.log('Migration Status: ALREADY APPLIED');
      console.log('==================================================\n');
      return;
    }

    // If we get here, columns don't exist yet
    console.log('⚠ Migration columns do not exist yet');
    console.log('  Error checking columns:', checkError.message);
    console.log('\nTo apply this migration, please:');
    console.log('1. Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new');
    console.log('2. Copy the SQL from: supabase/migrations/20250130_add_ai_generated_images.sql');
    console.log('3. Paste and click "Run"\n');

    console.log('Or use the Supabase CLI with database password:');
    console.log('  npx supabase db push --db-url "postgres://postgres:[PASSWORD]@db.tmgbmcbwfkvmylmfpkzy.supabase.co:5432/postgres"\n');

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

runMigration();
