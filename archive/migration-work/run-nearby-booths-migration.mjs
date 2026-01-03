import { readFileSync } from 'fs';

const PROJECT_REF = 'tmgbmcbwfkvmylmfpkzy';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_7e8b3b7e466f7cf341bb1c67106c7f98786edb4d';

console.log('🔧 Running nearby booths function migration...\n');

const sql = readFileSync('./supabase/migrations/20251220_add_nearby_booths_function.sql', 'utf8');

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
  console.log('Functions created:');
  console.log('- calculate_distance() - Haversine formula for distance calculation');
  console.log('- get_nearby_booths() - Returns booths within radius');

} catch (error) {
  console.error('❌ Error running migration:', error);
  process.exit(1);
}
