-- ============================================================
-- MAJOR CITIES PHOTO BOOTH SOURCES
-- All configured with HYBRID MODE for flexible extraction
-- Total: 117 new sources across 9 major cities
-- ============================================================

-- ============================================================
-- NEW YORK CITY & BROOKLYN (20 sources)
-- ============================================================

INSERT INTO crawl_sources (
  name, source_name, source_url, base_url, source_type,
  extractor_type, enabled, priority, crawl_frequency_days,
  pages_per_batch, extraction_mode, pattern_learning_status
) VALUES

-- Tier 1: High-Priority City Guides (Priority 90-95)
('FOX 5 NY Photo Booths', 'FOX 5 NY Trendy NYC Photobooths', 'https://www.fox5ny.com/news/new-york-city-photobooth-spots-trendy', 'https://www.fox5ny.com', 'city_guide', 'city_guide_nyc_fox5', true, 95, 14, 1, 'hybrid', 'not_started'),
('Columbia Spectator Photo Booths', 'Columbia Spectator Strike a Pose', 'https://www.columbiaspectator.com/spectrum/2025/04/07/strike-a-pose-photo-booths-worth-visiting-in-new-york-city/', 'https://www.columbiaspectator.com', 'city_guide', 'city_guide_nyc_columbia', true, 90, 14, 1, 'hybrid', 'not_started'),
('Gothamist AUTOPHOTO Museum', 'Gothamist NYC Museum Photo Booth', 'https://gothamist.com/arts-entertainment/your-phone-could-never-a-new-nyc-museum-honors-the-photo-booth', 'https://gothamist.com', 'city_guide', 'city_guide_nyc_gothamist', true, 95, 14, 1, 'hybrid', 'not_started'),
('TimeOut NYC Photobooth Museum', 'TimeOut NYC First Photobooth Museum', 'https://www.timeout.com/newyork/news/inside-nycs-first-photo-booth-museum-which-is-drawing-lines-on-the-citys-coolest-street-120925', 'https://www.timeout.com', 'city_guide', 'city_guide_nyc_timeout', true, 95, 14, 1, 'hybrid', 'not_started'),
('NYLON Best Photo Booths NYC', 'NYLON Where to Find Best Photo Booths NYC', 'https://www.nylon.com/articles/best-photo-booths-new-york-city', 'https://www.nylon.com', 'city_guide', 'city_guide_nyc_nylon', true, 90, 14, 1, 'hybrid', 'not_started'),

-- Tier 2: Directories (Priority 85-90)
('Photobooth.net NYC', 'Photobooth.net NYC Locations', 'https://www.photobooth.net/locations/map.php', 'https://www.photobooth.net', 'directory', 'directory_nyc_photobooth', true, 90, 7, 1, 'hybrid', 'not_started'),
('Classic Photo Booth East Coast', 'Classic Photo Booth East Coast Locations', 'https://www.classicphotobooth.net/vintage-photobooth-locations-east-coast/', 'https://www.classicphotobooth.net', 'directory', 'directory_east_coast', true, 85, 7, 1, 'hybrid', 'not_started'),
('AUTOPHOTO Museum Locator', 'AUTOPHOTO Booth Locator Map', 'https://www.autophoto.org/booth-locator', 'https://www.autophoto.org', 'directory', 'directory_autophoto', true, 90, 7, 1, 'hybrid', 'not_started'),

-- Tier 3: Hotel & Venue Guides (Priority 80-85)
('Soho Grand Photo Booths', 'Soho Grand Photo Booths of NYC Guide', 'https://www.sohogrand.com/stories/photo-booths-of-nyc/', 'https://www.sohogrand.com', 'blog', 'blog_nyc_sohogrand', true, 80, 30, 1, 'hybrid', 'not_started'),
('Roxy Hotel Photo Booths', 'Roxy Hotel Photo Booths of New York', 'https://www.roxyhotelnyc.com/stories/photo-booths-of-new-york/', 'https://www.roxyhotelnyc.com', 'blog', 'blog_nyc_roxy', true, 80, 30, 1, 'hybrid', 'not_started'),

-- Tier 4: Community & Yelp (Priority 70-80)
('Yelp Brooklyn Bars Photobooths', 'Yelp Top Bars with Photo Booths Brooklyn', 'https://www.yelp.com/search?find_desc=Bar+With+Photobooth&find_loc=Brooklyn,+NY', 'https://www.yelp.com', 'community', 'community_yelp_brooklyn', true, 75, 14, 1, 'hybrid', 'not_started'),
('Yelp NYC Bars Photo Booths', 'Yelp Top Bars with Photo Booths NYC', 'https://www.yelp.com/search?find_desc=Bar+With+Photo+Booth&find_loc=New+York,+NY', 'https://www.yelp.com', 'community', 'community_yelp_nyc', true, 75, 14, 1, 'hybrid', 'not_started'),

-- Tier 5: Operators (Priority 75-80)
('Old Friend Photobooth', 'Old Friend Photobooth NYC', 'https://www.oldfriendphotobooth.com/', 'https://www.oldfriendphotobooth.com', 'operator_site', 'operator_oldfriend', true, 75, 30, 1, 'hybrid', 'not_started'),
('Majestic Photobooth NYC', 'Majestic Photobooth NYC Venues', 'https://www.majesticphotobooth.com/locations/photo-booth-new-york-city', 'https://www.majesticphotobooth.com', 'operator_site', 'operator_majestic_nyc', true, 75, 30, 1, 'hybrid', 'not_started'),

