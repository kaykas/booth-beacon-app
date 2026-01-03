import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPhotoboothUrl() {
  const { data, error } = await supabase
    .from('crawl_sources')
    .select('id, source_name, source_url, enabled')
    .or('source_name.ilike.%photobooth%.net%,source_name.eq.photobooth.net');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('\n🔍 All photobooth.net related sources in database:\n');
    data?.forEach((source, i) => {
      console.log(`${i + 1}. ${source.source_name} (${source.enabled ? 'ENABLED' : 'disabled'})`);
      console.log(`   URL: ${source.source_url}`);
      console.log(`   Has includeInactiveBooths=1? ${source.source_url.includes('includeInactiveBooths=1') ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });
    console.log('\n✅ Expected URL: https://www.photobooth.net/locations/browse.php?ddState=0&includeInactiveBooths=1');
  }
}

checkPhotoboothUrl().catch(console.error);
