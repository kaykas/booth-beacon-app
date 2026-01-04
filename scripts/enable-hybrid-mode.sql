-- Enable Hybrid Mode for City Guide Sources
-- This enables the hybrid crawler system for all city guide sources
-- They will use Agent mode on first crawl (to learn patterns)
-- Then use direct scraping on subsequent crawls (98% cheaper)

UPDATE crawl_sources
SET
  extraction_mode = 'hybrid',
  pattern_learning_status = 'not_started',
  direct_scraping_enabled = false
WHERE
  extractor_type LIKE '%city_guide%'
  OR source_name LIKE '%City Guide%';

-- Verify the update
SELECT
  id,
  source_name,
  extraction_mode,
  pattern_learning_status,
  direct_scraping_enabled,
  enabled
FROM crawl_sources
WHERE extraction_mode = 'hybrid'
ORDER BY source_name;
