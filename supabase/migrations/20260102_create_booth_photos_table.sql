-- =====================================================
-- Community Photo Uploads System
-- Date: 2026-01-02
-- Purpose: Allow community to upload and share booth photos
-- =====================================================

-- Create booth_photos table for community submissions
CREATE TABLE IF NOT EXISTS booth_photos (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for anonymous uploads

  -- Photo URLs
  photo_url TEXT NOT NULL, -- Full URL to storage
  thumbnail_url TEXT, -- Optional smaller version

  -- Photo metadata
  photo_type TEXT NOT NULL CHECK (photo_type IN (
    'exterior',
    'interior',
    'strips',
    'other'
  )),
  notes TEXT, -- Optional user notes about the photo

  -- Moderation
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'rejected'
  )),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- INDEXES
-- ========================================

-- Index on booth_id for fast lookup of booth photos
CREATE INDEX idx_booth_photos_booth_id ON booth_photos(booth_id);

-- Index on status for moderation queue queries
CREATE INDEX idx_booth_photos_status ON booth_photos(status);

-- Index on user_id for user's submissions (only where user_id is not null)
CREATE INDEX idx_booth_photos_user_id ON booth_photos(user_id) WHERE user_id IS NOT NULL;

-- Composite index for approved photos by booth (most common query)
CREATE INDEX idx_booth_photos_approved_booth ON booth_photos(booth_id, status) WHERE status = 'approved';

-- Index for sorting by creation date
CREATE INDEX idx_booth_photos_created_at ON booth_photos(created_at DESC);

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE booth_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can INSERT their own photos
CREATE POLICY "booth_photos_insert_authenticated" ON booth_photos
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (auth.uid() = user_id OR user_id IS NULL)
  );

-- Policy: Anyone can SELECT approved photos (public access)
CREATE POLICY "booth_photos_select_approved" ON booth_photos
  FOR SELECT
  USING (status = 'approved');

-- Policy: Users can SELECT their own photos (any status)
CREATE POLICY "booth_photos_select_own" ON booth_photos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can SELECT all photos (for moderation)
CREATE POLICY "booth_photos_select_admin" ON booth_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policy: Admins can UPDATE status (for approval/rejection)
CREATE POLICY "booth_photos_update_admin" ON booth_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policy: Users can UPDATE their own pending photos (within 24 hours)
CREATE POLICY "booth_photos_update_own_pending" ON booth_photos
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status = 'pending'
    AND created_at > NOW() - INTERVAL '24 hours'
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Policy: Users can DELETE their own pending photos (within 24 hours)
CREATE POLICY "booth_photos_delete_own_pending" ON booth_photos
  FOR DELETE
  USING (
    auth.uid() = user_id
    AND status = 'pending'
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- ========================================
-- TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_booth_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER booth_photos_updated_at
  BEFORE UPDATE ON booth_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_booth_photos_updated_at();

-- Function to set approved_at when status changes to approved
CREATE OR REPLACE FUNCTION set_booth_photo_approved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.approved_at = NOW();
    NEW.approved_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set approved_at
CREATE TRIGGER booth_photos_set_approved_at
  BEFORE UPDATE ON booth_photos
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION set_booth_photo_approved_at();

-- ========================================
-- VIEWS
-- ========================================

-- View for moderation queue (pending photos)
CREATE OR REPLACE VIEW booth_photos_moderation_queue AS
SELECT
  bp.*,
  b.name as booth_name,
  b.city as booth_city,
  b.country as booth_country,
  p.email as user_email,
  p.full_name as user_name
FROM booth_photos bp
JOIN booths b ON bp.booth_id = b.id
LEFT JOIN profiles p ON bp.user_id = p.id
WHERE bp.status = 'pending'
ORDER BY bp.created_at ASC;

-- Grant access to view
GRANT SELECT ON booth_photos_moderation_queue TO authenticated;

-- View for booth photo statistics
CREATE OR REPLACE VIEW booth_photo_stats AS
SELECT
  booth_id,
  COUNT(*) as total_photos,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_photos,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_photos,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_photos,
  COUNT(*) FILTER (WHERE photo_type = 'exterior') as exterior_photos,
  COUNT(*) FILTER (WHERE photo_type = 'interior') as interior_photos,
  COUNT(*) FILTER (WHERE photo_type = 'strips') as strip_photos,
  COUNT(DISTINCT user_id) as unique_contributors,
  MAX(created_at) as last_photo_at
FROM booth_photos
GROUP BY booth_id;

-- Grant access to view
GRANT SELECT ON booth_photo_stats TO authenticated, anon;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE booth_photos IS 'Community-uploaded photos for photo booths';
COMMENT ON COLUMN booth_photos.photo_type IS 'Type of photo: exterior (outside), interior (inside booth), strips (sample photos), other';
COMMENT ON COLUMN booth_photos.status IS 'Moderation status: pending (awaiting review), approved (visible to all), rejected (hidden)';
COMMENT ON COLUMN booth_photos.user_id IS 'User who uploaded the photo, NULL for anonymous uploads';
COMMENT ON COLUMN booth_photos.notes IS 'Optional user notes about the photo';
