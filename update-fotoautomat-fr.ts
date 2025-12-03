import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateSource() {
  console.log('\n🔧 Updating fotoautomat.fr source...\n');

  // Update the source with correct URL and configuration
  const { data, error } = await supabase
    .from('crawl_sources')
    .update({
      source_url: 'https://fotoautomat.fr/en/our-adresses/',
      source_name: 'Fotoautomat France',
      extractor_type: 'discovery',
      status: 'pending',
      enabled: true
    })
    .eq('id', '8e86c918-e190-46fd-825e-092159c9b6ea')
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating source:', error);
    throw error;
  }

  console.log('✅ Source updated successfully!');
  console.log('   Name:', data.source_name);
  console.log('   URL:', data.source_url);
  console.log('   Extractor:', data.extractor_type);
  console.log('   Status:', data.status);
  console.log('   Enabled:', data.enabled);
  console.log('\n✅ Ready to test crawl!\n');
}

updateSource().catch(console.error);
