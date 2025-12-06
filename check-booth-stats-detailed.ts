import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkBoothStats() {
  console.log('=== DETAILED BOOTH COUNT ANALYSIS ===\n');

  // 1. All active booths (no other filters)
  const { count: allActive } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  console.log('1. Total active booths (no filters):', allActive);

  // 2. Active + operational booths
  const { count: activeOperational } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('is_operational', true);

  console.log('2. Active + operational booths:', activeOperational);

  // 3. Active + with coordinates
  const { count: activeWithCoords } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  console.log('3. Active + with coordinates:', activeWithCoords);

  // 4. Active + operational + with coordinates (what homepage shows)
  const { count: homepageCount } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('is_operational', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  console.log('4. Active + operational + coordinates (HOMEPAGE):', homepageCount);

  console.log('\n=== ANALYSIS ===');
  console.log(`Booths lost due to is_operational filter: ${(allActive || 0) - (activeOperational || 0)}`);
  console.log(`Booths lost due to missing coordinates: ${(allActive || 0) - (activeWithCoords || 0)}`);
  console.log(`Total booths excluded from homepage: ${(allActive || 0) - (homepageCount || 0)}`);

  console.log('\n=== USER ISSUE ===');
  console.log(`User sees: ~${homepageCount} booths`);
  console.log(`Should see: ${allActive} booths (or ${activeOperational} if operational filter is desired)`);
}

checkBoothStats().catch(console.error);
