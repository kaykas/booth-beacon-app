import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OLD_KEY = 'AIzaSyD85rR9ze3sBtOmZ5DM8NyehutWyjPuteA';
const NEW_KEY = 'AIzaSyDJLpEwja8Hyh2IPpBMZmVbDLL6h7rIiUI';

async function updatePhotoApiKeys() {
  console.log('🔍 Finding booths with Google Maps photo URLs using old API key...\n');

  // Find all booths with photo URLs containing the old API key
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, slug, photo_exterior_url')
    .like('photo_exterior_url', `%${OLD_KEY}%`);

  if (error) {
    console.error('Error fetching booths:', error);
    return;
  }

  if (!booths || booths.length === 0) {
    console.log('✅ No booths found with old API key in photo URLs');
    return;
  }

  console.log(`Found ${booths.length} booths with old API key in photo URLs\n`);

  let updated = 0;
  let failed = 0;

  for (const booth of booths) {
    const oldUrl = booth.photo_exterior_url!;
    const newUrl = oldUrl.replace(OLD_KEY, NEW_KEY);

    console.log(`Updating ${booth.name} (${booth.slug})...`);

    const { error: updateError } = await supabase
      .from('booths')
      .update({ photo_exterior_url: newUrl })
      .eq('id', booth.id);

    if (updateError) {
      console.error(`  ❌ Failed:`, updateError.message);
      failed++;
    } else {
      console.log(`  ✅ Updated`);
      updated++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('UPDATE COMPLETE');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Updated: ${updated} booths`);
  console.log(`❌ Failed: ${failed} booths`);
  console.log(`${'='.repeat(60)}\n`);
}

updatePhotoApiKeys();
