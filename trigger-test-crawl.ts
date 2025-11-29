// Simple script to trigger a test crawl via the Edge Function API
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function triggerTestCrawl() {
  console.log('🚀 Triggering Test Crawl for photobooth.net\n');

  // Step 1: Get the photobooth.net source ID
  console.log('📊 Step 1: Finding photobooth.net source...');
  const { data: sources, error: sourceError } = await supabase
    .from('crawl_sources')
    .select('id, name, source_url, extractor_type')
    .eq('extractor_type', 'photobooth_net')
    .eq('enabled', true)
    .limit(1);

  if (sourceError || !sources || sources.length === 0) {
    console.error('❌ Failed to find photobooth.net source:', sourceError);
    return;
  }

  const source = sources[0];
  console.log(`✅ Found source: ${source.name} (${source.id})`);
  console.log(`   URL: ${source.source_url}`);
  console.log(`   Extractor: ${source.extractor_type}\n`);

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
    console.log(`   API Call Time: ${metric.api_call_duration_ms || 'N/A'}ms`);
    console.log(`   Extraction Time: ${metric.extraction_duration_ms || 'N/A'}ms`);
    console.log(`   Pages Crawled: ${metric.pages_crawled || 0}`);
    console.log(`   Booths Extracted: ${metric.booths_extracted || 0}\n`);
  } else {
    console.log('⚠️  No metrics recorded yet\n');
  }

  // Check booths table
  const { data: booths, error: boothsError } = await supabase
    .from('booths')
    .select('id, name, city, country')
    .order('created_at', { ascending: false })
    .limit(10);

  if (booths) {
    console.log(`✅ Total booths in database: ${booths.length}`);
    if (booths.length > 3) {
      console.log('\n🎉 NEW BOOTHS EXTRACTED:');
      booths.slice(0, Math.min(5, booths.length - 3)).forEach(booth => {
        console.log(`   - ${booth.name || 'Unnamed'} in ${booth.city || 'Unknown'}, ${booth.country || 'Unknown'}`);
      });
    } else {
      console.log('   (Still only the 3 original test booths)');
    }
  }

  console.log('\n✅ Test crawl complete!');
}

triggerTestCrawl().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
