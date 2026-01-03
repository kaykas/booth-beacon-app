-- =====================================================
-- Storage Bucket Configuration for Community Photos
-- Date: 2026-01-02
-- Purpose: Configure storage bucket and policies for photo uploads
-- =====================================================

-- Create storage bucket for community photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'booth-community-photos',
  'booth-community-photos',
  true, -- Public bucket (approved photos will be visible)
  5242880, -- 5MB file size limit (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ========================================
-- STORAGE RLS POLICIES
-- ========================================

-- Policy: Authenticated users can upload photos
CREATE POLICY "booth_photos_upload_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'booth-community-photos'
  AND (storage.foldername(name))[1] IN ('uploads', 'thumbnails')
);

-- Policy: Anyone can view approved photos (public bucket)
CREATE POLICY "booth_photos_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'booth-community-photos');

-- Policy: Users can update their own uploads (within 24 hours)
CREATE POLICY "booth_photos_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'booth-community-photos'
  AND auth.uid()::text = (storage.foldername(name))[2] -- Second folder level is user_id
  AND created_at > NOW() - INTERVAL '24 hours'
);

-- Policy: Users can delete their own uploads (within 24 hours)
CREATE POLICY "booth_photos_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'booth-community-photos'
  AND auth.uid()::text = (storage.foldername(name))[2] -- Second folder level is user_id
  AND created_at > NOW() - INTERVAL '24 hours'
);

-- Policy: Admins can update any photo (for moderation)
CREATE POLICY "booth_photos_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'booth-community-photos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Admins can delete any photo (for moderation)
CREATE POLICY "booth_photos_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'booth-community-photos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to generate storage path for user uploads
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
  timestamp_str := TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');
  random_str := SUBSTR(MD5(RANDOM()::TEXT), 1, 8);
  
  RETURN FORMAT(
    'uploads/%s/%s/%s_%s.%s',
    p_user_id,
    p_booth_id,
    timestamp_str,
    random_str,
    p_file_extension
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get public URL for storage object
CREATE OR REPLACE FUNCTION get_booth_photo_public_url(
  p_storage_path TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN FORMAT(
    'https://tmgbmcbwfkvmylmfpkzy.supabase.co/storage/v1/object/public/booth-community-photos/%s',
    p_storage_path
  );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON FUNCTION get_booth_photo_storage_path IS 'Generate unique storage path for booth photo uploads';
COMMENT ON FUNCTION get_booth_photo_public_url IS 'Generate public URL for stored booth photo';
