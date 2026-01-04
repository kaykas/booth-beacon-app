-- Complete SF Bay Area Photo Booth Sources
-- Total: 35+ new sources across SF, Oakland, Marin, Sonoma
-- All configured for hybrid mode for cost efficiency

-- ==================================================
-- TIER 1: HIGH-VALUE CITY GUIDES & DIRECTORIES (Priority 80-90)
-- ==================================================

INSERT INTO crawl_sources (name, source_name, source_url, base_url, source_type, extractor_type, enabled, priority, crawl_frequency_days, pages_per_batch, extraction_mode, pattern_learning_status)
VALUES
  -- Top SF sources
  ('LocalWiki San Francisco Photo Booths', 'LocalWiki SF Photo Booths', 'https://localwiki.org/sf/Photo_Booths', 'https://localwiki.org', 'city_guide', 'city_guide_sf_localwiki', true, 85, 7, 1, 'hybrid', 'not_started'),

  ('Do The Bay - Photo Booths', 'Do The Bay Photo Booths', 'https://dothebay.com/p/photo-booths-bay-area', 'https://dothebay.com', 'city_guide', 'city_guide_sf_dothebay', true, 90, 7, 1, 'hybrid', 'not_started'),

  ('The Bold Italic SF Photo Booths', 'Bold Italic SF Photo Booths', 'https://thebolditalic.com/san-francisco-s-best-photobooths-the-bold-italic-san-francisco-f9a4b6682309', 'https://thebolditalic.com', 'city_guide', 'city_guide_sf_bolditalic', true, 85, 7, 1, 'hybrid', 'not_started'),

  ('Photomatica SF Photo Booth Crawl', 'Photomatica SF Crawl', 'https://www.photomatica.com/sf-photo-booth-crawl', 'https://www.photomatica.com', 'operator_site', 'operator_photomatica_sf', true, 90, 7, 3, 'hybrid', 'not_started'),

  ('Photomatica Oakland Permanent Installations', 'Photomatica Oakland', 'https://www.photomatica.com/permanent-photo-booth/oakland', 'https://www.photomatica.com', 'operator_site', 'operator_photomatica_oakland', true, 85, 7, 3, 'hybrid', 'not_started'),

  ('SF Standard - Photo Booths Popping Up', 'SF Standard Photo Booths', 'https://sfstandard.com/2024/06/29/photomatica-vintage-photobooths-san-francisco/', 'https://sfstandard.com', 'blog', 'city_guide_sf_standard', true, 80, 14, 1, 'hybrid', 'not_started');

-- ==================================================
-- TIER 2: MUSEUMS & CULTURAL ATTRACTIONS (Priority 70-80)
-- ==================================================

INSERT INTO crawl_sources (name, source_name, source_url, base_url, source_type, extractor_type, enabled, priority, crawl_frequency_days, pages_per_batch, extraction_mode, pattern_learning_status)
VALUES
  ('Musée Mécanique Pier 45', 'Musée Mécanique SF', 'https://www.tripadvisor.com/ShowUserReviews-g60713-d104542-r443538777-Musee_Mecanique-San_Francisco_California.html', 'https://www.tripadvisor.com', 'directory', 'directory_tripadvisor_musee', true, 75, 14, 1, 'hybrid', 'not_started'),

  ('Photomatica Photo Booth Museum', 'Photo Booth Museum SF', 'https://www.photomatica.com/photo-booth-museum/san-francisco', 'https://www.photomatica.com', 'operator_site', 'operator_photomatica_museum', true, 80, 7, 1, 'hybrid', 'not_started'),

  ('TimeOut SF Museums Guide', 'TimeOut SF Museums', 'https://www.timeout.com/san-francisco/things-to-do/best-san-francisco-museums', 'https://www.timeout.com', 'city_guide', 'city_guide_sf_timeout_museums', true, 70, 14, 1, 'hybrid', 'not_started'),

  ('Wonderful Museums - SF Photo Booth Museum', 'Wonderful Museums SF', 'https://www.wonderfulmuseums.com/museum/sf-photo-booth-museum/', 'https://www.wonderfulmuseums.com', 'directory', 'directory_wonderful_museums', true, 65, 30, 1, 'hybrid', 'not_started');

