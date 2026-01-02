-- Add City Guide Sources to Booth Beacon Database
-- Run this first, then execute production-agent-crawler.ts

INSERT INTO crawl_sources (
  source_name,
  source_url,
  extractor_type,
  enabled,
  priority,
  crawl_frequency_days,
  pages_per_batch,
  total_pages_target,
  description
) VALUES
  -- BERLIN (3 sources)
  (
    'Digital Cosmonaut Berlin',
    'https://digitalcosmonaut.com/berlin-photoautomat-locations/',
    'city_guide_berlin_digitalcosmonaut',
    true,
    80,
    7,
    1,
    1,
    'Berlin photo booth locations guide from Digital Cosmonaut'
  ),
  (
    'Phelt Magazine Berlin',
    'https://pheltmagazine.co/photo-booths-of-berlin/',
    'city_guide_berlin_phelt',
    true,
    80,
    7,
    1,
    1,
    'Berlin photo booth guide from Phelt Magazine'
  ),
  (
    'Aperture Tours Berlin',
    'https://www.aperturetours.com/blog/photoautomat-berlin',
    'city_guide_berlin_aperture',
    true,
    75,
    7,
    1,
    1,
    'Berlin photoautomat guide from Aperture Tours'
  ),

  -- LONDON (3 sources)
  (
    'Design My Night London',
    'https://www.designmynight.com/london/whats-on/unusual-things-to-do/best-photo-booths-in-london',
    'city_guide_london_designmynight',
    true,
    80,
    7,
    1,
    1,
    'Best photo booths in London from Design My Night'
  ),
  (
    'London World',
    'https://londonworld.com/lifestyle/things-to-do/where-to-find-photo-booths-in-london',
    'city_guide_london_world',
    true,
    75,
    7,
    1,
    1,
    'London photo booth locations from London World'
  ),
  (
    'Flash Pack London',
    'https://www.flashpack.com/blog/photo-booths-london/',
    'city_guide_london_flashpack',
    true,
    80,
    7,
    1,
    1,
    'London photo booth guide from Flash Pack'
  ),

  -- LOS ANGELES (2 sources)
  (
    'Time Out LA',
    'https://www.timeout.com/los-angeles/things-to-do/photo-booths-in-los-angeles',
    'city_guide_la_timeout',
    true,
    85,
    7,
    1,
    1,
    'Los Angeles photo booths from Time Out'
  ),
  (
    'Locale Magazine LA',
    'https://localemagazine.com/photo-booth-los-angeles/',
    'city_guide_la_locale',
    true,
    80,
    7,
    1,
    1,
    'LA photo booth locations from Locale Magazine'
  ),

  -- CHICAGO (2 sources)
  (
    'Time Out Chicago',
    'https://www.timeout.com/chicago/things-to-do/photo-booths-in-chicago',
    'city_guide_chicago_timeout',
    true,
    85,
    7,
    1,
    1,
    'Chicago photo booths from Time Out'
  ),
  (
    'Block Club Chicago',
    'https://blockclubchicago.org/2023/08/14/chicago-photo-booths/',
    'city_guide_chicago_blockclub',
    true,
    80,
    7,
    1,
    1,
    'Chicago photo booth guide from Block Club'
  ),

  -- NEW YORK (3 sources)
  (
    'Design My Night NYC',
    'https://www.designmynight.com/new-york/whats-on/unusual-things-to-do/best-photo-booths-in-new-york',
    'city_guide_ny_designmynight',
    true,
    85,
    7,
    1,
    1,
    'Best photo booths in NYC from Design My Night'
  ),
  (
    'Roxy Hotel NYC',
    'https://www.roxyhotelnyc.com/blog/photo-booths-nyc',
    'city_guide_ny_roxy',
    true,
    80,
    7,
    1,
    1,
    'NYC photo booth guide from Roxy Hotel'
  ),
  (
    'Airial Travel Brooklyn',
    'https://www.airialtravel.com/blog/brooklyn-photo-booths',
    'city_guide_ny_airial',
    true,
    80,
    7,
    1,
    1,
    'Brooklyn photo booth locations from Airial Travel'
  )
ON CONFLICT (source_url) DO UPDATE SET
  extractor_type = EXCLUDED.extractor_type,
  enabled = EXCLUDED.enabled,
  priority = EXCLUDED.priority,
  description = EXCLUDED.description;
