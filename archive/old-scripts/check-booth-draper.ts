import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBooth() {
  console.log('🔍 Checking for booth with slug: kmart-7624-draper\n');

  const { data, error } = await supabase
    .from('booths')
    .select('id, name, slug, city, country, latitude, longitude')
    .eq('slug', 'kmart-7624-draper')
    .single();

  if (error) {
    console.log('❌ Error:', error.message);
    console.log('Code:', error.code);
    console.log('Details:', error.details);
  } else if (data) {
    console.log('✅ Booth EXISTS in database:');
    console.log('   ID:', data.id);
    console.log('   Name:', data.name);
    console.log('   Slug:', data.slug);
    console.log('   Location:', data.city, data.country);
    console.log('   Coordinates:', data.latitude, data.longitude);
  } else {
    console.log('❌ Booth NOT FOUND with slug: kmart-7624-draper');
  }

  // Also check with anon key (what the production site uses)
  console.log('\n🔍 Now testing with ANON key (production behavior):\n');

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const anonSupabase = createClient(supabaseUrl, anonKey);

  const { data: anonData, error: anonError } = await anonSupabase
    .from('booths')
    .select('id, name, slug, city, country')
    .eq('slug', 'kmart-7624-draper')
    .single();

  if (anonError) {
    console.log('❌ ANON KEY Error:', anonError.message);
    console.log('Code:', anonError.code);
    console.log('Details:', anonError.details);
    console.log('\n⚠️  THIS IS THE PROBLEM - Production cannot read booths with anon key!');
  } else if (anonData) {
    console.log('✅ ANON KEY Success - booth readable:');
    console.log('   ID:', anonData.id);
    console.log('   Name:', anonData.name);
  } else {
    console.log('❌ ANON KEY: No data returned');
  }
}

checkBooth().catch(console.error);
