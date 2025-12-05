-- Migration: Add get_nearby_booths function for spatial queries
-- This function finds booths within a specified radius of a given location
-- Uses PostGIS for efficient spatial queries

CREATE OR REPLACE FUNCTION get_nearby_booths(
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_radius_km INTEGER DEFAULT 5,
  p_limit INTEGER DEFAULT 6,
  p_exclude_booth_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  photo_exterior_url TEXT,
  ai_preview_url TEXT,
  ai_generated_image_url TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL,
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
    NULL::TEXT as ai_generated_image_url, -- Field doesn't exist yet
    b.latitude,
    b.longitude,
    ROUND(
      CAST(
        ST_Distance(
          b.location_geog,
          ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        ) / 1000 AS NUMERIC
      ),
      2
    ) AS distance_km,
    b.status,
    b.booth_type,
    b.machine_model,
    b.cost
  FROM booths b
  WHERE
    b.id != COALESCE(p_exclude_booth_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND b.status = 'active'
    AND b.location_geog IS NOT NULL
    AND ST_DWithin(
      b.location_geog,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      p_radius_km * 1000
    )
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_nearby_booths TO authenticated, anon;

-- Create an index on location_geog if it doesn't exist (for performance)
-- This should already exist from the main schema, but we ensure it here
CREATE INDEX IF NOT EXISTS booths_location_geog_idx ON booths USING GIST(location_geog);
