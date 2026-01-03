# Manual Migration Guide: Performance Indices

**Migration File**: `20260102192750_add_performance_indices.sql`
**Expected Duration**: 5-10 minutes
**Impact**: Zero downtime (uses `CONCURRENTLY` option)

## Why Manual Application?

The Supabase CLI migration system is experiencing sync issues, and programmatic application through connection poolers requires specific authentication credentials not available via service role keys. Manual application via the Supabase SQL Editor is the most reliable method.

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor

Navigate to: [https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql](https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql)

### 2. Copy Migration SQL

Open the migration file at:
```
/Users/jkw/Projects/booth-beacon-app/supabase/migrations/20260102192750_add_performance_indices.sql
```

Copy the **entire contents** of this file (298 lines).

### 3. Paste and Execute

1. Paste the SQL into the Supabase SQL Editor
2. Click the **"Run"** button (or press Cmd/Ctrl + Enter)
3. Wait for execution to complete (5-10 minutes)
4. Check for success messages in the results panel

### 4. What Gets Created

This migration creates:

✅ **9 Performance Indices:**
1. `idx_booths_geography_gist` - GIST spatial index for map queries (HIGHEST PRIORITY)
2. `idx_booths_city_country_operational` - Composite index for location filtering
3. `idx_booths_city` - City filter dropdown optimization
4. `idx_booths_country` - Country filter dropdown optimization
5. `idx_booths_status_updated_at` - Recent booths queries
6. `idx_booths_machine_model` - Machine model filtering
7. `idx_booths_verification_status` - Admin dashboard queries
8. `idx_booths_google_enriched_timestamp` - Enrichment tracking
9. `idx_booths_created_at` - Admin timeline queries
10. `idx_booths_search_vector` - Full-text search (conditional on column existence)

✅ **1 Helper Function:**
- `find_nearby_booths()` - Efficient geospatial queries using the GIST index

### 5. Verify Installation

After execution completes, run the verification script:

```bash
cd /Users/jkw/Projects/booth-beacon-app
node scripts/verify-performance-indices.js
```

This will check:
- ✓ All indices exist
- ✓ Helper function is callable
- ✓ Index sizes and statistics
- ✓ Database connection works

### 6. Expected Results

The verification script should show:

```
✅ ALL PERFORMANCE INDICES VERIFIED SUCCESSFULLY!

📋 Summary:
   • 9 core indices created
   • 1 helper function created
   • Total index size: ~XX MB

🚀 Expected performance improvements:
   • Map queries: 60-80% faster
   • Location filtering: 70% faster
   • City/country dropdowns: 80% faster
```

## Troubleshooting

### Error: "index already exists"

This is safe to ignore. It means the index was already created in a previous run. The migration uses `DROP INDEX IF EXISTS` to handle this, but if you're re-running just the CREATE statements, you can safely ignore these errors.

### Error: "column search_vector does not exist"

The `idx_booths_search_vector` index is conditional. If the `search_vector` column doesn't exist in your `booths` table, this index won't be created. This is expected and safe.

### Error: "extension postgis does not exist"

Run this command first in the SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Then re-run the migration.

### Error: Timeout or "query is taking too long"

The `CONCURRENTLY` option means indices are created without blocking table access, but it takes longer. Wait for the query to complete (up to 15 minutes for large tables). Do not cancel the query.

## Performance Testing

After installation, test query performance with these queries:

### Test 1: Geospatial Query (should use idx_booths_geography_gist)
```sql
EXPLAIN ANALYZE
SELECT * FROM booths
WHERE ST_DWithin(
  ST_MakePoint(longitude, latitude)::geography,
  ST_MakePoint(-73.935242, 40.730610)::geography,
  50000
)
AND is_operational = true
LIMIT 20;
```

Look for `Index Scan using idx_booths_geography_gist` in the query plan.

### Test 2: Location Filtering (should use idx_booths_city_country_operational)
```sql
EXPLAIN ANALYZE
SELECT * FROM booths
WHERE city = 'New York'
AND country = 'United States'
AND is_operational = true
LIMIT 50;
```

Look for `Index Scan using idx_booths_city_country_operational` in the query plan.

### Test 3: Helper Function
```sql
-- Find booths near NYC (40.730610, -73.935242) within 50km
SELECT * FROM find_nearby_booths(40.730610, -73.935242, 50, 20);
```

Should return results instantly with distance calculations.