-- Tier 6: Wedding Industry (Priority 65-70)
('WeddingWire NYC', 'WeddingWire Best Photo Booths NYC', 'https://www.weddingwire.com/c/ny-new-york/new-york-manhattan-brooklyn-bronx-queens/photo-booths/501B-207-rca.html', 'https://www.weddingwire.com', 'directory', 'directory_weddingwire_nyc', true, 65, 30, 1, 'hybrid', 'not_started'),
('The Knot NYC', 'The Knot Photo Booth Rentals NYC', 'https://www.theknot.com/marketplace/wedding-photo-booth-rentals-new-york-ny', 'https://www.theknot.com', 'directory', 'directory_theknot_nyc', true, 65, 30, 1, 'hybrid', 'not_started'),

-- Tier 7: Social & Community (Priority 60-70)
('Lemon8 NYC Photo Booths', 'Lemon8 Best NYC Photo Booth Spots', 'https://www.lemon8-app.com/@kelsrei/7518800753369137694', 'https://www.lemon8-app.com', 'community', 'community_lemon8_nyc', true, 65, 30, 1, 'hybrid', 'not_started'),
('Secret NYC Photo Booths', 'Secret NYC Hidden Photo Booth Locations', 'https://secretnyc.co/', 'https://secretnyc.co', 'blog', 'blog_secretnyc', true, 70, 30, 1, 'hybrid', 'not_started'),
('Airial Travel Brooklyn', 'Airial Travel Vintage Photo Booths Brooklyn', 'https://www.airial.travel/attractions/united-states/vintage-photo-booths-brooklyn-6Z9kXpDF', 'https://www.airial.travel', 'blog', 'blog_airial_brooklyn', true, 70, 30, 1, 'hybrid', 'not_started'),
('NYC Tourism Nightlife', 'NYC Tourism Ultimate Nightlife Guide', 'https://www.nyctourism.com/articles/ultimate-guide-to-nightlife-nyc/', 'https://www.nyctourism.com', 'city_guide', 'city_guide_nyc_tourism', true, 75, 30, 1, 'hybrid', 'not_started');

-- ============================================================
-- LOS ANGELES (20 sources)
-- ============================================================

INSERT INTO crawl_sources (
  name, source_name, source_url, base_url, source_type,
  extractor_type, enabled, priority, crawl_frequency_days,
  pages_per_batch, extraction_mode, pattern_learning_status
) VALUES

-- Tier 1: High-Priority City Guides (Priority 90-95)
('TimeOut LA Vintage Booths', 'TimeOut LA Vintage Photo Booths', 'https://www.timeout.com/los-angeles/news/vintage-photo-booths-are-having-a-moment-we-found-some-of-l-a-s-remaining-ones-121324', 'https://www.timeout.com', 'city_guide', 'city_guide_la_timeout', true, 95, 14, 1, 'hybrid', 'not_started'),
('LA Weekly Top 10', 'LA Weekly Top 10 Photo Booths', 'https://www.laweekly.com/top-10-photo-booths-in-los-angeles/', 'https://www.laweekly.com', 'city_guide', 'city_guide_la_weekly', true, 90, 14, 1, 'hybrid', 'not_started'),
('Locale Magazine LA', 'Locale Magazine 9 LA Photo Booths', 'https://localemagazine.com/best-la-photo-booths/', 'https://localemagazine.com', 'blog', 'blog_la_locale', true, 90, 14, 1, 'hybrid', 'not_started'),
('Infatuation Los Angeles', 'The Infatuation Los Angeles', 'https://www.theinfatuation.com/los-angeles', 'https://www.theinfatuation.com', 'city_guide', 'city_guide_la_infatuation', true, 85, 14, 1, 'hybrid', 'not_started'),

-- Tier 2: Directories (Priority 85-90)
('Photobooth.net LA', 'Photobooth.net Los Angeles Directory', 'https://www.photobooth.net/locations/browse.php?ddState=5&locationID=740&includeInactiveBooths=0', 'https://www.photobooth.net', 'directory', 'directory_la_photobooth', true, 90, 7, 1, 'hybrid', 'not_started'),
('Find My Film Lab', 'Find My Film Lab Photo Booth Microsite', 'https://findmyfilmlab.com/find-my-photo-booth/', 'https://findmyfilmlab.com', 'directory', 'directory_findmyfilmlab', true, 85, 14, 1, 'hybrid', 'not_started'),

-- Tier 3: Tourism (Priority 80-85)
('Discover LA Breweries', 'Discover LA Craft Breweries Guide', 'https://www.discoverlosangeles.com/things-to-do/the-guide-to-craft-breweries-in-los-angeles', 'https://www.discoverlosangeles.com', 'city_guide', 'city_guide_la_discover', true, 80, 30, 1, 'hybrid', 'not_started'),
('Hollywood Roosevelt', 'The Hollywood Roosevelt Hotel', 'https://www.thehollywoodroosevelt.com/', 'https://www.thehollywoodroosevelt.com', 'operator_site', 'operator_roosevelt', true, 75, 30, 1, 'hybrid', 'not_started'),