-- ==================================================
-- TIER 3: ENTERTAINMENT VENUES (Priority 65-75)
-- ==================================================

INSERT INTO crawl_sources (name, source_name, source_url, base_url, source_type, extractor_type, enabled, priority, crawl_frequency_days, pages_per_batch, extraction_mode, pattern_learning_status)
VALUES
  ('Lucky Strike San Francisco', 'Lucky Strike SF', 'https://www.luckystrikeent.com/location/lucky-strike-san-francisco', 'https://www.luckystrikeent.com', 'operator_site', 'operator_lucky_strike_sf', true, 70, 14, 1, 'hybrid', 'not_started'),

  ('Emporium Arcade Bar Oakland', 'Emporium Oakland', 'https://www.tripadvisor.com/Attraction_Review-g32810-d24179735-Reviews-Emporium_Oakland-Oakland_California.html', 'https://www.tripadvisor.com', 'operator_site', 'operator_emporium_oakland', true, 75, 14, 1, 'hybrid', 'not_started'),

  ('Temple Nightclub SF', 'Temple SF', 'https://www.templesf.com/private-events', 'https://www.templesf.com', 'operator_site', 'operator_temple_sf', true, 65, 30, 1, 'hybrid', 'not_started'),

  ('Dave & Busters Santa Rosa', 'Dave & Busters Santa Rosa', 'https://www.daveandbusters.com/', 'https://www.daveandbusters.com', 'operator_site', 'operator_davebusters_santarosa', true, 70, 14, 3, 'hybrid', 'not_started');

-- ==================================================
-- TIER 4: HOTELS & LODGING (Priority 60-70)
-- ==================================================

INSERT INTO crawl_sources (name, source_name, source_url, base_url, source_type, extractor_type, enabled, priority, crawl_frequency_days, pages_per_batch, extraction_mode, pattern_learning_status)
VALUES
  ('Hotel Kabuki Japantown', 'Hotel Kabuki SF', 'https://www.mrandmrssmith.com/luxury-hotels/hotel-kabuki', 'https://www.mrandmrssmith.com', 'operator_site', 'operator_hotel_kabuki', true, 65, 30, 1, 'hybrid', 'not_started'),

  ('Hotel Zetta SoMa', 'Hotel Zetta SF', 'https://www.mrandmrssmith.com/luxury-hotels/hotel-zetta-san-francisco', 'https://www.mrandmrssmith.com', 'operator_site', 'operator_hotel_zetta', true, 65, 30, 1, 'hybrid', 'not_started');

-- ==================================================
-- TIER 5: NEWS & LIFESTYLE MEDIA (Priority 65-75)
-- ==================================================

