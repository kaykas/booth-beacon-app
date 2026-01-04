-- Add SF Bay Area Photo Booth Sources
-- Priority: San Francisco, Oakland, Marin County, Sonoma County

-- Tier 1: High-value city guides and directories
INSERT INTO crawl_sources (name, source_name, source_url, extractor_type, enabled, priority, crawl_frequency_days, pages_per_batch, extraction_mode, pattern_learning_status)
VALUES
  ('LocalWiki San Francisco Photo Booths', 'LocalWiki SF Photo Booths', 'https://localwiki.org/sf/Photo_Booths', 'city_guide_sf_localwiki', true, 80, 7, 1, 'hybrid', 'not_started'),

  ('Do The Bay - Photo Booths', 'Do The Bay Photo Booths', 'https://dothebay.com/p/photo-booths-bay-area', 'city_guide_sf_dothebay', true, 85, 7, 1, 'hybrid', 'not_started'),

  ('The Bold Italic SF Photo Booths', 'Bold Italic SF Photo Booths', 'https://thebolditalic.com/san-francisco-s-best-photobooths-the-bold-italic-san-francisco-f9a4b6682309', 'city_guide_sf_bolditalic', true, 80, 7, 1, 'hybrid', 'not_started'),

  ('Photomatica SF Photo Booth Crawl', 'Photomatica SF Crawl', 'https://www.photomatica.com/sf-photo-booth-crawl', 'operator_photomatica_sf', true, 90, 7, 3, 'hybrid', 'not_started'),

  ('SF Standard - Photo Booths Article', 'SF Standard Photo Booths', 'https://sfstandard.com/2024/06/29/photomatica-vintage-photobooths-san-francisco/', 'city_guide_sf_standard', true, 75, 14, 1, 'hybrid', 'not_started');

-- Tier 2: Additional SF sources
INSERT INTO crawl_sources (name, source_name, source_url, extractor_type, enabled, priority, crawl_frequency_days, pages_per_batch, extraction_mode, pattern_learning_status)
VALUES
  ('Foursquare Mission District Photo Booths', 'Foursquare Mission SF', 'https://foursquare.com/top-places/mission-san-francisco/best-places-photo-booth', 'directory_foursquare_sf', true, 70, 14, 1, 'hybrid', 'not_started'),

  ('Tinybeans SF Photo Booths', 'Tinybeans SF', 'https://tinybeans.com/san-francisco/photo-booths-in-sf/', 'city_guide_sf_tinybeans', true, 65, 14, 1, 'hybrid', 'not_started'),

  ('SF Chronicle Photo Booth Museum', 'SF Chronicle Photo Booth', 'https://www.sfchronicle.com/entertainment/article/photomatica-photo-booth-sf-20012049.php', 'city_guide_sf_chronicle', true, 70, 30, 1, 'hybrid', 'not_started'),

  ('Hoodline Castro Photo Booth Museum', 'Hoodline Castro', 'https://hoodline.com/2024/12/say-cheese-castro-vintage-photo-booth-museum-now-open/', 'city_guide_sf_hoodline', true, 65, 30, 1, 'hybrid', 'not_started'),

  ('TimeOut SF Photo Booth Museum', 'TimeOut SF Photo Booth', 'https://www.timeout.com/san-francisco/news/a-brand-new-photo-booth-museum-just-opened-in-san-francisco-121424', 'city_guide_sf_timeout', true, 70, 14, 1, 'hybrid', 'not_started');

-- Oakland sources
INSERT INTO crawl_sources (name, source_name, source_url, extractor_type, enabled, priority, crawl_frequency_days, pages_per_batch, extraction_mode, pattern_learning_status)
VALUES
  ('Yelp Oakland Photo Booth Bars', 'Yelp Oakland Photo Booths', 'https://www.yelp.com/search?find_desc=Bar+With+Photo+Booth&find_loc=Oakland,+CA', 'directory_yelp_oakland', true, 75, 14, 1, 'hybrid', 'not_started');

-- SF Standard additional coverage
INSERT INTO crawl_sources (name, source_name, source_url, extractor_type, enabled, priority, crawl_frequency_days, pages_per_batch, extraction_mode, pattern_learning_status)
VALUES
  ('SF Standard Club Photomatica', 'SF Standard Club Photomatica', 'https://sfstandard.com/2024/08/06/club-photomatica-opens-photobooth-shop-sanfrancisco-haight/', 'city_guide_sf_standard_club', true, 70, 30, 1, 'hybrid', 'not_started');

-- Verify additions
SELECT
  id,
  source_name,
  source_url,
  extraction_mode,
  priority,
  enabled
FROM crawl_sources
WHERE source_name LIKE '%SF%'
   OR source_name LIKE '%Oakland%'
   OR source_name LIKE '%Bay%'
ORDER BY priority DESC, source_name;
