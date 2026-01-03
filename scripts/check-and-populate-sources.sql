-- Check current state of crawl_sources table
SELECT
  COUNT(*) as total_sources,
  COUNT(*) FILTER (WHERE enabled = true) as enabled_sources,
  COUNT(*) FILTER (WHERE status = 'active') as active_sources,
  COUNT(*) FILTER (WHERE enabled = true AND status = 'active') as ready_to_crawl
FROM crawl_sources;

-- Show sources ready to crawl
SELECT
  source_name,
  extractor_type,
  enabled,
  status,
  priority,
  last_crawl_timestamp,
  total_booths_found
FROM crawl_sources
WHERE enabled = true AND status = 'active'
ORDER BY priority DESC;

-- Show disabled/inactive sources
SELECT
  source_name,
  extractor_type,
  enabled,
  status
FROM crawl_sources
WHERE enabled = false OR status != 'active'
ORDER BY source_name
LIMIT 20;
