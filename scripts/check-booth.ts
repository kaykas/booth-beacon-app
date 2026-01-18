import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkBooth() {
  const { data, error } = await supabase
    .from('booths')
    .select('id, name, city, state, description, completeness_score, status')
    .or('name.ilike.%heebie%,city.ilike.%petaluma%');

  if (error) {
    console.log('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No booth found matching "heebie" or in Petaluma');
    return;
  }

  data.forEach(booth => {
    console.log('\n=== BOOTH ===');
    console.log('Name:', booth.name);
    console.log('Location:', `${booth.city}, ${booth.state}`);
    console.log('Status:', booth.status);
    console.log('Description:', booth.description || 'NULL - NO DESCRIPTION');
    console.log('Completeness Score:', booth.completeness_score);
  });

  const boothsWithoutDesc = data.filter(b => !b.description || b.description === '');
  console.log('\n=== SUMMARY ===');
  console.log(`Total booths found: ${data.length}`);
  console.log(`Booths without description: ${boothsWithoutDesc.length}`);

  if (boothsWithoutDesc.length > 0) {
    console.log('\nBooths needing descriptions:');
    boothsWithoutDesc.forEach(b => console.log(`  - ${b.name} (${b.city})`));
  }
}

checkBooth();