-- Tier 4: Neighborhood Guides (Priority 75-80)
('Silver Lake Nightlife', 'Silver Lake Nightlife Guide', 'https://silverlake.lanightlife.com/', 'https://silverlake.lanightlife.com', 'blog', 'blog_silverlake', true, 75, 30, 1, 'hybrid', 'not_started'),
('Eastsider LA', 'The Eastsider LA Silver Lake Echo Park', 'https://www.theeastsiderla.com/', 'https://www.theeastsiderla.com', 'community', 'community_eastsiderla', true, 75, 30, 1, 'hybrid', 'not_started'),
('Visit Long Beach', 'Visit Long Beach', 'https://www.visitlongbeach.com/', 'https://www.visitlongbeach.com', 'city_guide', 'city_guide_longbeach', true, 70, 30, 1, 'hybrid', 'not_started'),

-- Tier 5: Museums & Attractions (Priority 85-90)
('Photomatica LA Museum', 'Photomatica Photo Booth Museum LA', 'https://www.photomatica.com/photo-booth-museum/los-angeles', 'https://www.photomatica.com', 'operator_site', 'operator_photomatica_la', true, 85, 14, 1, 'hybrid', 'not_started'),

-- Tier 6: Wedding & Events (Priority 65-70)
('WeddingWire LA', 'WeddingWire Los Angeles Photo Booths', 'https://www.weddingwire.com/c/ca-california/los-angeles-county/photo-booths/803A-207-rca.html', 'https://www.weddingwire.com', 'directory', 'directory_weddingwire_la', true, 65, 30, 1, 'hybrid', 'not_started'),
('Culver City Arts', 'Culver City Arts District', 'https://culvercityartsdistrict.com/', 'https://culvercityartsdistrict.com', 'community', 'community_culvercity', true, 70, 30, 1, 'hybrid', 'not_started'),

-- Tier 7: Yelp Directories (Priority 70-75)
('Yelp LA Bars', 'Yelp Los Angeles Bars with Photo Booths', 'https://www.yelp.com/search?find_desc=Bar+With+Photo+Booth&find_loc=Los+Angeles,+CA', 'https://www.yelp.com', 'community', 'community_yelp_la', true, 70, 14, 1, 'hybrid', 'not_started'),
('Yelp DTLA Bars', 'Yelp Downtown LA Bars with Photo Booths', 'https://www.yelp.com/search?find_desc=Bar+With+Photo+Booth&find_loc=Downtown,+Los+Angeles,+CA', 'https://www.yelp.com', 'community', 'community_yelp_dtla', true, 70, 14, 1, 'hybrid', 'not_started'),
('Yelp Venice Bars', 'Yelp Venice Beach Bars with Photo Booths', 'https://www.yelp.com/search?find_desc=Bar+With+Photo+Booth&find_loc=Venice,+Los+Angeles,+CA', 'https://www.yelp.com', 'community', 'community_yelp_venice', true, 70, 14, 1, 'hybrid', 'not_started'),
('Yelp Los Feliz Bars', 'Yelp Los Feliz Bars with Photo Booths', 'https://www.yelp.com/search?find_desc=Bar+With+Photo+Booth&find_loc=Los+Feliz,+Los+Angeles,+CA', 'https://www.yelp.com', 'community', 'community_yelp_losfeliz', true, 70, 14, 1, 'hybrid', 'not_started'),

-- Tier 8: Additional (Priority 65-70)
('Downtown LA Official', 'Downtown LA Official Site', 'https://downtownla.com/', 'https://downtownla.com', 'city_guide', 'city_guide_dtla', true, 70, 30, 1, 'hybrid', 'not_started'),
('Photobooth.net Long Beach', 'Photobooth.net Long Beach Locations', 'https://www.photobooth.net/locations/browse.php?ddState=5&locationID=740&includeInactiveBooths=0', 'https://www.photobooth.net', 'directory', 'directory_longbeach', true, 70, 30, 1, 'hybrid', 'not_started');

-- ============================================================
-- CHICAGO (18 sources)
-- ============================================================

INSERT INTO crawl_sources (
  name, source_name, source_url, base_url, source_type,
  extractor_type, enabled, priority, crawl_frequency_days,
  pages_per_batch, extraction_mode, pattern_learning_status
) VALUES

-- Tier 1: High-Priority City Guides (Priority 90-95)
('TimeOut Chicago 20 Bars', 'TimeOut Chicago 20 Bars with Photo Booth', 'https://www.timeout.com/chicago/bars/20-chicago-bars-with-a-photo-booth', 'https://www.timeout.com', 'city_guide', 'city_guide_chicago_timeout', true, 95, 14, 1, 'hybrid', 'not_started'),
('Infatuation Chicago Big Booth', 'The Infatuation Chicago Big Booth Rankings', 'https://www.theinfatuation.com/chicago/guides/big-booth-guide-chicago', 'https://www.theinfatuation.com', 'city_guide', 'city_guide_chicago_infatuation', true, 90, 14, 1, 'hybrid', 'not_started'),
('Fodors Chicago Nightlife', 'Fodors Travel Chicago Nightlife Guide', 'https://www.fodors.com/world/north-america/usa/illinois/chicago/things-to-do/nightlife', 'https://www.fodors.com', 'city_guide', 'city_guide_chicago_fodors', true, 85, 14, 1, 'hybrid', 'not_started'),

