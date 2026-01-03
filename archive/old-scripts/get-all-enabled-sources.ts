import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAllEnabledSources() {
  console.log('\n📋 ALL 15 ENABLED SOURCES:\n');

  const { data: sources, error } = await supabase
    .from('crawl_sources')
    .select('id, source_name, source_url, extractor_type, total_booths_found, status')
    .eq('enabled', true)
    .order('total_booths_found', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!sources || sources.length === 0) {
    console.log('⚠️ No enabled sources found!');
    return;
  }

  // Categorize sources
  const working = sources.filter(s => (s.total_booths_found || 0) > 0);
  const needsTesting = sources.filter(s => (s.total_booths_found || 0) === 0);

  console.log('✅ WORKING SOURCES (Extracting Booths):');
  console.log('='.repeat(60));
  working.forEach((s, i) => {
    console.log(`\n${i + 1}. ${s.source_name}`);
    console.log(`   Booths: ${s.total_booths_found}`);
    console.log(`   Status: ${s.status}`);
    console.log(`   Extractor: ${s.extractor_type || 'NULL'}`);
    console.log(`   URL: ${s.source_url}`);
  });

  console.log('\n\n🔍 NEEDS TESTING (0 Booths):');
  console.log('='.repeat(60));
  needsTesting.forEach((s, i) => {
    console.log(`\n${i + 1}. ${s.source_name}`);
    console.log(`   Status: ${s.status}`);
    console.log(`   Extractor: ${s.extractor_type || 'NULL'}`);
    console.log(`   URL: ${s.source_url}`);
  });

  console.log('\n\n📊 SUMMARY:');
  console.log('='.repeat(60));
  console.log(`Total Enabled: ${sources.length}`);
  console.log(`Working (extracting booths): ${working.length}`);
  console.log(`Need Testing (0 booths): ${needsTesting.length}`);
}

getAllEnabledSources().catch(console.error);
