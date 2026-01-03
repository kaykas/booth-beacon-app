-- Migration: Fix get_nearby_booths to support excluding current booth
-- Date: 2026-01-03-- Drop and recreate with exclude parameter
DROP FUNCTION IF EXISTS get_nearby_booths(DECIMAL, DECIMAL, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_nearby_booths(
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_radius_km INTEGER DEFAULT 5,
  p_limit INTEGER DEFAULT 10,
  p_exclude_booth_id UUID DEFAULT NULL
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
    ROUND(ST_Distance(
      ST_SetSRID(ST_MakePoint(p_longitude::float, p_latitude::float), 4326)::geography,
      b.location_geog
    ) / 1000, 2)::DECIMAL as distance_km,
    b.machine_model,
    b.booth_type,
    b.photo_exterior_url,
    b.status
  FROM public.booths b
  WHERE
    b.location_geog IS NOT NULL
    AND ST_DWithin(
      b.location_geog,
      ST_SetSRID(ST_MakePoint(p_longitude::float, p_latitude::float), 4326)::geography,
      p_radius_km * 1000
    )
    -- Exclude the current booth if specified
    AND (p_exclude_booth_id IS NULL OR b.id != p_exclude_booth_id)
  ORDER BY b.location_geog <-> ST_SetSRID(ST_MakePoint(p_longitude::float, p_latitude::float), 4326)::geography
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';
