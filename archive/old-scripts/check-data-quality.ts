import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkDataQuality() {
  // Get booth quality stats
  const { data: booths } = await supabase
    .from('booths')
    .select('id, name, address, phone, website, hours, photo_exterior_url, ai_preview_url, latitude, longitude')
    .eq('status', 'active');

  if (!booths) {
    console.log('No booths found');
    return;
  }

  let needsGeocoding = 0;
  let needsVenueData = 0;
  let needsImages = 0;

  booths.forEach(b => {
    if (!b.latitude || !b.longitude) needsGeocoding++;
    if (!b.address || !b.phone || !b.website) needsVenueData++;
    if (!b.photo_exterior_url && !b.ai_preview_url) needsImages++;
  });

  console.log('Data Quality Analysis:');
  console.log('====================');
  console.log('Total Active Booths:', booths.length);
  console.log('');
  console.log('Needs Enrichment:');
  console.log('- Missing Coordinates:', needsGeocoding, '(' + Math.round(needsGeocoding/booths.length*100) + '%)');
  console.log('- Missing Venue Data:', needsVenueData, '(' + Math.round(needsVenueData/booths.length*100) + '%)');
  console.log('- Missing Images:', needsImages, '(' + Math.round(needsImages/booths.length*100) + '%)');
  console.log('');
  console.log('Action Plan:');
  console.log('1. Run venue enrichment for', needsVenueData, 'booths');
  console.log('2. Run geocoding for', needsGeocoding, 'booths');
  console.log('3. Generate AI images for', needsImages, 'booths (Est. cost: $' + (needsImages * 0.04).toFixed(2) + ')');
}

checkDataQuality().catch(console.error);
