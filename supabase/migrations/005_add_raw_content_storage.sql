-- =====================================================
-- RAW CONTENT STORAGE
-- Store raw Firecrawl markdown for re-processing
-- =====================================================

CREATE TABLE IF NOT EXISTS crawl_raw_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES crawl_sources(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  raw_markdown TEXT,
  raw_html TEXT,
  metadata JSONB, -- Firecrawl metadata (title, description, etc)
  crawled_at TIMESTAMP DEFAULT NOW(),
  content_hash TEXT, -- MD5 hash to detect changes

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_raw_content_source ON crawl_raw_content(source_id);
CREATE INDEX IF NOT EXISTS idx_raw_content_url ON crawl_raw_content(url);
CREATE INDEX IF NOT EXISTS idx_raw_content_crawled_at ON crawl_raw_content(crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_content_hash ON crawl_raw_content(content_hash);

-- Keep only latest N versions per URL (auto-cleanup old content)
CREATE OR REPLACE FUNCTION cleanup_old_raw_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Keep only the 3 most recent versions per URL
  DELETE FROM crawl_raw_content
  WHERE url = NEW.url
  AND id NOT IN (
    SELECT id FROM crawl_raw_content
    WHERE url = NEW.url
    ORDER BY crawled_at DESC
    LIMIT 3
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cleanup_raw_content ON crawl_raw_content;
CREATE TRIGGER trigger_cleanup_raw_content
  AFTER INSERT ON crawl_raw_content
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_raw_content();

-- Add extracted_from_raw_content reference to booths
ALTER TABLE booths ADD COLUMN IF NOT EXISTS extracted_from_content_id UUID REFERENCES crawl_raw_content(id);

-- View to find URLs that need re-extraction (content changed)
CREATE OR REPLACE VIEW content_needing_reextraction AS
SELECT
  crc.*,
  cs.source_name,
  cs.extractor_type
FROM crawl_raw_content crc
JOIN crawl_sources cs ON crc.source_id = cs.id
WHERE crc.crawled_at = (
  SELECT MAX(crawled_at) FROM crawl_raw_content WHERE url = crc.url
)
AND NOT EXISTS (
  SELECT 1 FROM booths WHERE extracted_from_content_id = crc.id
)
ORDER BY crc.crawled_at DESC;

COMMENT ON TABLE crawl_raw_content IS 'Stores raw Firecrawl markdown/HTML for re-processing without API costs';
COMMENT ON COLUMN crawl_raw_content.content_hash IS 'MD5 hash of content to detect changes without re-crawling';
COMMENT ON VIEW content_needing_reextraction IS 'Shows content that has been crawled but not yet extracted into booths';
