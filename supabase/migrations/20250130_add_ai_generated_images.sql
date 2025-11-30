-- Add AI-generated image columns to booths table
ALTER TABLE booths
ADD COLUMN IF NOT EXISTS ai_generated_image_url TEXT,
ADD COLUMN IF NOT EXISTS ai_image_prompt TEXT,
ADD COLUMN IF NOT EXISTS ai_image_generated_at TIMESTAMPTZ;

-- Create index for booths with AI images
CREATE INDEX IF NOT EXISTS idx_booths_ai_generated
ON booths(ai_generated_image_url)
WHERE ai_generated_image_url IS NOT NULL;

-- Create storage bucket for booth images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('booth-images', 'booth-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set storage policies for booth-images bucket
CREATE POLICY IF NOT EXISTS "Public Access for booth-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'booth-images' );

CREATE POLICY IF NOT EXISTS "Authenticated users can upload booth images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'booth-images'
  AND auth.role() = 'service_role'
);

CREATE POLICY IF NOT EXISTS "Service role can update booth images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'booth-images' AND auth.role() = 'service_role' );

CREATE POLICY IF NOT EXISTS "Service role can delete booth images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'booth-images' AND auth.role() = 'service_role' );
