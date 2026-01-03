import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testCrawl() {
  console.log('\n🧪 Testing Fotoautomat France crawler...\n');

  // Invoke the unified-crawler function for this specific source
  const { data, error } = await supabase.functions.invoke('unified-crawler', {
    body: {
      sourceId: '8e86c918-e190-46fd-825e-092159c9b6ea',
      stream: false
    }
  });

  if (error) {
    console.error('❌ Crawler error:', error);
    throw error;
  }

  console.log('📊 Crawl Results:\n');
  console.log(JSON.stringify(data, null, 2));

  // Check how many booths were extracted
  const { data: booths, error: boothsError } = await supabase
    .from('booths')
    .select('id, name, city, country')
    .eq('source_id', '8e86c918-e190-46fd-825e-092159c9b6ea')
    .order('created_at', { ascending: false })
    .limit(10);

  if (boothsError) {
    console.error('❌ Error checking booths:', boothsError);
  } else {
    console.log('\n📍 Extracted Booths (' + (booths?.length || 0) + '):\n');
    booths?.forEach((b, i) => {
      console.log(`${i + 1}. ${b.name} in ${b.city}, ${b.country}`);
    });
  }

  // Check crawler metrics
  const { data: metrics } = await supabase
    .from('crawler_metrics')
    .select('*')
    .eq('source_id', '8e86c918-e190-46fd-825e-092159c9b6ea')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (metrics) {
    console.log('\n📈 Latest Metrics:');
    console.log('   Status:', metrics.status);
    console.log('   Booths extracted:', metrics.booths_extracted || 0);
    console.log('   Duration:', metrics.duration_ms || 0, 'ms');
    if (metrics.error_message) {
      console.log('   Error:', metrics.error_message);
    }
  }
}

testCrawl().catch(console.error);