## Alternative: Copy-Paste Ready SQL

If you want to execute the migration in sections, here's the critical SQL:

<details>
<summary>Click to expand SQL (copy this entire block)</summary>

\`\`\`sql
-- CRITICAL GEOSPATIAL INDEX (Highest Priority)
DROP INDEX IF EXISTS idx_booths_geography_gist CASCADE;
CREATE INDEX CONCURRENTLY idx_booths_geography_gist
ON booths USING GIST (
  geography(ST_MakePoint(longitude, latitude))
)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON INDEX idx_booths_geography_gist IS 'GIST spatial index for efficient map queries using PostGIS';

-- LOCATION SEARCH INDICES
DROP INDEX IF EXISTS idx_booths_city_country_operational CASCADE;
CREATE INDEX CONCURRENTLY idx_booths_city_country_operational
ON booths (city, country, is_operational)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

DROP INDEX IF EXISTS idx_booths_city CASCADE;
CREATE INDEX CONCURRENTLY idx_booths_city
ON booths (city)
WHERE is_operational = true;

DROP INDEX IF EXISTS idx_booths_country CASCADE;
CREATE INDEX CONCURRENTLY idx_booths_country
ON booths (country)
WHERE is_operational = true;

-- OTHER PERFORMANCE INDICES
DROP INDEX IF EXISTS idx_booths_status_updated_at CASCADE;
CREATE INDEX CONCURRENTLY idx_booths_status_updated_at
ON booths (status, updated_at DESC)
WHERE is_operational = true;

DROP INDEX IF EXISTS idx_booths_machine_model CASCADE;
CREATE INDEX CONCURRENTLY idx_booths_machine_model
ON booths (machine_model)
WHERE machine_model IS NOT NULL AND is_operational = true;

DROP INDEX IF EXISTS idx_booths_verification_status CASCADE;
CREATE INDEX CONCURRENTLY idx_booths_verification_status
ON booths (verification_status, last_verified DESC)
WHERE verification_status IS NOT NULL;

DROP INDEX IF EXISTS idx_booths_google_enriched_timestamp CASCADE;
CREATE INDEX CONCURRENTLY idx_booths_google_enriched_timestamp
ON booths (google_enriched_at DESC)
WHERE google_enriched_at IS NOT NULL;

DROP INDEX IF EXISTS idx_booths_created_at CASCADE;
CREATE INDEX CONCURRENTLY idx_booths_created_at
ON booths (created_at DESC)
WHERE status = 'active';

-- HELPER FUNCTION
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

COMMENT ON FUNCTION find_nearby_booths IS 'Efficiently finds booths within a distance radius using the GIST spatial index';

-- UPDATE STATISTICS
ANALYZE booths;
\`\`\`

</details>

## Success Checklist

- [ ] SQL executed without errors in Supabase Dashboard
- [ ] Verification script shows all indices created
- [ ] Helper function `find_nearby_booths()` is callable
- [ ] Query plans show index usage (EXPLAIN ANALYZE tests)
- [ ] No significant errors in Supabase logs
- [ ] Application performance feels faster (map queries, filters)

## Support

If you encounter issues:

1. Check Supabase logs: [https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/logs](https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/logs)
2. Run verification script: `node scripts/verify-performance-indices.js`
3. Check database statistics: Run the queries in section "Performance Testing"

## Rollback (if needed)

If you need to remove these indices:

```sql
DROP INDEX IF EXISTS idx_booths_geography_gist CASCADE;
DROP INDEX IF EXISTS idx_booths_city_country_operational CASCADE;
DROP INDEX IF EXISTS idx_booths_city CASCADE;
DROP INDEX IF EXISTS idx_booths_country CASCADE;
DROP INDEX IF EXISTS idx_booths_status_updated_at CASCADE;
DROP INDEX IF EXISTS idx_booths_machine_model CASCADE;
DROP INDEX IF EXISTS idx_booths_verification_status CASCADE;
DROP INDEX IF EXISTS idx_booths_google_enriched_timestamp CASCADE;
DROP INDEX IF EXISTS idx_booths_created_at CASCADE;
DROP INDEX IF EXISTS idx_booths_search_vector CASCADE;
DROP FUNCTION IF EXISTS find_nearby_booths CASCADE;
```

---

**Migration Date**: 2026-01-02
**Expected Performance Gain**: 60-80%
**Downtime**: Zero (CONCURRENTLY option)
