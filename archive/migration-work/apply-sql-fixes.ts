import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applySQLFixes() {
  console.log('\n🔧 Applying SQL fixes to Supabase...\n');

  // Read the SQL file
  const sqlContent = readFileSync('apply-all-fixes.sql', 'utf-8');

  // Split into individual statements (simplified - splits on semicolons not in strings)
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

  console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.trim().length === 0) {
      continue;
    }

    console.log(`\n[${i + 1}/${statements.length}] Executing...`);
    console.log(statement.substring(0, 100) + '...');

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        console.error('❌ Error:', error.message);
        errorCount++;
      } else {
        console.log('✅ Success');
        successCount++;

        // If this is a verification query, show the results
        if (data) {
          console.log('   Result:', JSON.stringify(data, null, 2));
        }
      }
    } catch (err: unknown) {
      console.error('❌ Exception:', err instanceof Error ? err.message : String(err));
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(60) + '\n');

  // Run final verification
  console.log('\n🔍 Running final verification...\n');

  // Check crawl_results table exists
  const { data: tableCheck } = await supabase
    .from('crawl_results')
    .select('*')
    .limit(1);

  if (tableCheck !== null) {
    console.log('✅ crawl_results table exists');
  } else {
    console.log('❌ crawl_results table not found');
  }

  // Count enabled/disabled sources
  const { count: enabledCount } = await supabase
    .from('crawl_sources')
    .select('*', { count: 'exact', head: true })
    .eq('enabled', true);

  const { count: disabledCount } = await supabase
    .from('crawl_sources')
    .select('*', { count: 'exact', head: true })
    .eq('enabled', false);

  console.log(`\n📈 Source Status:`);
  console.log(`   Enabled: ${enabledCount}`);
  console.log(`   Disabled: ${disabledCount}`);
  console.log(`   Total: ${(enabledCount || 0) + (disabledCount || 0)}`);

  console.log('\n✅ SQL fixes applied!\n');
}

applySQLFixes().catch(console.error);
