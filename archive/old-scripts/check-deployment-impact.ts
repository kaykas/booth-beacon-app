import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDeploymentImpact() {
  console.log('\n🔍 Checking deployment impact after schema fix...\n');

  // Get enabled sources
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('source_name, status, total_booths_found')
    .eq('enabled', true)
    .order('total_booths_found', { ascending: false });

  console.log('📊 Enabled Sources Status:');
  const errorCount = sources?.filter(s => s.status === 'error').length || 0;
  const successCount = sources?.filter(s => s.status === 'success').length || 0;
  console.log(`   Error: ${errorCount}`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Other: ${(sources?.length || 0) - errorCount - successCount}\n`);

  console.log('📈 Top 10 Sources by Booth Count:');
  sources?.slice(0, 10).forEach((s, i) => {
    console.log(`  ${i+1}. ${s.source_name}: ${s.total_booths_found || 0} booths (${s.status})`);
  });

  // Get total booth count
  const { count: totalBooths } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📈 Total Booths in Database: ${totalBooths}`);

  // Check how many have coordinates
  const { count: withCoords } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  console.log(`📍 Booths with Coordinates: ${withCoords} (${Math.round((withCoords / (totalBooths || 1) * 100))}%)`);

  // Check photobooth.net specifically
  const photoboothNet = sources?.find(s => s.source_name?.toLowerCase().includes('photobooth'));
  if (photoboothNet) {
    console.log(`\n🎯 Photobooth.net Status:`);
    console.log(`   Booths: ${photoboothNet.total_booths_found || 0}`);
    console.log(`   Status: ${photoboothNet.status}`);
  }

  console.log('\n');
}

checkDeploymentImpact().catch(console.error);
