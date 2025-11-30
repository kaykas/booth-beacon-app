import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBooth() {
  console.log('🔍 Checking for booth with slug: kmart-3405-minneapolis\n');

  const { data, error } = await supabase
    .from('booths')
    .select('id, name, slug, city, country, latitude, longitude')
    .eq('slug', 'kmart-3405-minneapolis')
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
    console.log('❌ Booth NOT FOUND with slug: kmart-3405-minneapolis');
  }
}

checkBooth().catch(console.error);
