-- First, create a function that can execute DDL statements
-- This function will be created and then called to run the migration

-- Create a function to execute the migration
CREATE OR REPLACE FUNCTION execute_geocode_validation_migration()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add validation metadata columns
  ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocode_match_score INTEGER;
  ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocode_validation_issues TEXT[];
  ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocode_validated_at TIMESTAMPTZ;
  ALTER TABLE booths ADD COLUMN IF NOT EXISTS needs_geocode_review BOOLEAN DEFAULT FALSE;

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_booths_needs_geocode_review
  ON booths(needs_geocode_review)
  WHERE needs_geocode_review = TRUE;

  CREATE INDEX IF NOT EXISTS idx_booths_low_confidence_geocode
  ON booths(geocode_confidence)
  WHERE geocode_confidence IN ('low', 'reject');

  -- Add comments (these will fail if run multiple times, but that's okay)
  BEGIN
    EXECUTE 'COMMENT ON COLUMN booths.geocode_match_score IS ''Match score from geocode validation (0-100)''';
    EXECUTE 'COMMENT ON COLUMN booths.geocode_validation_issues IS ''Array of validation issues found during geocoding''';
    EXECUTE 'COMMENT ON COLUMN booths.geocode_validated_at IS ''Timestamp of last geocode validation''';
    EXECUTE 'COMMENT ON COLUMN booths.needs_geocode_review IS ''Flag indicating booth needs manual geocode review''';
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors from comments
    NULL;
  END;

  RETURN 'Migration executed successfully';
END;
$$;

-- Now call the function to execute the migration
SELECT execute_geocode_validation_migration();

-- Clean up the function after execution
DROP FUNCTION IF EXISTS execute_geocode_validation_migration();
