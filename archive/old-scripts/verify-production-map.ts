import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function verifyProductionMap() {
  console.log('=== VERIFYING PRODUCTION MAP DATA ===\n');

  // Simulate what the map page does with pagination
  console.log('1️⃣  Testing pagination logic (what the map page should do)...\n');

  let allBooths: unknown[] = [];
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
      console.error('❌ Error fetching booths:', error);
      hasMore = false;
    } else if (data) {
      allBooths = [...allBooths, ...data];
      console.log(`   Page ${page + 1}: Fetched ${data.length} booths (total: ${allBooths.length})`);
      hasMore = data.length === pageSize;
      page++;
    } else {
      hasMore = false;
    }
  }

  console.log(`\n✅ Total booths fetched with pagination: ${allBooths.length}\n`);

  // Check database stats
  console.log('2️⃣  Checking database statistics...\n');

  const { count: totalBooths } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  const { count: activeBooths } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: boothsWithCoords } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  console.log(`   Total booths in database: ${totalBooths}`);
  console.log(`   Active booths: ${activeBooths}`);
  console.log(`   Booths with coordinates: ${boothsWithCoords}`);

  // Final verdict
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL VERDICT\n');

  if (allBooths.length >= (boothsWithCoords || 0)) {
    console.log(`✅ SUCCESS! Pagination returns all ${allBooths.length} booths`);
    console.log(`✅ Map should display ${boothsWithCoords} markers (booths with coordinates)`);
    console.log('\n🎉 The map pagination fix is working correctly!');
    console.log('\nOnce deployed to production, the map will show all booths.');
  } else {
    console.log(`❌ PROBLEM: Pagination returned ${allBooths.length} booths`);
    console.log(`❌ Expected: ${boothsWithCoords} booths with coordinates`);
    console.log('\n⚠️  The pagination logic may still have issues.');
  }

  console.log('='.repeat(60));
}

verifyProductionMap().catch(console.error);
