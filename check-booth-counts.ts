import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkBoothCounts() {
  // Total active booths
  const { count: totalActive } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Booths with coordinates (can be shown on map)
  const { count: withCoords } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  console.log('=== BOOTH COUNTS ===');
  console.log('Total active booths:', totalActive);
  console.log('Booths with coordinates (mappable):', withCoords);
  console.log('Booths without coordinates:', (totalActive || 0) - (withCoords || 0));
}

checkBoothCounts().catch(console.error);
