import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sources = [
  // NYC (20 sources)
  { name: 'FOX 5 NY Photo Booths', source_name: 'FOX 5 NY Trendy NYC Photobooths', source_url: 'https://www.fox5ny.com/news/new-york-city-photobooth-spots-trendy', base_url: 'https://www.fox5ny.com', source_type: 'city_guide', extractor_type: 'city_guide_nyc_fox5', enabled: true, priority: 95, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Columbia Spectator Photo Booths', source_name: 'Columbia Spectator Strike a Pose', source_url: 'https://www.columbiaspectator.com/spectrum/2025/04/07/strike-a-pose-photo-booths-worth-visiting-in-new-york-city/', base_url: 'https://www.columbiaspectator.com', source_type: 'city_guide', extractor_type: 'city_guide_nyc_columbia', enabled: true, priority: 90, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Gothamist AUTOPHOTO Museum', source_name: 'Gothamist NYC Museum Photo Booth', source_url: 'https://gothamist.com/arts-entertainment/your-phone-could-never-a-new-nyc-museum-honors-the-photo-booth', base_url: 'https://gothamist.com', source_type: 'city_guide', extractor_type: 'city_guide_nyc_gothamist', enabled: true, priority: 95, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'TimeOut NYC Photobooth Museum', source_name: 'TimeOut NYC First Photobooth Museum', source_url: 'https://www.timeout.com/newyork/news/inside-nycs-first-photo-booth-museum-which-is-drawing-lines-on-the-citys-coolest-street-120925', base_url: 'https://www.timeout.com', source_type: 'city_guide', extractor_type: 'city_guide_nyc_timeout', enabled: true, priority: 95, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'NYLON Best Photo Booths NYC', source_name: 'NYLON Where to Find Best Photo Booths NYC', source_url: 'https://www.nylon.com/articles/best-photo-booths-new-york-city', base_url: 'https://www.nylon.com', source_type: 'city_guide', extractor_type: 'city_guide_nyc_nylon', enabled: true, priority: 90, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Photobooth.net NYC', source_name: 'Photobooth.net NYC Locations', source_url: 'https://www.photobooth.net/locations/map.php', base_url: 'https://www.photobooth.net', source_type: 'directory', extractor_type: 'directory_nyc_photobooth', enabled: true, priority: 90, crawl_frequency_days: 7, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Classic Photo Booth East Coast', source_name: 'Classic Photo Booth East Coast Locations', source_url: 'https://www.classicphotobooth.net/vintage-photobooth-locations-east-coast/', base_url: 'https://www.classicphotobooth.net', source_type: 'directory', extractor_type: 'directory_east_coast', enabled: true, priority: 85, crawl_frequency_days: 7, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'AUTOPHOTO Museum Locator', source_name: 'AUTOPHOTO Booth Locator Map', source_url: 'https://www.autophoto.org/booth-locator', base_url: 'https://www.autophoto.org', source_type: 'directory', extractor_type: 'directory_autophoto', enabled: true, priority: 90, crawl_frequency_days: 7, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Soho Grand Photo Booths', source_name: 'Soho Grand Photo Booths of NYC Guide', source_url: 'https://www.sohogrand.com/stories/photo-booths-of-nyc/', base_url: 'https://www.sohogrand.com', source_type: 'blog', extractor_type: 'blog_nyc_sohogrand', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Roxy Hotel Photo Booths', source_name: 'Roxy Hotel Photo Booths of New York', source_url: 'https://www.roxyhotelnyc.com/stories/photo-booths-of-new-york/', base_url: 'https://www.roxyhotelnyc.com', source_type: 'blog', extractor_type: 'blog_nyc_roxy', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Yelp Brooklyn Bars Photobooths', source_name: 'Yelp Top Bars with Photo Booths Brooklyn', source_url: 'https://www.yelp.com/search?find_desc=Bar+With+Photobooth&find_loc=Brooklyn,+NY', base_url: 'https://www.yelp.com', source_type: 'community', extractor_type: 'community_yelp_brooklyn', enabled: true, priority: 75, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Yelp NYC Bars Photo Booths', source_name: 'Yelp Top Bars with Photo Booths NYC', source_url: 'https://www.yelp.com/search?find_desc=Bar+With+Photo+Booth&find_loc=New+York,+NY', base_url: 'https://www.yelp.com', source_type: 'community', extractor_type: 'community_yelp_nyc', enabled: true, priority: 75, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Old Friend Photobooth', source_name: 'Old Friend Photobooth NYC', source_url: 'https://www.oldfriendphotobooth.com/', base_url: 'https://www.oldfriendphotobooth.com', source_type: 'operator_site', extractor_type: 'operator_oldfriend', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Majestic Photobooth NYC', source_name: 'Majestic Photobooth NYC Venues', source_url: 'https://www.majesticphotobooth.com/locations/photo-booth-new-york-city', base_url: 'https://www.majesticphotobooth.com', source_type: 'operator_site', extractor_type: 'operator_majestic_nyc', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'WeddingWire NYC', source_name: 'WeddingWire Best Photo Booths NYC', source_url: 'https://www.weddingwire.com/c/ny-new-york/new-york-manhattan-brooklyn-bronx-queens/photo-booths/501B-207-rca.html', base_url: 'https://www.weddingwire.com', source_type: 'directory', extractor_type: 'directory_weddingwire_nyc', enabled: true, priority: 65, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'The Knot NYC', source_name: 'The Knot Photo Booth Rentals NYC', source_url: 'https://www.theknot.com/marketplace/wedding-photo-booth-rentals-new-york-ny', base_url: 'https://www.theknot.com', source_type: 'directory', extractor_type: 'directory_theknot_nyc', enabled: true, priority: 65, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Lemon8 NYC Photo Booths', source_name: 'Lemon8 Best NYC Photo Booth Spots', source_url: 'https://www.lemon8-app.com/@kelsrei/7518800753369137694', base_url: 'https://www.lemon8-app.com', source_type: 'community', extractor_type: 'community_lemon8_nyc', enabled: true, priority: 65, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Secret NYC Photo Booths', source_name: 'Secret NYC Hidden Photo Booth Locations', source_url: 'https://secretnyc.co/', base_url: 'https://secretnyc.co', source_type: 'blog', extractor_type: 'blog_secretnyc', enabled: true, priority: 70, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Airial Travel Brooklyn', source_name: 'Airial Travel Vintage Photo Booths Brooklyn', source_url: 'https://www.airial.travel/attractions/united-states/vintage-photo-booths-brooklyn-6Z9kXpDF', base_url: 'https://www.airial.travel', source_type: 'blog', extractor_type: 'blog_airial_brooklyn', enabled: true, priority: 70, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'NYC Tourism Nightlife', source_name: 'NYC Tourism Ultimate Nightlife Guide', source_url: 'https://www.nyctourism.com/articles/ultimate-guide-to-nightlife-nyc/', base_url: 'https://www.nyctourism.com', source_type: 'city_guide', extractor_type: 'city_guide_nyc_tourism', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
];

async function main() {
  console.log(`\n🚀 Adding ${sources.length} sources to database...\n`);

  let succeeded = 0;
  let failed = 0;

  for (const source of sources) {
    try {
      const { error } = await supabase
        .from('crawl_sources')
        .insert(source);

      if (error) {
        console.log(`  ❌ ${source.source_name}: ${error.message}`);
        failed++;
      } else {
        console.log(`  ✅ ${source.source_name}`);
        succeeded++;
      }
    } catch (e: any) {
      console.log(`  ❌ ${source.source_name}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Success: ${succeeded} | ❌ Failed: ${failed}`);
  console.log(`${'='.repeat(60)}\n`);
}

main();
