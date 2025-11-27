-- =====================================================
-- CRAWLER SYSTEM TABLES
-- Run this in Supabase SQL Editor to add crawler infrastructure
-- =====================================================

-- Crawl Sources: Define where we scrape data from
CREATE TABLE IF NOT EXISTS crawl_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL, -- 'photobooth_net', 'lomography', 'photomatica', etc.
  base_url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority runs first
  config JSONB DEFAULT '{}', -- Source-specific config
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crawler Jobs: Track crawl job queue and status
CREATE TABLE IF NOT EXISTS crawler_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'active', 'completed', 'failed')) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  booths_found INTEGER DEFAULT 0,
  booths_new INTEGER DEFAULT 0,
  booths_updated INTEGER DEFAULT 0,
  pages_crawled INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX crawler_jobs_status_idx ON crawler_jobs(status);
CREATE INDEX crawler_jobs_source_idx ON crawler_jobs(source_name);
CREATE INDEX crawler_jobs_created_idx ON crawler_jobs(created_at DESC);

-- Crawler Metrics: Performance tracking
CREATE TABLE IF NOT EXISTS crawler_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name TEXT NOT NULL,
  job_id UUID REFERENCES crawler_jobs(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('success', 'failure', 'partial')) DEFAULT 'success',
  duration_ms INTEGER,
  booths_extracted INTEGER DEFAULT 0,
  pages_processed INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX crawler_metrics_source_idx ON crawler_metrics(source_name);
CREATE INDEX crawler_metrics_completed_idx ON crawler_metrics(completed_at DESC);

-- Booth Duplicates: Track potential duplicates for deduplication
CREATE TABLE IF NOT EXISTS booth_duplicates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booth_id_1 UUID REFERENCES booths(id) ON DELETE CASCADE NOT NULL,
  booth_id_2 UUID REFERENCES booths(id) ON DELETE CASCADE NOT NULL,
  similarity_score DECIMAL(3, 2), -- 0.00 to 1.00
  match_type TEXT, -- 'exact_address', 'name_similarity', 'coordinates', etc.
  status TEXT CHECK (status IN ('pending', 'merged', 'not_duplicate', 'ignored')) DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booth_id_1, booth_id_2)
);

CREATE INDEX booth_duplicates_status_idx ON booth_duplicates(status);
CREATE INDEX booth_duplicates_similarity_idx ON booth_duplicates(similarity_score DESC);

-- Admin Users: Track who has admin access
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'super_admin', 'moderator')) DEFAULT 'admin',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for crawler tables
ALTER TABLE crawl_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE booth_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admin-only access to crawler tables
CREATE POLICY "Admins can view crawl sources"
  ON crawl_sources FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage crawl sources"
  ON crawl_sources FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view crawler jobs"
  ON crawler_jobs FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage crawler jobs"
  ON crawler_jobs FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view crawler metrics"
  ON crawler_metrics FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view duplicates"
  ON booth_duplicates FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage duplicates"
  ON booth_duplicates FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view admin_users"
  ON admin_users FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can manage admin_users"
  ON admin_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Insert default crawl sources
INSERT INTO crawl_sources (name, source_type, base_url, priority) VALUES
  ('Photobooth.net', 'photobooth_net', 'https://www.photobooth.net/locations/', 10),
  ('Lomography Locations', 'lomography', 'https://www.lomography.com/magazine/tipster', 8),
  ('Photomatica Berlin', 'photomatica', 'https://www.photomatica.de', 7)
ON CONFLICT (name) DO NOTHING;

-- Create view for crawler dashboard stats
CREATE OR REPLACE VIEW crawler_dashboard_stats AS
SELECT
  COUNT(DISTINCT id) as total_jobs,
  COUNT(DISTINCT id) FILTER (WHERE status = 'active') as active_jobs,
  COUNT(DISTINCT id) FILTER (WHERE status = 'pending') as pending_jobs,
  COUNT(DISTINCT id) FILTER (WHERE status = 'completed') as completed_jobs,
  COUNT(DISTINCT id) FILTER (WHERE status = 'failed') as failed_jobs,
  SUM(booths_found) as total_booths_found,
  MAX(completed_at) as last_run_timestamp
FROM crawler_jobs;
