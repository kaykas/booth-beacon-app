import { createClient } from '@supabase/supabase-js';

async function fixPhotoboothUrl() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('\n🔧 FIXING PHOTOBOOTH.NET URL\n');

  // Revert to the simpler, working URL
  const { data: updated, error } = await supabase
    .from('crawl_sources')
    .update({
      source_url: 'https://www.photobooth.net/locations/',
      enabled: true
    })
    .ilike('source_name', '%photobooth%net%')
    .select();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Fixed photobooth.net sources:\n');
  updated?.forEach(source => {
    console.log(`  - ${source.source_name}`);
    console.log(`    URL: ${source.source_url}`);
    console.log(`    Enabled: ${source.enabled}`);
    console.log('');
  });

  console.log('✅ URL reverted to simpler /locations/ page that works!\n');
}

fixPhotoboothUrl();
