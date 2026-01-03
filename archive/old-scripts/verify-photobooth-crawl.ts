import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyPhotoboothCrawl() {
  console.log('\n🔍 Verifying photobooth.net crawl results...\n');

  // Count total booths from photobooth.net
  const { data: booths, error } = await supabase
    .from('booths')
    .select('*')
    .eq('source_primary', 'photobooth.net')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error querying database:', error);
    return;
  }

  console.log(`📊 Total photobooth.net booths: ${booths?.length || 0}\n`);

  // Show recent booths
  console.log('📝 Most recent booths:');
  booths?.slice(0, 15).forEach((booth, i) => {
    console.log(`   ${i + 1}. ${booth.name}`);
    console.log(`      Location: ${booth.city || 'Unknown'}, ${booth.state || booth.country}`);
    console.log(`      Status: ${booth.status} (operational: ${booth.is_operational})`);
    console.log(`      Machine: ${booth.machine_model || 'Unknown'}`);
    console.log(`      Cost: ${booth.cost || 'Unknown'}`);
    console.log(`      Address: ${booth.address}`);
    console.log('');
  });

  // Count by status
  const activeCount = booths?.filter(b => b.status === 'active').length || 0;
  const inactiveCount = booths?.filter(b => b.status === 'inactive').length || 0;

  console.log('\n📈 Status breakdown:');
  console.log(`   Active: ${activeCount}`);
  console.log(`   Inactive: ${inactiveCount}`);

  // Count with machine info
  const withMachine = booths?.filter(b => b.machine_model).length || 0;
  const withCost = booths?.filter(b => b.cost).length || 0;
  const withCoordinates = booths?.filter(b => b.latitude && b.longitude).length || 0;

  console.log('\n📋 Data completeness:');
  console.log(`   With machine model: ${withMachine}`);
  console.log(`   With cost: ${withCost}`);
  console.log(`   With coordinates: ${withCoordinates}`);
}

verifyPhotoboothCrawl().catch(console.error);
