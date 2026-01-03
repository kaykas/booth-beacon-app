-- Add enrichment attempt tracking column
ALTER TABLE booths
ADD COLUMN IF NOT EXISTS enrichment_attempted_at TIMESTAMPTZ;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_booths_enrichment_attempted
ON booths(enrichment_attempted_at)
WHERE enrichment_attempted_at IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'booths'
AND column_name = 'enrichment_attempted_at';
