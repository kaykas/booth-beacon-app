# Performance Indices Application Guide

## Overview
This guide helps you apply the new performance indices from the January 2, 2026 migration that complement (not conflict with) the December 18, 2025 migration.

## What's New
The new migration adds **9 new indices** that don't exist in the December 18 migration:

1. **idx_booths_geography_gist** - New GIST spatial index using geography()
2. **idx_booths_city_country_operational** - Composite (city, country, is_operational)
3. **idx_booths_city** - City-only filter index
4. **idx_booths_country** - Country-only filter index
5. **idx_booths_status_updated_at** - Status + timestamp composite
6. **idx_booths_machine_model** - Machine model filtering
7. **idx_booths_verification_status** - Verification workflow index
8. **idx_booths_google_enriched_timestamp** - Enrichment tracking
9. **idx_booths_created_at** - Admin dashboard creation timeline

Plus a new **find_nearby_booths()** helper function.

## Expected Performance Improvement
- **60-70%** faster map queries
- **50-80%** faster location filtering
- **40-60%** faster admin dashboard queries
- **Instant** city/country dropdown population

---

## Method 1: Supabase CLI (Recommended)

### Step 1: Verify CLI Installation
```bash
which supabase
# Should output: /opt/homebrew/bin/supabase
```

### Step 2: Check Authentication
```bash
supabase projects list
# You should see your project: tmgbmcbwfkvmylmfpkzy
```

### Step 3: Apply Indices
```bash
cd /Users/jkw/Projects/booth-beacon-app
supabase db execute -f scripts/apply-new-indices.sql --project-ref tmgbmcbwfkvmylmfpkzy
```

**Expected Duration:** 2-5 minutes (indices created with CONCURRENTLY)

---

## Method 2: Supabase Dashboard

### Step 1: Open SQL Editor
Navigate to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql

### Step 2: Copy SQL Content
Copy the entire contents of `/Users/jkw/Projects/booth-beacon-app/scripts/apply-new-indices.sql`

### Step 3: Paste and Execute
1. Paste into the SQL editor
2. Click "Run" button
3. Wait for completion (2-5 minutes)

---

## Method 3: Direct psql Connection

### Step 1: Get Connection String
From Supabase Dashboard → Settings → Database → Connection String

### Step 2: Execute SQL
```bash
psql "YOUR_CONNECTION_STRING" -f scripts/apply-new-indices.sql
```

---

## Verification Queries

After applying indices, run these queries to verify they were created successfully:

### 1. List All New Indices
```sql
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename = 'booths'
  AND indexname LIKE 'idx_booths_%'
ORDER BY indexname;
```

Expected output should include:
- idx_booths_city
- idx_booths_country
- idx_booths_created_at
- idx_booths_geography_gist
- idx_booths_city_country_operational
- idx_booths_google_enriched_timestamp
- idx_booths_machine_model
- idx_booths_status_updated_at
- idx_booths_verification_status

### 2. Test Geography Index Performance
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

**Look for:** "Index Scan using idx_booths_geography_gist"

### 3. Test City/Country Filter Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM booths
WHERE city = 'New York'
AND country = 'United States'
AND is_operational = true
LIMIT 50;
```

**Look for:** "Index Scan using idx_booths_city_country_operational"

### 4. Test Helper Function
```sql
-- Find booths near New York City (within 50km)
SELECT * FROM find_nearby_booths(40.7128, -74.0060, 50, 10);
```

Expected: Should return up to 10 booths sorted by distance

### 5. Check Index Usage Statistics
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename = 'booths'
  AND indexname LIKE 'idx_booths_%'
ORDER BY idx_scan DESC;
```

---

## Troubleshooting

### Issue: "CREATE INDEX CONCURRENTLY cannot run inside a transaction block"
**Solution:** Run statements individually, not as a transaction

### Issue: "Index already exists"
**Solution:** The script includes `DROP INDEX IF EXISTS` for idempotency - safe to re-run

### Issue: "Permission denied"
**Solution:** Ensure you're using the service role key, not anon key

### Issue: "Column does not exist"
**Solution:** Check that column names match your schema:
- `is_operational` vs `is_active`
- `venue_name` vs `name`
- Adjust SQL if needed

---

## Rollback (If Needed)

If you need to remove the new indices:

```sql
-- Remove new indices
DROP INDEX IF EXISTS idx_booths_geography_gist CASCADE;
DROP INDEX IF EXISTS idx_booths_city_country_operational CASCADE;
DROP INDEX IF EXISTS idx_booths_city CASCADE;
DROP INDEX IF EXISTS idx_booths_country CASCADE;
DROP INDEX IF EXISTS idx_booths_status_updated_at CASCADE;
DROP INDEX IF EXISTS idx_booths_machine_model CASCADE;
DROP INDEX IF EXISTS idx_booths_verification_status CASCADE;
DROP INDEX IF EXISTS idx_booths_google_enriched_timestamp CASCADE;
DROP INDEX IF EXISTS idx_booths_created_at CASCADE;

-- Remove helper function
DROP FUNCTION IF EXISTS find_nearby_booths;
```

---

## Post-Application Checklist

- [ ] All 9 indices created successfully
- [ ] find_nearby_booths() function exists
- [ ] Geography index is being used in EXPLAIN ANALYZE
- [ ] City/country filter queries are faster
- [ ] No errors in Supabase logs
- [ ] Index sizes are reasonable (check pg_stat_user_indexes)
- [ ] Application performance improved (test map loading)

---

## Next Steps

1. **Monitor Performance:** Use the verification queries above to track index usage
2. **Update Queries:** Ensure your application queries take advantage of the new indices
3. **Test Thoroughly:** Verify map functionality, filtering, and search are working correctly
4. **Document:** Note any issues or improvements in the project README

---

## Contact & Support

- **Supabase Dashboard:** https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy
- **Project:** Booth Beacon
- **Migration File:** `/Users/jkw/Projects/booth-beacon-app/scripts/apply-new-indices.sql`
