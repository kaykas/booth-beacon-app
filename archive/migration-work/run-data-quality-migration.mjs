// Run data quality cleanup migration
import { readFileSync } from 'fs';

const SUPABASE_ACCESS_TOKEN = 'sbp_7e8b3b7e466f7cf341bb1c67106c7f98786edb4d';
const PROJECT_REF = 'tmgbmcbwfkvmylmfpkzy';

async function runMigration() {
  const sql = readFileSync('./supabase/migrations/20251220_data_quality_cleanup.sql', 'utf8');

  console.log('🧹 Running data quality cleanup migration...');
  console.log('This will:');
  console.log('  1. Add needs_verification column');
  console.log('  2. Clean up Lomography photo metadata');
  console.log('  3. Clear incorrect operator names');
  console.log('  4. Flag vague addresses');
  console.log('  5. Mark old data as unverified');
  console.log('');

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Migration failed (${response.status}):`, errorText);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration completed successfully!');
    console.log('');

    // Get stats on what changed
    console.log('📊 Fetching updated stats...');
    const statsResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            SELECT
              COUNT(*) as total_booths,
              COUNT(*) FILTER (WHERE needs_verification = TRUE) as needs_verification_count,
              COUNT(*) FILTER (WHERE status = 'unverified') as unverified_count,
              COUNT(*) FILTER (WHERE description IS NULL) as cleared_descriptions,
              COUNT(*) FILTER (WHERE operator_name IS NULL AND source_primary = 'Lomography') as cleared_operators
            FROM booths;
          `
        })
      }
    );

    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      if (stats && stats.length > 0) {
        const s = stats[0];
        console.log('');
        console.log('📈 Results:');
        console.log(`  Total booths: ${s.total_booths}`);
        console.log(`  Flagged for verification: ${s.needs_verification_count}`);
        console.log(`  Marked as unverified: ${s.unverified_count}`);
        console.log(`  Descriptions cleared: ${s.cleared_descriptions}`);
        console.log(`  Operator names cleared: ${s.cleared_operators}`);
      }
    }

    console.log('');
    console.log('✅ Data quality cleanup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigration();