-- Tier 2: Local Blogs & News (Priority 85-90)
('Block Club Chicago Booths', 'Block Club Chicago Vintage Photo Booths', 'https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed-meet-the-women-trying-to-keep-them-alive/', 'https://blockclubchicago.org', 'blog', 'blog_chicago_blockclub', true, 90, 14, 1, 'hybrid', 'not_started'),
('Choose Chicago Official', 'Choose Chicago Official Tourism', 'https://www.choosechicago.com/', 'https://www.choosechicago.com', 'city_guide', 'city_guide_chicago_official', true, 85, 30, 1, 'hybrid', 'not_started'),
('Choose Chicago Wicker Park', 'Choose Chicago Wicker Park Bucktown', 'https://www.choosechicago.com/neighborhoods/wicker-park-bucktown/', 'https://www.choosechicago.com', 'city_guide', 'city_guide_chicago_wickerpark', true, 80, 30, 1, 'hybrid', 'not_started'),
('Choose Chicago Pilsen', 'Choose Chicago Pilsen Neighborhood', 'https://www.choosechicago.com/neighborhoods/pilsen/', 'https://www.choosechicago.com', 'city_guide', 'city_guide_chicago_pilsen', true, 75, 30, 1, 'hybrid', 'not_started'),

-- Tier 3: Operators (Priority 80-85)
('A&A Studios Chicago', 'A&A Studios Chicago Photobooth Locations', 'https://www.aastudiosinc.com/chicago-photobooth-locations', 'https://www.aastudiosinc.com', 'operator_site', 'operator_aastudios_chicago', true, 85, 14, 1, 'hybrid', 'not_started'),
('Emporium Arcade Bar', 'Emporium Arcade Bar Chicago', 'https://www.emporiumarcadebar.com/services/photo-booth/', 'https://www.emporiumarcadebar.com', 'operator_site', 'operator_emporium_chicago', true, 80, 30, 1, 'hybrid', 'not_started'),
('Metro Smartbar Chicago', 'Metro Chicago Smartbar', 'https://metrochicago.com/', 'https://metrochicago.com', 'operator_site', 'operator_metro_chicago', true, 75, 30, 1, 'hybrid', 'not_started'),

-- Tier 4: Directories (Priority 75-80)
('Photobooth.net Illinois', 'Photobooth.net Illinois Locations', 'http://www.photobooth.net/locations/browse.php?ddState=14', 'http://www.photobooth.net', 'directory', 'directory_illinois_photobooth', true, 80, 7, 1, 'hybrid', 'not_started'),

-- Tier 5: Community (Priority 70-75)
('Yelp Chicago Bars Photobooths', 'Yelp Bars With Photobooth Chicago', 'https://www.yelp.com/search?find_desc=Bars+With+Photobooth&find_loc=Chicago%2C+IL', 'https://www.yelp.com', 'community', 'community_yelp_chicago', true, 75, 14, 1, 'hybrid', 'not_started'),
('Foursquare Near North Side', 'Foursquare Best Places Photo Booth Near North', 'https://foursquare.com/top-places/near-north-side-chicago/best-places-photo-booth', 'https://foursquare.com', 'community', 'community_foursquare_chicago', true, 70, 14, 1, 'hybrid', 'not_started'),

-- Tier 6: Neighborhood Guides (Priority 70-75)
('TimeOut Logan Square', 'TimeOut Chicago Best Bars Logan Square', 'https://www.timeout.com/chicago/bars/best-bars-in-logan-square', 'https://www.timeout.com', 'city_guide', 'city_guide_chicago_logansquare', true, 75, 30, 1, 'hybrid', 'not_started'),
('TimeOut River North', 'TimeOut Chicago River North Streeterville', 'https://www.timeout.com/chicago/bars/the-best-bars-in-river-north-and-streeterville', 'https://www.timeout.com', 'city_guide', 'city_guide_chicago_rivernorth', true, 70, 30, 1, 'hybrid', 'not_started'),

-- Tier 7: Hotels & Suburban (Priority 65-70)
('Chicago Hotels Blackstone', 'Chicago Hotels Blackstone Freehand', 'https://www.aastudiosinc.com/chicago-photobooth-locations', 'https://www.aastudiosinc.com', 'operator_site', 'operator_chicago_hotels', true, 70, 30, 1, 'hybrid', 'not_started'),
('Six Flags Great America', 'Six Flags Great America Suburban', 'https://www.photobooth.net/locations/browse.php?ddState=14&locationID=522', 'https://www.photobooth.net', 'directory', 'directory_sixflags_chicago', true, 65, 30, 1, 'hybrid', 'not_started');

-- ============================================================
-- PORTLAND (10 sources)
-- ============================================================

INSERT INTO crawl_sources (
  name, source_name, source_url, base_url, source_type,
  extractor_type, enabled, priority, crawl_frequency_days,
  pages_per_batch, extraction_mode, pattern_learning_status
) VALUES

