-- =====================================================
-- Common Queries for Community Photos Feature
-- Quick reference for developers and admins
-- =====================================================

-- ========================================
-- MODERATION QUERIES
-- ========================================

-- Get all pending photos for moderation
SELECT * FROM booth_photos_moderation_queue;

-- Count pending photos by type
SELECT
  photo_type,
  COUNT(*) as count
FROM booth_photos
WHERE status = 'pending'
GROUP BY photo_type
ORDER BY count DESC;

-- Approve a photo
UPDATE booth_photos
SET status = 'approved'
WHERE id = 'YOUR_PHOTO_ID_HERE';
-- Note: approved_at and approved_by set automatically by trigger

-- Reject a photo
UPDATE booth_photos
SET status = 'rejected'
WHERE id = 'YOUR_PHOTO_ID_HERE';

-- Get recently approved photos
SELECT
  bp.*,
  b.name as booth_name,
  b.city
FROM booth_photos bp
JOIN booths b ON bp.booth_id = b.id
WHERE bp.status = 'approved'
  AND bp.approved_at > NOW() - INTERVAL '7 days'
ORDER BY bp.approved_at DESC;

-- ========================================
-- STATISTICS QUERIES
-- ========================================

-- Overall photo statistics
SELECT
  COUNT(*) as total_photos,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
  COUNT(DISTINCT booth_id) as booths_with_photos,
  COUNT(DISTINCT user_id) as unique_contributors
FROM booth_photos;

-- Photos per booth (top 20)
SELECT
  b.name,
  b.city,
  b.country,
  bps.total_photos,
  bps.approved_photos,
  bps.pending_photos
FROM booth_photo_stats bps
JOIN booths b ON bps.booth_id = b.id
ORDER BY bps.total_photos DESC
LIMIT 20;

-- Most active contributors
SELECT
  p.full_name,
  p.email,
  COUNT(*) as total_uploads,
  COUNT(*) FILTER (WHERE bp.status = 'approved') as approved,
  COUNT(*) FILTER (WHERE bp.status = 'rejected') as rejected,
  MAX(bp.created_at) as last_upload
FROM booth_photos bp
JOIN profiles p ON bp.user_id = p.id
WHERE bp.user_id IS NOT NULL
GROUP BY p.id, p.full_name, p.email
ORDER BY total_uploads DESC
LIMIT 20;

-- Photos by type breakdown
SELECT
  photo_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'pending') as pending
FROM booth_photos
GROUP BY photo_type
ORDER BY total DESC;

-- Daily upload trends (last 30 days)
SELECT
  DATE(created_at) as date,
  COUNT(*) as uploads,
  COUNT(*) FILTER (WHERE status = 'approved') as approved
FROM booth_photos
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ========================================
-- USER QUERIES
-- ========================================

-- Get user's upload history
SELECT
  bp.*,
  b.name as booth_name,
  b.city
FROM booth_photos bp
JOIN booths b ON bp.booth_id = b.id
WHERE bp.user_id = 'YOUR_USER_ID_HERE'
ORDER BY bp.created_at DESC;

-- Get user's pending submissions
SELECT * FROM booth_photos
WHERE user_id = 'YOUR_USER_ID_HERE'
  AND status = 'pending'
ORDER BY created_at DESC;

-- ========================================
-- BOOTH QUERIES
-- ========================================

-- Get all approved photos for a booth
SELECT *
FROM booth_photos
WHERE booth_id = 'YOUR_BOOTH_ID_HERE'
  AND status = 'approved'
ORDER BY created_at DESC;

-- Get booth photo statistics
SELECT * FROM booth_photo_stats
WHERE booth_id = 'YOUR_BOOTH_ID_HERE';

-- Booths without community photos
SELECT
  b.id,
  b.name,
  b.city,
  b.country
FROM booths b
LEFT JOIN booth_photos bp ON b.id = bp.booth_id AND bp.status = 'approved'
WHERE bp.id IS NULL
  AND b.status = 'active'
ORDER BY b.rating_average DESC NULLS LAST
LIMIT 50;

-- Booths with most community engagement (photos + variety)
SELECT
  b.name,
  b.city,
  bps.total_photos,
  bps.unique_contributors,
  (bps.exterior_photos > 0)::int +
  (bps.interior_photos > 0)::int +
  (bps.strip_photos > 0)::int as photo_variety_score
FROM booth_photo_stats bps
JOIN booths b ON bps.booth_id = b.id
WHERE bps.approved_photos > 0
ORDER BY bps.total_photos DESC, photo_variety_score DESC
LIMIT 20;

-- ========================================
-- QUALITY CONTROL QUERIES
-- ========================================

-- Find users with high rejection rate (potential spam)
SELECT
  p.email,
  COUNT(*) as total_uploads,
  COUNT(*) FILTER (WHERE bp.status = 'rejected') as rejected,
  ROUND(COUNT(*) FILTER (WHERE bp.status = 'rejected')::numeric / COUNT(*) * 100, 2) as rejection_rate
FROM booth_photos bp
JOIN profiles p ON bp.user_id = p.id
WHERE bp.user_id IS NOT NULL
GROUP BY p.id, p.email
HAVING COUNT(*) >= 5
  AND COUNT(*) FILTER (WHERE bp.status = 'rejected')::numeric / COUNT(*) > 0.5
ORDER BY rejection_rate DESC;

-- Find duplicate uploads (same user, booth, and day)
SELECT
  user_id,
  booth_id,
  DATE(created_at) as upload_date,
  COUNT(*) as uploads
FROM booth_photos
WHERE user_id IS NOT NULL
GROUP BY user_id, booth_id, DATE(created_at)
HAVING COUNT(*) > 3
ORDER BY uploads DESC;

-- Photos pending for too long (>7 days)
SELECT
  bp.*,
  b.name as booth_name,
  EXTRACT(DAY FROM NOW() - bp.created_at) as days_pending
FROM booth_photos bp
JOIN booths b ON bp.booth_id = b.id
WHERE bp.status = 'pending'
  AND bp.created_at < NOW() - INTERVAL '7 days'
ORDER BY bp.created_at ASC;

-- ========================================
-- CLEANUP QUERIES (USE WITH CAUTION!)
-- ========================================

-- Delete rejected photos older than 30 days
-- DELETE FROM booth_photos
-- WHERE status = 'rejected'
--   AND created_at < NOW() - INTERVAL '30 days';

-- Remove orphaned photos (booths deleted)
-- DELETE FROM booth_photos
-- WHERE booth_id NOT IN (SELECT id FROM booths);

-- ========================================
-- PERFORMANCE MONITORING
-- ========================================

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'booth_photos'
ORDER BY idx_scan DESC;

-- Table size and row count
SELECT
  pg_size_pretty(pg_total_relation_size('booth_photos')) as total_size,
  pg_size_pretty(pg_relation_size('booth_photos')) as table_size,
  pg_size_pretty(pg_indexes_size('booth_photos')) as indexes_size,
  (SELECT COUNT(*) FROM booth_photos) as row_count;
