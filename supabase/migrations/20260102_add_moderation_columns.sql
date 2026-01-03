-- Add moderation tracking columns to booth_comments table
ALTER TABLE booth_comments
ADD COLUMN IF NOT EXISTS moderation_status TEXT CHECK (moderation_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add moderation tracking columns to booth_user_photos table (moderated_at and moderated_by only, status already exists)
ALTER TABLE booth_user_photos
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for filtering by moderation status
CREATE INDEX IF NOT EXISTS idx_booth_comments_moderation_status ON booth_comments(moderation_status);
CREATE INDEX IF NOT EXISTS idx_booth_user_photos_moderation_status ON booth_user_photos(moderation_status);

-- Create index for moderation queries
CREATE INDEX IF NOT EXISTS idx_booth_comments_moderated_at ON booth_comments(moderated_at);
CREATE INDEX IF NOT EXISTS idx_booth_user_photos_moderated_at ON booth_user_photos(moderated_at);

-- Update RLS policies for booth_comments to respect moderation status
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON booth_comments;
CREATE POLICY "Approved comments are viewable by everyone"
  ON booth_comments FOR SELECT
  USING (moderation_status = 'approved' OR auth.uid() = user_id);

-- Comment: The booth_user_photos policies are already properly configured in the schema
