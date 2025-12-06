-- Migration: Add Geocode Metadata Columns
-- Description: Add geocode_provider and geocode_confidence columns for tracking geocoding source and quality
-- Date: 2025-12-05
-- Related: Complements 20251205_add_enrichment_tracking_columns.sql

-- =====================================================
-- Add geocode metadata columns to booths table
-- =====================================================

-- Add provider tracking (which service was used for geocoding)
ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocode_provider TEXT;

-- Add confidence level tracking
ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocode_confidence TEXT;

-- =====================================================
-- Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_booths_geocode_provider
ON booths(geocode_provider)
WHERE geocode_provider IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_booths_geocode_confidence
ON booths(geocode_confidence)
WHERE geocode_confidence IS NOT NULL;

-- =====================================================
-- Add column comments for documentation
-- =====================================================

COMMENT ON COLUMN booths.geocode_provider IS 'Geocoding service used (google, nominatim, etc.)';
COMMENT ON COLUMN booths.geocode_confidence IS 'Geocoding confidence level: high, medium, or low';
