import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkStatus() {
  console.log('\n=== CRAWLER SOURCES STATUS ===\n');

  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('*')
    .order('priority');

  const enabled = sources?.filter(s => s.enabled) || [];
  const disabled = sources?.filter(s => s.enabled === false) || [];

  console.log(`Total sources: ${sources?.length || 0}`);
  console.log(`Enabled: ${enabled.length}`);
  console.log(`Disabled: ${disabled.length}\n`);

  if (disabled.length > 0) {
    console.log('Disabled sources:');
    disabled.forEach(s => {
      console.log(`  - ${s.source_name} (${s.source_type}) - Priority: ${s.priority}`);
    });
  }

  console.log('\n=== BOOTH STATISTICS ===\n');

  const { data: booths } = await supabase
    .from('booths')
    .select('id, created_at, latitude, longitude, source_id');

  const total = booths?.length || 0;
  const geocoded = booths?.filter(b => b.latitude && b.longitude).length || 0;
  const uniqueSources = new Set(booths?.map(b => b.source_id)).size;

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const addedLastDay = booths?.filter(b => new Date(b.created_at) > oneDayAgo).length || 0;
  const addedLastWeek = booths?.filter(b => new Date(b.created_at) > oneWeekAgo).length || 0;

  console.log(`Total booths: ${total}`);
  console.log(`From unique sources: ${uniqueSources}`);
  console.log(`Geocoded: ${geocoded} (${Math.round((geocoded / total) * 100)}%)`);
  console.log(`Added last 24h: ${addedLastDay}`);
  console.log(`Added last week: ${addedLastWeek}`);

  console.log('\n=== RECENT CRAWL ACTIVITY ===\n');

  const { data: rawContent } = await supabase
    .from('crawl_raw_content')
    .select(`
      created_at,
      crawl_sources (
        source_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (rawContent && rawContent.length > 0) {
    rawContent.forEach(rc => {
      const sourceName = (rc.crawl_sources as unknown as { source_name: string })?.source_name || 'Unknown';
      console.log(`${new Date(rc.created_at).toISOString()} - ${sourceName}`);
    });
  } else {
    console.log('No recent crawl activity found');
  }

  console.log('\n=== DATA QUALITY ISSUES ===\n');

  const { data: sample } = await supabase
    .from('booths')
    .select('name, address, city, country, latitude, longitude')
    .limit(100);

  let missingCity = 0;
  let missingAddress = 0;
  let missingCoords = 0;
  let genericNames = 0;

  sample?.forEach(b => {
    if (!b.city) missingCity++;
    if (!b.address) missingAddress++;
    if (!b.latitude || !b.longitude) missingCoords++;
    if (/^(unknown|booth|photo|mall|station)$/i.test(b.name)) genericNames++;
  });

  console.log(`Sample of ${sample?.length || 0} booths:`);
  console.log(`Missing city: ${missingCity} (${Math.round((missingCity / (sample?.length || 1)) * 100)}%)`);
  console.log(`Missing address: ${missingAddress} (${Math.round((missingAddress / (sample?.length || 1)) * 100)}%)`);
  console.log(`Missing coordinates: ${missingCoords} (${Math.round((missingCoords / (sample?.length || 1)) * 100)}%)`);
  console.log(`Generic names: ${genericNames} (${Math.round((genericNames / (sample?.length || 1)) * 100)}%)`);
}

checkStatus().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
