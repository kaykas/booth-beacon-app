-- =====================================================
-- SEED CRAWL SOURCES
-- Adds all 39+ crawl sources to the system
-- =====================================================

INSERT INTO crawl_sources (
  source_name,
  source_url,
  extractor_type,
  enabled,
  priority,
  crawl_frequency_days,
  status
) VALUES
  -- TIER 1: Primary Directory Sources (Highest Priority)
  ('Photobooth.net', 'https://www.photobooth.net/locations/', 'photobooth_net', true, 100, 7, 'active'),
  ('Lomography Locations', 'https://www.lomography.com/magazine/tipster/photobooth-locations', 'lomography', true, 90, 14, 'active'),
  ('Flickr Photobooth Group', 'https://www.flickr.com/groups/photobooth/', 'flickr_photobooth', true, 85, 30, 'active'),

  -- TIER 2: Regional Directories & Operators
  ('Photomatica Berlin', 'https://www.photomatica.de', 'photomatica', true, 80, 14, 'active'),
  ('Photomatica West Coast', 'https://www.photomatica.com', 'photomatica_west_coast', true, 80, 14, 'active'),
  ('Photomatic', 'https://photomatic.com.au', 'photomatic', true, 75, 14, 'active'),
  ('Photoautomat DE', 'https://www.photoautomat.de', 'photoautomat_de', true, 75, 14, 'active'),
  ('Classic Photo Booth Co', 'https://classicphotoboothco.com/locations', 'classic_photo_booth_co', true, 75, 14, 'active'),
  ('Autophoto', 'https://autophoto.org', 'autophoto', true, 70, 14, 'active'),

  -- European Operators
  ('Fotoautomat Berlin', 'https://www.fotoautomat-berlin.de', 'fotoautomat_berlin', true, 70, 14, 'active'),
  ('Autofoto', 'https://www.autofoto.nl', 'autofoto', true, 70, 14, 'active'),
  ('Fotoautomat FR', 'https://www.fotoautomat.fr', 'fotoautomat_fr', true, 70, 14, 'active'),
  ('Fotoautomat Wien', 'https://www.fotoautomat-wien.at', 'fotoautomat_wien', true, 70, 14, 'active'),
  ('Fotoautomatica', 'https://www.fotoautomatica.it', 'fotoautomatica', true, 70, 14, 'active'),
  ('Flash Pack', 'https://www.theflashpack.com/photobooths', 'flash_pack', true, 65, 30, 'active'),
  ('Metro Auto Photo', 'https://www.metroautophoto.com', 'metro_auto_photo', true, 65, 14, 'active'),

  -- TIER 3: City Guides
  -- Berlin
  ('Digital Cosmonaut Berlin', 'https://digitalcosmonaut.com/photo-booths-berlin', 'city_guide_berlin_digitalcosmonaut', true, 60, 30, 'active'),
  ('Phelt Magazine Berlin', 'https://pheltmag.com/berlin-photobooths', 'city_guide_berlin_phelt', true, 60, 30, 'active'),
  ('Aperture Tours Berlin', 'https://aperturetours.com/berlin-photo-booths', 'city_guide_berlin_aperture', true, 60, 30, 'active'),

  -- London
  ('Design My Night London', 'https://www.designmynight.com/london/whats-on/unusual-things-to-do/photo-booths', 'city_guide_london_designmynight', true, 60, 30, 'active'),
  ('London World', 'https://londonworld.com/photo-booths', 'city_guide_london_world', true, 60, 30, 'active'),
  ('Flash Pack London', 'https://www.theflashpack.com/london/photo-booths', 'city_guide_london_flashpack', true, 60, 30, 'active'),

  -- Los Angeles
  ('Time Out LA', 'https://www.timeout.com/los-angeles/things-to-do/photo-booths-in-los-angeles', 'city_guide_la_timeout', true, 60, 30, 'active'),
  ('Locale Magazine LA', 'https://localemagazine.com/la-photo-booths', 'city_guide_la_locale', true, 60, 30, 'active'),

  -- Chicago
  ('Time Out Chicago', 'https://www.timeout.com/chicago/things-to-do/photo-booths-in-chicago', 'city_guide_chicago_timeout', true, 60, 30, 'active'),
  ('Block Club Chicago', 'https://blockclubchicago.org/photo-booths', 'city_guide_chicago_blockclub', true, 60, 30, 'active'),

  -- New York
  ('Design My Night NYC', 'https://www.designmynight.com/new-york/whats-on/unusual-things-to-do/photo-booths', 'city_guide_ny_designmynight', true, 60, 30, 'active'),
  ('Roxy Hotel NYC', 'https://www.roxyhotelnyc.com/photo-booth', 'city_guide_ny_roxy', true, 60, 30, 'active'),
  ('Airial Travel Brooklyn', 'https://www.airialtravel.com/brooklyn-photo-booths', 'city_guide_ny_airial', true, 60, 30, 'active'),

  -- TIER 4: Travel Blogs & Community
  ('Solo Sophie Paris', 'https://solosophie.com/paris-photo-booths/', 'solo_sophie', true, 50, 60, 'active'),
  ('Misadventures with Andi', 'https://www.misadventureswithand.com/photo-booths', 'misadventures_andi', true, 50, 60, 'active'),
  ('No Camera Bag Vienna', 'https://www.nocamerabag.com/vienna-photo-booths', 'no_camera_bag', true, 50, 60, 'active'),
  ('Girl in Florence', 'https://www.girl-in-florence.com/photo-booths/', 'girl_in_florence', true, 50, 60, 'active'),
  ('Accidentally Wes Anderson', 'https://accidentallywesanderson.com/photobooths', 'accidentally_wes_anderson', true, 50, 60, 'active'),
  ('Do The Bay SF', 'https://dothebay.com/photo-booths-san-francisco', 'dothebay', true, 50, 60, 'active'),
  ('Concrete Playground', 'https://concreteplayground.com/photo-booths', 'concrete_playground', true, 50, 60, 'active'),
  ('Japan Experience', 'https://www.japan-experience.com/purikura-photo-booths', 'japan_experience', true, 50, 60, 'active'),
  ('Smithsonian', 'https://www.smithsonianmag.com/history/photo-booth-history/', 'smithsonian', true, 40, 90, 'active'),

  -- Social/Community (Lower Priority, less reliable)
  ('Pinterest Photobooths', 'https://www.pinterest.com/search/pins/?q=photo%20booth%20locations', 'pinterest', false, 20, 90, 'disabled')

ON CONFLICT (source_name) DO UPDATE SET
  source_url = EXCLUDED.source_url,
  extractor_type = EXCLUDED.extractor_type,
  priority = EXCLUDED.priority,
  crawl_frequency_days = EXCLUDED.crawl_frequency_days;

-- Update metadata
UPDATE crawl_sources SET
  created_at = COALESCE(created_at, NOW()),
  updated_at = NOW();

COMMENT ON TABLE crawl_sources IS 'Configuration for all booth data sources - 39 active extractors covering directories, operators, city guides, and travel blogs';