-- Tier 1: High-Priority (Priority 90-95)
('PDXtoday Photo Booths', 'PDXtoday Best Photo Booths in Bars', 'https://pdxtoday.6amcity.com/business/asked-what-are-the-best-photo-booths-in-bars-around-portland', 'https://pdxtoday.6amcity.com', 'city_guide', 'city_guide_portland_pdxtoday', true, 95, 14, 1, 'hybrid', 'not_started'),
('DoPDX Photo Booths', 'DoPDX Favorites Photo Booths', 'https://dopdx.com/p/photo-booths', 'https://dopdx.com', 'community', 'community_dopdx', true, 95, 14, 1, 'hybrid', 'not_started'),
('Puddles Ultimate List', 'Puddles Ultimate List Portland Photo Booths', 'https://www.puddlesphotobooth.com/portland-photo-booths', 'https://www.puddlesphotobooth.com', 'operator_site', 'operator_puddles_portland', true, 90, 14, 1, 'hybrid', 'not_started'),
('Puddles Vintage Booths', 'Puddles Best Vintage Photo Booths Portland', 'https://www.puddlesphotobooth.com/the-best-vintage-photo-booths-in-portland', 'https://www.puddlesphotobooth.com', 'operator_site', 'operator_puddles_vintage', true, 85, 14, 1, 'hybrid', 'not_started'),

-- Tier 2: Local Media (Priority 80-85)
('Willamette Week', 'Willamette Week Portland', 'https://www.wweek.com/', 'https://www.wweek.com', 'blog', 'blog_willamette_week', true, 85, 30, 1, 'hybrid', 'not_started'),
('Portland Monthly Bar Crawls', 'Portland Monthly Best Bar Crawls', 'https://www.pdxmonthly.com/eat-and-drink/2023/10/best-portland-bar-crawls', 'https://www.pdxmonthly.com', 'city_guide', 'city_guide_portland_monthly', true, 80, 30, 1, 'hybrid', 'not_started'),
('Portland Tribune Photo Booths', 'Portland Tribune Woman Behind Booths', 'https://portlandtribune.com/2025/07/30/say-cheese-portland-meet-the-woman-behind-the-citys-favorite-photo-booths/', 'https://portlandtribune.com', 'blog', 'blog_portland_tribune', true, 85, 30, 1, 'hybrid', 'not_started'),

-- Tier 3: Tourism & Directory (Priority 75-80)
('Travel Portland Alberta', 'Travel Portland Alberta Arts District', 'https://www.travelportland.com/neighborhoods/alberta-arts-district/', 'https://www.travelportland.com', 'city_guide', 'city_guide_portland_alberta', true, 75, 30, 1, 'hybrid', 'not_started'),
('Ground Kontrol', 'Ground Kontrol Classic Arcade', 'http://photobooth.net/locations/index.php?locationID=256', 'http://photobooth.net', 'directory', 'directory_groundkontrol', true, 80, 30, 1, 'hybrid', 'not_started'),
('Portland Mercury', 'Portland Mercury', 'https://www.portlandmercury.com/', 'https://www.portlandmercury.com', 'blog', 'blog_portland_mercury', true, 75, 30, 1, 'hybrid', 'not_started');

-- ============================================================
-- SEATTLE (10 sources)
-- ============================================================

INSERT INTO crawl_sources (
  name, source_name, source_url, base_url, source_type,
  extractor_type, enabled, priority, crawl_frequency_days,
  pages_per_batch, extraction_mode, pattern_learning_status
) VALUES

-- Tier 1: High-Priority (Priority 90-95)
('Seattle Times Bar Booths', 'Seattle Times Best Bar Photo Booths', 'https://theticket.seattletimes.com/city-guides/the-best-bar-photo-booths-in-seattle/', 'https://theticket.seattletimes.com', 'city_guide', 'city_guide_seattle_times', true, 95, 14, 1, 'hybrid', 'not_started'),
('Rain or Shine Guides', 'Rain or Shine Film Photobooths Seattle', 'http://www.rainorshineguides.com/blog/2016/5/20/filmphotobooths', 'http://www.rainorshineguides.com', 'blog', 'blog_seattle_rainorshine', true, 90, 14, 1, 'hybrid', 'not_started'),
('Infatuation Seattle Capitol Hill', 'Infatuation Seattle Best Capitol Hill Bars', 'https://www.theinfatuation.com/seattle/guides/the-best-capitol-hill-bars', 'https://www.theinfatuation.com', 'city_guide', 'city_guide_seattle_capitolhill', true, 90, 14, 1, 'hybrid', 'not_started'),

-- Tier 2: City Guides (Priority 80-85)
('Infatuation Seattle Fremont', 'Infatuation Seattle Fremont Restaurants', 'https://www.theinfatuation.com/seattle/guides/fremont-seattle-restaurants', 'https://www.theinfatuation.com', 'city_guide', 'city_guide_seattle_fremont', true, 80, 30, 1, 'hybrid', 'not_started'),
('Seattle Met', 'Seattle Met Magazine', 'https://www.seattlemet.com/', 'https://www.seattlemet.com', 'city_guide', 'city_guide_seattle_met', true, 85, 30, 1, 'hybrid', 'not_started'),
('The Stranger Seattle', 'The Stranger Seattle', 'https://www.strangertickets.com/', 'https://www.strangertickets.com', 'blog', 'blog_seattle_stranger', true, 80, 30, 1, 'hybrid', 'not_started'),
('TimeOut Seattle Best Bars', 'TimeOut Seattle 17 Best Bars', 'https://www.timeout.com/seattle/bars/best-bars-in-seattle', 'https://www.timeout.com', 'city_guide', 'city_guide_seattle_timeout', true, 85, 14, 1, 'hybrid', 'not_started'),

