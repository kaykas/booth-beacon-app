-- Migration: Add photo_type and notes columns to booth_user_photos table
-- Description: Add fields for better photo categorization and user context
-- Date: 2026-01-03

-- Add photo_type column to categorize uploads
ALTER TABLE booth_user_photos
ADD COLUMN IF NOT EXISTS photo_type TEXT CHECK (photo_type IN ('exterior', 'interior', 'strips', 'other'));

-- Add notes column for user-provided context
ALTER TABLE booth_user_photos
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for filtering by photo type
CREATE INDEX IF NOT EXISTS idx_booth_user_photos_type ON booth_user_photos(photo_type);

-- Comment on new columns
COMMENT ON COLUMN booth_user_photos.photo_type IS 'Type of photo: exterior, interior, strips, or other';
COMMENT ON COLUMN booth_user_photos.notes IS 'User-provided notes or context about the photo';
