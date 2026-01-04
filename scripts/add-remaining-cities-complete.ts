import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Los Angeles sources (20)
const laSources = [
  { name: 'TimeOut LA Vintage Booths', source_name: 'TimeOut LA Vintage Photo Booths', source_url: 'https://www.timeout.com/los-angeles/news/vintage-photo-booths-are-having-a-moment-we-found-some-of-l-a-s-remaining-ones-121324', base_url: 'https://www.timeout.com', source_type: 'city_guide', extractor_type: 'city_guide_la_timeout', enabled: true, priority: 95, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'LA Weekly Top 10', source_name: 'LA Weekly Top 10 Photo Booths', source_url: 'https://www.laweekly.com/top-10-photo-booths-in-los-angeles/', base_url: 'https://www.laweekly.com', source_type: 'city_guide', extractor_type: 'city_guide_la_weekly', enabled: true, priority: 90, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Locale Magazine LA', source_name: 'Locale Magazine 9 LA Photo Booths', source_url: 'https://localemagazine.com/best-la-photo-booths/', base_url: 'https://localemagazine.com', source_type: 'blog', extractor_type: 'blog_la_locale', enabled: true, priority: 90, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Infatuation Los Angeles', source_name: 'The Infatuation Los Angeles', source_url: 'https://www.theinfatuation.com/los-angeles', base_url: 'https://www.theinfatuation.com', source_type: 'city_guide', extractor_type: 'city_guide_la_infatuation', enabled: true, priority: 85, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Photobooth.net LA', source_name: 'Photobooth.net Los Angeles Directory', source_url: 'https://www.photobooth.net/locations/browse.php?ddState=5&locationID=740&includeInactiveBooths=0', base_url: 'https://www.photobooth.net', source_type: 'directory', extractor_type: 'directory_la_photobooth', enabled: true, priority: 90, crawl_frequency_days: 7, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Find My Film Lab', source_name: 'Find My Film Lab Photo Booth Microsite', source_url: 'https://findmyfilmlab.com/find-my-photo-booth/', base_url: 'https://findmyfilmlab.com', source_type: 'directory', extractor_type: 'directory_findmyfilmlab', enabled: true, priority: 85, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Discover LA Breweries', source_name: 'Discover LA Craft Breweries Guide', source_url: 'https://www.discoverlosangeles.com/things-to-do/the-guide-to-craft-breweries-in-los-angeles', base_url: 'https://www.discoverlosangeles.com', source_type: 'city_guide', extractor_type: 'city_guide_la_discover', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Hollywood Roosevelt', source_name: 'The Hollywood Roosevelt Hotel', source_url: 'https://www.thehollywoodroosevelt.com/', base_url: 'https://www.thehollywoodroosevelt.com', source_type: 'operator_site', extractor_type: 'operator_roosevelt', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Silver Lake Nightlife', source_name: 'Silver Lake Nightlife Guide', source_url: 'https://silverlake.lanightlife.com/', base_url: 'https://silverlake.lanightlife.com', source_type: 'blog', extractor_type: 'blog_silverlake', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Eastsider LA', source_name: 'The Eastsider LA Silver Lake Echo Park', source_url: 'https://www.theeastsiderla.com/', base_url: 'https://www.theeastsiderla.com', source_type: 'community', extractor_type: 'community_eastsiderla', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Visit Long Beach', source_name: 'Visit Long Beach', source_url: 'https://www.visitlongbeach.com/', base_url: 'https://www.visitlongbeach.com', source_type: 'city_guide', extractor_type: 'city_guide_longbeach', enabled: true, priority: 70, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Photomatica LA Museum', source_name: 'Photomatica Photo Booth Museum LA', source_url: 'https://www.photomatica.com/photo-booth-museum/los-angeles', base_url: 'https://www.photomatica.com', source_type: 'operator_site', extractor_type: 'operator_photomatica_la', enabled: true, priority: 85, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'WeddingWire LA', source_name: 'WeddingWire Los Angeles Photo Booths', source_url: 'https://www.weddingwire.com/c/ca-california/los-angeles-county/photo-booths/803A-207-rca.html', base_url: 'https://www.weddingwire.com', source_type: 'directory', extractor_type: 'directory_weddingwire_la', enabled: true, priority: 65, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Culver City Arts', source_name: 'Culver City Arts District', source_url: 'https://culvercityartsdistrict.com/', base_url: 'https://culvercityartsdistrict.com', source_type: 'community', extractor_type: 'community_culvercity', enabled: true, priority: 70, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Yelp LA Bars', source_name: 'Yelp Los Angeles Bars with Photo Booths', source_url: 'https://www.yelp.com/search?find_desc=Bar+With+Photo+Booth&find_loc=Los+Angeles,+CA', base_url: 'https://www.yelp.com', source_type: 'community', extractor_type: 'community_yelp_la', enabled: true, priority: 70, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Yelp DTLA Bars', source_name: 'Yelp Downtown LA Bars with Photo Booths', source_url: 'https://www.yelp.com/search?find_desc=Bar+With+Photo+Booth&find_loc=Downtown,+Los+Angeles,+CA', base_url: 'https://www.yelp.com', source_type: 'community', extractor_type: 'community_yelp_dtla', enabled: true, priority: 70, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Yelp Venice Bars', source_name: 'Yelp Venice Beach Bars with Photo Booths', source_url: 'https://www.yelp.com/search?find_desc=Bar+With+Photo+Booth&find_loc=Venice,+Los+Angeles,+CA', base_url: 'https://www.yelp.com', source_type: 'community', extractor_type: 'community_yelp_venice', enabled: true, priority: 70, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Yelp Los Feliz Bars', source_name: 'Yelp Los Feliz Bars with Photo Booths', source_url: 'https://www.yelp.com/search?find_desc=Bar+With+Photo+Booth&find_loc=Los+Feliz,+Los+Angeles,+CA', base_url: 'https://www.yelp.com', source_type: 'community', extractor_type: 'community_yelp_losfeliz', enabled: true, priority: 70, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Downtown LA Official', source_name: 'Downtown LA Official Site', source_url: 'https://downtownla.com/', base_url: 'https://downtownla.com', source_type: 'city_guide', extractor_type: 'city_guide_dtla', enabled: true, priority: 70, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Photobooth.net Long Beach', source_name: 'Photobooth.net Long Beach Locations', source_url: 'https://www.photobooth.net/locations/browse.php?ddState=5&locationID=740&includeInactiveBooths=0', base_url: 'https://www.photobooth.net', source_type: 'directory', extractor_type: 'directory_longbeach', enabled: true, priority: 70, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
];

// Chicago sources (18)
const chicagoSources = [
  { name: 'TimeOut Chicago 20 Bars', source_name: 'TimeOut Chicago 20 Bars with Photo Booth', source_url: 'https://www.timeout.com/chicago/bars/20-chicago-bars-with-a-photo-booth', base_url: 'https://www.timeout.com', source_type: 'city_guide', extractor_type: 'city_guide_chicago_timeout', enabled: true, priority: 95, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Infatuation Chicago Big Booth', source_name: 'The Infatuation Chicago Big Booth Rankings', source_url: 'https://www.theinfatuation.com/chicago/guides/big-booth-guide-chicago', base_url: 'https://www.theinfatuation.com', source_type: 'city_guide', extractor_type: 'city_guide_chicago_infatuation', enabled: true, priority: 90, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Fodors Chicago Nightlife', source_name: 'Fodors Travel Chicago Nightlife Guide', source_url: 'https://www.fodors.com/world/north-america/usa/illinois/chicago/things-to-do/nightlife', base_url: 'https://www.fodors.com', source_type: 'city_guide', extractor_type: 'city_guide_chicago_fodors', enabled: true, priority: 85, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Block Club Chicago Booths', source_name: 'Block Club Chicago Vintage Photo Booths', source_url: 'https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed-meet-the-women-trying-to-keep-them-alive/', base_url: 'https://blockclubchicago.org', source_type: 'blog', extractor_type: 'blog_chicago_blockclub', enabled: true, priority: 90, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Choose Chicago Official', source_name: 'Choose Chicago Official Tourism', source_url: 'https://www.choosechicago.com/', base_url: 'https://www.choosechicago.com', source_type: 'city_guide', extractor_type: 'city_guide_chicago_official', enabled: true, priority: 85, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Choose Chicago Wicker Park', source_name: 'Choose Chicago Wicker Park Bucktown', source_url: 'https://www.choosechicago.com/neighborhoods/wicker-park-bucktown/', base_url: 'https://www.choosechicago.com', source_type: 'city_guide', extractor_type: 'city_guide_chicago_wickerpark', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Choose Chicago Pilsen', source_name: 'Choose Chicago Pilsen Neighborhood', source_url: 'https://www.choosechicago.com/neighborhoods/pilsen/', base_url: 'https://www.choosechicago.com', source_type: 'city_guide', extractor_type: 'city_guide_chicago_pilsen', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'A&A Studios Chicago', source_name: 'A&A Studios Chicago Photobooth Locations', source_url: 'https://www.aastudiosinc.com/chicago-photobooth-locations', base_url: 'https://www.aastudiosinc.com', source_type: 'operator_site', extractor_type: 'operator_aastudios_chicago', enabled: true, priority: 85, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Emporium Arcade Bar', source_name: 'Emporium Arcade Bar Chicago', source_url: 'https://www.emporiumarcadebar.com/services/photo-booth/', base_url: 'https://www.emporiumarcadebar.com', source_type: 'operator_site', extractor_type: 'operator_emporium_chicago', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Metro Smartbar Chicago', source_name: 'Metro Chicago Smartbar', source_url: 'https://metrochicago.com/', base_url: 'https://metrochicago.com', source_type: 'operator_site', extractor_type: 'operator_metro_chicago', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Photobooth.net Illinois', source_name: 'Photobooth.net Illinois Locations', source_url: 'http://www.photobooth.net/locations/browse.php?ddState=14', base_url: 'http://www.photobooth.net', source_type: 'directory', extractor_type: 'directory_illinois_photobooth', enabled: true, priority: 80, crawl_frequency_days: 7, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Yelp Chicago Bars Photobooths', source_name: 'Yelp Bars With Photobooth Chicago', source_url: 'https://www.yelp.com/search?find_desc=Bars+With+Photobooth&find_loc=Chicago%2C+IL', base_url: 'https://www.yelp.com', source_type: 'community', extractor_type: 'community_yelp_chicago', enabled: true, priority: 75, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Foursquare Near North Side', source_name: 'Foursquare Best Places Photo Booth Near North', source_url: 'https://foursquare.com/top-places/near-north-side-chicago/best-places-photo-booth', base_url: 'https://foursquare.com', source_type: 'community', extractor_type: 'community_foursquare_chicago', enabled: true, priority: 70, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'TimeOut Logan Square', source_name: 'TimeOut Chicago Best Bars Logan Square', source_url: 'https://www.timeout.com/chicago/bars/best-bars-in-logan-square', base_url: 'https://www.timeout.com', source_type: 'city_guide', extractor_type: 'city_guide_chicago_logansquare', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'TimeOut River North', source_name: 'TimeOut Chicago River North Streeterville', source_url: 'https://www.timeout.com/chicago/bars/the-best-bars-in-river-north-and-streeterville', base_url: 'https://www.timeout.com', source_type: 'city_guide', extractor_type: 'city_guide_chicago_rivernorth', enabled: true, priority: 70, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Chicago Hotels Blackstone', source_name: 'Chicago Hotels Blackstone Freehand', source_url: 'https://www.aastudiosinc.com/chicago-photobooth-locations', base_url: 'https://www.aastudiosinc.com', source_type: 'operator_site', extractor_type: 'operator_chicago_hotels', enabled: true, priority: 70, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Six Flags Great America', source_name: 'Six Flags Great America Suburban', source_url: 'https://www.photobooth.net/locations/browse.php?ddState=14&locationID=522', base_url: 'https://www.photobooth.net', source_type: 'directory', extractor_type: 'directory_sixflags_chicago', enabled: true, priority: 65, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
];

// Portland sources (10)
const portlandSources = [
  { name: 'PDXtoday Photo Booths', source_name: 'PDXtoday Best Photo Booths in Bars', source_url: 'https://pdxtoday.6amcity.com/business/asked-what-are-the-best-photo-booths-in-bars-around-portland', base_url: 'https://pdxtoday.6amcity.com', source_type: 'city_guide', extractor_type: 'city_guide_portland_pdxtoday', enabled: true, priority: 95, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'DoPDX Photo Booths', source_name: 'DoPDX Favorites Photo Booths', source_url: 'https://dopdx.com/p/photo-booths', base_url: 'https://dopdx.com', source_type: 'community', extractor_type: 'community_dopdx', enabled: true, priority: 95, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Puddles Ultimate List', source_name: 'Puddles Ultimate List Portland Photo Booths', source_url: 'https://www.puddlesphotobooth.com/portland-photo-booths', base_url: 'https://www.puddlesphotobooth.com', source_type: 'operator_site', extractor_type: 'operator_puddles_portland', enabled: true, priority: 90, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Puddles Vintage Booths', source_name: 'Puddles Best Vintage Photo Booths Portland', source_url: 'https://www.puddlesphotobooth.com/the-best-vintage-photo-booths-in-portland', base_url: 'https://www.puddlesphotobooth.com', source_type: 'operator_site', extractor_type: 'operator_puddles_vintage', enabled: true, priority: 85, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Willamette Week', source_name: 'Willamette Week Portland', source_url: 'https://www.wweek.com/', base_url: 'https://www.wweek.com', source_type: 'blog', extractor_type: 'blog_willamette_week', enabled: true, priority: 85, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Portland Monthly Bar Crawls', source_name: 'Portland Monthly Best Bar Crawls', source_url: 'https://www.pdxmonthly.com/eat-and-drink/2023/10/best-portland-bar-crawls', base_url: 'https://www.pdxmonthly.com', source_type: 'city_guide', extractor_type: 'city_guide_portland_monthly', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Portland Tribune Photo Booths', source_name: 'Portland Tribune Woman Behind Booths', source_url: 'https://portlandtribune.com/2025/07/30/say-cheese-portland-meet-the-woman-behind-the-citys-favorite-photo-booths/', base_url: 'https://portlandtribune.com', source_type: 'blog', extractor_type: 'blog_portland_tribune', enabled: true, priority: 85, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Travel Portland Alberta', source_name: 'Travel Portland Alberta Arts District', source_url: 'https://www.travelportland.com/neighborhoods/alberta-arts-district/', base_url: 'https://www.travelportland.com', source_type: 'city_guide', extractor_type: 'city_guide_portland_alberta', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Ground Kontrol', source_name: 'Ground Kontrol Classic Arcade', source_url: 'http://photobooth.net/locations/index.php?locationID=256', base_url: 'http://photobooth.net', source_type: 'directory', extractor_type: 'directory_groundkontrol', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Portland Mercury', source_name: 'Portland Mercury', source_url: 'https://www.portlandmercury.com/', base_url: 'https://www.portlandmercury.com', source_type: 'blog', extractor_type: 'blog_portland_mercury', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
];

// Seattle sources (10)
const seattleSources = [
  { name: 'Seattle Times Bar Booths', source_name: 'Seattle Times Best Bar Photo Booths', source_url: 'https://theticket.seattletimes.com/city-guides/the-best-bar-photo-booths-in-seattle/', base_url: 'https://theticket.seattletimes.com', source_type: 'city_guide', extractor_type: 'city_guide_seattle_times', enabled: true, priority: 95, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Rain or Shine Guides', source_name: 'Rain or Shine Film Photobooths Seattle', source_url: 'http://www.rainorshineguides.com/blog/2016/5/20/filmphotobooths', base_url: 'http://www.rainorshineguides.com', source_type: 'blog', extractor_type: 'blog_seattle_rainorshine', enabled: true, priority: 90, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Infatuation Seattle Capitol Hill', source_name: 'Infatuation Seattle Best Capitol Hill Bars', source_url: 'https://www.theinfatuation.com/seattle/guides/the-best-capitol-hill-bars', base_url: 'https://www.theinfatuation.com', source_type: 'city_guide', extractor_type: 'city_guide_seattle_capitolhill', enabled: true, priority: 90, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Infatuation Seattle Fremont', source_name: 'Infatuation Seattle Fremont Restaurants', source_url: 'https://www.theinfatuation.com/seattle/guides/fremont-seattle-restaurants', base_url: 'https://www.theinfatuation.com', source_type: 'city_guide', extractor_type: 'city_guide_seattle_fremont', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Seattle Met', source_name: 'Seattle Met Magazine', source_url: 'https://www.seattlemet.com/', base_url: 'https://www.seattlemet.com', source_type: 'city_guide', extractor_type: 'city_guide_seattle_met', enabled: true, priority: 85, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'The Stranger Seattle', source_name: 'The Stranger Seattle', source_url: 'https://www.strangertickets.com/', base_url: 'https://www.strangertickets.com', source_type: 'blog', extractor_type: 'blog_seattle_stranger', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'TimeOut Seattle Best Bars', source_name: 'TimeOut Seattle 17 Best Bars', source_url: 'https://www.timeout.com/seattle/bars/best-bars-in-seattle', base_url: 'https://www.timeout.com', source_type: 'city_guide', extractor_type: 'city_guide_seattle_timeout', enabled: true, priority: 85, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'EverOut Seattle', source_name: 'EverOut Seattle Location Directory', source_url: 'https://everout.com/seattle/locations/', base_url: 'https://everout.com', source_type: 'directory', extractor_type: 'directory_everout_seattle', enabled: true, priority: 75, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Visit Seattle Fremont', source_name: 'Visit Seattle Fremont Wallingford', source_url: 'https://visitseattle.org/neighborhoods/fremont-wallingford/', base_url: 'https://visitseattle.org', source_type: 'city_guide', extractor_type: 'city_guide_seattle_visitfremont', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Photobooth.net Seattle', source_name: 'Photobooth.net Seattle Locations', source_url: 'http://photobooth.net/', base_url: 'http://photobooth.net', source_type: 'directory', extractor_type: 'directory_seattle_photobooth', enabled: true, priority: 80, crawl_frequency_days: 7, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
];

// Austin sources (15)
const austinSources = [
  { name: 'Austinites101 35 Photo Booths', source_name: 'Austinites101 35+ Photo Booths Around Austin', source_url: 'https://www.austinites101.com/blog/post/photo-booths-around-austin/', base_url: 'https://www.austinites101.com', source_type: 'blog', extractor_type: 'blog_austin_austinites101', enabled: true, priority: 95, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Do512 Best Bars Photobooths', source_name: 'Do512 Best Bars with Photo Booths Austin', source_url: 'https://do512.com/p/photobooths-in-austin', base_url: 'https://do512.com', source_type: 'city_guide', extractor_type: 'city_guide_austin_do512', enabled: true, priority: 95, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Visit Austin Red River', source_name: 'Visit Austin Red River Cultural District', source_url: 'https://www.austintexas.org/things-to-do/entertainment-districts/red-river/', base_url: 'https://www.austintexas.org', source_type: 'city_guide', extractor_type: 'city_guide_austin_redriver', enabled: true, priority: 85, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Visit Austin South Congress', source_name: 'Visit Austin South Congress Avenue', source_url: 'https://www.austintexas.org/things-to-do/entertainment-districts/south-congress/', base_url: 'https://www.austintexas.org', source_type: 'city_guide', extractor_type: 'city_guide_austin_soco', enabled: true, priority: 85, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Visit Austin Rainey Street', source_name: 'Visit Austin Rainey Street District', source_url: 'https://www.austintexas.org/explore/entertainment-districts/rainey-street/', base_url: 'https://www.austintexas.org', source_type: 'city_guide', extractor_type: 'city_guide_austin_rainey', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Visit Austin Warehouse', source_name: 'Visit Austin Warehouse District', source_url: 'https://www.austintexas.org/explore/entertainment-districts/downtown/warehouse-district/', base_url: 'https://www.austintexas.org', source_type: 'city_guide', extractor_type: 'city_guide_austin_warehouse', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Do512 East Side Bar Guide', source_name: 'Do512 The East Side Bar Guide', source_url: 'https://do512.com/p/east-side-bar-guide', base_url: 'https://do512.com', source_type: 'city_guide', extractor_type: 'city_guide_austin_eastside', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Lost in Austin Red River', source_name: 'Lost in Austin Best of Red River District', source_url: 'https://lostinaustin.org/red-river-district/', base_url: 'https://lostinaustin.org', source_type: 'blog', extractor_type: 'blog_austin_lostinaustin', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Do512 South Congress', source_name: 'Do512 Do South Congress', source_url: 'https://do512.com/p/south-congress', base_url: 'https://do512.com', source_type: 'city_guide', extractor_type: 'city_guide_austin_do512soco', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Austin Chronicle 25 Bars', source_name: 'Austin Chronicle 25 Bars That Define Austin', source_url: 'https://www.austinchronicle.com/food/2017-07-21/25-bars-that-define-austin/', base_url: 'https://www.austinchronicle.com', source_type: 'city_guide', extractor_type: 'city_guide_austin_chronicle', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Infatuation Austin', source_name: 'The Infatuation Austin', source_url: 'https://www.theinfatuation.com/austin', base_url: 'https://www.theinfatuation.com', source_type: 'city_guide', extractor_type: 'city_guide_austin_infatuation', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'CultureMap Austin Bars', source_name: 'CultureMap Austin Restaurants Bars', source_url: 'https://austin.culturemap.com/news/restaurants-bars/', base_url: 'https://austin.culturemap.com', source_type: 'blog', extractor_type: 'blog_austin_culturemap', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Downtown Austin Alliance', source_name: 'Downtown Austin Alliance Photo Spots', source_url: 'https://downtownaustin.com/blog/photo-worthy-spots-in-austin/', base_url: 'https://downtownaustin.com', source_type: 'community', extractor_type: 'community_downtown_austin', enabled: true, priority: 70, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Do512 Speakeasies', source_name: 'Do512 Speakeasies Secret Bars Austin', source_url: 'https://do512.com/p/speakeasies-secret-bars-in-austin', base_url: 'https://do512.com', source_type: 'city_guide', extractor_type: 'city_guide_austin_speakeasies', enabled: true, priority: 70, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Austin Chronicle Best Of', source_name: 'Austin Chronicle Best of Austin Awards', source_url: 'https://www.austinchronicle.com/best-of-austin/year:2023/poll:critics/category:nightlife/', base_url: 'https://www.austinchronicle.com', source_type: 'community', extractor_type: 'community_austin_bestof', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
];

// Berlin sources (8)
const berlinSources = [
  { name: 'Photokabine Berlin', source_name: 'Photokabine Berlin Locations', source_url: 'https://www.photokabine.de/locations', base_url: 'https://www.photokabine.de', source_type: 'operator_site', extractor_type: 'operator_photokabine', enabled: true, priority: 95, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Aperture Tours Photoautomats', source_name: 'Aperture Tours Photoautomats of Berlin', source_url: 'https://www.aperturetours.com/blog/2017/berlin-photoautomat', base_url: 'https://www.aperturetours.com', source_type: 'blog', extractor_type: 'blog_berlin_aperture', enabled: true, priority: 90, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Visit Berlin Official', source_name: 'Visit Berlin Official Tourism', source_url: 'https://www.visitberlin.de/en', base_url: 'https://www.visitberlin.de', source_type: 'city_guide', extractor_type: 'city_guide_berlin_official', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Infatuation Berlin', source_name: 'The Infatuation Berlin', source_url: 'https://www.theinfatuation.com/berlin', base_url: 'https://www.theinfatuation.com', source_type: 'city_guide', extractor_type: 'city_guide_berlin_infatuation', enabled: true, priority: 85, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'TimeOut Berlin Nightlife', source_name: 'TimeOut Berlin Nightlife', source_url: 'https://www.timeout.com/berlin/nightlife', base_url: 'https://www.timeout.com', source_type: 'city_guide', extractor_type: 'city_guide_berlin_timeout', enabled: true, priority: 85, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Resident Advisor Berlin', source_name: 'Resident Advisor Berlin Clubs Guide', source_url: 'https://ra.co/guide/de/berlin', base_url: 'https://ra.co', source_type: 'directory', extractor_type: 'directory_berlin_ra', enabled: true, priority: 80, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Lonely Planet Berlin Clubs', source_name: 'Lonely Planet 22 Best Berlin Clubs', source_url: 'https://www.lonelyplanet.com/articles/berlin-clubs', base_url: 'https://www.lonelyplanet.com', source_type: 'city_guide', extractor_type: 'city_guide_berlin_lonely', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Culture Trip Berlin Bars', source_name: 'Culture Trip 11 Coolest Bars Berlin', source_url: 'https://theculturetrip.com/germany/articles/the-8-best-bars-to-visit-in-berlin', base_url: 'https://theculturetrip.com', source_type: 'blog', extractor_type: 'blog_berlin_culturetrip', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
];

// Paris sources (8)
const parisSources = [
  { name: 'Wooish Paris Vintage Booths', source_name: 'Wooish Best Vintage Film Photo Booths Paris', source_url: 'https://www.wooish.co/post/my-favorite-non-touristy-and-inexpensive-activity-to-do-in-paris', base_url: 'https://www.wooish.co', source_type: 'blog', extractor_type: 'blog_paris_wooish', enabled: true, priority: 95, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Solo Sophie Paris Booths', source_name: 'Solo Sophie Vintage Photo Booths Paris', source_url: 'https://www.solosophie.com/vintage-photo-booths-in-paris/', base_url: 'https://www.solosophie.com', source_type: 'blog', extractor_type: 'blog_paris_solosophie', enabled: true, priority: 90, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Fat Tire Tours Paris', source_name: 'Fat Tire Tours Best Photo Booths Paris', source_url: 'https://www.fattiretours.com/like-a-local/photobooths-in-paris/', base_url: 'https://www.fattiretours.com', source_type: 'blog', extractor_type: 'blog_paris_fattire', enabled: true, priority: 85, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Paris je taime Official', source_name: 'Paris je taime Official Tourist Office', source_url: 'https://parisjetaime.com/eng/', base_url: 'https://parisjetaime.com', source_type: 'city_guide', extractor_type: 'city_guide_paris_official', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Infatuation Paris', source_name: 'The Infatuation Paris', source_url: 'https://www.theinfatuation.com/paris', base_url: 'https://www.theinfatuation.com', source_type: 'city_guide', extractor_type: 'city_guide_paris_infatuation', enabled: true, priority: 85, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'TimeOut Paris Best Bars', source_name: 'TimeOut Paris Best Bars', source_url: 'https://www.timeout.com/paris/en/bars-pubs/best-bars-in-paris', base_url: 'https://www.timeout.com', source_type: 'city_guide', extractor_type: 'city_guide_paris_timeout', enabled: true, priority: 85, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Lonely Planet Paris Nightlife', source_name: 'Lonely Planet Paris After Dark', source_url: 'https://www.lonelyplanet.com/articles/paris-after-dark-nightlife', base_url: 'https://www.lonelyplanet.com', source_type: 'city_guide', extractor_type: 'city_guide_paris_lonely', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Culture Trip Paris Bars', source_name: 'Culture Trip Quirky Bars Paris', source_url: 'https://theculturetrip.com/europe/france/paris/articles/10-quirky-parisian-bars-you-won-t-find-anywhere-else', base_url: 'https://theculturetrip.com', source_type: 'blog', extractor_type: 'blog_paris_culturetrip', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
];

// London sources (8)
const londonSources = [
  { name: 'Design My Night London', source_name: 'Design My Night Photobooths in London', source_url: 'https://www.designmynight.com/london/blog/photobooths-in-london', base_url: 'https://www.designmynight.com', source_type: 'directory', extractor_type: 'directory_london_dmn', enabled: true, priority: 95, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'London World 25 Booths', source_name: 'London World 25 Quirky Photo Booths', source_url: 'https://www.londonworld.com/whats-on/photo-booths-london-near-me-locations-4478164', base_url: 'https://www.londonworld.com', source_type: 'directory', extractor_type: 'directory_london_world', enabled: true, priority: 90, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Flash Pack London Booths', source_name: 'Flash Pack Best Photo Booths London', source_url: 'https://itstheflashpack.com/the-lens/the-best-photo-booths-in-london/', base_url: 'https://itstheflashpack.com', source_type: 'blog', extractor_type: 'blog_london_flashpack', enabled: true, priority: 85, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Visit London Official', source_name: 'Visit London Official Visitor Guide', source_url: 'https://www.visitlondon.com/', base_url: 'https://www.visitlondon.com', source_type: 'city_guide', extractor_type: 'city_guide_london_official', enabled: true, priority: 80, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Infatuation London', source_name: 'The Infatuation London', source_url: 'https://www.theinfatuation.com/london', base_url: 'https://www.theinfatuation.com', source_type: 'city_guide', extractor_type: 'city_guide_london_infatuation', enabled: true, priority: 85, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'TimeOut London Best Bars', source_name: 'TimeOut London Best Bars', source_url: 'https://www.timeout.com/london/bars-and-pubs/the-best-bars-in-london', base_url: 'https://www.timeout.com', source_type: 'city_guide', extractor_type: 'city_guide_london_timeout', enabled: true, priority: 85, crawl_frequency_days: 14, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Lonely Planet London Rooftops', source_name: 'Lonely Planet Best Rooftop Bars London', source_url: 'https://www.lonelyplanet.com/articles/best-rooftop-bars-london', base_url: 'https://www.lonelyplanet.com', source_type: 'city_guide', extractor_type: 'city_guide_london_lonely', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
  { name: 'Culture Trip London Pubs', source_name: 'Culture Trip Best Pubs London', source_url: 'https://theculturetrip.com/europe/united-kingdom/england/london/articles/the-20-best-pubs-in-london-you-must-visit', base_url: 'https://theculturetrip.com', source_type: 'blog', extractor_type: 'blog_london_culturetrip', enabled: true, priority: 75, crawl_frequency_days: 30, pages_per_batch: 1, extraction_mode: 'hybrid', pattern_learning_status: 'not_started' },
];

interface CityBatch {
  cityName: string;
  sources: any[];
}

const allCities: CityBatch[] = [
  { cityName: 'Los Angeles', sources: laSources },
  { cityName: 'Chicago', sources: chicagoSources },
  { cityName: 'Portland', sources: portlandSources },
  { cityName: 'Seattle', sources: seattleSources },
  { cityName: 'Austin', sources: austinSources },
  { cityName: 'Berlin', sources: berlinSources },
  { cityName: 'Paris', sources: parisSources },
  { cityName: 'London', sources: londonSources },
];

async function insertCity(city: CityBatch) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📍 ${city.cityName.toUpperCase()} (${city.sources.length} sources)`);
  console.log(`${'='.repeat(60)}\n`);

  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const source of city.sources) {
    try {
      const { error } = await supabase
        .from('crawl_sources')
        .insert(source);

      if (error) {
        if (error.code === '23505') {
          console.log(`  ⚠️  ${source.name}: Already exists (skipping)`);
        } else {
          console.log(`  ❌ ${source.name}: ${error.message}`);
          errors.push(`${source.name}: ${error.message}`);
        }
        failed++;
      } else {
        console.log(`  ✅ ${source.name}`);
        succeeded++;
      }
    } catch (e: any) {
      console.log(`  ❌ ${source.name}: ${e.message}`);
      errors.push(`${source.name}: ${e.message}`);
      failed++;
    }
  }

  return { cityName: city.cityName, succeeded, failed, errors };
}

async function main() {
  console.log('\n🚀 MAJOR CITIES BATCH IMPORT');
  console.log('============================');
  console.log(`Total cities: ${allCities.length}`);
  console.log(`Total sources: ${allCities.reduce((sum, city) => sum + city.sources.length, 0)}`);
  console.log('\n');

  const results = [];

  for (const city of allCities) {
    const result = await insertCity(city);
    results.push(result);
  }

  // Final summary
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(80));

  let totalSucceeded = 0;
  let totalFailed = 0;

  for (const result of results) {
    totalSucceeded += result.succeeded;
    totalFailed += result.failed;
    const icon = result.succeeded === result.succeeded + result.failed ? '✅' : '⚠️';
    console.log(`\n${icon} ${result.cityName}:`);
    console.log(`   ✅ Added: ${result.succeeded}`);
    console.log(`   ❌ Failed/Skipped: ${result.failed}`);

    if (result.errors.length > 0) {
      console.log(`   Errors:`);
      result.errors.forEach(err => console.log(`      - ${err}`));
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`✅ Total Succeeded: ${totalSucceeded}`);
  console.log(`❌ Total Failed: ${totalFailed}`);
  console.log(`📈 Success Rate: ${((totalSucceeded / (totalSucceeded + totalFailed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));

  // Check database totals
  console.log('\n📊 Checking database totals...\n');

  const { data: allSources, error } = await supabase
    .from('crawl_sources')
    .select('id, name, enabled')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching database totals:', error);
  } else {
    console.log(`Total sources in database: ${allSources.length}`);
    console.log(`Enabled sources: ${allSources.filter(s => s.enabled).length}`);
    console.log(`Disabled sources: ${allSources.filter(s => !s.enabled).length}`);
  }

  console.log('\n✅ Import complete!\n');
}

main();