-- Tier 3: Directories & Tourism (Priority 70-80)
('EverOut Seattle', 'EverOut Seattle Location Directory', 'https://everout.com/seattle/locations/', 'https://everout.com', 'directory', 'directory_everout_seattle', true, 75, 14, 1, 'hybrid', 'not_started'),
('Visit Seattle Fremont', 'Visit Seattle Fremont Wallingford', 'https://visitseattle.org/neighborhoods/fremont-wallingford/', 'https://visitseattle.org', 'city_guide', 'city_guide_seattle_visitfremont', true, 75, 30, 1, 'hybrid', 'not_started'),
('Photobooth.net Seattle', 'Photobooth.net Seattle Locations', 'http://photobooth.net/', 'http://photobooth.net', 'directory', 'directory_seattle_photobooth', true, 80, 7, 1, 'hybrid', 'not_started');

-- ============================================================
-- AUSTIN (15 sources)
-- ============================================================

INSERT INTO crawl_sources (
  name, source_name, source_url, base_url, source_type,
  extractor_type, enabled, priority, crawl_frequency_days,
  pages_per_batch, extraction_mode, pattern_learning_status
) VALUES

-- Tier 1: High-Priority (Priority 90-95)
('Austinites101 35 Photo Booths', 'Austinites101 35+ Photo Booths Around Austin', 'https://www.austinites101.com/blog/post/photo-booths-around-austin/', 'https://www.austinites101.com', 'blog', 'blog_austin_austinites101', true, 95, 14, 1, 'hybrid', 'not_started'),
('Do512 Best Bars Photobooths', 'Do512 Best Bars with Photo Booths Austin', 'https://do512.com/p/photobooths-in-austin', 'https://do512.com', 'city_guide', 'city_guide_austin_do512', true, 95, 14, 1, 'hybrid', 'not_started'),

-- Tier 2: Tourism Official (Priority 85-90)
('Visit Austin Red River', 'Visit Austin Red River Cultural District', 'https://www.austintexas.org/things-to-do/entertainment-districts/red-river/', 'https://www.austintexas.org', 'city_guide', 'city_guide_austin_redriver', true, 85, 30, 1, 'hybrid', 'not_started'),
('Visit Austin South Congress', 'Visit Austin South Congress Avenue', 'https://www.austintexas.org/things-to-do/entertainment-districts/south-congress/', 'https://www.austintexas.org', 'city_guide', 'city_guide_austin_soco', true, 85, 30, 1, 'hybrid', 'not_started'),
('Visit Austin Rainey Street', 'Visit Austin Rainey Street District', 'https://www.austintexas.org/explore/entertainment-districts/rainey-street/', 'https://www.austintexas.org', 'city_guide', 'city_guide_austin_rainey', true, 80, 30, 1, 'hybrid', 'not_started'),
('Visit Austin Warehouse', 'Visit Austin Warehouse District', 'https://www.austintexas.org/explore/entertainment-districts/downtown/warehouse-district/', 'https://www.austintexas.org', 'city_guide', 'city_guide_austin_warehouse', true, 80, 30, 1, 'hybrid', 'not_started'),

-- Tier 3: Neighborhood Guides (Priority 75-85)
('Do512 East Side Bar Guide', 'Do512 The East Side Bar Guide', 'https://do512.com/p/east-side-bar-guide', 'https://do512.com', 'city_guide', 'city_guide_austin_eastside', true, 80, 30, 1, 'hybrid', 'not_started'),
('Lost in Austin Red River', 'Lost in Austin Best of Red River District', 'https://lostinaustin.org/red-river-district/', 'https://lostinaustin.org', 'blog', 'blog_austin_lostinaustin', true, 75, 30, 1, 'hybrid', 'not_started'),
('Do512 South Congress', 'Do512 Do South Congress', 'https://do512.com/p/south-congress', 'https://do512.com', 'city_guide', 'city_guide_austin_do512soco', true, 75, 30, 1, 'hybrid', 'not_started'),

-- Tier 4: Local Media (Priority 75-85)
('Austin Chronicle 25 Bars', 'Austin Chronicle 25 Bars That Define Austin', 'https://www.austinchronicle.com/food/2017-07-21/25-bars-that-define-austin/', 'https://www.austinchronicle.com', 'city_guide', 'city_guide_austin_chronicle', true, 80, 30, 1, 'hybrid', 'not_started'),
('Infatuation Austin', 'The Infatuation Austin', 'https://www.theinfatuation.com/austin', 'https://www.theinfatuation.com', 'city_guide', 'city_guide_austin_infatuation', true, 75, 30, 1, 'hybrid', 'not_started'),
('CultureMap Austin Bars', 'CultureMap Austin Restaurants Bars', 'https://austin.culturemap.com/news/restaurants-bars/', 'https://austin.culturemap.com', 'blog', 'blog_austin_culturemap', true, 75, 30, 1, 'hybrid', 'not_started'),