INSERT INTO crawl_sources (name, source_name, source_url, base_url, source_type, extractor_type, enabled, priority, crawl_frequency_days, pages_per_batch, extraction_mode, pattern_learning_status)
VALUES
  ('Foursquare Mission District Photo Booths', 'Foursquare Mission SF', 'https://foursquare.com/top-places/mission-san-francisco/best-places-photo-booth', 'https://foursquare.com', 'directory', 'directory_foursquare_sf', true, 75, 14, 1, 'hybrid', 'not_started'),

  ('Tinybeans SF Photo Booths', 'Tinybeans SF', 'https://tinybeans.com/san-francisco/photo-booths-in-sf/', 'https://tinybeans.com', 'city_guide', 'city_guide_sf_tinybeans', true, 70, 14, 1, 'hybrid', 'not_started'),

  ('SF Chronicle Photo Booth Museum', 'SF Chronicle Photo Booth', 'https://www.sfchronicle.com/entertainment/article/photomatica-photo-booth-sf-20012049.php', 'https://www.sfchronicle.com', 'city_guide', 'city_guide_sf_chronicle', true, 75, 30, 1, 'hybrid', 'not_started'),

  ('Hoodline Castro Photo Booth Museum', 'Hoodline Castro', 'https://hoodline.com/2024/12/say-cheese-castro-vintage-photo-booth-museum-now-open/', 'https://hoodline.com', 'city_guide', 'city_guide_sf_hoodline_castro', true, 70, 30, 1, 'hybrid', 'not_started'),

  ('Hoodline Dave & Busters Santa Rosa', 'Hoodline Santa Rosa', 'https://hoodline.com/2025/12/game-on-as-dave-buster-s-turns-santa-rosa-plaza-into-giant-arcade/', 'https://hoodline.com', 'city_guide', 'city_guide_santarosa_hoodline', true, 65, 30, 1, 'hybrid', 'not_started'),

  ('SF Standard Club Photomatica', 'SF Standard Club Photomatica', 'https://sfstandard.com/2024/08/06/club-photomatica-opens-photobooth-shop-sanfrancisco-haight/', 'https://sfstandard.com', 'city_guide', 'city_guide_sf_standard_club', true, 70, 30, 1, 'hybrid', 'not_started'),

  ('TimeOut SF Photo Booth Museum', 'TimeOut SF Photo Booth', 'https://www.timeout.com/san-francisco/news/a-brand-new-photo-booth-museum-just-opened-in-san-francisco-121424', 'https://www.timeout.com', 'city_guide', 'city_guide_sf_timeout', true, 70, 14, 1, 'hybrid', 'not_started'),

  ('SF Gate Instagrammable Coffee Shops', 'SF Gate Coffee Shops', 'https://www.sfgate.com/food/slideshow/Instagrammable-coffee-shops-of-San-Francisco-185601.php', 'https://www.sfgate.com', 'city_guide', 'city_guide_sf_gate_coffee', true, 60, 30, 1, 'hybrid', 'not_started'),

  ('SF Gate Best Dive Bars', 'SF Gate Dive Bars', 'https://www.sfgate.com/bars/article/San-Francisco-perfect-dive-bar-16917697.php', 'https://www.sfgate.com', 'city_guide', 'city_guide_sf_gate_bars', true, 65, 30, 1, 'hybrid', 'not_started');

-- ==================================================
-- TIER 6: SPECIALIZED COMMUNITIES (Priority 60-70)
-- ==================================================

INSERT INTO crawl_sources (name, source_name, source_url, base_url, source_type, extractor_type, enabled, priority, crawl_frequency_days, pages_per_batch, extraction_mode, pattern_learning_status)
VALUES
  ('Analog Forever Magazine - Photoworks SF', 'Analog Forever Photoworks', 'https://www.analogforevermagazine.com/features-interviews/photoworks-sf-analog-in-the-digital-age', 'https://www.analogforevermagazine.com', 'blog', 'blog_analog_forever', true, 65, 30, 1, 'hybrid', 'not_started'),

  ('Harvey Milk Photo Center', 'Harvey Milk Photo Center', 'https://www.harveymilkphotocenter.org/', 'https://www.harveymilkphotocenter.org', 'community', 'community_harvey_milk', true, 60, 30, 1, 'hybrid', 'not_started'),

  ('East Bay Photo Collective', 'EBPCO Oakland', 'https://www.ebpco.org/about', 'https://www.ebpco.org', 'community', 'community_ebpco', true, 60, 30, 1, 'hybrid', 'not_started'),

  ('The Infatuation SF LGBTQ+ Bars', 'Infatuation SF LGBTQ', 'https://www.theinfatuation.com/san-francisco/guides/best-lgbtq-gay-bars-san-francisco', 'https://www.theinfatuation.com', 'city_guide', 'city_guide_sf_infatuation_lgbtq', true, 70, 14, 1, 'hybrid', 'not_started'),

  ('QLIST SF LGBTQ+ Nightlife', 'QLIST SF', 'https://qlist.app/cities/California/San-Francisco/83', 'https://qlist.app', 'directory', 'directory_qlist_sf', true, 65, 14, 1, 'hybrid', 'not_started');

