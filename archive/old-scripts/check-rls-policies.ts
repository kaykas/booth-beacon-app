import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// Legacy anon key from Supabase
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTExOTksImV4cCI6MjA3OTc2NzE5OX0.nVAPKx30OTNSaZ92Koeg_gUonm3Zols3FOTvfO5TrrA';

const supabase = createClient(supabaseUrl, supabaseKey);
const anonSupabase = createClient(supabaseUrl, anonKey);

async function checkRLS() {
  console.log('\n🔍 CHECKING RLS CONFIGURATION FOR BOOTHS TABLE\n');

  // Test with anon key (what production uses)
  console.log('=== TESTING WITH ANON KEY (Production behavior) ===\n');

  const { data: anonData, error: anonError } = await anonSupabase
    .from('booths')
    .select('id, name, slug')
    .limit(5);

  if (anonError) {
    console.log('❌ ANON KEY FAILED:');
    console.log('   Error:', anonError.message);
    console.log('   Code:', anonError.code);
    console.log('   Details:', anonError.details);
    console.log('\n⚠️  THIS IS WHY THE MAP AND BOOTH PAGES ARE BROKEN!');
  } else if (anonData) {
    console.log('✅ ANON KEY SUCCESS:');
    console.log('   Returned', anonData.length, 'booths');
    if (anonData.length > 0) {
      console.log('   Sample:', anonData[0].name);
    }
  }

  // Test with service role key (always works)
  console.log('\n=== TESTING WITH SERVICE ROLE KEY (Should always work) ===\n');

  const { data: serviceData, error: serviceError } = await supabase
    .from('booths')
    .select('id, name, slug')
    .limit(5);

  if (serviceError) {
    console.log('❌ SERVICE KEY FAILED:', serviceError.message);
  } else if (serviceData) {
    console.log('✅ SERVICE KEY SUCCESS:');
    console.log('   Returned', serviceData.length, 'booths');
  }

  // Check RLS policies directly
  console.log('\n=== CHECKING RLS POLICIES IN DATABASE ===\n');

  const { data: policies, error: policiesError } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles::text,
          cmd,
          qual
        FROM pg_policies
        WHERE tablename = 'booths'
        ORDER BY policyname;
      `
    });

  if (policiesError) {
    console.log('❌ Could not fetch policies:', policiesError.message);
  } else if (policies && policies.length > 0) {
    console.log('Found', policies.length, 'RLS policies:\n');
    policies.forEach((p: any, i: number) => {
      console.log(`${i + 1}. Policy: "${p.policyname}"`);
      console.log(`   Command: ${p.cmd}`);
      console.log(`   Roles: ${p.roles}`);
      console.log(`   Using clause: ${p.qual || '(no restriction)'}\n`);
    });
  } else {
    console.log('❌ NO RLS POLICIES FOUND!');
    console.log('   This means RLS is enabled but blocking all public access');
  }

  // Check if RLS is enabled
  const { data: rlsStatus, error: rlsError } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT relrowsecurity as rls_enabled
        FROM pg_class
        WHERE relname = 'booths'
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      `
    });

  if (!rlsError && rlsStatus && rlsStatus.length > 0) {
    console.log('=== RLS STATUS ===\n');
    console.log('RLS Enabled:', rlsStatus[0].rls_enabled === true ? 'YES' : 'NO');

    if (rlsStatus[0].rls_enabled === true && (!policies || policies.length === 0)) {
      console.log('\n⚠️  PROBLEM IDENTIFIED:');
      console.log('   RLS is ENABLED but there are NO policies allowing public reads!');
      console.log('   This blocks all anonymous access to the booths table.');
    }
  }
}

checkRLS().catch(console.error);
