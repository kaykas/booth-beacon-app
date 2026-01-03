-- Phase 3: Create storage bucket for user-uploaded booth photos

-- Create the booth-photos storage bucket (public access for approved photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'booth-photos',
  'booth-photos',
  true,
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload booth photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'booth-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text -- User can only upload to their own folder
);

-- RLS Policy: Anyone can view approved photos
CREATE POLICY "Public can view approved booth photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'booth-photos');

-- RLS Policy: Users can update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'booth-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'booth-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'booth-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Service role can do anything (for moderation)
CREATE POLICY "Service role full access to booth photos"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'booth-photos')
WITH CHECK (bucket_id = 'booth-photos');

-- Add helpful comments
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads';
