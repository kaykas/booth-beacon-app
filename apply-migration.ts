import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk'
);

async function applyMigration() {
  console.log('Applying booth enrichments migration...\n');

  // Execute each ALTER TABLE statement separately
  const statements = [
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS phone TEXT",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS email TEXT",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS website TEXT",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS instagram TEXT",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_place_id TEXT",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1)",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_user_ratings_total INTEGER",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_photos TEXT[]",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_enriched_at TIMESTAMP WITH TIME ZONE",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_business_status TEXT",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_formatted_address TEXT",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_phone TEXT",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_website TEXT",
    "ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_opening_hours JSONB",
  ];

  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 80)}...`);

    const { data, error } = await supabase.rpc('exec', { sql: statement });

    if (error && !error.message.includes('already exists')) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Success');
    }
  }

  console.log('\n✅ Migration complete!');
}

applyMigration().catch(console.error);
