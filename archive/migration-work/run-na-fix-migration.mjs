import { readFileSync } from 'fs';

const PROJECT_REF = 'tmgbmcbwfkvmylmfpkzy';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_7e8b3b7e466f7cf341bb1c67106c7f98786edb4d';

console.log('🔧 Running N/A booths fix migration...\n');

const sql = readFileSync('./supabase/migrations/20251220_fix_na_booths.sql', 'utf8');

try {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error('❌ Migration failed:', result);
    process.exit(1);
  }

  console.log('✅ Migration completed successfully!');
  console.log('\nResults:', JSON.stringify(result, null, 2));

} catch (error) {
  console.error('❌ Error running migration:', error);
  process.exit(1);
}
