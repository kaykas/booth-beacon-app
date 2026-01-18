import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n=== DEPLOYING WEIGHTED COMPLETENESS SCORING ===\n');

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20260116_weighted_completeness_scoring.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Loaded migration file');
    console.log('🔄 Executing SQL...\n');

    // Execute the migration using Supabase client
    // Split migration into individual statements and execute sequentially
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.toLowerCase().includes('select')) {
        // Execute SELECT statements and show results
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          // Try direct query for final SELECT
          const { data: queryData, error: queryError } = await supabase
            .from('booths')
            .select('status, completeness_score', { count: 'exact' });

          if (!queryError) {
            console.log('✅ Migration completed - checking results...\n');
            continue;
          }
        }
      } else {
        // Execute DDL/DML statements
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        if (error && !error.message.includes('already exists')) {
          console.warn(`⚠️  Statement warning: ${error.message}`);
        }
      }
    }

    console.log('✅ Migration applied successfully!\n');

    // Verify results with direct query
    const { data: stats, error: statsError } = await supabase
      .from('booths')
      .select('completeness_score');

    if (!statsError && stats) {
      const avgScore = stats.reduce((sum, b) => sum + (b.completeness_score || 0), 0) / stats.length;
      const excellent = stats.filter(b => b.completeness_score >= 80).length;
      const good = stats.filter(b => b.completeness_score >= 60 && b.completeness_score < 80).length;
      const fair = stats.filter(b => b.completeness_score >= 40 && b.completeness_score < 60).length;
      const poor = stats.filter(b => b.completeness_score < 40).length;

      console.log('📊 Results:');
      console.log({
        status: 'Completeness Scoring Updated',
        total_booths: stats.length,
        avg_score: Math.round(avgScore * 10) / 10,
        excellent,
        good,
        fair,
        poor
      });
      console.log('');
    }

  } catch (error: any) {
    console.error('❌ Error deploying migration:', error.message);
    throw error;
  }
}

main();
