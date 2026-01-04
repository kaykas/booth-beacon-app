import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // Get Heebie-Jeebie booth
  const { data: booth } = await supabase
    .from('booths')
    .select('id,name,slug,photo_exterior_url,ai_generated_image_url,ai_preview_url')
    .ilike('slug', '%heebe%')
    .single();

  console.log('Booth:', JSON.stringify(booth, null, 2));

  // Get community photos
  const { data: photos } = await supabase
    .from('booth_user_photos')
    .select('photo_url,moderation_status')
    .eq('booth_id', booth!.id);

  console.log('\nCommunity Photos:', JSON.stringify(photos, null, 2));
}

check();
