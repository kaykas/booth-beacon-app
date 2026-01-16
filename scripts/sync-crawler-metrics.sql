-- Sync crawler metrics: Update crawl_sources with actual booth counts
-- This fixes the total_booths_extracted counter that's currently showing 0 for all sources

-- Step 1: Update total_booths_extracted from existing booths
UPDATE crawl_sources cs
SET
  total_booths_extracted = COALESCE(booth_counts.count, 0),
  updated_at = NOW()
FROM (
  SELECT
    source_primary,
    COUNT(*) as count
  FROM booths
  WHERE source_primary IS NOT NULL
  GROUP BY source_primary
) AS booth_counts
WHERE cs.source_name = booth_counts.source_primary
   OR cs.name = booth_counts.source_primary;

-- Step 2: Identify and disable low performers (enabled sources with 0 booths)
UPDATE crawl_sources
SET
  enabled = false,
  notes = COALESCE(notes || E'\n', '') || 'Auto-disabled on ' || NOW()::date || ' - no booths extracted after multiple crawls',
  updated_at = NOW()
WHERE enabled = true
  AND total_booths_extracted = 0
  AND last_successful_crawl IS NOT NULL  -- Has run at least once
  AND last_successful_crawl < NOW() - INTERVAL '7 days';  -- Ran over a week ago

-- Step 3: Increase crawl frequency for top performers (10+ booths)
UPDATE crawl_sources
SET
  crawl_frequency_days = 7,  -- Weekly crawls
  priority = GREATEST(priority, 80),  -- Boost priority
  updated_at = NOW()
WHERE total_booths_extracted >= 10
  AND enabled = true;

-- Step 4: Set moderate frequency for decent performers (5-9 booths)
UPDATE crawl_sources
SET
  crawl_frequency_days = 14,  -- Bi-weekly
  priority = GREATEST(priority, 60),
  updated_at = NOW()
WHERE total_booths_extracted BETWEEN 5 AND 9
  AND enabled = true;

-- Report results
SELECT
  'Top Performers (10+ booths)' as category,
  COUNT(*) as count,
  ARRAY_AGG(source_name ORDER BY total_booths_extracted DESC) FILTER (WHERE total_booths_extracted >= 10) as sources
FROM crawl_sources
WHERE enabled = true AND total_booths_extracted >= 10

UNION ALL

SELECT
  'Decent Performers (5-9 booths)' as category,
  COUNT(*) as count,
  ARRAY_AGG(source_name ORDER BY total_booths_extracted DESC) FILTER (WHERE total_booths_extracted BETWEEN 5 AND 9) as sources
FROM crawl_sources
WHERE enabled = true AND total_booths_extracted BETWEEN 5 AND 9

UNION ALL

SELECT
  'Disabled Low Performers (0 booths, ran >7 days ago)' as category,
  COUNT(*) as count,
  NULL as sources
FROM crawl_sources
WHERE enabled = false
  AND notes LIKE '%Auto-disabled%no booths extracted%'
  AND updated_at::date = CURRENT_DATE;
