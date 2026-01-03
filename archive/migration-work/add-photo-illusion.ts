import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addPhotoIllusion() {
  console.log('\n🆕 Adding Photo Illusion source...\n');

  const { data, error} = await supabase
    .from('crawl_sources')
    .insert({
      name: 'Photo Illusion',
      source_name: 'Photo Illusion',
      source_url: 'https://www.photoillusion.com/',
      base_url: 'https://www.photoillusion.com',
      source_type: 'operator_site',
      extractor_type: 'discovery',
      enabled: true,
      status: 'pending',
      priority: 50,
      notes: 'Unstructured listings on homepage'
    })
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }

  console.log('✅ Photo Illusion added successfully!');
  console.log('   ID:', data[0].id);
  console.log('   URL:', data[0].source_url);
}

addPhotoIllusion().catch(console.error);
