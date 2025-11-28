-- =====================================================
-- BOOTH ENHANCEMENTS MIGRATION
-- Adds fields for creating amazing, rich booth pages
-- All fields are optional to preserve existing data
-- =====================================================

-- Social & Community Features
ALTER TABLE booths ADD COLUMN IF NOT EXISTS rating_average DECIMAL(2, 1) DEFAULT 0.0;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Rich Content
ALTER TABLE booths ADD COLUMN IF NOT EXISTS photo_captions JSONB; -- Array of {url, caption, uploaded_by, uploaded_at}
ALTER TABLE booths ADD COLUMN IF NOT EXISTS video_urls TEXT[];
ALTER TABLE booths ADD COLUMN IF NOT EXISTS nearby_attractions TEXT[];
ALTER TABLE booths ADD COLUMN IF NOT EXISTS parking_info TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS accessibility_info TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS special_features TEXT[]; -- ["vintage strips", "color", "instant prints"]

-- Historical & Story
ALTER TABLE booths ADD COLUMN IF NOT EXISTS year_installed INTEGER;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS historical_notes TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS fun_facts TEXT[];
ALTER TABLE booths ADD COLUMN IF NOT EXISTS historical_photos JSONB; -- Array of {url, year, caption}

-- SEO & Discovery
ALTER TABLE booths ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS alternative_names TEXT[];
ALTER TABLE booths ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS keywords TEXT[]; -- For search optimization

-- Verification & Quality
ALTER TABLE booths ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);
ALTER TABLE booths ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS data_quality_score INTEGER; -- 0-100
ALTER TABLE booths ADD COLUMN IF NOT EXISTS completeness_score INTEGER; -- 0-100

-- Social Media
ALTER TABLE booths ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS twitter_handle TEXT;

-- Operating Details
ALTER TABLE booths ADD COLUMN IF NOT EXISTS seasonal_hours JSONB; -- {summer: "...", winter: "..."}
ALTER TABLE booths ADD COLUMN IF NOT EXISTS special_notes TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS last_maintenance_date DATE;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS maintenance_notes TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booths_slug ON booths(slug);
CREATE INDEX IF NOT EXISTS idx_booths_neighborhood ON booths(neighborhood);
CREATE INDEX IF NOT EXISTS idx_booths_rating ON booths(rating_average DESC);
CREATE INDEX IF NOT EXISTS idx_booths_tags ON booths USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_booths_keywords ON booths USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_booths_verified ON booths(verified_at) WHERE verified_at IS NOT NULL;

-- Function to auto-generate slug from name
CREATE OR REPLACE FUNCTION generate_booth_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := trim(both '-' from NEW.slug);

    -- Ensure uniqueness by appending city
    IF NEW.city IS NOT NULL THEN
      NEW.slug := NEW.slug || '-' || lower(regexp_replace(NEW.city, '[^a-zA-Z0-9]+', '-', 'g'));
      NEW.slug := trim(both '-' from NEW.slug);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slugs
DROP TRIGGER IF EXISTS booth_slug_trigger ON booths;
CREATE TRIGGER booth_slug_trigger
  BEFORE INSERT OR UPDATE ON booths
  FOR EACH ROW
  EXECUTE FUNCTION generate_booth_slug();

-- Function to calculate completeness score
CREATE OR REPLACE FUNCTION calculate_booth_completeness(booth_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  booth_record RECORD;
BEGIN
  SELECT * INTO booth_record FROM booths WHERE id = booth_id;

  -- Required fields (already have)
  IF booth_record.name IS NOT NULL THEN score := score + 5; END IF;
  IF booth_record.address IS NOT NULL THEN score := score + 5; END IF;
  IF booth_record.country IS NOT NULL THEN score := score + 5; END IF;

  -- Important fields
  IF booth_record.latitude IS NOT NULL AND booth_record.longitude IS NOT NULL THEN score := score + 10; END IF;
  IF booth_record.city IS NOT NULL THEN score := score + 5; END IF;
  IF booth_record.description IS NOT NULL THEN score := score + 10; END IF;
  IF booth_record.photos IS NOT NULL AND array_length(booth_record.photos, 1) > 0 THEN score := score + 15; END IF;

  -- Nice to have
  IF booth_record.hours IS NOT NULL THEN score := score + 5; END IF;
  IF booth_record.cost IS NOT NULL THEN score := score + 5; END IF;
  IF booth_record.website IS NOT NULL THEN score := score + 5; END IF;
  IF booth_record.phone IS NOT NULL THEN score := score + 5; END IF;
  IF booth_record.machine_model IS NOT NULL THEN score := score + 5; END IF;
  IF booth_record.machine_manufacturer IS NOT NULL THEN score := score + 5; END IF;

  -- Enhanced fields
  IF booth_record.neighborhood IS NOT NULL THEN score := score + 3; END IF;
  IF booth_record.parking_info IS NOT NULL THEN score := score + 2; END IF;
  IF booth_record.accessibility_info IS NOT NULL THEN score := score + 3; END IF;
  IF booth_record.tags IS NOT NULL AND array_length(booth_record.tags, 1) > 0 THEN score := score + 5; END IF;
  IF booth_record.year_installed IS NOT NULL THEN score := score + 2; END IF;

  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to update completeness scores for all booths
CREATE OR REPLACE FUNCTION update_all_completeness_scores()
RETURNS void AS $$
BEGIN
  UPDATE booths
  SET completeness_score = calculate_booth_completeness(id);
END;
$$ LANGUAGE plpgsql;

-- Update completeness scores for existing booths
SELECT update_all_completeness_scores();

-- Create view for high-quality booths (for featured listings)
CREATE OR REPLACE VIEW featured_booths AS
SELECT
  b.*,
  COALESCE(b.rating_average, 0) as rating,
  COALESCE(b.completeness_score, 0) as completeness
FROM booths b
WHERE
  b.status = 'active'
  AND b.is_operational = true
  AND (b.completeness_score >= 70 OR b.rating_average >= 4.0)
ORDER BY
  b.rating_average DESC NULLS LAST,
  b.completeness_score DESC,
  b.favorite_count DESC;

-- Create view for booths needing attention
CREATE OR REPLACE VIEW booths_needing_enhancement AS
SELECT
  b.*,
  COALESCE(b.completeness_score, 0) as completeness,
  CASE
    WHEN b.photos IS NULL OR array_length(b.photos, 1) = 0 THEN 'needs_photos'
    WHEN b.latitude IS NULL OR b.longitude IS NULL THEN 'needs_location'
    WHEN b.description IS NULL THEN 'needs_description'
    WHEN b.hours IS NULL THEN 'needs_hours'
    ELSE 'needs_details'
  END as priority_need
FROM booths b
WHERE
  b.status = 'active'
  AND COALESCE(b.completeness_score, 0) < 70
ORDER BY b.completeness_score ASC NULLS FIRST;

COMMENT ON TABLE booths IS 'Photo booth locations with comprehensive data for rich, engaging pages';
COMMENT ON COLUMN booths.slug IS 'URL-friendly unique identifier, auto-generated from name and city';
COMMENT ON COLUMN booths.tags IS 'User-generated tags like "vintage", "date-spot", "hidden-gem"';
COMMENT ON COLUMN booths.completeness_score IS 'Data completeness percentage (0-100), auto-calculated';
COMMENT ON COLUMN booths.data_quality_score IS 'Overall data quality score including accuracy and freshness';
COMMENT ON COLUMN booths.photo_captions IS 'Structured photo data with captions and attribution';
COMMENT ON COLUMN booths.special_features IS 'Unique features like "vintage strips", "color photos", "instant prints"';
