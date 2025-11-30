import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkBooth() {
  console.log('\n🔍 Checking booth: kmart-7624-draper\n');

  const { data, error } = await supabase
    .from('booths')
    .select('id, name, slug, city, country')
    .eq('slug', 'kmart-7624-draper')
    .single();

  if (error) {
    console.log('❌ Error:', error.message);
    console.log('Code:', error.code);
  } else if (data) {
    console.log('✅ Booth EXISTS:');
    console.log('   ID:', data.id);
    console.log('   Name:', data.name);
    console.log('   Slug:', data.slug);
    console.log('   Location:', data.city, data.country);
  } else {
    console.log('❌ Booth NOT FOUND with slug: kmart-7624-draper');
  }
}

checkBooth().catch(console.error);
