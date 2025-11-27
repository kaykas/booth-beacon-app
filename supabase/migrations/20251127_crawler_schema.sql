-- =====================================================
-- UNIFIED CRAWLER INFRASTRUCTURE SCHEMA
-- Extends existing crawler tables with full unified-crawler support
-- =====================================================

-- ========================================
-- 1. ADD SOURCE TRACKING COLUMNS TO BOOTHS
-- ========================================

-- Source tracking for multi-source data
ALTER TABLE booths ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS source_names TEXT[] DEFAULT '{}';
ALTER TABLE booths ADD COLUMN IF NOT EXISTS source_urls TEXT[] DEFAULT '{}';

-- Create index for source queries
CREATE INDEX IF NOT EXISTS idx_booths_source_id ON booths(source_id);

-- ========================================
-- 2. EXTEND CRAWL SOURCES TABLE
-- Add columns needed by unified-crawler
-- ========================================

-- First, check if crawl_sources has the simpler schema and needs extension
-- Add missing columns if they don't exist
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS country_focus TEXT;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS extractor_type TEXT;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS crawl_frequency_days INTEGER DEFAULT 7;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS incremental_enabled BOOLEAN DEFAULT true;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS last_crawl_timestamp TIMESTAMP;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS last_successful_crawl TIMESTAMP;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS total_booths_found INTEGER DEFAULT 0;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS total_booths_added INTEGER DEFAULT 0;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS total_booths_updated INTEGER DEFAULT 0;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS consecutive_failures INTEGER DEFAULT 0;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS last_error_message TEXT;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS last_error_timestamp TIMESTAMP;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS average_crawl_duration_seconds INTEGER;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS average_booths_per_crawl INTEGER;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS pages_per_batch INTEGER DEFAULT 3;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS total_pages_target INTEGER;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS last_batch_page INTEGER DEFAULT 0;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS last_batch_urls TEXT[] DEFAULT '{}';
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS crawl_completed BOOLEAN DEFAULT false;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS pages_processed INTEGER DEFAULT 0;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS total_pages_crawled INTEGER DEFAULT 0;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS last_content_hash TEXT;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS content_changed_at TIMESTAMP;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS total_booths_extracted INTEGER DEFAULT 0;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS total_booths_validated INTEGER DEFAULT 0;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS total_booths_deduplicated INTEGER DEFAULT 0;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS validation_failure_rate NUMERIC(5,2) DEFAULT 0.0;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS crawl_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE crawl_sources ADD COLUMN IF NOT EXISTS notes TEXT;

