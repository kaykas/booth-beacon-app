-- ========================================
-- CRAWLER REGISTRY TABLE
-- Tracks high-priority sources and run health
-- ========================================

CREATE TABLE IF NOT EXISTS crawler_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crawl_source_id UUID REFERENCES crawl_sources(id) ON DELETE SET NULL,
  source_name TEXT NOT NULL UNIQUE,
  source_url TEXT NOT NULL,
  tier TEXT CHECK (tier IN ('CORE', 'DISCOVERY', 'BLOG')) NOT NULL,
  cadence_days INTEGER DEFAULT 7,
  last_run TIMESTAMPTZ,
  last_success TIMESTAMPTZ,
  error_rate NUMERIC(5,2) DEFAULT 0.0,
  last_result_count INTEGER DEFAULT 0,
  previous_result_count INTEGER DEFAULT 0,
  alert_channel TEXT,
  alert_target TEXT,
  enabled BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crawler_registry_tier ON crawler_registry(tier);
CREATE INDEX IF NOT EXISTS idx_crawler_registry_enabled ON crawler_registry(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_crawler_registry_last_run ON crawler_registry(last_run DESC);

CREATE OR REPLACE FUNCTION update_crawler_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_crawler_registry_timestamp ON crawler_registry;
CREATE TRIGGER trigger_update_crawler_registry_timestamp
BEFORE UPDATE ON crawler_registry
FOR EACH ROW
EXECUTE FUNCTION update_crawler_registry_updated_at();

-- Seed critical NOT IN DATABASE sources from MASTER_CRAWLER_STRATEGY
INSERT INTO crawler_registry (source_name, source_url, tier, cadence_days, notes)
VALUES
  ('autofoto.org', 'https://www.autofoto.org/locations', 'CORE', 7, 'London/Barcelona operator - NOT IN DATABASE - HIGH priority'),
  ('fotoautomatica.com', 'https://www.fotoautomatica.com/', 'CORE', 14, 'Florence network - NOT IN DATABASE - HIGH priority'),
  ('automatfoto.se', 'https://automatfoto.se/', 'DISCOVERY', 14, 'Sweden network - NOT IN DATABASE - HIGH priority'),
  ('classicphotobooth.net', 'https://classicphotobooth.net/locations-2/', 'CORE', 7, 'NYC/Philly operator - CRITICAL - NOT IN DATABASE'),
  ('photomatica.com', 'https://photomatica.com/locations', 'CORE', 7, 'San Francisco/LA operator - NOT IN DATABASE - HIGH priority'),
  ('metroautophoto.com.au', 'https://metroautophoto.com.au/locations', 'CORE', 10, 'Australia network - NOT IN DATABASE - HIGH priority'),
  ('louiedespres.com/photobooth-project', 'https://louiedespres.com/photobooth-project', 'DISCOVERY', 14, 'Dip & Dunk tracker - NOT IN DATABASE - HIGH priority')
ON CONFLICT (source_name) DO NOTHING;
