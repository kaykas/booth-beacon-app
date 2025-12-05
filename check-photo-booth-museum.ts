import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkPhotoBoothMuseum() {
  // Find The Photo Booth Museum
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, city, ai_preview_url, photo_exterior_url, photos')
    .ilike('name', '%Photo Booth Museum%')
    .eq('city', 'San Francisco');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('The Photo Booth Museum Booths:');
  console.log('============================');
  booths?.forEach(b => {
    console.log();
    console.log('Name:', b.name);
    console.log('ID:', b.id);
    console.log('AI Preview URL:', b.ai_preview_url || 'NONE');
    console.log('Photo Exterior URL:', b.photo_exterior_url || 'NONE');
    console.log('Photos array:', b.photos || 'NONE');
  });

  // Check all booths with unsplash URLs that need cleanup
  const { data: unsplashBooths } = await supabase
    .from('booths')
    .select('id, name, ai_preview_url')
    .ilike('ai_preview_url', '%unsplash%');

  console.log();
  console.log('Booths with Unsplash URLs needing cleanup:', unsplashBooths?.length || 0);
  if (unsplashBooths && unsplashBooths.length > 0) {
    console.log('First 5:');
    unsplashBooths.slice(0, 5).forEach(b => {
      console.log('  -', b.name, '-', b.ai_preview_url);
    });
  }
}

checkPhotoBoothMuseum().catch(console.error);
