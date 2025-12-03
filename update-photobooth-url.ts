import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updatePhotoboothUrl() {
  console.log('🔧 Updating photobooth.net URL to show ALL booths in left rail...\n');

  const { data, error } = await supabase
    .from('crawl_sources')
    .update({
      source_url: 'https://www.photobooth.net/locations/browse.php?ddState=0&includeInactiveBooths=1',
      notes: 'Shows ALL booths in left rail - no state selection needed. Includes inactive booths. 350+ booths expected.'
    })
    .eq('source_name', 'photobooth.net')
    .select();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Updated photobooth.net source:');
    console.log('   New URL:', data[0].source_url);
    console.log('   Notes:', data[0].notes);
    console.log('\n📍 This URL shows ALL booths in the left rail navigation - expected 350+ booths!');
  } else {
    console.log('⚠️  No source found with name "photobooth.net"');
  }
}

updatePhotoboothUrl().catch(console.error);
