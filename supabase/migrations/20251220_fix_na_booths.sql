-- Fix booths with 'N/A' as name - these are invalid extraction failures
-- Migration: 20251220_fix_na_booths.sql

-- Mark all booths with name='N/A' as closed (invalid data)
UPDATE booths
SET
  status = 'closed',
  is_operational = false,
  needs_verification = true,
  data_source_type = 'invalid_extraction'
WHERE name = 'N/A'
  OR (name ILIKE '%N/A%' AND city = 'N/A')
  OR (name ILIKE '%N/A%' AND country = 'N/A');

-- Also mark booths with descriptions that are clearly photography blog posts, not booth info
UPDATE booths
SET
  status = 'closed',
  is_operational = false,
  needs_verification = true,
  data_source_type = 'invalid_extraction',
  description = NULL
WHERE description ILIKE '%film photography day%'
  AND description ILIKE '%office-mates%'
  AND description ILIKE '%Canon%';

-- Mark booths with completely empty source URLs as suspicious
UPDATE booths
SET
  needs_verification = true
WHERE source_urls = ARRAY['']::text[]
  OR source_urls = ARRAY[]::text[]
  OR source_urls IS NULL;

-- Summary counts
SELECT
  'N/A name booths marked as closed' as action,
  COUNT(*) as count
FROM booths
WHERE name = 'N/A' AND status = 'closed';

SELECT
  'Blog description booths cleaned' as action,
  COUNT(*) as count
FROM booths
WHERE data_source_type = 'invalid_extraction';

SELECT
  'Booths with empty source URLs flagged' as action,
  COUNT(*) as count
FROM booths
WHERE needs_verification = true
  AND (source_urls = ARRAY['']::text[] OR source_urls = ARRAY[]::text[] OR source_urls IS NULL);
