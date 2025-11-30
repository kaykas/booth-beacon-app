import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkResults() {
  console.log('\n📊 Checking Autophoto Crawl Results...\n');

  // Check if any booths were extracted from Autophoto
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, city, country, source_id')
    .eq('source_id', 'e180b417-47b7-47ca-ae68-83afc81dea2f')
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('🎯 Autophoto Booths (if any):');
    if (booths && booths.length > 0) {
      console.log(`✅ Found ${booths.length} booths from Autophoto!`);
      booths.forEach(b => console.log(`   - ${b.name} in ${b.city}, ${b.country}`));
    } else {
      console.log('⚠️  No booths extracted yet (504 timeout occurred)');
    }
  }

  // Check crawler_metrics for this source
  const { data: metrics } = await supabase
    .from('crawler_metrics')
    .select('*')
    .eq('source_id', 'e180b417-47b7-47ca-ae68-83afc81dea2f')
    .order('created_at', { ascending: false })
    .limit(1);

  if (metrics && metrics.length > 0) {
    console.log('\n📈 Latest Crawler Metrics:');
    console.log(`   Status: ${metrics[0].status}`);
    console.log(`   Booths extracted: ${metrics[0].booths_extracted || 0}`);
    console.log(`   Duration: ${metrics[0].duration_ms || 'N/A'} ms`);
    console.log(`   Error message: ${metrics[0].error_message || 'None'}`);
  } else {
    console.log('\n⚠️  No crawler metrics recorded (likely timed out before recording)');
  }
}

checkResults().catch(console.error);
