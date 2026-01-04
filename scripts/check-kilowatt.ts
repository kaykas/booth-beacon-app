import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkKilowatt() {
  const { data, error } = await supabase
    .from('booths')
    .select('id,name,slug,latitude,longitude,city,address')
    .ilike('name', '%kilowatt%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data?.length || 0} Kilowatt booths:\n`);
  data?.forEach(booth => {
    console.log(`  ${booth.name} (${booth.slug})`);
    console.log(`    ID: ${booth.id}`);
    console.log(`    Address: ${booth.address}, ${booth.city}`);
    console.log(`    Coords: ${booth.latitude}, ${booth.longitude}\n`);
  });
}

checkKilowatt();
