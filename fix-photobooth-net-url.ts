import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('\n🔧 Updating photobooth.net source URL...\n');

  // Update the photobooth.net source to use the comprehensive browse page
  const { data, error } = await supabase
    .from('crawl_sources')
    .update({
      source_url: 'https://www.photobooth.net/locations/browse.php?ddState=0&includeInactiveBooths=1',
      updated_at: new Date().toISOString()
    })
    .eq('source_name', 'Photobooth.net')
    .select();

  if (error) {
    console.error('❌ Error updating source:', error);
  } else {
    console.log('✅ Successfully updated Photobooth.net source!');
    console.log('New URL:', data[0]?.source_url);
    console.log('\nThis URL will fetch:');
    console.log('  - ddState=0: ALL states (not just one state)');
    console.log('  - includeInactiveBooths=1: Include inactive booths too');
    console.log('\nExpected to capture hundreds of booths across all US states!');
  }
}

main();
