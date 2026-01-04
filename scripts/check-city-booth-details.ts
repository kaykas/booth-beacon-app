import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkCityDetails() {
  const cities = ['Berlin', 'Chicago', 'Los Angeles', 'New York', 'San Francisco'];

  console.log('City Booth Analysis');
  console.log('='.repeat(80));
  console.log();

  for (const city of cities) {
    console.log(`\n📍 ${city}`);
    console.log('-'.repeat(60));

    // Total booths
    const { count: total } = await supabase
      .from('booths')
      .select('id', { count: 'exact', head: true })
      .eq('city', city);

    console.log(`   Total booths: ${total || 0}`);

    // Active booths
    const { count: active } = await supabase
      .from('booths')
      .select('id', { count: 'exact', head: true })
      .eq('city', city)
      .eq('status', 'active');

    console.log(`   Active booths: ${active || 0}`);

    // With coordinates
    const { count: withCoords } = await supabase
      .from('booths')
      .select('id', { count: 'exact', head: true })
      .eq('city', city)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    console.log(`   With coordinates: ${withCoords || 0}`);

    // Active + operational + coords
    const { count: ready } = await supabase
      .from('booths')
      .select('id', { count: 'exact', head: true })
      .eq('city', city)
      .eq('status', 'active')
      .eq('is_operational', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    console.log(`   Ready for guide (active+operational+coords): ${ready || 0}`);

    // Sample of booths without coordinates
    const { data: needsGeocode } = await supabase
      .from('booths')
      .select('id, name, address')
      .eq('city', city)
      .or('latitude.is.null,longitude.is.null')
      .limit(5);

    if (needsGeocode && needsGeocode.length > 0) {
      console.log(`   \n   Booths needing geocoding (showing ${needsGeocode.length}):`);
      needsGeocode.forEach((booth) => {
        console.log(`     - ${booth.name} (${booth.address})`);
      });
    }
  }

  console.log('\n' + '='.repeat(80));
}

checkCityDetails().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
