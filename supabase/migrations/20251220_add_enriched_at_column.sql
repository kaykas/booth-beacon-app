-- Add enriched_at column to booths table
ALTER TABLE booths ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance on enriched_at
CREATE INDEX IF NOT EXISTS idx_booths_enriched_at ON booths(enriched_at);
