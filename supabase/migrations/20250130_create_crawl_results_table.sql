-- Create table for storing raw crawl data (for reprocessing)
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
CREATE INDEX idx_crawl_results_source_id ON crawl_results(source_id);
CREATE INDEX idx_crawl_results_url ON crawl_results(url);
CREATE INDEX idx_crawl_results_crawled_at ON crawl_results(crawled_at DESC);
CREATE INDEX idx_crawl_results_content_hash ON crawl_results(content_hash);

-- Enable RLS
ALTER TABLE crawl_results ENABLE ROW LEVEL SECURITY;

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
