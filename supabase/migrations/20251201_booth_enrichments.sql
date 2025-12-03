-- Migration: Booth Enrichments System
-- Description: Add Google Maps enrichment fields to booths table and create booth_enrichments tracking table
-- Date: 2025-12-01

-- =====================================================
-- PART 1: Add enrichment fields to booths table
-- =====================================================

-- Contact & Social fields
ALTER TABLE booths ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Google Maps Integration fields
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1);
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_user_ratings_total INTEGER;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_photos TEXT[];
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_enriched_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_business_status TEXT;

-- Additional Google data fields (optional)
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_formatted_address TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_phone TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_website TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_opening_hours JSONB;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_booths_google_place_id ON booths(google_place_id);
CREATE INDEX IF NOT EXISTS idx_booths_google_enriched_at ON booths(google_enriched_at);
CREATE INDEX IF NOT EXISTS idx_booths_google_rating ON booths(google_rating);
CREATE INDEX IF NOT EXISTS idx_booths_phone ON booths(phone);
CREATE INDEX IF NOT EXISTS idx_booths_website ON booths(website);

-- =====================================================
-- PART 2: Create booth_enrichments tracking table
-- =====================================================

CREATE TABLE IF NOT EXISTS booth_enrichments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,

  -- Google enrichment status
  google_attempted_at TIMESTAMP WITH TIME ZONE,
  google_enriched_at TIMESTAMP WITH TIME ZONE,
  google_error TEXT,
  google_place_id TEXT,

  -- Enrichment data (JSONB for flexibility)
  google_data JSONB,

  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT booth_enrichments_booth_id_key UNIQUE (booth_id)
);

-- Create indexes for booth_enrichments
CREATE INDEX IF NOT EXISTS idx_booth_enrichments_booth_id ON booth_enrichments(booth_id);
CREATE INDEX IF NOT EXISTS idx_booth_enrichments_place_id ON booth_enrichments(google_place_id);
CREATE INDEX IF NOT EXISTS idx_booth_enrichments_attempted ON booth_enrichments(google_attempted_at);
CREATE INDEX IF NOT EXISTS idx_booth_enrichments_enriched ON booth_enrichments(google_enriched_at);

-- =====================================================
-- PART 3: Create function to auto-update updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_booth_enrichments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booth_enrichments_updated_at
  BEFORE UPDATE ON booth_enrichments
  FOR EACH ROW
  EXECUTE FUNCTION update_booth_enrichments_updated_at();

-- =====================================================
-- PART 4: Add comments for documentation
-- =====================================================

COMMENT ON TABLE booth_enrichments IS 'Tracks enrichment status and history for booth data from external sources like Google Maps';
COMMENT ON COLUMN booth_enrichments.google_attempted_at IS 'When we last tried to enrich this booth from Google';
COMMENT ON COLUMN booth_enrichments.google_enriched_at IS 'When we successfully enriched this booth from Google';
COMMENT ON COLUMN booth_enrichments.google_error IS 'Last error message if enrichment failed';
COMMENT ON COLUMN booth_enrichments.google_data IS 'Full JSON response from Google Places API';

COMMENT ON COLUMN booths.phone IS 'Contact phone number for the booth or venue';
COMMENT ON COLUMN booths.email IS 'Contact email for the booth or venue';
COMMENT ON COLUMN booths.website IS 'Booth or venue website URL';
COMMENT ON COLUMN booths.instagram IS 'Instagram handle (without @)';
COMMENT ON COLUMN booths.google_place_id IS 'Google Maps Place ID for this booth';
COMMENT ON COLUMN booths.google_rating IS 'Google Maps rating (1.0-5.0)';
COMMENT ON COLUMN booths.google_user_ratings_total IS 'Number of Google reviews';
COMMENT ON COLUMN booths.google_photos IS 'Array of Google Maps photo URLs';
COMMENT ON COLUMN booths.google_enriched_at IS 'Timestamp of last Google Maps enrichment';
COMMENT ON COLUMN booths.google_business_status IS 'Google business status: OPERATIONAL, CLOSED_TEMPORARILY, or CLOSED_PERMANENTLY';
