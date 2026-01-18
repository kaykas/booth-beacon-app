import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

// Supabase connection details
const pool = new Pool({
  host: 'aws-0-us-west-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.tmgbmcbwfkvmylmfpkzy',
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

    // Execute the entire migration as a single transaction
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');

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
    await client.query('ROLLBACK');
    console.error('❌ Error deploying migration:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
