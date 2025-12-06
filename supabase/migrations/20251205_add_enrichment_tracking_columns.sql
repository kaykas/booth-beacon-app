-- Migration: Add Enrichment Tracking Columns
-- Description: Add enrichment_attempted_at, geocoded_at columns to booths table for tracking enrichment processes
-- Date: 2025-12-05
-- Note: google_place_id was already added in 20251201_booth_enrichments.sql

-- =====================================================
-- Add enrichment tracking columns to booths table
-- =====================================================

-- Add enrichment attempt tracking
ALTER TABLE booths ADD COLUMN IF NOT EXISTS enrichment_attempted_at TIMESTAMPTZ;

-- Add geocoding completion tracking
ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;

-- Ensure google_place_id exists (already in prior migration, but safe to run)
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_place_id TEXT;

-- =====================================================
-- Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_booths_enrichment_attempted
ON booths(enrichment_attempted_at)
WHERE enrichment_attempted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_booths_geocoded
ON booths(geocoded_at)
WHERE geocoded_at IS NOT NULL;

-- =====================================================
-- Add column comments for documentation
-- =====================================================

COMMENT ON COLUMN booths.enrichment_attempted_at IS 'Timestamp when venue enrichment was last attempted (geocoding, Google Places, etc.)';
COMMENT ON COLUMN booths.geocoded_at IS 'Timestamp when geocoding was successfully completed';
COMMENT ON COLUMN booths.google_place_id IS 'Google Places API place_id for venue data enrichment';
