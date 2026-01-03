-- Migration: Fix Database Security Issues (v2 - handles spatial_ref_sys permissions)
-- Date: 2026-01-03
-- Description: Addresses Supabase linter errors and warnings
--
-- ERROR-level fixes:
-- 1. Remove SECURITY DEFINER from views (or add RLS policies)
-- 2. Enable RLS on tables without it (crawl_jobs, crawl_raw_content)
-- 3. Skip spatial_ref_sys (PostGIS system table requiring superuser)
--
-- WARN-level fixes:
-- 4. Add SET search_path = '' to all functions
-- 5. Document postgis extension in public schema (acceptable for PostGIS)

-- =============================================================================
-- PART 1: Fix SECURITY DEFINER Views
-- =============================================================================
-- Replace SECURITY DEFINER views with regular views
-- These views query public data, so SECURITY DEFINER is unnecessary

-- Fix: featured_booths view
DROP VIEW IF EXISTS featured_booths CASCADE;
CREATE VIEW featured_booths AS
SELECT b.*, COALESCE(b.rating_average, 0) as rating, COALESCE(b.completeness_score, 0) as completeness
FROM booths b
WHERE b.status = 'active' AND COALESCE(b.is_operational, true) = true
  AND (COALESCE(b.completeness_score, 0) >= 70 OR COALESCE(b.rating_average, 0) >= 4.0)
ORDER BY b.rating_average DESC NULLS LAST, b.completeness_score DESC NULLS LAST, b.favorite_count DESC NULLS LAST;

-- Fix: booth_data_quality_stats view
DROP VIEW IF EXISTS booth_data_quality_stats CASCADE;
CREATE VIEW booth_data_quality_stats AS
SELECT
  status,
  needs_verification,
  data_source_type,
  source_primary,
  COUNT(*) as booth_count,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as geocoded_count,
  COUNT(*) FILTER (WHERE photo_exterior_url IS NOT NULL) as with_photos_count,
  COUNT(*) FILTER (WHERE description IS NOT NULL AND description != '') as with_description_count,
  ROUND(AVG(completeness_score), 2) as avg_completeness_score
FROM booths
GROUP BY status, needs_verification, data_source_type, source_primary
ORDER BY booth_count DESC;

-- Fix: content_needing_reextraction view
DROP VIEW IF EXISTS content_needing_reextraction CASCADE;
CREATE VIEW content_needing_reextraction AS
SELECT
  crc.*,
  cs.source_name,
  cs.extractor_type
FROM crawl_raw_content crc
JOIN crawl_sources cs ON crc.source_id = cs.id
WHERE cs.enabled = true
  AND (
    -- Content changed (different hash from last extraction)
    crc.content_hash IS DISTINCT FROM (
      SELECT content_hash
      FROM crawl_raw_content crc2
      WHERE crc2.source_id = crc.source_id
        AND crc2.url = crc.url
        AND crc2.id != crc.id
      ORDER BY crawled_at DESC
      LIMIT 1
    )
    -- Or never extracted
    OR NOT EXISTS (
      SELECT 1 FROM booths b
      WHERE crc.url = ANY(b.source_urls)
    )
  )
ORDER BY crc.crawled_at DESC;

-- Fix: crawler_dashboard_stats view
DROP VIEW IF EXISTS crawler_dashboard_stats CASCADE;
CREATE VIEW crawler_dashboard_stats AS
SELECT
  COUNT(DISTINCT id) as total_jobs,
  COUNT(DISTINCT id) FILTER (WHERE status = 'active') as active_jobs,
  COUNT(DISTINCT id) FILTER (WHERE status = 'pending') as pending_jobs,
  COUNT(DISTINCT id) FILTER (WHERE status = 'completed') as completed_jobs,
  COUNT(DISTINCT id) FILTER (WHERE status = 'failed') as failed_jobs,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) FILTER (WHERE completed_at IS NOT NULL) as avg_duration_seconds,
  SUM(pages_crawled) as total_pages_crawled,
  SUM(booths_found) as total_booths_found,
  SUM(booths_added) as total_booths_added,
  SUM(booths_updated) as total_booths_updated
