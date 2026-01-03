-- Check existing indices on booths table
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'booths'
  AND schemaname = 'public'
ORDER BY indexname;
