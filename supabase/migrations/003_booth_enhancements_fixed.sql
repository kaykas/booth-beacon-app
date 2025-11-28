-- =====================================================
-- BOOTH ENHANCEMENTS MIGRATION (FIXED)
-- Adds fields for creating amazing, rich booth pages
-- All fields are optional to preserve existing data
-- Handles missing columns gracefully
-- =====================================================

-- Social & Community Features
ALTER TABLE booths ADD COLUMN IF NOT EXISTS rating_average DECIMAL(2, 1) DEFAULT 0.0;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Rich Content
ALTER TABLE booths ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}'; -- Add base photos field if missing
ALTER TABLE booths ADD COLUMN IF NOT EXISTS photo_captions JSONB;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS video_urls TEXT[];
ALTER TABLE booths ADD COLUMN IF NOT EXISTS nearby_attractions TEXT[];
ALTER TABLE booths ADD COLUMN IF NOT EXISTS parking_info TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS accessibility_info TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS special_features TEXT[];

-- Historical & Story
ALTER TABLE booths ADD COLUMN IF NOT EXISTS year_installed INTEGER;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS historical_notes TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS fun_facts TEXT[];
ALTER TABLE booths ADD COLUMN IF NOT EXISTS historical_photos JSONB;

-- SEO & Discovery
ALTER TABLE booths ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS alternative_names TEXT[];
ALTER TABLE booths ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- Verification & Quality
ALTER TABLE booths ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS data_quality_score INTEGER;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS completeness_score INTEGER;

-- Social Media
ALTER TABLE booths ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS twitter_handle TEXT;

-- Operating Details
ALTER TABLE booths ADD COLUMN IF NOT EXISTS seasonal_hours JSONB;
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

-- Add unique constraint to slug if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booths_slug_key'
  ) THEN
    ALTER TABLE booths ADD CONSTRAINT booths_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Function to auto-generate slug from name
