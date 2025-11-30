import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testImageFix() {
  // Get a booth with a broken Unsplash URL
  const { data: booth, error } = await supabase
    .from('booths')
    .select('*')
    .eq('slug', 'corner-mall-boston')
    .single();

  if (error) {
    console.error('Error fetching booth:', error);
    return;
  }

  console.log('\n=== BOOTH DATA ===');
  console.log('Name:', booth.name);
  console.log('Slug:', booth.slug);
  console.log('photo_exterior_url:', booth.photo_exterior_url || 'NULL');
  console.log('ai_preview_url:', booth.ai_preview_url || 'NULL');

  // Simulate the logic from our components
  const isBrokenUnsplashUrl = booth.ai_preview_url?.includes('source.unsplash.com');

  console.log('\n=== COMPONENT LOGIC ===');
  console.log('isBrokenUnsplashUrl:', isBrokenUnsplashUrl);

  // BoothCard/BoothMap logic
  const imageUrl = booth.photo_exterior_url || (!isBrokenUnsplashUrl ? booth.ai_preview_url : null) || '/placeholder-booth.svg';
  const hasAiPreview = booth.ai_preview_url && !booth.photo_exterior_url && !isBrokenUnsplashUrl;

  console.log('\n=== RESULT ===');
  console.log('Final imageUrl:', imageUrl);
  console.log('hasAiPreview:', hasAiPreview);
  console.log('Will show placeholder?', imageUrl === '/placeholder-booth.svg');

  // BoothImage component logic (for booth detail pages)
  const hasNoImage = !imageUrl || imageUrl === '/placeholder-booth.svg';
  console.log('BoothImage will show "No photo yet"?', hasNoImage);
}

testImageFix().catch(console.error);
