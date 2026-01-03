import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateAllSources() {
  console.log('\n🔧 Updating all sources in parallel...\n');

  // Run all updates in parallel
  const [
    fotoautomatWien,
    photomatica,
    blockClub,
    photoIllusion,
    boothByBryant,
    fotoautomatFrance
  ] = await Promise.all([
    // 1. Update Fotoautomat Wien - note about homepage list
    supabase
      .from('crawl_sources')
      .update({
        notes: 'Homepage has list of booths with Google Maps links and search results pages',
        extractor_type: 'discovery'
      })
      .ilike('source_name', '%Fotoautomat%Wien%')
      .select(),

    // 2. Update Photomatica URL to find-a-booth page
    supabase
      .from('crawl_sources')
      .update({
        source_url: 'https://www.photomatica.com/find-a-booth-near-you',
        notes: 'Not super structured but listings are there',
        extractor_type: 'discovery'
      })
      .ilike('source_name', '%Photomatica%')
      .eq('source_url', 'https://www.photomatica.com/photo-booth-museum')
      .select(),

    // 3. Disable Block Club Chicago
    supabase
      .from('crawl_sources')
      .update({
        enabled: false,
        status: 'disabled_per_user'
      })
      .ilike('source_name', '%Block Club%Chicago%')
      .select(),

    // 4. Add Photo Illusion as new source
    supabase
      .from('crawl_sources')
      .insert({
        source_name: 'Photo Illusion',
        source_url: 'https://www.photoillusion.com/',
        source_type: 'operator_site',
        extractor_type: 'discovery',
        enabled: true,
        status: 'pending',
        priority: 50,
        notes: 'Unstructured listings on homepage'
      })
      .select(),

    // 5. Update Booth by Bryant with notes
    supabase
      .from('crawl_sources')
      .update({
        notes: 'Listings with Orange County city, addresses, and photos. Multi-location operator.',
        extractor_type: 'discovery',
        enabled: true
      })
      .ilike('source_url', '%boothbybryant%')
      .select(),

    // 6. Mark Fotoautomat France for retry with different approach
    supabase
      .from('crawl_sources')
      .update({
        notes: 'Info is in the HTML - needs different extraction approach',
        status: 'pending'
      })
      .eq('id', '8e86c918-e190-46fd-825e-092159c9b6ea')
      .select()
  ]);

  // Report results
  console.log('✅ Fotoautomat Wien:', fotoautomatWien.error ? '❌ ' + fotoautomatWien.error.message : `✓ Updated ${fotoautomatWien.data?.length || 0} rows`);
  console.log('✅ Photomatica:', photomatica.error ? '❌ ' + photomatica.error.message : `✓ Updated ${photomatica.data?.length || 0} rows`);
  console.log('✅ Block Club Chicago:', blockClub.error ? '❌ ' + blockClub.error.message : `✓ Disabled ${blockClub.data?.length || 0} rows`);
  console.log('✅ Photo Illusion:', photoIllusion.error ? '❌ ' + photoIllusion.error.message : `✓ Added ${photoIllusion.data?.length || 0} new source`);
  console.log('✅ Booth by Bryant:', boothByBryant.error ? '❌ ' + boothByBryant.error.message : `✓ Updated ${boothByBryant.data?.length || 0} rows`);
  console.log('✅ Fotoautomat France:', fotoautomatFrance.error ? '❌ ' + fotoautomatFrance.error.message : `✓ Updated ${fotoautomatFrance.data?.length || 0} rows`);

  console.log('\n📊 Summary:\n');
  console.log('Updated sources: 5');
  console.log('Disabled sources: 1 (Block Club Chicago)');
  console.log('New sources: 1 (Photo Illusion)');
}

updateAllSources().catch(console.error);