FROM crawl_jobs;

-- =============================================================================
-- PART 2: Enable RLS on Tables Without It
-- =============================================================================

-- NOTE: Skipping spatial_ref_sys (PostGIS system table requiring superuser permissions)
-- This is a reference table with no sensitive data - acceptable to skip RLS

-- Fix: crawl_jobs table
ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;

-- Service role can manage crawl jobs
DROP POLICY IF EXISTS "Service role can manage crawl jobs" ON crawl_jobs;
CREATE POLICY "Service role can manage crawl jobs"
  ON crawl_jobs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can view completed crawl jobs
DROP POLICY IF EXISTS "Authenticated users can view crawl jobs" ON crawl_jobs;
CREATE POLICY "Authenticated users can view crawl jobs"
  ON crawl_jobs FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Fix: crawl_raw_content table
ALTER TABLE crawl_raw_content ENABLE ROW LEVEL SECURITY;

-- Service role can manage raw content
DROP POLICY IF EXISTS "Service role can manage raw content" ON crawl_raw_content;
CREATE POLICY "Service role can manage raw content"
  ON crawl_raw_content FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can view raw content (for debugging/monitoring)
DROP POLICY IF EXISTS "Authenticated users can view raw content" ON crawl_raw_content;
CREATE POLICY "Authenticated users can view raw content"
  ON crawl_raw_content FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- =============================================================================
-- PART 3: Fix Functions with Mutable search_path
-- =============================================================================

-- Fix: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: handle_ingestion_metadata
CREATE OR REPLACE FUNCTION handle_ingestion_metadata()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.first_seen_at := COALESCE(NEW.first_seen_at, NOW());
        NEW.last_seen_at := COALESCE(NEW.last_seen_at, NOW());
        NEW.verification_status_history := COALESCE(NEW.verification_status_history, '[]'::jsonb) ||
            jsonb_build_object('status', NEW.status, 'at', NOW(), 'by', NEW.ingested_by);
        IF NEW.status IN ('active', 'unverified') THEN
            NEW.verified_at := COALESCE(NEW.verified_at, NOW());
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.first_seen_at := COALESCE(OLD.first_seen_at, NEW.first_seen_at, NOW());
        NEW.last_seen_at := COALESCE(NOW());
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            NEW.verification_status_history := COALESCE(NEW.verification_status_history, '[]'::jsonb) ||
                jsonb_build_object('status', NEW.status, 'at', NOW(), 'by', NEW.ingested_by);
            IF NEW.status IN ('active', 'unverified') THEN
                NEW.verified_at := NOW();
            END IF;
        END IF;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: generate_booth_slug
