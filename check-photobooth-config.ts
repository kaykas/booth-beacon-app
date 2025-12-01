import { createClient } from '@supabase/supabase-js';

async function checkPhotoboothNetConfig() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('\n=== PHOTOBOOTH.NET CRAWLER CONFIGURATION ===\n');

  // Check crawl_sources configuration
  const { data: photoboothNet, error } = await supabase
    .from('crawl_sources')
    .select('*')
    .ilike('source_name', '%photobooth%')
    .order('priority');

  if (error) {
    console.error('Error fetching sources:', error);
    return;
  }

  if (photoboothNet && photoboothNet.length > 0) {
    console.log('📡 Crawler Sources:');
    photoboothNet.forEach(source => {
      console.log('\nSource Name:', source.source_name);
      console.log('URL:', source.source_url);
      console.log('Enabled:', source.enabled);
      console.log('Extractor:', source.extractor_name || 'default (AI)');
      console.log('Priority:', source.priority);
      console.log('Last Crawled:', source.last_crawled_at || 'Never');
      console.log('---');
    });
  } else {
    console.log('❌ No photobooth.net sources found!');
  }

  // Check how many booths from photobooth.net
  const { data: booths } = await supabase
    .from('booths')
    .select('id, name, city, state, country')
    .ilike('source_url', '%photobooth.net%')
    .limit(10);

  console.log('\n📊 Sample Booths from photobooth.net:');
  if (booths && booths.length > 0) {
    booths.forEach(b => console.log('  -', b.name, 'in', b.city + ',', b.state, b.country));
  } else {
    console.log('  ❌ No booths found from photobooth.net');
  }

  const { count } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .ilike('source_url', '%photobooth.net%');

  console.log('\n📈 Total booths from photobooth.net:', count || 0);
  console.log('   Expected: 350+');

  if ((count || 0) < 300) {
    console.log('\n⚠️  WARNING: Found significantly fewer booths than expected!');
    console.log('   The specialized extractor is designed to find 350+ booths.');
  }
}

checkPhotoboothNetConfig();