CREATE OR REPLACE FUNCTION generate_booth_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := trim(both '-' from NEW.slug);
    IF NEW.city IS NOT NULL THEN
      NEW.slug := NEW.slug || '-' || lower(regexp_replace(NEW.city, '[^a-zA-Z0-9]+', '-', 'g'));
      NEW.slug := trim(both '-' from NEW.slug);
    END IF;

    -- Handle duplicates by appending a counter
    DECLARE
      base_slug TEXT := NEW.slug;
      counter INTEGER := 1;
    BEGIN
      WHILE EXISTS (SELECT 1 FROM booths WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
        NEW.slug := base_slug || '-' || counter;
        counter := counter + 1;
      END LOOP;
    END;
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

-- Safe function to calculate completeness score (handles missing columns)
CREATE OR REPLACE FUNCTION calculate_booth_completeness(booth_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  booth_record RECORD;
  photos_count INTEGER := 0;
BEGIN
  SELECT * INTO booth_record FROM booths WHERE id = booth_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Required fields
  IF booth_record.name IS NOT NULL AND booth_record.name != '' THEN score := score + 5; END IF;
  IF booth_record.address IS NOT NULL AND booth_record.address != '' THEN score := score + 5; END IF;
  IF booth_record.country IS NOT NULL AND booth_record.country != '' THEN score := score + 5; END IF;

  -- Important fields
  IF booth_record.latitude IS NOT NULL AND booth_record.longitude IS NOT NULL THEN score := score + 10; END IF;
  IF booth_record.city IS NOT NULL AND booth_record.city != '' THEN score := score + 5; END IF;
  IF booth_record.description IS NOT NULL AND booth_record.description != '' THEN score := score + 10; END IF;

  -- Photos (handle if column exists)
  BEGIN
    EXECUTE format('SELECT CASE WHEN $1.photos IS NOT NULL THEN array_length($1.photos, 1) ELSE 0 END')
    INTO photos_count USING booth_record;
    IF photos_count > 0 THEN score := score + 15; END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Column doesn't exist or other error, skip
    NULL;
  END;

  -- Nice to have fields
  IF booth_record.hours IS NOT NULL AND booth_record.hours != '' THEN score := score + 5; END IF;
  IF booth_record.cost IS NOT NULL AND booth_record.cost != '' THEN score := score + 5; END IF;
  IF booth_record.website IS NOT NULL AND booth_record.website != '' THEN score := score + 5; END IF;
  IF booth_record.phone IS NOT NULL AND booth_record.phone != '' THEN score := score + 5; END IF;

  -- Machine info (handle if columns exist)
  BEGIN
    IF booth_record.machine_model IS NOT NULL AND booth_record.machine_model != '' THEN score := score + 5; END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    IF booth_record.machine_manufacturer IS NOT NULL AND booth_record.machine_manufacturer != '' THEN score := score + 5; END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Enhanced fields (check if they exist)
  BEGIN
    IF booth_record.neighborhood IS NOT NULL AND booth_record.neighborhood != '' THEN score := score + 3; END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    IF booth_record.parking_info IS NOT NULL AND booth_record.parking_info != '' THEN score := score + 2; END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    IF booth_record.accessibility_info IS NOT NULL AND booth_record.accessibility_info != '' THEN score := score + 3; END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    IF booth_record.tags IS NOT NULL AND array_length(booth_record.tags, 1) > 0 THEN score := score + 5; END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    IF booth_record.year_installed IS NOT NULL THEN score := score + 2; END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to update completeness scores for all booths
CREATE OR REPLACE FUNCTION update_all_completeness_scores()
RETURNS void AS $$
BEGIN
  UPDATE booths SET completeness_score = calculate_booth_completeness(id);
END;
$$ LANGUAGE plpgsql;

-- Update completeness scores for existing booths
SELECT update_all_completeness_scores();

-- Create view for high-quality booths
CREATE OR REPLACE VIEW featured_booths AS
SELECT b.*, COALESCE(b.rating_average, 0) as rating, COALESCE(b.completeness_score, 0) as completeness
FROM booths b
WHERE b.status = 'active' AND COALESCE(b.is_operational, true) = true
  AND (COALESCE(b.completeness_score, 0) >= 70 OR COALESCE(b.rating_average, 0) >= 4.0)
ORDER BY b.rating_average DESC NULLS LAST, b.completeness_score DESC NULLS LAST, b.favorite_count DESC NULLS LAST;

-- Create view for booths needing attention
CREATE OR REPLACE VIEW booths_needing_enhancement AS
SELECT
  b.*,
  COALESCE(b.completeness_score, 0) as completeness,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booths' AND column_name = 'photos')
      OR b.photos IS NULL
      OR array_length(b.photos, 1) = 0 THEN 'needs_photos'
    WHEN b.latitude IS NULL OR b.longitude IS NULL THEN 'needs_location'
    WHEN b.description IS NULL OR b.description = '' THEN 'needs_description'
    WHEN b.hours IS NULL OR b.hours = '' THEN 'needs_hours'
    ELSE 'needs_details'
  END as priority_need
FROM booths b
WHERE b.status = 'active' AND COALESCE(b.completeness_score, 0) < 70
ORDER BY b.completeness_score ASC NULLS FIRST;

-- Add comments
COMMENT ON TABLE booths IS 'Photo booth locations with comprehensive data for rich, engaging pages';
COMMENT ON COLUMN booths.slug IS 'URL-friendly unique identifier, auto-generated from name and city';
COMMENT ON COLUMN booths.tags IS 'User-generated tags like "vintage", "date-spot", "hidden-gem"';
COMMENT ON COLUMN booths.completeness_score IS 'Data completeness percentage (0-100), auto-calculated';
COMMENT ON COLUMN booths.data_quality_score IS 'Overall data quality score including accuracy and freshness';