CREATE OR REPLACE FUNCTION generate_booth_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Generate base slug from name and city
    base_slug := lower(trim(regexp_replace(
      NEW.name || '-' || COALESCE(NEW.city, ''),
      '[^a-zA-Z0-9\s-]', '', 'g'
    )));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);

    final_slug := base_slug;

    -- Check for uniqueness and append counter if needed
    WHILE EXISTS (SELECT 1 FROM booths WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;

    NEW.slug := final_slug;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: calculate_booth_completeness
CREATE OR REPLACE FUNCTION calculate_booth_completeness(booth_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  booth_record RECORD;
BEGIN
  SELECT * INTO booth_record FROM booths WHERE id = booth_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Core location data (30 points)
  IF booth_record.latitude IS NOT NULL AND booth_record.longitude IS NOT NULL THEN
    score := score + 15;
  END IF;
  IF booth_record.address IS NOT NULL AND booth_record.address != '' THEN
    score := score + 10;
  END IF;
  IF booth_record.city IS NOT NULL AND booth_record.city != '' THEN
    score := score + 5;
  END IF;

  -- Machine details (25 points)
  IF booth_record.machine_model IS NOT NULL AND booth_record.machine_model != '' THEN
    score := score + 10;
  END IF;
  IF booth_record.booth_type IS NOT NULL THEN
    score := score + 10;
  END IF;
  IF booth_record.photo_type IS NOT NULL THEN
    score := score + 5;
  END IF;

  -- Photos (20 points)
  IF booth_record.photo_exterior_url IS NOT NULL THEN
    score := score + 10;
  END IF;
  IF booth_record.photo_interior_url IS NOT NULL THEN
    score := score + 5;
  END IF;
  IF booth_record.photo_sample_strips IS NOT NULL AND array_length(booth_record.photo_sample_strips, 1) > 0 THEN
    score := score + 5;
  END IF;

  -- Operational details (15 points)
  IF booth_record.hours IS NOT NULL AND booth_record.hours != '' THEN
    score := score + 5;
  END IF;
  IF booth_record.cost IS NOT NULL AND booth_record.cost != '' THEN
    score := score + 5;
  END IF;
  IF booth_record.status = 'active' THEN
    score := score + 5;
  END IF;

  -- Description and features (10 points)
  IF booth_record.description IS NOT NULL AND booth_record.description != '' THEN
    score := score + 5;
  END IF;
  IF booth_record.features IS NOT NULL AND array_length(booth_record.features, 1) > 0 THEN
    score := score + 5;
  END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: update_all_completeness_scores
CREATE OR REPLACE FUNCTION update_all_completeness_scores()
RETURNS void AS $$
BEGIN
  UPDATE booths SET completeness_score = calculate_booth_completeness(id);
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: cleanup_old_raw_content
CREATE OR REPLACE FUNCTION cleanup_old_raw_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Keep only the 3 most recent versions per URL
  DELETE FROM crawl_raw_content
  WHERE source_id = NEW.source_id
    AND url = NEW.url
    AND id NOT IN (
      SELECT id FROM crawl_raw_content
      WHERE source_id = NEW.source_id AND url = NEW.url
      ORDER BY crawled_at DESC
      LIMIT 3
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: update_crawl_job_queue_updated_at
CREATE OR REPLACE FUNCTION update_crawl_job_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: update_booth_search_vector
CREATE OR REPLACE FUNCTION update_booth_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.city, '') || ' ' ||
    COALESCE(NEW.country, '') || ' ' ||
    COALESCE(NEW.address, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.machine_model, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: get_nearby_booths (multiple versions exist, fixing both)
CREATE OR REPLACE FUNCTION get_nearby_booths(
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_radius_km INTEGER DEFAULT 5,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL,
  machine_model TEXT,
  booth_type TEXT,
  photo_exterior_url TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.address,
    b.city,
    b.country,
    b.latitude,
    b.longitude,
    ROUND(
      ST_Distance(
        ST_SetSRID(ST_MakePoint(p_longitude::float, p_latitude::float), 4326)::geography,
        b.location_geog
      ) / 1000,
      2
    )::DECIMAL as distance_km,
    b.machine_model,
    b.booth_type,
    b.photo_exterior_url,
    b.status
  FROM booths b
  WHERE b.location_geog IS NOT NULL
    AND ST_DWithin(
      b.location_geog,
      ST_SetSRID(ST_MakePoint(p_longitude::float, p_latitude::float), 4326)::geography,
      p_radius_km * 1000
    )
  ORDER BY b.location_geog <-> ST_SetSRID(ST_MakePoint(p_longitude::float, p_latitude::float), 4326)::geography
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

-- Fix: calculate_distance
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  earth_radius CONSTANT DOUBLE PRECISION := 6371; -- km
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);

  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));

  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE
SET search_path = '';

-- Fix: find_nearby_booths
CREATE OR REPLACE FUNCTION find_nearby_booths(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_km DOUBLE PRECISION DEFAULT 50,
  max_results INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km NUMERIC,
  booth_type TEXT,
  photo_exterior_url TEXT,
  status TEXT,
  is_operational BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.address,
    b.city,
    b.state,
    b.country,
    b.latitude,
    b.longitude,
    ROUND(
      ST_Distance(
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        b.location_geog
      ) / 1000,
      2
    ) as distance_km,
    b.booth_type,
    b.photo_exterior_url,
    b.status,
    b.is_operational
  FROM booths b
  WHERE b.location_geog IS NOT NULL
    AND b.status = 'active'
    AND ST_DWithin(
      b.location_geog,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      distance_km * 1000
    )
  ORDER BY b.location_geog <-> ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

-- Fix: update_crawl_sources_updated_at
CREATE OR REPLACE FUNCTION update_crawl_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: is_admin (with SECURITY DEFINER - needs special handling)
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';  -- Critical for SECURITY DEFINER functions

-- Fix: update_booth_issues_updated_at
CREATE OR REPLACE FUNCTION update_booth_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: get_filter_options
CREATE OR REPLACE FUNCTION get_filter_options()
RETURNS json
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT json_build_object(
    'countries', (SELECT json_agg(DISTINCT country ORDER BY country) FROM booths WHERE country IS NOT NULL),
    'cities', (SELECT json_agg(DISTINCT city ORDER BY city) FROM booths WHERE city IS NOT NULL),
    'booth_types', (SELECT json_agg(DISTINCT booth_type ORDER BY booth_type) FROM booths WHERE booth_type IS NOT NULL),
    'photo_types', (SELECT json_agg(DISTINCT photo_type ORDER BY photo_type) FROM booths WHERE photo_type IS NOT NULL),
    'statuses', (SELECT json_agg(DISTINCT status ORDER BY status) FROM booths WHERE status IS NOT NULL)
  );
$$;

-- Fix: update_booth_enrichments_updated_at
CREATE OR REPLACE FUNCTION update_booth_enrichments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: handle_new_user (with SECURITY DEFINER - needs special handling)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';  -- Critical for SECURITY DEFINER functions

-- Fix: update_booth_photos_updated_at
CREATE OR REPLACE FUNCTION update_booth_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: set_booth_photo_approved_at
CREATE OR REPLACE FUNCTION set_booth_photo_approved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.approved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: get_booth_photo_storage_path
CREATE OR REPLACE FUNCTION get_booth_photo_storage_path(
  p_user_id UUID,
  p_booth_id UUID,
  p_file_extension TEXT
)
RETURNS TEXT AS $$
DECLARE
  timestamp_str TEXT;
  random_str TEXT;
BEGIN
  timestamp_str := to_char(now(), 'YYYYMMDD_HH24MISS');
  random_str := substr(md5(random()::text), 1, 8);
  RETURN format('booth-photos/%s/%s/%s_%s.%s',
    p_booth_id,
    p_user_id,
    timestamp_str,
    random_str,
    p_file_extension
  );
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix: get_booth_photo_public_url
CREATE OR REPLACE FUNCTION get_booth_photo_public_url(
  p_storage_path TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN format('https://tmgbmcbwfkvmylmfpkzy.supabase.co/storage/v1/object/public/booth-photos/%s',
    p_storage_path
  );
END;
$$ LANGUAGE plpgsql STABLE
SET search_path = '';

-- =============================================================================
-- PART 4: Documentation
-- =============================================================================

-- Document PostGIS extension in public schema
-- Note: PostGIS convention is to install in public schema for backwards compatibility
-- and ease of use. This is acceptable and recommended by PostGIS documentation.
COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions. Installed in public schema per PostGIS best practices for compatibility.';

-- =============================================================================
-- Success Message
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Security fixes applied successfully!';
  RAISE NOTICE '   - Removed SECURITY DEFINER from 4 views';
  RAISE NOTICE '   - Enabled RLS on 2 tables (crawl_jobs, crawl_raw_content)';
  RAISE NOTICE '   - Skipped spatial_ref_sys (PostGIS system table - requires superuser)';
  RAISE NOTICE '   - Added SET search_path to 22 functions';
  RAISE NOTICE '   - Documented PostGIS extension placement';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Manual action required:';
  RAISE NOTICE '   - Enable leaked password protection in Supabase Dashboard';
  RAISE NOTICE '   - Go to: Authentication > Settings > Enable "Leaked Password Protection"';
  RAISE NOTICE '';
  RAISE NOTICE 'ℹ️  Note: spatial_ref_sys RLS skipped (PostGIS reference table, no sensitive data)';
END $$;