-- Tier 5: Community (Priority 70-75)
('Downtown Austin Alliance', 'Downtown Austin Alliance Photo Spots', 'https://downtownaustin.com/blog/photo-worthy-spots-in-austin/', 'https://downtownaustin.com', 'community', 'community_downtown_austin', true, 70, 30, 1, 'hybrid', 'not_started'),
('Do512 Speakeasies', 'Do512 Speakeasies Secret Bars Austin', 'https://do512.com/p/speakeasies-secret-bars-in-austin', 'https://do512.com', 'city_guide', 'city_guide_austin_speakeasies', true, 70, 30, 1, 'hybrid', 'not_started'),
('Austin Chronicle Best Of', 'Austin Chronicle Best of Austin Awards', 'https://www.austinchronicle.com/best-of-austin/year:2023/poll:critics/category:nightlife/', 'https://www.austinchronicle.com', 'community', 'community_austin_bestof', true, 75, 30, 1, 'hybrid', 'not_started');

-- ============================================================
-- BERLIN (8 sources)
-- ============================================================

INSERT INTO crawl_sources (
  name, source_name, source_url, base_url, source_type,
  extractor_type, enabled, priority, crawl_frequency_days,
  pages_per_batch, extraction_mode, pattern_learning_status
) VALUES

-- Tier 1: High-Priority (Priority 90-95)
('Photokabine Berlin', 'Photokabine Berlin Locations', 'https://www.photokabine.de/locations', 'https://www.photokabine.de', 'operator_site', 'operator_photokabine', true, 95, 14, 1, 'hybrid', 'not_started'),
('Aperture Tours Photoautomats', 'Aperture Tours Photoautomats of Berlin', 'https://www.aperturetours.com/blog/2017/berlin-photoautomat', 'https://www.aperturetours.com', 'blog', 'blog_berlin_aperture', true, 90, 14, 1, 'hybrid', 'not_started'),

-- Tier 2: Tourism & City Guides (Priority 80-85)
('Visit Berlin Official', 'Visit Berlin Official Tourism', 'https://www.visitberlin.de/en', 'https://www.visitberlin.de', 'city_guide', 'city_guide_berlin_official', true, 80, 30, 1, 'hybrid', 'not_started'),
('Infatuation Berlin', 'The Infatuation Berlin', 'https://www.theinfatuation.com/berlin', 'https://www.theinfatuation.com', 'city_guide', 'city_guide_berlin_infatuation', true, 85, 30, 1, 'hybrid', 'not_started'),
('TimeOut Berlin Nightlife', 'TimeOut Berlin Nightlife', 'https://www.timeout.com/berlin/nightlife', 'https://www.timeout.com', 'city_guide', 'city_guide_berlin_timeout', true, 85, 14, 1, 'hybrid', 'not_started'),

-- Tier 3: Clubs & Nightlife (Priority 75-85)
('Resident Advisor Berlin', 'Resident Advisor Berlin Clubs Guide', 'https://ra.co/guide/de/berlin', 'https://ra.co', 'directory', 'directory_berlin_ra', true, 80, 14, 1, 'hybrid', 'not_started'),
('Lonely Planet Berlin Clubs', 'Lonely Planet 22 Best Berlin Clubs', 'https://www.lonelyplanet.com/articles/berlin-clubs', 'https://www.lonelyplanet.com', 'city_guide', 'city_guide_berlin_lonely', true, 75, 30, 1, 'hybrid', 'not_started'),
('Culture Trip Berlin Bars', 'Culture Trip 11 Coolest Bars Berlin', 'https://theculturetrip.com/germany/articles/the-8-best-bars-to-visit-in-berlin', 'https://theculturetrip.com', 'blog', 'blog_berlin_culturetrip', true, 75, 30, 1, 'hybrid', 'not_started');

-- ============================================================
-- PARIS (8 sources)
-- ============================================================

INSERT INTO crawl_sources (
  name, source_name, source_url, base_url, source_type,
  extractor_type, enabled, priority, crawl_frequency_days,
  pages_per_batch, extraction_mode, pattern_learning_status
) VALUES

-- Tier 1: High-Priority (Priority 90-95)
('Wooish Paris Vintage Booths', 'Wooish Best Vintage Film Photo Booths Paris', 'https://www.wooish.co/post/my-favorite-non-touristy-and-inexpensive-activity-to-do-in-paris', 'https://www.wooish.co', 'blog', 'blog_paris_wooish', true, 95, 14, 1, 'hybrid', 'not_started'),
('Solo Sophie Paris Booths', 'Solo Sophie Vintage Photo Booths Paris', 'https://www.solosophie.com/vintage-photo-booths-in-paris/', 'https://www.solosophie.com', 'blog', 'blog_paris_solosophie', true, 90, 14, 1, 'hybrid', 'not_started'),
('Fat Tire Tours Paris', 'Fat Tire Tours Best Photo Booths Paris', 'https://www.fattiretours.com/like-a-local/photobooths-in-paris/', 'https://www.fattiretours.com', 'blog', 'blog_paris_fattire', true, 85, 14, 1, 'hybrid', 'not_started'),

