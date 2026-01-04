import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTExOTksImV4cCI6MjA3OTc2NzE5OX0.nVAPKx30OTNSaZ92Koeg_gUonm3Zols3FOTvfO5TrrA'
);

async function testNearby() {
  const { data, error } = await supabase.rpc('get_nearby_booths', {
    p_latitude: 37.7749,
    p_longitude: -122.4194,
    p_radius_km: 50,
    p_limit: 3,
    p_exclude_booth_id: '00000000-0000-0000-0000-000000000000'
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} booths:\n`);
  data.forEach((booth: any) => {
    console.log(`  - ${booth.name} (${booth.distance_km}km away)`);
  });
}

testNearby();
