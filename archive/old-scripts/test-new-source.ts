// Test script to verify newly seeded sources work with unified-crawler
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testNewSource() {
  console.log('🚀 Testing Newly Seeded Source: Autophoto Chicago/Midwest\n');

  // Step 1: Get the Autophoto source
  console.log('📊 Step 1: Finding Autophoto Chicago/Midwest source...');
  const { data: sources, error: sourceError } = await supabase
    .from('crawl_sources')
    .select('id, name, source_url, source_type, extractor_type, enabled')
    .eq('name', 'Autophoto Chicago/Midwest')
    .limit(1);

  if (sourceError || !sources || sources.length === 0) {
    console.error('❌ Failed to find Autophoto source:', sourceError);
    console.log('\n💡 Checking all enabled sources...');

    const { data: allSources } = await supabase
      .from('crawl_sources')
      .select('id, name, source_url, enabled, priority')
      .eq('enabled', true)
      .order('priority', { ascending: false })
      .limit(5);

    console.log('\nTop 5 enabled sources:');
    allSources?.forEach(s => {
      console.log(`  - ${s.name} (priority: ${s.priority})`);
    });
    return;
  }

  const source = sources[0];
  console.log(`✅ Found source: ${source.name} (${source.id})`);
  console.log(`   URL: ${source.source_url}`);
  console.log(`   Type: ${source.source_type}`);
  console.log(`   Extractor: ${source.extractor_type || 'generic'}`);
  console.log(`   Enabled: ${source.enabled}\n`);

  // Step 2: Trigger the crawler via Edge Function
  console.log('📊 Step 2: Calling unified-crawler Edge Function...');
  console.log(`   Endpoint: ${SUPABASE_URL}/functions/v1/unified-crawler`);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-crawler`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceId: source.id,
        forceCrawl: true,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Crawler returned error (${response.status}):`, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Crawler response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error calling crawler:', error);
    return;
  }

  // Step 3: Check results
  console.log('\n📊 Step 3: Checking results...\n');

  // Check crawler_metrics
  const { data: metrics, error: metricsError } = await supabase
    .from('crawler_metrics')
    .select('*')
    .eq('source_id', source.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (metrics && metrics.length > 0) {
    const metric = metrics[0];
    console.log('✅ Crawler metrics recorded:');
    console.log(`   Status: ${metric.status}`);
    console.log(`   Duration: ${metric.duration_ms || 'N/A'}ms`);
    console.log(`   Pages Crawled: ${metric.pages_crawled || 0}`);
    console.log(`   Booths Extracted: ${metric.booths_extracted || 0}\n`);
  } else {
    console.log('⚠️  No metrics recorded yet\n');
  }

  // Check booths from this source
  const { data: booths, error: boothsError } = await supabase
    .from('booths')
    .select('id, name, city, country, source_id')
    .eq('source_id', source.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (booths && booths.length > 0) {
    console.log(`✅ Booths extracted from this source: ${booths.length}`);
    console.log('\n🎉 NEW BOOTHS FROM AUTOPHOTO:');
    booths.forEach(booth => {
      console.log(`   - ${booth.name || 'Unnamed'} in ${booth.city || 'Unknown'}, ${booth.country || 'Unknown'}`);
    });
  } else {
    console.log('⚠️  No booths extracted from this source yet');
  }

  console.log('\n✅ Test complete!');
}

testNewSource().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
