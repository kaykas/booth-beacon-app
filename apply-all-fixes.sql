-- ============================================
-- BOOTH BEACON CRAWLER FIXES
-- Date: 2025-01-30
-- ============================================

-- ============================================
-- 1. CREATE CRAWL_RESULTS TABLE (for raw data storage)
-- ============================================

CREATE TABLE IF NOT EXISTS crawl_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES crawl_sources(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  raw_html TEXT,
  raw_json JSONB,
  content_hash TEXT,
  crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  http_status INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_crawl_results_source_id ON crawl_results(source_id);
CREATE INDEX IF NOT EXISTS idx_crawl_results_url ON crawl_results(url);
CREATE INDEX IF NOT EXISTS idx_crawl_results_crawled_at ON crawl_results(crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_crawl_results_content_hash ON crawl_results(content_hash);

-- Enable RLS
ALTER TABLE crawl_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to crawl_results" ON crawl_results;
DROP POLICY IF EXISTS "Allow service role full access to crawl_results" ON crawl_results;

-- Allow public read access (for reprocessing)
CREATE POLICY "Allow public read access to crawl_results"
  ON crawl_results
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Allow service role to insert/update/delete
CREATE POLICY "Allow service role full access to crawl_results"
  ON crawl_results
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE crawl_results IS 'Stores raw HTML/JSON from crawls for reprocessing and debugging';
COMMENT ON COLUMN crawl_results.content_hash IS 'MD5 hash of content for change detection';
COMMENT ON COLUMN crawl_results.raw_html IS 'Raw HTML response from crawler';
COMMENT ON COLUMN crawl_results.raw_json IS 'Parsed JSON data if available';

-- ============================================
-- 2. DISABLE BROKEN SOURCES (11 sources)
-- ============================================

-- Disable all broken sources (404s, timeouts, 405s)
UPDATE crawl_sources
SET enabled = false, status = 'disabled_broken'
WHERE id IN (
  '06e164b0-8071-4e78-ba36-65802ff43a3f', -- aastudiosinc (404)
  '0d1a2065-c8ee-473b-84a6-f9c04ed705ac', -- Classic Photo Booth (404)
  '6d1ffea2-7d4d-4de7-a787-3d0e0693d70e', -- Louie Despres (404)
  '47fd8906-0fea-4519-bf55-ea12bb98e8d8', -- Autofoto UK/Spain (timeout)
  '02ca8203-e441-426d-bb94-d4998253ed09', -- Photomatica West Coast (404)
  '8867017a-2ec2-40e4-b07d-ca3d827ca4d4', -- Girl in Florence (404)
  '8ae47c82-eef9-4139-8846-eb950b9ccb3b', -- DoTheBay (404)
  '3187ba89-608f-4d22-9413-0b7725e7907e', -- Time Out LA (405)
  '7697acf9-143f-48ca-9abe-1c3ea3324cdf', -- Time Out Chicago (405)
  'bad7bc13-613e-4aeb-8b6b-ef0e29c31182'  -- Metro Auto Photo Australia (timeout)
);

-- Note: Fotoautomat France URL was already fixed to https://fotoautomat.fr/en/our-adresses/

-- ============================================
-- 3. REMOVE DUPLICATE SOURCES (2 sources)
-- ============================================

-- Disable duplicate photobooth.net (keep the one with more booths)
UPDATE crawl_sources
SET enabled = false, status = 'disabled_duplicate'
WHERE source_url = 'https://www.photobooth.net/locations/'
  AND (total_booths_found = 5 OR total_booths_found < 10);

-- Disable duplicate autophoto (keep main autophoto.org)
UPDATE crawl_sources
SET enabled = false, status = 'disabled_duplicate'
WHERE source_name = 'Autophoto Chicago/Midwest';

-- ============================================
-- 4. FIX CONFIGURATION ISSUES (5 sources)
-- ============================================

-- Add missing source names
UPDATE crawl_sources
SET source_name = 'Photoautomat Berlin'
WHERE id = 'a6eb60de-4c91-43c3-9ee9-f15a608c6f74';

UPDATE crawl_sources
SET source_name = 'Booth by Bryant'
WHERE id = '2652b605-0b48-41e9-b529-819278a8462f';

UPDATE crawl_sources
SET source_name = 'Find My Film Lab'
WHERE id = '28584ea2-1c01-452c-9260-fd2200a2b5c9';

UPDATE crawl_sources
SET source_name = 'Eternalog Fotobooth'
WHERE id = '6ea21991-64ae-4986-aa9f-47b4bc71ea2d';

-- Add missing extractor
UPDATE crawl_sources
SET extractor_type = 'core'
WHERE source_name = 'Automatfoto - Stockholm Network'
  AND extractor_type IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check that crawl_results table was created
SELECT
  'crawl_results table created' AS status,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'crawl_results'
  ) AS exists;

-- Count disabled sources
SELECT
  'Disabled sources' AS category,
  COUNT(*) AS count
FROM crawl_sources
WHERE enabled = false;

-- Count enabled sources
SELECT
  'Enabled sources' AS category,
  COUNT(*) AS count
FROM crawl_sources
WHERE enabled = true;

-- Show sources that need testing
SELECT
  source_name,
  source_url,
  extractor_type,
  total_booths_found
FROM crawl_sources
WHERE enabled = true
  AND (total_booths_found IS NULL OR total_booths_found = 0)
ORDER BY priority;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

SELECT '✅ All fixes applied successfully!' AS message;
