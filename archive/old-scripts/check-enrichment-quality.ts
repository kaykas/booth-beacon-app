import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkEnrichmentQuality() {
  console.log('=== ENRICHMENT QUALITY & MAP DATA ANALYSIS ===\n');

  // 1. Verify the map query returns all booths using pagination
  console.log('1️⃣  MAP QUERY TEST (with pagination)');
  let allBooths: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const start = page * pageSize;
    const end = start + pageSize - 1;

    const { data, error } = await supabase
      .from('booths')
      .select('*')
      .range(start, end);

    if (error) {
      console.error('❌ Pagination error:', error);
      hasMore = false;
    } else if (data) {
      allBooths = [...allBooths, ...data];
      hasMore = data.length === pageSize;
      console.log(`   Fetched page ${page + 1}: ${data.length} booths (total so far: ${allBooths.length})`);
      page++;
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ Map query with pagination returns: ${allBooths.length} booths`);

  // 2. Check coordinate coverage
  console.log('\n2️⃣  COORDINATE COVERAGE');
  const { count: totalActive } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: withCoords } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  console.log(`Total active booths: ${totalActive}`);
  console.log(`Booths with coordinates: ${withCoords}`);
  console.log(`Missing coordinates: ${(totalActive || 0) - (withCoords || 0)}`);
  console.log(`Coverage: ${((withCoords || 0) / (totalActive || 1) * 100).toFixed(1)}%`);

  // 3. Check description coverage
  console.log('\n3️⃣  DESCRIPTION COVERAGE');
  const { count: withDescriptions } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('ai_generated_description', 'is', null);

  const { count: withoutDescriptions } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('ai_generated_description', null);

  console.log(`Booths with AI descriptions: ${withDescriptions}`);
  console.log(`Booths without descriptions: ${withoutDescriptions}`);
  console.log(`Coverage: ${((withDescriptions || 0) / (totalActive || 1) * 100).toFixed(1)}%`);

  // 4. Check image coverage
  console.log('\n4️⃣  IMAGE COVERAGE');
  const { count: withImages } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('booth_image', 'is', null);

  console.log(`Booths with images: ${withImages}`);
  console.log(`Booths without images: ${(totalActive || 0) - (withImages || 0)}`);
  console.log(`Coverage: ${((withImages || 0) / (totalActive || 1) * 100).toFixed(1)}%`);

  // 5. Check venue enrichment coverage
  console.log('\n5️⃣  VENUE ENRICHMENT COVERAGE');
  const { count: withPhone } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('phone', 'is', null);

  const { count: withWebsite } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('website', 'is', null);

  const { count: withHours } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('hours', 'is', null);

  console.log(`Booths with phone: ${withPhone} (${((withPhone || 0) / (totalActive || 1) * 100).toFixed(1)}%)`);
  console.log(`Booths with website: ${withWebsite} (${((withWebsite || 0) / (totalActive || 1) * 100).toFixed(1)}%)`);
  console.log(`Booths with hours: ${withHours} (${((withHours || 0) / (totalActive || 1) * 100).toFixed(1)}%)`);

  // 6. Find booths that won't show on map (missing coordinates)
  console.log('\n6️⃣  BOOTHS MISSING COORDINATES (WON\'T SHOW ON MAP)');
  const { data: missingCoords } = await supabase
    .from('booths')
    .select('id, name, city, state, country, latitude, longitude')
    .eq('status', 'active')
    .or('latitude.is.null,longitude.is.null')
    .limit(20);

  if (missingCoords && missingCoords.length > 0) {
    console.log(`\nShowing first ${Math.min(20, missingCoords.length)} booths:`);
    missingCoords.forEach((booth, idx) => {
      console.log(`${idx + 1}. ${booth.name} (${booth.city}, ${booth.country})`);
      console.log(`   ID: ${booth.id}`);
      console.log(`   Lat: ${booth.latitude || 'MISSING'}, Lng: ${booth.longitude || 'MISSING'}`);
    });
  } else {
    console.log('✅ All active booths have coordinates!');
  }

  // 7. Find booths with incomplete enrichment
  console.log('\n7️⃣  BOOTHS WITH INCOMPLETE ENRICHMENT');
  const { data: incompleteBooths } = await supabase
    .from('booths')
    .select('id, name, city, country, ai_generated_description, booth_image, phone, website')
    .eq('status', 'active')
    .or('ai_generated_description.is.null,booth_image.is.null')
    .limit(10);

  if (incompleteBooths && incompleteBooths.length > 0) {
    console.log(`\nShowing first ${Math.min(10, incompleteBooths.length)} booths:`);
    incompleteBooths.forEach((booth, idx) => {
      const missing = [];
      if (!booth.ai_generated_description) missing.push('description');
      if (!booth.booth_image) missing.push('image');
      if (!booth.phone) missing.push('phone');
      if (!booth.website) missing.push('website');

      console.log(`${idx + 1}. ${booth.name} (${booth.city}, ${booth.country})`);
      console.log(`   ID: ${booth.id}`);
      console.log(`   Missing: ${missing.join(', ')}`);
    });
  } else {
    console.log('✅ All active booths have complete enrichment!');
  }

  // 8. Summary and recommendations
  console.log('\n8️⃣  SUMMARY & RECOMMENDATIONS');
  const coordCoverage = ((withCoords || 0) / (totalActive || 1) * 100);
  const descCoverage = ((withDescriptions || 0) / (totalActive || 1) * 100);
  const imageCoverage = ((withImages || 0) / (totalActive || 1) * 100);

  console.log('\n📊 Overall Enrichment Score:');
  console.log(`   Coordinates: ${coordCoverage.toFixed(1)}% ${coordCoverage === 100 ? '✅' : '⚠️'}`);
  console.log(`   Descriptions: ${descCoverage.toFixed(1)}% ${descCoverage > 90 ? '✅' : descCoverage > 70 ? '⚠️' : '❌'}`);
  console.log(`   Images: ${imageCoverage.toFixed(1)}% ${imageCoverage > 90 ? '✅' : imageCoverage > 70 ? '⚠️' : '❌'}`);

  console.log('\n🎯 Map Display Status:');
  if (coordCoverage === 100) {
    console.log(`   ✅ ALL ${withCoords} active booths can be shown on the map`);
  } else {
    console.log(`   ⚠️  ${(totalActive || 0) - (withCoords || 0)} booths cannot be shown (missing coordinates)`);
    console.log(`   📍 Run geocoding enrichment on these booths`);
  }

  console.log('\n💡 Next Steps:');
  if (descCoverage < 100) {
    console.log(`   • Generate descriptions for ${(totalActive || 0) - (withDescriptions || 0)} remaining booths`);
  }
  if (imageCoverage < 100) {
    console.log(`   • Generate images for ${(totalActive || 0) - (withImages || 0)} remaining booths`);
  }
  if (coordCoverage < 100) {
    console.log(`   • Geocode ${(totalActive || 0) - (withCoords || 0)} booths to add map markers`);
  }
}

checkEnrichmentQuality().catch(console.error);
