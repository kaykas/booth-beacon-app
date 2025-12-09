-- Migration: Add Geocode Validation Metadata Fields
-- Description: Add fields to track detailed validation results from 4-layer validation system
-- Date: 2025-12-08
-- Related: Extends 20251205_add_geocode_metadata_columns.sql

-- =====================================================
-- Add validation metadata columns to booths table
-- =====================================================

-- Match score from geocode validation (0-100)
ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocode_match_score INTEGER;

-- Validation issues array (stores issues found during validation)
ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocode_validation_issues TEXT[];

-- Timestamp of last validation
ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocode_validated_at TIMESTAMPTZ;

-- Manual review flag (true if booth needs manual review)
ALTER TABLE booths ADD COLUMN IF NOT EXISTS needs_geocode_review BOOLEAN DEFAULT FALSE;

-- =====================================================
-- Create indexes for performance
-- =====================================================

-- Index for finding booths needing review
CREATE INDEX IF NOT EXISTS idx_booths_needs_geocode_review
ON booths(needs_geocode_review)
WHERE needs_geocode_review = TRUE;

-- Index for finding low-confidence geocodes
CREATE INDEX IF NOT EXISTS idx_booths_low_confidence_geocode
ON booths(geocode_confidence)
WHERE geocode_confidence IN ('low', 'reject');

-- =====================================================
-- Add column comments for documentation
-- =====================================================

COMMENT ON COLUMN booths.geocode_match_score IS 'Match score from geocode validation (0-100)';
COMMENT ON COLUMN booths.geocode_validation_issues IS 'Array of validation issues found during geocoding';
COMMENT ON COLUMN booths.geocode_validated_at IS 'Timestamp of last geocode validation';
COMMENT ON COLUMN booths.needs_geocode_review IS 'Flag indicating booth needs manual geocode review';
