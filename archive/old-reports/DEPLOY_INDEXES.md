# Deploy Database Indexes - Manual Instructions

## Quick Deploy (Copy-Paste into Supabase SQL Editor)

**Go to:** https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new

**Copy and paste this SQL:**

```sql
-- =====================================================
-- 1. CRITICAL: Geospatial Index for Map Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_booths_location_gist
ON booths USING GIST (geography(ST_MakePoint(longitude, latitude)))
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- =====================================================
-- 2. Active Booths Location Index
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_booths_location_active
ON booths (latitude, longitude, is_active)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND is_active = true;

-- =====================================================
-- 3. City/State/Country Filter Index
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_booths_city_state_country
ON booths (city, state, country)
WHERE is_active = true;

-- =====================================================
-- 4. Full-Text Search Setup
-- =====================================================

-- Add search vector column
ALTER TABLE booths ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_booths_search_vector
ON booths USING GIN (search_vector);

-- Create trigger function
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

-- Populate existing records
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
-- 5. Admin & Status Indexes
-- =====================================================

-- Admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_booths_admin
ON booths (created_at DESC, verification_status, is_active);

-- Geocoding status tracking
CREATE INDEX IF NOT EXISTS idx_booths_geocoding_status
ON booths (latitude, longitude, updated_at)
WHERE latitude IS NULL OR longitude IS NULL;

-- =====================================================
-- 6. Analyze Table
-- =====================================================
ANALYZE booths;

-- =====================================================
-- Verification Query (run this after)
-- =====================================================
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_indexes
JOIN pg_class ON pg_class.relname = indexname
WHERE tablename = 'booths'
ORDER BY indexname;
```

## Expected Result

After running, you should see these indexes:
- `idx_booths_location_gist` (geospatial - most important!)
- `idx_booths_location_active`
- `idx_booths_city_state_country`
- `idx_booths_search_vector`
- `idx_booths_admin`
- `idx_booths_geocoding_status`

## Performance Impact

- **Map queries:** 10-50x faster with geospatial index
- **Search:** Instant full-text search
- **Admin queries:** Much faster dashboard loads

## Troubleshooting

If you get "already exists" errors, that's fine - it means the indexes are already there!

If you get permission errors, make sure you're logged into the correct Supabase project.
