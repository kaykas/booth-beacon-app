# Database Migration: Add Geocoding Validation Columns

## Summary
This migration adds geocoding validation metadata fields to the `booths` table.

## Migration Status
**STATUS: NOT YET APPLIED**

## Execution Instructions

### Quick Start
1. Open: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new
2. Paste the SQL below (it's in your clipboard)
3. Click "Run"
4. Run: `node scripts/verify-migration.js` to verify

### SQL to Execute (Function-Based Approach)
```sql
CREATE OR REPLACE FUNCTION execute_geocode_validation_migration()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocode_match_score INTEGER;
  ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocode_validation_issues TEXT[];
  ALTER TABLE booths ADD COLUMN IF NOT EXISTS geocode_validated_at TIMESTAMPTZ;
  ALTER TABLE booths ADD COLUMN IF NOT EXISTS needs_geocode_review BOOLEAN DEFAULT FALSE;

  CREATE INDEX IF NOT EXISTS idx_booths_needs_geocode_review
  ON booths(needs_geocode_review) WHERE needs_geocode_review = TRUE;

  CREATE INDEX IF NOT EXISTS idx_booths_low_confidence_geocode
  ON booths(geocode_confidence) WHERE geocode_confidence IN ('low', 'reject');

  RETURN 'Migration executed successfully';
END; $$;

SELECT execute_geocode_validation_migration();
DROP FUNCTION IF EXISTS execute_geocode_validation_migration();
```

## What Gets Added
- geocode_match_score (INTEGER): Match score 0-100
- geocode_validation_issues (TEXT[]): Array of issues
- geocode_validated_at (TIMESTAMPTZ): Validation timestamp
- needs_geocode_review (BOOLEAN): Manual review flag

## Verification
Run: `node scripts/verify-migration.js`
