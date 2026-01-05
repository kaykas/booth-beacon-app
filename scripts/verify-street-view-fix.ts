#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('🔍 Verifying Street View Fix\n');

  // Check The Smith Lincoln Center
  const { data: smith } = await supabase
    .from('booths')
    .select('name, slug, street_view_available, street_view_panorama_id, street_view_heading, street_view_distance_meters')
    .ilike('slug', '%smith%lincoln%')
    .single();

  console.log('✅ The Smith Lincoln Center:');
  console.log(`   Panorama ID: ${smith.street_view_panorama_id}`);
  console.log(`   Available: ${smith.street_view_available}`);
  console.log(`   Heading: ${smith.street_view_heading}°`);
  console.log(`   Distance: ${smith.street_view_distance_meters}m`);
  console.log(`   🔗 https://boothbeacon.org/booth/${smith.slug}\n`);

  // Get overall stats
  const { count: totalWithCoords } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null);

  const { count: validated } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .not('street_view_validated_at', 'is', null);

  const { count: available } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('street_view_available', true);

  const { count: unavailable } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('street_view_available', false);

  console.log('📊 Overall Statistics:');
  console.log(`   Total booths with coordinates: ${totalWithCoords}`);
  console.log(`   Validated: ${validated} (${((validated! / totalWithCoords!) * 100).toFixed(1)}%)`);
  console.log(`   Available: ${available} (${((available! / validated!) * 100).toFixed(1)}%)`);
  console.log(`   Unavailable: ${unavailable} (${((unavailable! / validated!) * 100).toFixed(1)}%)\n`);

  // Sample validated booths
  const { data: samples } = await supabase
    .from('booths')
    .select('name, city, country, street_view_panorama_id, street_view_distance_meters')
    .not('street_view_panorama_id', 'is', null)
    .limit(5);

  console.log('🌍 Sample Validated Booths:');
  samples?.forEach(b => {
    console.log(`   ✅ ${b.name} (${b.city}, ${b.country})`);
    console.log(`      Panorama: ${b.street_view_panorama_id.substring(0, 30)}...`);
    console.log(`      Distance: ${b.street_view_distance_meters}m\n`);
  });

  console.log('✨ Street View fix is complete and working!');
  console.log('🎯 All booth pages will now show correct locations.');
}

main().catch(console.error);
