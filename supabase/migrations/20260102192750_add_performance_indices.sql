-- =====================================================
-- PERFORMANCE OPTIMIZATION INDICES - PHASE 2
-- Booth Beacon Critical Performance Improvements
-- Council Recommendation: 60-70% performance improvement
-- Date: 2025-01-02
-- =====================================================

-- =====================================================
-- 1. GEOSPATIAL INDICES (Highest Priority)
-- =====================================================

-- Drop existing geospatial indices if they exist (idempotent)
DROP INDEX IF EXISTS idx_booths_location_gist CASCADE;
DROP INDEX IF EXISTS idx_booths_geography_gist CASCADE;
DROP INDEX IF EXISTS idx_booths_location_active CASCADE;

-- GIST index on geography for map queries (THE most critical index)
-- This enables efficient distance-based queries and bounding box searches
CREATE INDEX CONCURRENTLY idx_booths_geography_gist
ON booths USING GIST (
  geography(ST_MakePoint(longitude, latitude))
)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Comment for documentation
COMMENT ON INDEX idx_booths_geography_gist IS 'GIST spatial index for efficient map queries using PostGIS. Optimizes distance calculations and bounding box searches.';

-- =====================================================
-- 2. LOCATION SEARCH INDICES
-- =====================================================

-- Drop existing location search indices
DROP INDEX IF EXISTS idx_booths_city_country_operational CASCADE;
DROP INDEX IF EXISTS idx_booths_city_state_country CASCADE;
DROP INDEX IF EXISTS idx_booths_city_country CASCADE;
DROP INDEX IF EXISTS idx_booths_us_locations CASCADE;

-- Composite index for city/country/operational status (fastest for location filtering)
-- Covers queries like: WHERE city = ? AND country = ? AND is_operational = true
CREATE INDEX CONCURRENTLY idx_booths_city_country_operational
ON booths (city, country, is_operational)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON INDEX idx_booths_city_country_operational IS 'Composite index optimizing location-based filtering with operational status. Primary index for map location searches.';

-- Separate indices for filter dropdowns (city and country independently)
-- Users often filter by city OR country separately in UI dropdowns
DROP INDEX IF EXISTS idx_booths_city CASCADE;
DROP INDEX IF EXISTS idx_booths_country CASCADE;

CREATE INDEX CONCURRENTLY idx_booths_city
ON booths (city)
WHERE is_operational = true;

COMMENT ON INDEX idx_booths_city IS 'Index for city filter dropdown. Speeds up distinct city queries and city-based filtering.';

CREATE INDEX CONCURRENTLY idx_booths_country
ON booths (country)
WHERE is_operational = true;

COMMENT ON INDEX idx_booths_country IS 'Index for country filter dropdown. Speeds up distinct country queries and country-based filtering.';

-- =====================================================
-- 3. STATUS AND TIMESTAMP INDICES
-- =====================================================

-- Drop existing status indices
DROP INDEX IF EXISTS idx_booths_status_updated_at CASCADE;
DROP INDEX IF EXISTS idx_booths_status CASCADE;
DROP INDEX IF EXISTS idx_booths_updated_at CASCADE;

-- Composite index for recent booths (status + timestamp)
-- Covers: WHERE status = ? AND updated_at >= ? ORDER BY updated_at DESC
CREATE INDEX CONCURRENTLY idx_booths_status_updated_at
ON booths (status, updated_at DESC)
WHERE is_operational = true;

COMMENT ON INDEX idx_booths_status_updated_at IS 'Composite index for recently updated booths. Optimizes queries sorting by latest updates.';

-- =====================================================
-- 4. MACHINE MODEL SEARCH INDEX
-- =====================================================

-- Drop existing machine model index
DROP INDEX IF EXISTS idx_booths_machine_model CASCADE;

-- Index for machine model filtering
-- Users search for specific machine models (e.g., "Photo Booth Deluxe", "MiBO")
CREATE INDEX CONCURRENTLY idx_booths_machine_model
ON booths (machine_model)
WHERE machine_model IS NOT NULL AND is_operational = true;

COMMENT ON INDEX idx_booths_machine_model IS 'Index for machine model filtering. Optimizes queries filtering by specific booth models.';

-- =====================================================
-- 5. VERIFICATION AND DATA QUALITY INDICES
-- =====================================================

-- Drop existing verification indices
DROP INDEX IF EXISTS idx_booths_verification_status CASCADE;
DROP INDEX IF EXISTS idx_booths_last_verified CASCADE;

-- Verification status index for admin dashboard
CREATE INDEX CONCURRENTLY idx_booths_verification_status
ON booths (verification_status, last_verified DESC)
WHERE verification_status IS NOT NULL;

COMMENT ON INDEX idx_booths_verification_status IS 'Index for verification workflow and admin dashboard. Optimizes finding verified/unverified booths.';

-- =====================================================
-- 6. ENRICHMENT TRACKING INDICES
-- =====================================================

-- Drop existing enrichment indices
DROP INDEX IF EXISTS idx_booths_google_enriched_timestamp CASCADE;

