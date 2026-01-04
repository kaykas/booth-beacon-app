import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkChicagoBooths() {
  console.log('Checking Chicago booths country field...\n');

  const { data, error } = await supabase
    .from('booths')
    .select('name, country, state, status, is_operational, latitude, longitude')
    .eq('city', 'Chicago')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data?.length || 0} Chicago booths (showing first 10):\n`);

  data?.forEach((booth, idx) => {
    console.log(`${idx + 1}. ${booth.name}`);
    console.log(`   Country: ${booth.country}`);
    console.log(`   State: ${booth.state}`);
    console.log(`   Status: ${booth.status} | Operational: ${booth.is_operational}`);
    console.log(`   Coordinates: ${booth.latitude ? 'Yes' : 'No'}`);
    console.log();
  });

  // Check country variations
  const { data: countries } = await supabase
    .from('booths')
    .select('country')
    .eq('city', 'Chicago');

  const uniqueCountries = [...new Set(countries?.map((b) => b.country))];
  console.log('Unique country values for Chicago:');
  uniqueCountries.forEach((c) => console.log(`  - "${c}"`));
}

checkChicagoBooths().catch(console.error);
