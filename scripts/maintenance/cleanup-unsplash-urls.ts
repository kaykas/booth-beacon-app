
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function cleanBrokenUrls() {
  console.log('Cleaning up broken Unsplash URLs...');

  const { data, error } = await supabase
    .from('booths')
    .update({ ai_preview_url: null })
    .ilike('ai_preview_url', '%source.unsplash.com%')
    .select();

  if (error) {
    console.error('Error updating booths:', error);
  } else {
    console.log(`Successfully cleared ${data.length} broken AI preview URLs.`);
  }
}

cleanBrokenUrls();