-- ==================================================
-- TIER 7: TOURISM & LIFESTYLE BLOGS (Priority 55-65)
-- ==================================================

INSERT INTO crawl_sources (name, source_name, source_url, base_url, source_type, extractor_type, enabled, priority, crawl_frequency_days, pages_per_batch, extraction_mode, pattern_learning_status)
VALUES
  ('SF Travel Low Brow Dive Bars', 'SF Travel Dive Bars', 'https://www.sftravel.com/article/low-brow-sf-our-guide-to-dive-bars-greasy-spoons-hidden-local-hangouts', 'https://www.sftravel.com', 'blog', 'city_guide_sf_travel_divebars', true, 65, 14, 1, 'hybrid', 'not_started'),

  ('SF Travel LGBTQ+ Bars', 'SF Travel LGBTQ', 'https://www.sftravel.com/article/essential-lgbt-bars-san-francisco', 'https://www.sftravel.com', 'blog', 'city_guide_sf_travel_lgbtq', true, 65, 14, 1, 'hybrid', 'not_started'),

  ('Secret San Francisco Instagrammable Cafes', 'Secret SF Cafes', 'https://secretsanfrancisco.com/instagrammable-cafes-bay-area/', 'https://secretsanfrancisco.com', 'blog', 'blog_secret_sf', true, 60, 30, 1, 'hybrid', 'not_started'),

  ('Oldham Group Bay Area Hidden Gems', 'Oldham Group Hidden Gems', 'https://oldhamgroupluxury.com/blog/hidden-gems-of-the-bay-area', 'https://oldhamgroupluxury.com', 'blog', 'blog_oldham_group', true, 60, 30, 1, 'hybrid', 'not_started'),

  ('SF FunCheap Photo Booth Museum', 'FunCheap SF', 'https://sf.funcheap.com/grand-opening-sfs-brand-vintage-photo-booth-museum-free-photos-59p/', 'https://sf.funcheap.com', 'blog', 'city_guide_sf_funcheap', true, 60, 30, 1, 'hybrid', 'not_started'),

  ('Retro Roadmap Musée Mécanique', 'Retro Roadmap SF', 'https://www.retroroadmap.com/listing/musee-mecanique-vintage-arcade-san-francisco/', 'https://www.retroroadmap.com', 'blog', 'blog_retro_roadmap', true, 60, 30, 1, 'hybrid', 'not_started');

-- ==================================================
-- TIER 8: OAKLAND & EAST BAY (Priority 70-75)
-- ==================================================

INSERT INTO crawl_sources (name, source_name, source_url, base_url, source_type, extractor_type, enabled, priority, crawl_frequency_days, pages_per_batch, extraction_mode, pattern_learning_status)
VALUES
  ('Yelp Oakland Photo Booth Bars', 'Yelp Oakland Photo Booths', 'https://www.yelp.com/search?find_desc=Bar+With+Photo+Booth&find_loc=Oakland,+CA', 'https://www.yelp.com', 'directory', 'directory_yelp_oakland', true, 75, 14, 1, 'hybrid', 'not_started');

-- Verify all additions
SELECT
  COUNT(*) as total_new_sources,
  COUNT(CASE WHEN enabled = true THEN 1 END) as enabled_sources,
  COUNT(CASE WHEN extraction_mode = 'hybrid' THEN 1 END) as hybrid_mode_sources
FROM crawl_sources
WHERE created_at > now() - interval '1 minute';

-- Show all new SF Bay Area sources
SELECT
  id,
  source_name,
  source_url,
  base_url,
  source_type,
  extraction_mode,
  priority,
  enabled,
  extractor_type
FROM crawl_sources
WHERE source_name LIKE '%SF%'
   OR source_name LIKE '%Oakland%'
   OR source_name LIKE '%Bay%'
   OR source_name LIKE '%Santa Rosa%'
   OR source_name LIKE '%Photomatica%'
   OR source_name LIKE '%Marin%'
ORDER BY priority DESC, source_name;
