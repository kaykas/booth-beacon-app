-- =====================================================
-- VERIFICATION QUERIES FOR NEW PERFORMANCE INDICES
-- Run these after applying apply-new-indices.sql
-- =====================================================

\echo '=============================================='
\echo '1. LIST ALL INDICES ON BOOTHS TABLE'
\echo '=============================================='

SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS index_size,
  idx_scan AS scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'booths'
  AND schemaname = 'public'
ORDER BY indexname;

\echo ''
\echo '=============================================='
\echo '2. CHECK NEW INDICES SPECIFICALLY'
\echo '=============================================='

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booths_geography_gist') THEN '✓'
    ELSE '✗'
  END AS status,
  'idx_booths_geography_gist' AS index_name,
  'Geography GIST spatial index' AS description
UNION ALL
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booths_city_country_operational') THEN '✓'
    ELSE '✗'
  END,
  'idx_booths_city_country_operational',
  'City/Country/Operational composite'
UNION ALL
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booths_city') THEN '✓'
    ELSE '✗'
  END,
  'idx_booths_city',
  'City filter index'
UNION ALL
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booths_country') THEN '✓'
    ELSE '✗'
  END,
  'idx_booths_country',
  'Country filter index'
UNION ALL
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booths_status_updated_at') THEN '✓'
    ELSE '✗'
  END,
  'idx_booths_status_updated_at',
  'Status + timestamp composite'
UNION ALL
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booths_machine_model') THEN '✓'
    ELSE '✗'
  END,
  'idx_booths_machine_model',
  'Machine model filter'
UNION ALL
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booths_verification_status') THEN '✓'
    ELSE '✗'
  END,
  'idx_booths_verification_status',
  'Verification workflow'
UNION ALL
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booths_google_enriched_timestamp') THEN '✓'
    ELSE '✗'
  END,
  'idx_booths_google_enriched_timestamp',
  'Enrichment tracking'
UNION ALL
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_booths_created_at') THEN '✓'
    ELSE '✗'
  END,
  'idx_booths_created_at',
  'Admin dashboard creation';

\echo ''
\echo '=============================================='
\echo '3. CHECK HELPER FUNCTION'
\echo '=============================================='

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'find_nearby_booths'
    ) THEN '✓ find_nearby_booths() function exists'
    ELSE '✗ find_nearby_booths() function MISSING'
  END AS function_status;

\echo ''
\echo '=============================================='
\echo '4. TEST GEOGRAPHY INDEX (EXPLAIN)'
\echo '=============================================='

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, name, city, country, latitude, longitude
FROM booths
WHERE ST_DWithin(
  ST_MakePoint(longitude, latitude)::geography,
  ST_MakePoint(-73.935242, 40.730610)::geography,
  50000
)
AND is_operational = true
LIMIT 20;

\echo ''
\echo '=============================================='
\echo '5. TEST CITY/COUNTRY FILTER (EXPLAIN)'
\echo '=============================================='

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, city, country
FROM booths
WHERE city = 'New York'
AND country = 'United States'
AND is_operational = true
LIMIT 50;

\echo ''
\echo '=============================================='
\echo '6. TEST find_nearby_booths() FUNCTION'
\echo '=============================================='

-- Find booths near New York City (within 50km)
SELECT
  name,
  city,
  country,
  ROUND(distance_km::numeric, 2) AS distance_km
FROM find_nearby_booths(40.7128, -74.0060, 50, 5);

\echo ''
\echo '=============================================='
\echo '7. INDEX SIZE SUMMARY'
\echo '=============================================='

SELECT
  COUNT(*) AS total_indices,
  pg_size_pretty(SUM(pg_relation_size(indexrelid::regclass))) AS total_size
FROM pg_stat_user_indexes
WHERE tablename = 'booths';

\echo ''
\echo '=============================================='
\echo '8. RECENT INDEX USAGE (TOP 10)'
\echo '=============================================='

SELECT
  indexname,
  idx_scan AS scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS size
FROM pg_stat_user_indexes
WHERE tablename = 'booths'
  AND indexname LIKE 'idx_booths_%'
ORDER BY idx_scan DESC
LIMIT 10;

\echo ''
\echo '=============================================='
\echo 'VERIFICATION COMPLETE'
\echo '=============================================='
\echo 'Expected: 9 new indices with ✓ status'
\echo 'Expected: find_nearby_booths() function exists'
\echo 'Expected: EXPLAIN plans show "Index Scan using idx_booths_..."'
\echo '=============================================='
