import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

// Supabase direct connection (not pooler)
const pool = new Pool({
  host: 'db.tmgbmcbwfkvmylmfpkzy.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'XqzW8b*k9LKDLmfpkzy',
  ssl: {
    rejectUnauthorized: false
  },
  max: 1,
});

async function main() {
  console.log('\n=== DEPLOYING WEIGHTED COMPLETENESS SCORING ===\n');

  const client = await pool.connect();

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20260116_weighted_completeness_scoring.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Loaded migration file');
    console.log('🔄 Executing SQL...\n');

    // Execute the entire migration
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!\n');

    // Verify results
    const result = await client.query(`
      SELECT
        'Completeness Scoring Updated' as status,
        COUNT(*) as total_booths,
        ROUND(AVG(completeness_score)::numeric, 1) as avg_score,
        COUNT(*) FILTER (WHERE completeness_score >= 80) as excellent,
        COUNT(*) FILTER (WHERE completeness_score BETWEEN 60 AND 79) as good,
        COUNT(*) FILTER (WHERE completeness_score BETWEEN 40 AND 59) as fair,
        COUNT(*) FILTER (WHERE completeness_score < 40) as poor
      FROM booths
    `);

    console.log('📊 Results:');
    console.log(result.rows[0]);
    console.log('');

  } catch (error: any) {
    console.error('❌ Error deploying migration:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
