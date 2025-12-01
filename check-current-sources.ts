import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Check current photobooth.net source
  const { data: current } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('source_name', 'Photobooth.net')
    .single();

  console.log('\n📍 Current photobooth.net source:');
  console.log('URL:', current?.source_url);
  console.log('Enabled:', current?.enabled);
  console.log('Status:', current?.status);

  // Check if state-based sources already exist
  const { data: stateSources } = await supabase
    .from('crawl_sources')
    .select('source_name')
    .like('source_name', '%photobooth.net%');

  console.log('\n📊 Existing photobooth.net sources:');
  stateSources?.forEach(s => console.log('  -', s.source_name));

  // Check photomatica sources
  const { data: photomatica } = await supabase
    .from('crawl_sources')
    .select('source_name, source_url')
    .like('source_name', '%Photomatica%');

  console.log('\n🎯 Existing Photomatica sources:');
  photomatica?.forEach(s => console.log('  -', s.source_name, ':', s.source_url));
}

main();
