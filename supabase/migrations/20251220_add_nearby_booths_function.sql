-- Add get_nearby_booths RPC function for geographic proximity search
-- Migration: 20251220_add_nearby_booths_function.sql

-- Function to calculate distance between two lat/lng points using Haversine formula
-- Returns distance in kilometers
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  R CONSTANT DOUBLE PRECISION := 6371; -- Earth's radius in km
  dLat DOUBLE PRECISION;
  dLon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  -- Convert degrees to radians
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);

  -- Haversine formula
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));

  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get nearby booths within a radius
-- Returns booths sorted by distance from the given coordinates
CREATE OR REPLACE FUNCTION get_nearby_booths(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 25,
  p_limit INTEGER DEFAULT 6,
  p_exclude_booth_id UUID DEFAULT NULL
) RETURNS TABLE(
  id UUID,
  name TEXT,
  slug TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  photo_exterior_url TEXT,
  ai_preview_url TEXT,
  ai_generated_image_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION,
  status TEXT,
  booth_type TEXT,
  machine_model TEXT,
  cost TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.slug,
    b.city,
    b.state,
    b.country,
    b.photo_exterior_url,
    b.ai_preview_url,
    b.ai_generated_image_url,
    b.latitude::DOUBLE PRECISION,
    b.longitude::DOUBLE PRECISION,
    calculate_distance(p_latitude, p_longitude, b.latitude::DOUBLE PRECISION, b.longitude::DOUBLE PRECISION) AS distance_km,
    b.status,
    b.booth_type,
    b.machine_model,
    b.cost
  FROM booths b
  WHERE
    b.latitude IS NOT NULL
    AND b.longitude IS NOT NULL
    AND b.status = 'active'
    AND b.is_operational = true
    AND b.name != 'N/A' -- Exclude invalid extraction failures
    AND (p_exclude_booth_id IS NULL OR b.id != p_exclude_booth_id)
    AND calculate_distance(p_latitude, p_longitude, b.latitude, b.longitude) <= p_radius_km
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION calculate_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_nearby_booths(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, UUID) TO authenticated, anon;

-- Add comment for documentation
COMMENT ON FUNCTION get_nearby_booths IS 'Returns booths within specified radius (km) of given coordinates, sorted by distance. Excludes closed/invalid booths.';