-- Migrate data from old columns if they exist
UPDATE crawl_sources SET source_name = name WHERE source_name IS NULL AND name IS NOT NULL;
UPDATE crawl_sources SET source_url = base_url WHERE source_url IS NULL AND base_url IS NOT NULL;
UPDATE crawl_sources SET extractor_type = source_type WHERE extractor_type IS NULL AND source_type IS NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_crawl_sources_enabled ON crawl_sources(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_crawl_sources_priority ON crawl_sources(priority DESC);
CREATE INDEX IF NOT EXISTS idx_crawl_sources_last_crawl ON crawl_sources(last_crawl_timestamp);
CREATE INDEX IF NOT EXISTS idx_crawl_sources_status ON crawl_sources(status);
CREATE INDEX IF NOT EXISTS idx_crawl_sources_content_hash ON crawl_sources(last_content_hash);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_crawl_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_crawl_sources_timestamp ON crawl_sources;
CREATE TRIGGER trigger_update_crawl_sources_timestamp
BEFORE UPDATE ON crawl_sources
FOR EACH ROW
EXECUTE FUNCTION update_crawl_sources_updated_at();

-- Enable RLS
ALTER TABLE crawl_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access
CREATE POLICY "Crawl sources are viewable by everyone" ON crawl_sources
  FOR SELECT USING (true);

-- ========================================
-- 3. CRAWL METRICS TABLE
-- For health monitoring and performance tracking
-- ========================================

CREATE TABLE IF NOT EXISTS crawler_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  batch_number INTEGER,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  status TEXT NOT NULL, -- 'success', 'error', 'timeout', 'cancelled'
  error_message TEXT,
  pages_crawled INTEGER DEFAULT 0,
  booths_extracted INTEGER DEFAULT 0,
  api_call_duration_ms INTEGER,
  extraction_duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crawler_metrics_source ON crawler_metrics(source_id);
CREATE INDEX IF NOT EXISTS idx_crawler_metrics_created ON crawler_metrics(created_at DESC);

ALTER TABLE crawler_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Crawler metrics are viewable by everyone" ON crawler_metrics
  FOR SELECT USING (true);

-- ========================================
-- 4. CRAWL LOGS TABLE
-- Detailed logging for every crawl operation
-- ========================================

CREATE TABLE IF NOT EXISTS crawl_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Source tracking
  source_id UUID REFERENCES crawl_sources(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,

  -- Crawl session
  crawl_session_id UUID NOT NULL, -- Groups logs from same crawl run
  batch_number INTEGER,

  -- Timing
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER,

  -- Operation details
  operation_type TEXT NOT NULL, -- 'fetch', 'extract', 'validate', 'dedupe', 'upsert'
  operation_status TEXT NOT NULL, -- 'started', 'success', 'error', 'skipped'

  -- Metrics
  pages_crawled INTEGER DEFAULT 0,
  booths_extracted INTEGER DEFAULT 0,
  booths_validated INTEGER DEFAULT 0,
  booths_deduplicated INTEGER DEFAULT 0,
  booths_upserted INTEGER DEFAULT 0,

  -- Content tracking
  urls_processed TEXT[],
  content_hash TEXT,

  -- Error tracking
  error_message TEXT,
  error_stack TEXT,

  -- Additional context
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crawl_logs_source_id ON crawl_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_crawl_logs_session_id ON crawl_logs(crawl_session_id);
CREATE INDEX IF NOT EXISTS idx_crawl_logs_created_at ON crawl_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crawl_logs_status ON crawl_logs(operation_status);

-- Enable RLS
ALTER TABLE crawl_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Crawl logs are viewable by everyone" ON crawl_logs
  FOR SELECT USING (true);

-- ========================================
-- 5. SEED INITIAL CRAWL SOURCES
-- ========================================

INSERT INTO crawl_sources (source_name, source_url, source_type, country_focus, extractor_type, priority, notes) VALUES
  -- Tier 1: Global Directories
  ('photobooth.net', 'https://www.photobooth.net/', 'directory', 'USA', 'photobooth_net', 100, 'Primary USA source - comprehensive directory'),
  ('photomatica.com', 'https://photomatica.com/', 'directory', 'Europe', 'photomatica', 90, 'European focused - detailed machine info'),
  ('photoautomat.de', 'https://www.photoautomat.de/', 'directory', 'Germany', 'photoautomat_de', 85, 'Germany focused - Berlin and nationwide'),
  ('photomatic.net', 'https://photomatic.net/', 'directory', 'Australia', 'photomatic', 80, 'Australia/NZ focused'),
  ('lomography.com', 'https://www.lomography.com/photos/booths', 'directory', 'Global', 'lomography', 75, 'Global community photo booth map'),

  -- Tier 2: Regional Operators
  ('autophoto.org', 'https://autophoto.org/', 'operator_site', 'USA', 'autophoto', 70, 'USA operator with detailed listings'),
  ('classicphotoboothco.com', 'https://classicphotoboothco.com/', 'operator_site', 'USA', 'classic_photo_booth_co', 65, 'Classic Photo Booth Co locations')
ON CONFLICT (source_name) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Crawler infrastructure schema created successfully';
  RAISE NOTICE 'Tables created: crawl_sources, crawler_metrics, crawl_logs';
  RAISE NOTICE 'Seeded initial crawl sources for testing';
END $$;