-- Index for enrichment status tracking
CREATE INDEX CONCURRENTLY idx_booths_google_enriched_timestamp
ON booths (google_enriched_at DESC)
WHERE google_enriched_at IS NOT NULL;

COMMENT ON INDEX idx_booths_google_enriched_timestamp IS 'Index for tracking Google Maps enrichment progress. Identifies recently enriched booths.';

-- =====================================================
-- 7. ADMINISTRATIVE QUERY INDICES
-- =====================================================

-- Drop existing admin indices
DROP INDEX IF EXISTS idx_booths_created_at CASCADE;
DROP INDEX IF EXISTS idx_booths_created_verification CASCADE;

-- Index for admin dashboard creation timeline
CREATE INDEX CONCURRENTLY idx_booths_created_at
ON booths (created_at DESC)
WHERE status = 'active';

COMMENT ON INDEX idx_booths_created_at IS 'Index for admin dashboard. Optimizes queries for recently added booths.';

-- =====================================================
-- 8. SEARCH AND DISCOVERY INDICES
-- =====================================================

-- Drop existing search indices
DROP INDEX IF EXISTS idx_booths_search_vector CASCADE;

-- Full-text search index (if search_vector column exists)
-- Verify column exists before creating index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booths' AND column_name = 'search_vector'
  ) THEN
    DROP INDEX IF EXISTS idx_booths_search_vector CASCADE;
    CREATE INDEX CONCURRENTLY idx_booths_search_vector
    ON booths USING GIN (search_vector);

    COMMENT ON INDEX idx_booths_search_vector IS 'GIN index for full-text search. Optimizes complex text queries across booth data.';
  END IF;
END $$;

-- =====================================================
-- 9. GEOSPATIAL HELPER FUNCTION
-- =====================================================

-- Function to efficiently find nearby booths using the GIST index
CREATE OR REPLACE FUNCTION find_nearby_booths(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_km DOUBLE PRECISION DEFAULT 50,
  limit_count INT DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.address,
    b.city,
    b.country,
    b.latitude,
    b.longitude,
    ST_DistanceSphere(
      ST_MakePoint(lng, lat)::geography,
      ST_MakePoint(b.longitude, b.latitude)::geography
    ) / 1000 AS distance_km
  FROM booths b
  WHERE
    b.latitude IS NOT NULL
    AND b.longitude IS NOT NULL
    AND b.is_operational = true
    AND ST_DWithin(
      ST_MakePoint(lng, lat)::geography,
      ST_MakePoint(b.longitude, b.latitude)::geography,
      distance_km * 1000
    )
  ORDER BY distance_km ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION find_nearby_booths IS 'Efficiently finds booths within a distance radius using the GIST spatial index. Returns booths sorted by distance.';

-- =====================================================
-- 10. ANALYZE TABLES FOR QUERY OPTIMIZATION
-- =====================================================

-- Update statistics for the query planner
ANALYZE booths;

-- =====================================================
-- 11. VALIDATION & TESTING QUERIES
-- =====================================================

-- The following queries can be used to verify index performance:

-- Test 1: Geospatial query performance
-- EXPLAIN ANALYZE
-- SELECT * FROM booths
-- WHERE ST_DWithin(
--   ST_MakePoint(longitude, latitude)::geography,
--   ST_MakePoint(-73.935242, 40.730610)::geography,
--   50000
-- )
-- AND is_operational = true
-- LIMIT 20;

-- Test 2: Location filtering performance
-- EXPLAIN ANALYZE
-- SELECT * FROM booths
-- WHERE city = 'New York'
-- AND country = 'United States'
-- AND is_operational = true
-- LIMIT 50;

-- Test 3: Recent booths query
-- EXPLAIN ANALYZE
-- SELECT * FROM booths
-- WHERE status = 'active'
-- AND updated_at >= NOW() - INTERVAL '30 days'
-- ORDER BY updated_at DESC
-- LIMIT 20;

-- Test 4: Machine model filter
-- EXPLAIN ANALYZE
-- SELECT DISTINCT machine_model FROM booths
-- WHERE machine_model IS NOT NULL
-- AND is_operational = true
-- ORDER BY machine_model;

-- Test 5: City/Country dropdowns
-- EXPLAIN ANALYZE
-- SELECT DISTINCT city FROM booths
-- WHERE is_operational = true
-- ORDER BY city;

-- Check index sizes and usage
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS index_size
-- FROM pg_stat_user_indexes
-- WHERE tablename = 'booths'
-- ORDER BY pg_relation_size(indexrelid::regclass) DESC;

-- Check index usage statistics
-- SELECT
--   relname,
--   idx_scan,
--   idx_tup_read,
--   idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE relname LIKE 'idx_booths%'
-- ORDER BY idx_scan DESC;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
-- These indices provide the critical 60-70% performance improvement
-- identified by the council for:
-- 1. Map queries with geospatial GIST index
-- 2. Location filtering with city/country/operational indices
-- 3. Dropdown filter performance with separate city/country indices
-- 4. Recent booth discovery with status/timestamp index
-- 5. Machine model filtering for specialized searches
-- =====================================================
