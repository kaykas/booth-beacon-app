-- Add missing enrichment tracking columns
ALTER TABLE booths ADD COLUMN IF NOT EXISTS enrichment_attempted_at timestamptz;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_place_id text;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_booths_enrichment_attempted ON booths(enrichment_attempted_at) WHERE enrichment_attempted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_booths_geocoded ON booths(geocoded_at) WHERE geocoded_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_booths_google_place_id ON booths(google_place_id) WHERE google_place_id IS NOT NULL;

-- Comment the columns
COMMENT ON COLUMN booths.enrichment_attempted_at IS 'Timestamp when venue enrichment was last attempted';
COMMENT ON COLUMN booths.geocoded_at IS 'Timestamp when geocoding was completed';
COMMENT ON COLUMN booths.google_place_id IS 'Google Places API place_id for venue data';
