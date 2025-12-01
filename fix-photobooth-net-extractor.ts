import { createClient } from '@supabase/supabase-js';

async function fixPhotoboothNetExtractor() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('\n=== FIXING PHOTOBOOTH.NET EXTRACTOR ===\n');

  // Update both photobooth.net sources to use the specialized extractor
  const { data: updated, error } = await supabase
    .from('crawl_sources')
    .update({ extractor_type: 'photobooth_net' })
    .ilike('source_name', '%photobooth%net%')
    .select();

  if (error) {
    console.error('❌ Error updating sources:', error);
    return;
  }

  console.log('✅ Updated photobooth.net sources to use specialized extractor:\n');
  updated?.forEach(source => {
    console.log(`  - ${source.source_name}`);
    console.log(`    URL: ${source.source_url}`);
    console.log(`    Extractor: ${source.extractor_type}`);
    console.log('');
  });

  console.log('✅ Fix complete! The crawler will now use extractPhotoboothNetEnhanced()');
  console.log('   This specialized extractor is designed to find 350+ booths.\n');
}

fixPhotoboothNetExtractor();
