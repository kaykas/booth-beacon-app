/**
 * Emergency fix for Heebe Jeebe booth
 * Correct address: 46 Kentucky St, Petaluma, CA 94952
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixHeebeJeebe() {
  console.log('🔧 Fixing Heebe Jeebe General Store booth...\n');

  // First, check current data
  const { data: current, error: fetchError } = await supabase
    .from('booths')
    .select('id, name, slug, address, city, state, country, latitude, longitude')
    .eq('slug', 'heebe-jeebe-general-store-petaluma-1')
    .single();

  if (fetchError) {
    console.error('❌ Error fetching booth:', fetchError);
    process.exit(1);
  }

  if (!current) {
    console.error('❌ Booth not found!');
    process.exit(1);
  }

  console.log('📊 Current data:');
  console.log(`   Name: ${current.name}`);
  console.log(`   Address: ${current.address}`);
  console.log(`   City: ${current.city}, ${current.state}, ${current.country}`);
  console.log(`   Coordinates: ${current.latitude}, ${current.longitude}`);
  console.log('');

  // Geocode the correct address using Nominatim
  const correctAddress = '46 Kentucky St, Petaluma, CA 94952';
  console.log('🌐 Geocoding correct address:', correctAddress);

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(correctAddress)}`;
  const response = await fetch(nominatimUrl, {
    headers: {
      'User-Agent': 'BoothBeacon/1.0',
    },
  });

  await new Promise(resolve => setTimeout(resolve, 1100)); // Respect rate limit

  const results = await response.json();

  if (!results || results.length === 0) {
    console.error('❌ No geocoding results found!');
    process.exit(1);
  }

  const result = results[0];
  const newLat = parseFloat(result.lat);
  const newLng = parseFloat(result.lon);

  console.log(`   Found coordinates: ${newLat}, ${newLng}`);
  console.log(`   Display name: ${result.display_name}`);
  console.log('');

  // Update the booth
  console.log('💾 Updating booth in database...');

  const { error: updateError } = await supabase
    .from('booths')
    .update({
      address: '46 Kentucky St',
      city: 'Petaluma',
      state: 'CA',
      country: 'United States',
      postal_code: '94952',
      latitude: newLat,
      longitude: newLng,
      geocode_provider: 'nominatim',
      geocode_confidence: 'high',
      geocode_validated_at: new Date().toISOString(),
      needs_geocode_review: false,
    })
    .eq('id', current.id);

  if (updateError) {
    console.error('❌ Error updating booth:', updateError);
    process.exit(1);
  }

  console.log('✅ Heebe Jeebe booth updated successfully!');
  console.log(`   New address: 46 Kentucky St, Petaluma, CA 94952`);
  console.log(`   New coordinates: ${newLat}, ${newLng}`);
  console.log('');
  console.log('🔗 Check it out: https://boothbeacon.org/booth/heebe-jeebe-general-store-petaluma-1');
}

fixHeebeJeebe();
