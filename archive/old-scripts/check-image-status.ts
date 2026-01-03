import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkStatus() {
  // Total booths
  const { count: total } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Booths WITH images (either ai_preview_url OR photo_exterior_url)
  const { data: withImages } = await supabase
    .from('booths')
    .select('id')
    .eq('status', 'active')
    .or('ai_preview_url.not.is.null,photo_exterior_url.not.is.null');

  // Booths NEEDING images (neither ai_preview_url NOR photo_exterior_url)
  const { count: needImages } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('ai_preview_url', null)
    .is('photo_exterior_url', null);

  const withImagesCount = withImages?.length || 0;
  const progress = total ? ((withImagesCount / total) * 100).toFixed(1) : 0;
  const estimatedCost = (needImages || 0) * 0.04;

  console.log('');
  console.log('📊 IMAGE STATUS AFTER BATCH 1');
  console.log('============================');
  console.log('Total active booths:', total);
  console.log('Booths WITH images:', withImagesCount);
  console.log('Booths NEEDING images:', needImages);
  console.log('Progress:', progress + '%');
  console.log('Estimated cost for remaining: $' + estimatedCost.toFixed(2));
  console.log('');
}

checkStatus().catch(console.error);
