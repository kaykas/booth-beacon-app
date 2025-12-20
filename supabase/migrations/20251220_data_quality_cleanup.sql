-- Data Quality Cleanup Migration
-- Adds verification flags and cleans up bad data from Lomography crawler

-- 1. Add needs_verification column
ALTER TABLE booths ADD COLUMN IF NOT EXISTS needs_verification BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_booths_needs_verification ON booths(needs_verification) WHERE needs_verification = TRUE;

-- 2. Add data_source_type column to track extraction quality
ALTER TABLE booths ADD COLUMN IF NOT EXISTS data_source_type TEXT;
CREATE INDEX IF NOT EXISTS idx_booths_data_source_type ON booths(data_source_type);

-- 3. Flag Lomography booths with photo metadata in description as needing verification
UPDATE booths
SET
  needs_verification = TRUE,
  data_source_type = 'photo_metadata_extraction'
WHERE
  source_primary = 'Lomography'
  AND (
    description LIKE '%Photographer:%'
    OR description LIKE '%Camera:%'
    OR description LIKE '%Film:%'
    OR description LIKE '%Uploaded:%'
    OR description LIKE '%Albums:%'
  );

-- 4. Clear bad descriptions containing photo metadata
UPDATE booths
SET description = NULL
WHERE
  description LIKE '%Photographer:%'
  AND description LIKE '%Camera:%'
  AND description LIKE '%Film:%';

-- 5. Clear incorrect operator names from Lomography (photographers, not operators)
UPDATE booths
SET operator_name = NULL
WHERE
  source_primary = 'Lomography'
  AND operator_name IS NOT NULL
  AND needs_verification = TRUE;

-- 6. Flag booths with only city-name addresses as needing review
UPDATE booths
SET needs_verification = TRUE
WHERE
  address = city
  OR address IS NULL
  OR LENGTH(TRIM(address)) < 10;

-- 7. Flag old unverified data (> 1 year since last_verified)
UPDATE booths
SET
  needs_verification = TRUE,
  status = 'unverified'
WHERE
  source_primary = 'Lomography'
  AND (
    last_verified IS NULL
    OR last_verified < NOW() - INTERVAL '1 year'
  )
  AND status = 'active';

-- 8. Add comment explaining the flags
COMMENT ON COLUMN booths.needs_verification IS 'TRUE when booth data is incomplete, unverified, or extracted from unreliable sources (e.g., photo metadata instead of booth info)';
COMMENT ON COLUMN booths.data_source_type IS 'Type of data source: direct_submission, verified_scrape, photo_metadata_extraction, etc.';

-- 9. Create view for data quality reporting (useful for monitoring, not a dashboard)
CREATE OR REPLACE VIEW booth_data_quality_stats AS
SELECT
  status,
  needs_verification,
  data_source_type,
  source_primary,
  COUNT(*) as booth_count,
  COUNT(*) FILTER (WHERE description IS NULL) as missing_description,
  COUNT(*) FILTER (WHERE address = city OR address IS NULL) as vague_address,
  COUNT(*) FILTER (WHERE photo_exterior_url IS NULL AND photo_interior_url IS NULL) as no_photos,
  COUNT(*) FILTER (WHERE hours IS NULL) as no_hours,
  COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) as no_coordinates
FROM booths
GROUP BY status, needs_verification, data_source_type, source_primary
ORDER BY booth_count DESC;

-- Migration complete
-- Changes logged via Supabase migration system
