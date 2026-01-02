-- Migration: Add get_filter_options RPC function for efficient filter options retrieval
-- This function returns all unique cities, countries, and machine models in a single query
-- It's much more efficient than running 3 separate SELECT DISTINCT queries

CREATE OR REPLACE FUNCTION get_filter_options()
RETURNS json
LANGUAGE sql
STABLE
AS $$
  SELECT json_build_object(
    'cities', (
      SELECT json_agg(DISTINCT city ORDER BY city)
      FROM booths
      WHERE city IS NOT NULL
    ),
    'countries', (
      SELECT json_agg(DISTINCT country ORDER BY country)
      FROM booths
      WHERE country IS NOT NULL
    ),
    'machineModels', (
      SELECT json_agg(DISTINCT machine_model ORDER BY machine_model)
      FROM booths
      WHERE machine_model IS NOT NULL
    )
  );
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_filter_options() TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION get_filter_options() IS 'Returns unique filter options for the search page in a single query';
