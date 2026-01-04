import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkStatus() {
  console.log('\n📊 PHOTO BOOTH SOURCES - COMPLETE DATABASE STATUS\n');
  console.log('='.repeat(80));

  // Get all sources grouped by patterns
  const { data: allSources, error } = await supabase
    .from('crawl_sources')
    .select('name, extractor_type, enabled, priority, source_type, created_at')
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Group sources by city
  const cities = {
    'New York City': allSources.filter(s =>
      s.name?.toLowerCase().includes('nyc') ||
      s.name?.toLowerCase().includes('brooklyn') ||
      s.extractor_type?.includes('nyc')
    ),
    'Los Angeles': allSources.filter(s =>
      s.name?.toLowerCase().includes('los angeles') ||
      s.name?.toLowerCase().includes(' la ') ||
      s.extractor_type?.includes('_la_') ||
      s.name?.includes('Silver Lake') ||
      s.name?.includes('Venice') ||
      s.name?.includes('DTLA')
    ),
    'Chicago': allSources.filter(s =>
      s.name?.toLowerCase().includes('chicago') ||
      s.extractor_type?.includes('chicago') ||
      s.name?.includes('Illinois')
    ),
    'Portland': allSources.filter(s =>
      s.name?.toLowerCase().includes('portland') ||
      s.extractor_type?.includes('portland')
    ),
    'Seattle': allSources.filter(s =>
      s.name?.toLowerCase().includes('seattle') ||
      s.extractor_type?.includes('seattle')
    ),
    'Austin': allSources.filter(s =>
      s.name?.toLowerCase().includes('austin') ||
      s.extractor_type?.includes('austin')
    ),
    'Berlin': allSources.filter(s =>
      s.name?.toLowerCase().includes('berlin') ||
      s.extractor_type?.includes('berlin')
    ),
    'Paris': allSources.filter(s =>
      s.name?.toLowerCase().includes('paris') ||
      s.extractor_type?.includes('paris')
    ),
    'London': allSources.filter(s =>
      s.name?.toLowerCase().includes('london') ||
      s.extractor_type?.includes('london')
    ),
    'San Francisco Bay Area': allSources.filter(s =>
      s.name?.toLowerCase().includes('san francisco') ||
      s.name?.toLowerCase().includes('sf ') ||
      s.name?.toLowerCase().includes('oakland') ||
      s.name?.toLowerCase().includes('berkeley') ||
      s.name?.toLowerCase().includes('bay area') ||
      s.extractor_type?.includes('_sf_')
    ),
  };

  // Print city summaries
  for (const [cityName, sources] of Object.entries(cities)) {
    if (sources.length === 0) continue;

    const enabled = sources.filter(s => s.enabled).length;
    const disabled = sources.length - enabled;
    const highPriority = sources.filter(s => s.priority >= 90).length;

    console.log(`\n📍 ${cityName.toUpperCase()}`);
    console.log('-'.repeat(80));
    console.log(`Total Sources: ${sources.length}`);
    console.log(`Enabled: ${enabled} | Disabled: ${disabled}`);
    console.log(`High Priority (90+): ${highPriority}`);

    // Show top 5 sources
    console.log(`\nTop Sources:`);
    sources
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
      .forEach((s, i) => {
        const status = s.enabled ? '✅' : '❌';
        console.log(`  ${i + 1}. ${status} ${s.name} (Priority ${s.priority})`);
      });
  }

  // Overall statistics
  console.log('\n\n' + '='.repeat(80));
  console.log('📈 OVERALL STATISTICS');
  console.log('='.repeat(80));

  const totalSources = allSources.length;
  const totalEnabled = allSources.filter(s => s.enabled).length;
  const totalDisabled = totalSources - totalEnabled;

  console.log(`\nTotal Sources: ${totalSources}`);
  console.log(`Enabled: ${totalEnabled} (${((totalEnabled/totalSources)*100).toFixed(1)}%)`);
  console.log(`Disabled: ${totalDisabled} (${((totalDisabled/totalSources)*100).toFixed(1)}%)`);

  // Priority distribution
  const priority95 = allSources.filter(s => s.priority === 95).length;
  const priority90 = allSources.filter(s => s.priority === 90).length;
  const priority85 = allSources.filter(s => s.priority === 85).length;
  const priority80 = allSources.filter(s => s.priority === 80).length;
  const priorityBelow80 = allSources.filter(s => s.priority < 80).length;

  console.log(`\nPriority Distribution:`);
  console.log(`  Priority 95 (Top tier): ${priority95}`);
  console.log(`  Priority 90 (High): ${priority90}`);
  console.log(`  Priority 85 (Good): ${priority85}`);
  console.log(`  Priority 80 (Medium): ${priority80}`);
  console.log(`  Below 80 (Lower): ${priorityBelow80}`);

  // Source type distribution
  const sourceTypes: { [key: string]: number } = {};
  allSources.forEach(s => {
    sourceTypes[s.source_type] = (sourceTypes[s.source_type] || 0) + 1;
  });

  console.log(`\nSource Type Distribution:`);
  Object.entries(sourceTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  // Geographic coverage
  const citiesWithSources = Object.entries(cities)
    .filter(([_, sources]) => sources.length > 0)
    .length;

  console.log(`\nGeographic Coverage:`);
  console.log(`  Cities with sources: ${citiesWithSources}`);
  console.log(`  Average sources per city: ${(totalSources / citiesWithSources).toFixed(1)}`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ Status check complete\n');
}

checkStatus();
