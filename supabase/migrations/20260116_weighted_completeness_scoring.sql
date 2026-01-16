-- Improved Weighted Completeness Scoring
-- Replaces the 50% average completeness with a weighted algorithm
-- Based on CRAWLER_DATA_FLOW_ANALYSIS.md recommendations

-- Add completeness_score column if it doesn't exist
ALTER TABLE booths ADD COLUMN IF NOT EXISTS completeness_score INTEGER DEFAULT 0;

-- Create function to calculate weighted completeness score
CREATE OR REPLACE FUNCTION calculate_completeness_score(booth_record booths)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Core required fields (already validated, so these always contribute)
  IF booth_record.name IS NOT NULL AND booth_record.name != '' THEN
    score := score + 10;  -- Name (required)
  END IF;

  IF booth_record.address IS NOT NULL AND booth_record.address != '' THEN
    score := score + 10;  -- Address (required)
  END IF;

  IF booth_record.country IS NOT NULL THEN
    score := score + 5;   -- Country (required)
  END IF;

  -- Location precision (25 points total)
  IF booth_record.latitude IS NOT NULL AND booth_record.longitude IS NOT NULL THEN
    score := score + 15;  -- Coordinates (critical for map)
  END IF;

  IF booth_record.city IS NOT NULL AND booth_record.city != '' THEN
    score := score + 5;   -- City
  END IF;

  IF booth_record.state IS NOT NULL AND booth_record.state != '' THEN
    score := score + 5;   -- State/Province
  END IF;

  -- Visual content (20 points total - user experience)
  IF booth_record.photo_exterior_url IS NOT NULL THEN
    score := score + 10;  -- Exterior photo
  END IF;

  IF booth_record.photo_interior_url IS NOT NULL THEN
    score := score + 10;  -- Interior photo
  END IF;

  -- Descriptive content (15 points total - context and value)
  IF booth_record.description IS NOT NULL AND LENGTH(booth_record.description) >= 50 THEN
    score := score + 15;  -- Meaningful description (50+ chars)
  ELSIF booth_record.description IS NOT NULL AND LENGTH(booth_record.description) >= 20 THEN
    score := score + 8;   -- Short description
  END IF;

  -- Machine details (10 points total - technical info)
  IF booth_record.machine_model IS NOT NULL AND booth_record.machine_model != '' THEN
    score := score + 5;   -- Machine model
  END IF;

  IF booth_record.machine_manufacturer IS NOT NULL AND booth_record.machine_manufacturer != '' THEN
    score := score + 3;   -- Manufacturer
  END IF;

  IF booth_record.booth_type IS NOT NULL THEN
    score := score + 2;   -- Booth type (analog/digital)
  END IF;

  -- Operational details (10 points total - practical info)
  IF booth_record.hours IS NOT NULL AND booth_record.hours != '' THEN
    score := score + 5;   -- Business hours
  END IF;

  IF booth_record.cost IS NOT NULL AND booth_record.cost != '' THEN
    score := score + 3;   -- Cost information
  END IF;

  IF booth_record.is_operational IS NOT NULL THEN
    score := score + 2;   -- Operational status known
  END IF;

  -- Contact and web presence (5 points total)
  IF booth_record.website IS NOT NULL AND booth_record.website != '' THEN
    score := score + 3;   -- Website
  END IF;

  IF booth_record.phone IS NOT NULL AND booth_record.phone != '' THEN
    score := score + 2;   -- Phone number
  END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update all existing booths with weighted completeness scores
UPDATE booths
SET completeness_score = calculate_completeness_score(booths.*);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_booths_completeness_score ON booths(completeness_score DESC);

-- Create trigger to auto-update completeness score on booth changes
CREATE OR REPLACE FUNCTION trigger_update_completeness_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completeness_score := calculate_completeness_score(NEW.*);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_booth_completeness_score ON booths;
CREATE TRIGGER update_booth_completeness_score
  BEFORE INSERT OR UPDATE ON booths
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_completeness_score();

-- Create improved data quality view with weighted scores
CREATE OR REPLACE VIEW booth_data_quality_stats_v2 AS
SELECT
  status,
  needs_verification,
  data_source_type,
  source_primary,
  COUNT(*) as booth_count,

  -- Completeness metrics
  ROUND(AVG(completeness_score)::numeric, 1) as avg_completeness_score,
  COUNT(*) FILTER (WHERE completeness_score >= 80) as excellent_count,
  COUNT(*) FILTER (WHERE completeness_score BETWEEN 60 AND 79) as good_count,
  COUNT(*) FILTER (WHERE completeness_score BETWEEN 40 AND 59) as fair_count,
  COUNT(*) FILTER (WHERE completeness_score < 40) as poor_count,

  -- Field-specific metrics
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as with_coordinates,
  COUNT(*) FILTER (WHERE photo_exterior_url IS NOT NULL OR photo_interior_url IS NOT NULL) as with_photos,
  COUNT(*) FILTER (WHERE description IS NOT NULL AND LENGTH(description) >= 50) as with_description,
  COUNT(*) FILTER (WHERE machine_model IS NOT NULL) as with_machine_model,
  COUNT(*) FILTER (WHERE hours IS NOT NULL) as with_hours,
  COUNT(*) FILTER (WHERE cost IS NOT NULL) as with_cost,

  -- Quality percentages
  ROUND(100.0 * COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) / COUNT(*), 1) as geocoded_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE photo_exterior_url IS NOT NULL OR photo_interior_url IS NOT NULL) / COUNT(*), 1) as photo_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE description IS NOT NULL AND LENGTH(description) >= 50) / COUNT(*), 1) as description_pct
FROM booths
GROUP BY status, needs_verification, data_source_type, source_primary;

-- Report
SELECT
  'Completeness Scoring Updated' as status,
  COUNT(*) as total_booths,
  ROUND(AVG(completeness_score)::numeric, 1) as avg_score,
  COUNT(*) FILTER (WHERE completeness_score >= 80) as excellent,
  COUNT(*) FILTER (WHERE completeness_score BETWEEN 60 AND 79) as good,
  COUNT(*) FILTER (WHERE completeness_score BETWEEN 40 AND 59) as fair,
  COUNT(*) FILTER (WHERE completeness_score < 40) as poor
FROM booths;
