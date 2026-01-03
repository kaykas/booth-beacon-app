import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkBoothDataQuality() {
  console.log('\n📊 Analyzing Booth Data Quality...\n');

  // Get a sample of recent photobooth.net booths
  const { data: booths, error } = await supabase
    .from('booths')
    .select('*')
    .eq('source_primary', 'photobooth.net')
    .limit(5);

  if (error || !booths || booths.length === 0) {
    console.error('❌ Error fetching booths:', error);
    return;
  }

  console.log(`Analyzing ${booths.length} sample booths from photobooth.net:\n`);

  booths.forEach((booth, i) => {
    console.log(`\n${i + 1}. ${booth.name}`);
    console.log(`   Location: ${booth.city}, ${booth.state || booth.country}`);
    console.log('');
    console.log('   ✅ Data Available:');
    if (booth.machine_model) console.log(`      - Machine: ${booth.machine_model}`);
    if (booth.cost) console.log(`      - Cost: ${booth.cost}`);
    if (booth.status) console.log(`      - Status: ${booth.status}`);
    if (booth.is_operational !== null) console.log(`      - Operational: ${booth.is_operational}`);
    if (booth.latitude && booth.longitude) console.log(`      - Coordinates: ${booth.latitude}, ${booth.longitude}`);
    if (booth.description) console.log(`      - Description: ${booth.description.substring(0, 60)}...`);
    if (booth.hours) console.log(`      - Hours: ${booth.hours}`);
    if (booth.phone) console.log(`      - Phone: ${booth.phone}`);
    if (booth.website) console.log(`      - Website: ${booth.website}`);
    if (booth.instagram) console.log(`      - Instagram: ${booth.instagram}`);
    if (booth.google_rating) console.log(`      - Google Rating: ${booth.google_rating} (${booth.google_user_ratings_total} reviews)`);
    if (booth.ai_generated_image_url) console.log(`      - AI Image: Yes`);
    if (booth.accepts_cash) console.log(`      - Accepts Cash: ${booth.accepts_cash}`);
    if (booth.accepts_card) console.log(`      - Accepts Card: ${booth.accepts_card}`);
    if (booth.operator_name) console.log(`      - Operator: ${booth.operator_name}`);

    console.log('');
    console.log('   ❌ Data Missing:');
    if (!booth.machine_model) console.log('      - Machine model');
    if (!booth.cost) console.log('      - Cost');
    if (!booth.latitude || !booth.longitude) console.log('      - Coordinates');
    if (!booth.description) console.log('      - Description');
    if (!booth.hours) console.log('      - Hours');
    if (!booth.phone) console.log('      - Phone');
    if (!booth.website) console.log('      - Website');
    if (!booth.instagram) console.log('      - Instagram');
    if (!booth.google_rating) console.log('      - Google rating');
    if (!booth.ai_generated_image_url) console.log('      - AI image');
  });

  // Summary statistics
  const totalBooths = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('source_primary', 'photobooth.net');

  console.log(`\n\n📈 Overall Data Completeness (photobooth.net):`)
  console.log(`   Total booths: ${totalBooths.count || 0}`);

  const stats = {
    with_machine: await supabase.from('booths').select('*', { count: 'exact', head: true }).eq('source_primary', 'photobooth.net').not('machine_model', 'is', null),
    with_cost: await supabase.from('booths').select('*', { count: 'exact', head: true }).eq('source_primary', 'photobooth.net').not('cost', 'is', null),
    with_coords: await supabase.from('booths').select('*', { count: 'exact', head: true }).eq('source_primary', 'photobooth.net').not('latitude', 'is', null),
    with_description: await supabase.from('booths').select('*', { count: 'exact', head: true }).eq('source_primary', 'photobooth.net').not('description', 'is', null),
    with_hours: await supabase.from('booths').select('*', { count: 'exact', head: true }).eq('source_primary', 'photobooth.net').not('hours', 'is', null),
    with_phone: await supabase.from('booths').select('*', { count: 'exact', head: true }).eq('source_primary', 'photobooth.net').not('phone', 'is', null),
    with_website: await supabase.from('booths').select('*', { count: 'exact', head: true }).eq('source_primary', 'photobooth.net').not('website', 'is', null),
    with_google_rating: await supabase.from('booths').select('*', { count: 'exact', head: true }).eq('source_primary', 'photobooth.net').not('google_rating', 'is', null),
    with_ai_image: await supabase.from('booths').select('*', { count: 'exact', head: true }).eq('source_primary', 'photobooth.net').not('ai_generated_image_url', 'is', null),
  };

  const total = totalBooths.count || 1;
  console.log(`\n   Machine model: ${stats.with_machine.count} (${Math.round((stats.with_machine.count || 0) / total * 100)}%)`);
  console.log(`   Cost: ${stats.with_cost.count} (${Math.round((stats.with_cost.count || 0) / total * 100)}%)`);
  console.log(`   Coordinates: ${stats.with_coords.count} (${Math.round((stats.with_coords.count || 0) / total * 100)}%)`);
  console.log(`   Description: ${stats.with_description.count} (${Math.round((stats.with_description.count || 0) / total * 100)}%)`);
  console.log(`   Hours: ${stats.with_hours.count} (${Math.round((stats.with_hours.count || 0) / total * 100)}%)`);
  console.log(`   Phone: ${stats.with_phone.count} (${Math.round((stats.with_phone.count || 0) / total * 100)}%)`);
  console.log(`   Website: ${stats.with_website.count} (${Math.round((stats.with_website.count || 0) / total * 100)}%)`);
  console.log(`   Google Rating: ${stats.with_google_rating.count} (${Math.round((stats.with_google_rating.count || 0) / total * 100)}%)`);
  console.log(`   AI Image: ${stats.with_ai_image.count} (${Math.round((stats.with_ai_image.count || 0) / total * 100)}%)`);
}

checkBoothDataQuality().catch(console.error);