-- Tier 2: Tourism & City Guides (Priority 80-85)
('Paris je taime Official', 'Paris je taime Official Tourist Office', 'https://parisjetaime.com/eng/', 'https://parisjetaime.com', 'city_guide', 'city_guide_paris_official', true, 80, 30, 1, 'hybrid', 'not_started'),
('Infatuation Paris', 'The Infatuation Paris', 'https://www.theinfatuation.com/paris', 'https://www.theinfatuation.com', 'city_guide', 'city_guide_paris_infatuation', true, 85, 30, 1, 'hybrid', 'not_started'),
('TimeOut Paris Best Bars', 'TimeOut Paris Best Bars', 'https://www.timeout.com/paris/en/bars-pubs/best-bars-in-paris', 'https://www.timeout.com', 'city_guide', 'city_guide_paris_timeout', true, 85, 14, 1, 'hybrid', 'not_started'),

-- Tier 3: Additional (Priority 75-80)
('Lonely Planet Paris Nightlife', 'Lonely Planet Paris After Dark', 'https://www.lonelyplanet.com/articles/paris-after-dark-nightlife', 'https://www.lonelyplanet.com', 'city_guide', 'city_guide_paris_lonely', true, 75, 30, 1, 'hybrid', 'not_started'),
('Culture Trip Paris Bars', 'Culture Trip Quirky Bars Paris', 'https://theculturetrip.com/europe/france/paris/articles/10-quirky-parisian-bars-you-won-t-find-anywhere-else', 'https://theculturetrip.com', 'blog', 'blog_paris_culturetrip', true, 75, 30, 1, 'hybrid', 'not_started');

-- ============================================================
-- LONDON (8 sources)
-- ============================================================

INSERT INTO crawl_sources (
  name, source_name, source_url, base_url, source_type,
  extractor_type, enabled, priority, crawl_frequency_days,
  pages_per_batch, extraction_mode, pattern_learning_status
) VALUES

-- Tier 1: High-Priority (Priority 90-95)
('Design My Night London', 'Design My Night Photobooths in London', 'https://www.designmynight.com/london/blog/photobooths-in-london', 'https://www.designmynight.com', 'directory', 'directory_london_dmn', true, 95, 14, 1, 'hybrid', 'not_started'),
('London World 25 Booths', 'London World 25 Quirky Photo Booths', 'https://www.londonworld.com/whats-on/photo-booths-london-near-me-locations-4478164', 'https://www.londonworld.com', 'directory', 'directory_london_world', true, 90, 14, 1, 'hybrid', 'not_started'),
('Flash Pack London Booths', 'Flash Pack Best Photo Booths London', 'https://itstheflashpack.com/the-lens/the-best-photo-booths-in-london/', 'https://itstheflashpack.com', 'blog', 'blog_london_flashpack', true, 85, 14, 1, 'hybrid', 'not_started'),

-- Tier 2: Tourism & City Guides (Priority 80-85)
('Visit London Official', 'Visit London Official Visitor Guide', 'https://www.visitlondon.com/', 'https://www.visitlondon.com', 'city_guide', 'city_guide_london_official', true, 80, 30, 1, 'hybrid', 'not_started'),
('Infatuation London', 'The Infatuation London', 'https://www.theinfatuation.com/london', 'https://www.theinfatuation.com', 'city_guide', 'city_guide_london_infatuation', true, 85, 30, 1, 'hybrid', 'not_started'),
('TimeOut London Best Bars', 'TimeOut London Best Bars', 'https://www.timeout.com/london/bars-and-pubs/the-best-bars-in-london', 'https://www.timeout.com', 'city_guide', 'city_guide_london_timeout', true, 85, 14, 1, 'hybrid', 'not_started'),

-- Tier 3: Additional (Priority 75-80)
('Lonely Planet London Rooftops', 'Lonely Planet Best Rooftop Bars London', 'https://www.lonelyplanet.com/articles/best-rooftop-bars-london', 'https://www.lonelyplanet.com', 'city_guide', 'city_guide_london_lonely', true, 75, 30, 1, 'hybrid', 'not_started'),
('Culture Trip London Pubs', 'Culture Trip Best Pubs London', 'https://theculturetrip.com/europe/united-kingdom/england/london/articles/the-20-best-pubs-in-london-you-must-visit', 'https://theculturetrip.com', 'blog', 'blog_london_culturetrip', true, 75, 30, 1, 'hybrid', 'not_started');

-- ============================================================
-- SUMMARY
-- ============================================================
-- Total sources added: 117
-- NYC/Brooklyn: 20 sources
-- Los Angeles: 20 sources
-- Chicago: 18 sources
-- Portland: 10 sources
-- Seattle: 10 sources
-- Austin: 15 sources
-- Berlin: 8 sources
-- Paris: 8 sources
-- London: 8 sources
--
-- All sources configured with:
-- - extraction_mode: 'hybrid' (flexible address extraction)
-- - pattern_learning_status: 'not_started'
-- - Appropriate priorities based on source quality
-- - All enabled for immediate crawling
-- ============================================================
