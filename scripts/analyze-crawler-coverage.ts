import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get all sources
  const { data: allSources } = await supabase
    .from('crawl_sources')
    .select('source_name, extraction_mode, source_type, enabled, total_booths_found, total_booths_added')
    .order('extraction_mode');

  if (!allSources) {
    console.log('No sources found');
    return;
  }

  console.log('\n📊 Crawler Coverage Analysis\n');
  console.log('='.repeat(60));

  // Group by extraction mode
  const byMode = {
    hybrid: allSources.filter(s => s.extraction_mode === 'hybrid'),
    agent: allSources.filter(s => s.extraction_mode === 'agent'),
    direct: allSources.filter(s => s.extraction_mode === 'direct'),
    none: allSources.filter(s => !s.extraction_mode)
  };

  console.log('\n🔧 Extraction Modes:');
  console.log(`  🔄 Hybrid Mode: ${byMode.hybrid.length} sources`);
  console.log(`  🤖 Agent Only: ${byMode.agent.length} sources`);
  console.log(`  ⚡ Direct Only: ${byMode.direct.length} sources`);
  console.log(`  ❓ Not Configured: ${byMode.none.length} sources`);

  // Analyze hybrid sources by type
  console.log('\n📋 Hybrid Mode by Source Type:');
  const hybridByType: Record<string, number> = {};
  byMode.hybrid.forEach(s => {
    const type = s.source_type || 'unknown';
    hybridByType[type] = (hybridByType[type] || 0) + 1;
  });

  Object.entries(hybridByType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  • ${type}: ${count} sources`);
    });

  // Enabled status
  const hybridEnabled = byMode.hybrid.filter(s => s.enabled).length;
  console.log(`\n✅ Enabled Hybrid Sources: ${hybridEnabled}/${byMode.hybrid.length}`);

  // Performance metrics
  const hybridWithResults = byMode.hybrid.filter(s => (s.total_booths_found || 0) > 0);
  const hybridTotalFound = byMode.hybrid.reduce((sum, s) => sum + (s.total_booths_found || 0), 0);
  const hybridTotalAdded = byMode.hybrid.reduce((sum, s) => sum + (s.total_booths_added || 0), 0);

  console.log(`\n📦 Hybrid Mode Performance:`);
  console.log(`  Sources with results: ${hybridWithResults.length}/${byMode.hybrid.length}`);
  console.log(`  Total booths found: ${hybridTotalFound}`);
  console.log(`  Total booths added: ${hybridTotalAdded}`);
  console.log(`  Success rate: ${((hybridWithResults.length / byMode.hybrid.length) * 100).toFixed(1)}%`);

  // Geographic coverage
  console.log('\n🌍 Geographic Coverage (Hybrid Sources):');
  const geoPatterns = {
    'SF Bay Area': /SF|San Francisco|Oakland|Berkeley|Santa Rosa|Bay/i,
    'Los Angeles': /LA|Los Angeles/i,
    'New York': /NY|New York/i,
    'Chicago': /Chicago/i,
    'Austin': /Austin/i,
    'Portland': /Portland/i,
    'Seattle': /Seattle/i,
    'International': /Berlin|Paris|London|Tokyo/i
  };

  Object.entries(geoPatterns).forEach(([region, pattern]) => {
    const count = byMode.hybrid.filter(s => pattern.test(s.source_name)).length;
    if (count > 0) {
      console.log(`  📍 ${region}: ${count} sources`);
    }
  });

  // Show top performing hybrid sources
  console.log('\n🏆 Top Performing Hybrid Sources:\n');
  byMode.hybrid
    .filter(s => (s.total_booths_found || 0) > 0)
    .sort((a, b) => (b.total_booths_found || 0) - (a.total_booths_found || 0))
    .slice(0, 10)
    .forEach(s => {
      console.log(`  ✅ ${s.source_name}`);
      console.log(`     Found: ${s.total_booths_found} | Added: ${s.total_booths_added}`);
    });

  console.log(`\n${'='.repeat(60)}\n`);
}

main();
