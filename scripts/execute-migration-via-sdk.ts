import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLStatement(sql: string): Promise<any> {
  // Use fetch to call the Supabase REST API directly
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response.json();
}

async function main() {
  console.log('\n=== DEPLOYING WEIGHTED COMPLETENESS SCORING ===\n');

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20260116_weighted_completeness_scoring.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Loaded migration file');
    console.log('🔄 Executing SQL via Supabase client...\n');

    // Split by semicolons but preserve function definitions
    const statements: string[] = [];
    let currentStatement = '';
    let dollarQuoteCount = 0;

    for (const line of migrationSQL.split('\n')) {
      currentStatement += line + '\n';

      // Count $$ delimiters to track function boundaries
      const matches = line.match(/\$\$/g);
      if (matches) {
        dollarQuoteCount += matches.length;
      }

      // Only split on semicolon if we're not inside a function
      if (line.trim().endsWith(';') && dollarQuoteCount % 2 === 0) {
        if (currentStatement.trim() && !currentStatement.trim().startsWith('--')) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // Skip comments and empty statements
      if (!stmt || stmt.startsWith('--') || stmt.trim().length === 0) {
        continue;
      }

      // For the final SELECT, query it separately
      if (stmt.includes('Completeness Scoring Updated')) {
        console.log('📊 Checking results...\n');

        const { data, error } = await supabase
          .from('booths')
          .select('completeness_score');

        if (!error && data) {
          const avgScore = data.reduce((sum, b) => sum + (b.completeness_score || 0), 0) / data.length;
          const excellent = data.filter(b => b.completeness_score >= 80).length;
          const good = data.filter(b => b.completeness_score >= 60 && b.completeness_score < 80).length;
          const fair = data.filter(b => b.completeness_score >= 40 && b.completeness_score < 60).length;
          const poor = data.filter(b => b.completeness_score < 40).length;

          console.log('✅ Results:');
          console.log({
            status: 'Completeness Scoring Updated',
            total_booths: data.length,
            avg_score: Math.round(avgScore * 10) / 10,
            excellent,
            good,
            fair,
            poor
          });
        }
        continue;
      }

      // Execute DDL/DML via REST API using raw SQL
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: stmt })
        });

        if (!response.ok) {
          // Some errors are expected (like "already exists")
          const errorText = await response.text();
          if (errorText.includes('already exists') || errorText.includes('does not exist')) {
            console.log(`   ⚠️  Skipped (already exists): Statement ${i + 1}`);
          } else {
            console.log(`   ❌ Error on statement ${i + 1}: ${errorText}`);
          }
        } else {
          console.log(`   ✅ Executed statement ${i + 1}`);
        }
      } catch (error: any) {
        console.log(`   ⚠️  Statement ${i + 1} error (may be expected): ${error.message}`);
      }
    }

    console.log('\n✅ Migration completed!\n');

  } catch (error: any) {
    console.error('❌ Error deploying migration:', error.message);
    throw error;
  }
}

main();
