-- Fix Crawler Sources Based on Research Analysis
-- Date: 2025-11-28
-- Source: CRAWLING_STRATEGY_ANALYSIS.md

-- =====================================================
-- PART 1: Update Working Sources with Correct URLs
-- =====================================================

-- Update TimeOut LA (Working URL from Dec 2024)
UPDATE crawl_sources SET
  source_url = 'https://www.timeout.com/los-angeles/news/vintage-photo-booths-are-having-a-moment-we-found-some-of-l-a-s-remaining-ones-121324',
  status = 'active',
  last_error = NULL,
  consecutive_failures = 0
WHERE source_name = 'Time Out LA';

-- Update Locale Magazine LA (Correct URL)
UPDATE crawl_sources SET
  source_url = 'https://localemagazine.com/best-la-photo-booths/',
  status = 'active',
  last_error = NULL,
  consecutive_failures = 0
WHERE source_name = 'Locale Magazine LA';

-- Update TimeOut Chicago (Working URL)
UPDATE crawl_sources SET
  source_url = 'https://www.timeout.com/chicago/bars/20-chicago-bars-with-a-photo-booth',
  status = 'active',
  last_error = NULL,
  consecutive_failures = 0
WHERE source_name = 'Time Out Chicago';

-- Update Block Club Chicago (NEW March 2025 article - EXCELLENT source)
UPDATE crawl_sources SET
  source_url = 'https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed-meet-the-women-trying-to-keep-them-alive/',
  status = 'active',
  last_error = NULL,
  consecutive_failures = 0
WHERE source_name = 'Block Club Chicago';

-- =====================================================
-- PART 2: Disable Broken Sources
-- =====================================================

-- Disable sources with non-existent domains, 404 errors, or wrong content
UPDATE crawl_sources SET
  enabled = false,
  status = 'inactive',
  last_error = 'Domain does not exist - DNS failure'
WHERE source_name = 'Photomatica Berlin';

UPDATE crawl_sources SET
  enabled = false,
  status = 'inactive',
  last_error = 'URL returns 404 - page not found'
WHERE source_name = 'Classic Photo Booth Co';

UPDATE crawl_sources SET
  enabled = false,
  status = 'inactive',
  last_error = 'Domain for sale - site no longer active'
WHERE source_name = 'Autofoto';

UPDATE crawl_sources SET
  enabled = false,
  status = 'inactive',
  last_error = 'Wrong content - urban exploration blog, not photo booth guide'
WHERE source_name = 'Digital Cosmonaut Berlin';

UPDATE crawl_sources SET
  enabled = false,
  status = 'inactive',
  last_error = 'URL returns 404 - page not found'
WHERE source_name = 'Design My Night London';

UPDATE crawl_sources SET
  enabled = false,
  status = 'inactive',
  last_error = 'URL returns 404 - page not found'
WHERE source_name = 'Design My Night NYC';

UPDATE crawl_sources SET
  enabled = false,
  status = 'inactive',
  last_error = 'URL returns 404 - page not found'
WHERE source_name = 'Solo Sophie Paris';

UPDATE crawl_sources SET
  enabled = false,
  status = 'inactive',
  last_error = 'URL returns 404 - page not found'
WHERE source_name = 'Japan Experience';

UPDATE crawl_sources SET
  enabled = false,
  status = 'inactive',
  last_error = 'Historical article only, no current booth locations'
WHERE source_name = 'Smithsonian';

-- =====================================================
-- PART 3: Priority Adjustments (Optional Optimizations)
-- =====================================================

-- Upgrade Autophoto to Tier 1 (excellent NYC source with booth locator)
UPDATE crawl_sources SET priority = 90
WHERE source_name = 'Autophoto';

-- Downgrade Lomography to Tier 3 (not a comprehensive directory)
UPDATE crawl_sources SET priority = 60
WHERE source_name = 'Lomography Locations';

-- Downgrade Flickr to Tier 3 (rate limiting issues, unreliable data)
UPDATE crawl_sources SET priority = 50
WHERE source_name = 'Flickr Photobooth Group';

-- =====================================================
-- PART 4: Summary Query
-- =====================================================

-- Show updated source status
SELECT
  source_name,
  enabled,
  status,
  priority,
  source_url,
  last_error
FROM crawl_sources
WHERE source_name IN (
  'Time Out LA',
  'Locale Magazine LA',
  'Time Out Chicago',
  'Block Club Chicago',
  'Photomatica Berlin',
  'Classic Photo Booth Co',
  'Autofoto',
  'Digital Cosmonaut Berlin',
  'Design My Night London',
  'Design My Night NYC',
  'Solo Sophie Paris',
  'Japan Experience',
  'Smithsonian',
  'Autophoto',
  'Lomography Locations',
  'Flickr Photobooth Group'
)
ORDER BY enabled DESC, priority DESC;
