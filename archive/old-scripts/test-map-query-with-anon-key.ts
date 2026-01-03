import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// This mimics EXACTLY what the map page does
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

async function testMapQuery() {
  console.log('Testing map query with ANON key (same as browser)...\n');

  //Exactly the same query as map page line 54
  let query = supabase.from('booths').select('*').limit(10000);

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`✅ Query returned: ${data?.length || 0} booths`);
    console.log(`Expected: 1262 booths`);

    if ((data?.length || 0) < 1262) {
      console.log(`\n❌ PROBLEM: Only got ${data?.length} booths instead of 1262!`);
      console.log('This confirms the map page issue.');
    } else {
      console.log('\n✅ Query returns all booths correctly!');
    }
  }
}

testMapQuery().catch(console.error);
