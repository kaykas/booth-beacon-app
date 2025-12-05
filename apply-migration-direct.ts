import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function applyMigration() {
  console.log('🔧 Applying database migration via REST API...\n');

  const statements = [
    'ALTER TABLE booths ADD COLUMN IF NOT EXISTS enrichment_attempted_at timestamptz;',
    'ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;',
    'ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_place_id text;',
    'CREATE INDEX IF NOT EXISTS idx_booths_enrichment_attempted ON booths(enrichment_attempted_at) WHERE enrichment_attempted_at IS NOT NULL;',
    'CREATE INDEX IF NOT EXISTS idx_booths_geocoded ON booths(geocoded_at) WHERE geocoded_at IS NOT NULL;',
    'CREATE INDEX IF NOT EXISTS idx_booths_google_place_id ON booths(google_place_id) WHERE google_place_id IS NOT NULL;'
  ];

  for (const sql of statements) {
    console.log(`Executing: ${sql.substring(0, 60)}...`);

    try {
      // Use fetch to hit the SQL endpoint directly
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ query: sql })
        }
      );

      if (response.ok) {
        console.log('✓ Success');
      } else {
        console.log(`⚠️  Response: ${response.status} - ${await response.text()}`);
      }
    } catch (error) {
      console.log(`⚠️  Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  console.log('\n---');
  console.log('⚠️  Direct SQL execution requires dashboard access.');
  console.log('Please apply this SQL manually via Supabase Dashboard > SQL Editor:');
  console.log('');
  statements.forEach(s => console.log(s));
}

applyMigration();
