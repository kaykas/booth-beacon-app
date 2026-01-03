-- Create crawl_jobs table for async Firecrawl job tracking
CREATE TABLE IF NOT EXISTS crawl_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text UNIQUE NOT NULL,  -- Firecrawl job ID
  source_id uuid NOT NULL REFERENCES crawl_sources(id),
  source_name text NOT NULL,
  source_url text NOT NULL,
  extractor_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',  -- pending, crawling, processing, completed, failed

  -- Progress tracking
  pages_crawled integer DEFAULT 0,
  booths_found integer DEFAULT 0,
  booths_added integer DEFAULT 0,
  booths_updated integer DEFAULT 0,

  -- Timing
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  crawl_duration_ms integer,
  extraction_time_ms integer,

  -- Error handling
  error_message text,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create index on job_id for fast webhook lookups
CREATE INDEX idx_crawl_jobs_job_id ON crawl_jobs(job_id);

-- Create index on status for dashboard queries
CREATE INDEX idx_crawl_jobs_status ON crawl_jobs(status);

-- Create index on source_id for source-specific queries
CREATE INDEX idx_crawl_jobs_source_id ON crawl_jobs(source_id);

-- Create index on created_at for time-based queries
CREATE INDEX idx_crawl_jobs_created_at ON crawl_jobs(created_at DESC);

-- Add comment
COMMENT ON TABLE crawl_jobs IS 'Tracks async Firecrawl crawl jobs for webhook-based processing';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON crawl_jobs TO service_role;
GRANT SELECT ON crawl_jobs TO anon, authenticated;
