-- Migration: Add Street View validation columns to booths table
-- Created: 2026-01-02
-- Purpose: Enable validation and tracking of Google Street View availability for booth locations

-- Add validation columns
ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_available BOOLEAN DEFAULT NULL;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_panorama_id TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_distance_meters NUMERIC(10, 2);
ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_validated_at TIMESTAMPTZ;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_heading NUMERIC(5, 2);

-- Add index for efficient querying of validated booths
CREATE INDEX IF NOT EXISTS idx_booths_street_view_available
  ON booths(street_view_available)
  WHERE street_view_available IS NOT NULL;

-- Add index for finding booths needing validation
CREATE INDEX IF NOT EXISTS idx_booths_street_view_validation_needed
  ON booths(latitude, longitude, street_view_validated_at)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comment to document the columns
COMMENT ON COLUMN booths.street_view_available IS 'Boolean indicating if Street View is available within 50m radius. NULL = not yet validated';
COMMENT ON COLUMN booths.street_view_panorama_id IS 'Google Street View panorama ID for direct loading';
COMMENT ON COLUMN booths.street_view_distance_meters IS 'Distance in meters from booth to nearest Street View panorama';
COMMENT ON COLUMN booths.street_view_validated_at IS 'Timestamp when Street View availability was last validated';
COMMENT ON COLUMN booths.street_view_heading IS 'Optimal camera heading from panorama toward booth location (0-360 degrees)';
