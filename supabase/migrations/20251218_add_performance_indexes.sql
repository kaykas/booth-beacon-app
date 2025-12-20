-- =====================================================
-- Performance Optimization Indexes
-- Council Recommendation: Critical indexes for Booth Beacon
-- Date: 2025-12-18
-- =====================================================

-- Drop existing indexes if they exist (idempotent)
DROP INDEX IF EXISTS idx_booths_location_gist;
DROP INDEX IF EXISTS idx_booths_location_active;
DROP INDEX IF EXISTS idx_booths_city_state_country;
DROP INDEX IF EXISTS idx_booths_search_vector;
DROP INDEX IF EXISTS idx_booths_admin;
DROP INDEX IF EXISTS idx_booths_geocoding_status;
DROP INDEX IF EXISTS idx_booths_verification;

-- =====================================================
-- 1. GEOSPATIAL INDEXES (Highest Priority)
-- =====================================================

-- Create geospatial index for map queries
-- This is THE most important index for map performance
CREATE INDEX CONCURRENTLY idx_booths_location_gist
ON booths USING GIST (
  geography(ST_MakePoint(longitude, latitude))
)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Composite index for active booths with coordinates
CREATE INDEX CONCURRENTLY idx_booths_location_active
ON booths (latitude, longitude, is_active)
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND is_active = true;

-- =====================================================
-- 2. LOCATION TEXT SEARCH INDEXES
-- =====================================================

-- Index for city/state/country filtering
CREATE INDEX CONCURRENTLY idx_booths_city_state_country
ON booths (city, state, country)
WHERE is_active = true;

-- Partial index for US booths (most common query)
CREATE INDEX CONCURRENTLY idx_booths_us_locations
ON booths (city, state)
WHERE country = 'United States' AND is_active = true;

-- =====================================================
-- 3. FULL-TEXT SEARCH INDEX
-- =====================================================

-- Add search_vector column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booths' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE booths ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create GIN index for full-text search
CREATE INDEX CONCURRENTLY idx_booths_search_vector
ON booths USING GIN (search_vector);

-- =====================================================
-- 4. ADMIN/QUERY INDEXES
-- =====================================================

-- Index for admin dashboard queries
CREATE INDEX CONCURRENTLY idx_booths_admin
ON booths (created_at DESC, verification_status, is_active);

-- Index for tracking geocoding progress
CREATE INDEX CONCURRENTLY idx_booths_geocoding_status
ON booths (latitude, longitude, updated_at)
WHERE latitude IS NULL OR longitude IS NULL;

-- Index for verification workflows
CREATE INDEX CONCURRENTLY idx_booths_verification
ON booths (verification_status, last_verified, is_active);

-- =====================================================
-- 5. TRIGGER FOR AUTO-UPDATING SEARCH VECTOR
-- =====================================================

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_booth_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.venue_name, '') || ' ' ||
    COALESCE(NEW.location_description, '') || ' ' ||
    COALESCE(NEW.city, '') || ' ' ||
    COALESCE(NEW.neighborhood, '') || ' ' ||
    COALESCE(NEW.address, '') || ' ' ||
    COALESCE(NEW.venue_type, '') || ' ' ||
    COALESCE(NEW.state, '') || ' ' ||
    COALESCE(NEW.country, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS booth_search_vector_update ON booths;
CREATE TRIGGER booth_search_vector_update
  BEFORE INSERT OR UPDATE ON booths
  FOR EACH ROW
  EXECUTE FUNCTION update_booth_search_vector();

-- =====================================================
-- 6. POPULATE EXISTING RECORDS
-- =====================================================

-- Update search vectors for all existing records
UPDATE booths
SET search_vector = to_tsvector('english',
  COALESCE(venue_name, '') || ' ' ||
  COALESCE(location_description, '') || ' ' ||
  COALESCE(city, '') || ' ' ||
  COALESCE(neighborhood, '') || ' ' ||
  COALESCE(address, '') || ' ' ||
  COALESCE(venue_type, '') || ' ' ||
  COALESCE(state, '') || ' ' ||
  COALESCE(country, '')
)
WHERE search_vector IS NULL;

-- =====================================================
-- 7. ANALYZE TABLES
-- =====================================================

-- Update statistics for query planner
ANALYZE booths;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- View all indexes on booths table
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'booths';

-- Check index sizes
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS index_size
-- FROM pg_stat_user_indexes
-- WHERE tablename = 'booths'
-- ORDER BY pg_relation_size(indexrelid::regclass) DESC;

-- Test geospatial query performance
-- EXPLAIN ANALYZE
-- SELECT * FROM booths
-- WHERE latitude IS NOT NULL
--   AND latitude BETWEEN 40.0 AND 41.0
--   AND longitude BETWEEN -74.0 AND -73.0
--   AND is_active = true
-- LIMIT 100;

-- Test full-text search performance
-- EXPLAIN ANALYZE
-- SELECT * FROM booths
-- WHERE search_vector @@ to_tsquery('english', 'vintage & arcade')
--   AND is_active = true
-- LIMIT 20;
