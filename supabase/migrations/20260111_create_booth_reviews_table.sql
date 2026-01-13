-- =====================================================
-- BOOTH REVIEWS MIGRATION
-- Creates booth_reviews table for user ratings and reviews
-- Supports anonymous reviews with optional user_id
-- =====================================================

-- Create booth_reviews table
CREATE TABLE IF NOT EXISTS booth_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Rating (1-5 stars)
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

    -- Review content
    review_text TEXT,

    -- Optional photos (array of URLs)
    photos TEXT[] DEFAULT '{}',

    -- Moderation status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    moderation_notes TEXT,

    -- Anonymous reviewer info (when user_id is null)
    anonymous_name TEXT,
    anonymous_email TEXT,

    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booth_reviews_booth_id ON booth_reviews(booth_id);
CREATE INDEX IF NOT EXISTS idx_booth_reviews_user_id ON booth_reviews(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_booth_reviews_status ON booth_reviews(status);
CREATE INDEX IF NOT EXISTS idx_booth_reviews_rating ON booth_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_booth_reviews_created_at ON booth_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booth_reviews_booth_approved ON booth_reviews(booth_id) WHERE status = 'approved';

-- Composite index for booth reviews listing
CREATE INDEX IF NOT EXISTS idx_booth_reviews_booth_status_date
    ON booth_reviews(booth_id, status, created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_booth_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booth_reviews_updated_at_trigger ON booth_reviews;
CREATE TRIGGER booth_reviews_updated_at_trigger
    BEFORE UPDATE ON booth_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_booth_reviews_updated_at();

-- Function to recalculate booth rating stats
CREATE OR REPLACE FUNCTION recalculate_booth_rating(target_booth_id UUID)
RETURNS void AS $$
DECLARE
    avg_rating DECIMAL(2, 1);
    review_count INTEGER;
BEGIN
    -- Calculate average rating and count from approved reviews only
    SELECT
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
        COUNT(*)
    INTO avg_rating, review_count
    FROM booth_reviews
    WHERE booth_id = target_booth_id
      AND status = 'approved';

    -- Update the booth record
    UPDATE booths
    SET
        rating_average = avg_rating,
        rating_count = review_count,
        updated_at = NOW()
    WHERE id = target_booth_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update booth rating when reviews change
CREATE OR REPLACE FUNCTION trigger_recalculate_booth_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT and UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM recalculate_booth_rating(NEW.booth_id);
        RETURN NEW;
    END IF;

    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_booth_rating(OLD.booth_id);
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booth_reviews_rating_trigger ON booth_reviews;
CREATE TRIGGER booth_reviews_rating_trigger
    AFTER INSERT OR UPDATE OF rating, status OR DELETE ON booth_reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_booth_rating();

-- Enable Row Level Security
ALTER TABLE booth_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can read approved reviews
CREATE POLICY "Anyone can read approved reviews" ON booth_reviews
    FOR SELECT USING (status = 'approved');

-- Authenticated users can read their own reviews (any status)
CREATE POLICY "Users can read own reviews" ON booth_reviews
    FOR SELECT USING (auth.uid() = user_id);

-- Anyone can insert reviews (for anonymous reviews)
CREATE POLICY "Anyone can create reviews" ON booth_reviews
    FOR INSERT WITH CHECK (true);

-- Users can update their own pending reviews
CREATE POLICY "Users can update own pending reviews" ON booth_reviews
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own pending reviews
CREATE POLICY "Users can delete own pending reviews" ON booth_reviews
    FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

-- Create view for review statistics per booth
CREATE OR REPLACE VIEW booth_review_stats AS
SELECT
    booth_id,
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_reviews,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_reviews,
    ROUND(AVG(rating) FILTER (WHERE status = 'approved')::numeric, 1) as average_rating,
    COUNT(*) FILTER (WHERE status = 'approved' AND rating = 5) as five_star_count,
    COUNT(*) FILTER (WHERE status = 'approved' AND rating = 4) as four_star_count,
    COUNT(*) FILTER (WHERE status = 'approved' AND rating = 3) as three_star_count,
    COUNT(*) FILTER (WHERE status = 'approved' AND rating = 2) as two_star_count,
    COUNT(*) FILTER (WHERE status = 'approved' AND rating = 1) as one_star_count
FROM booth_reviews
GROUP BY booth_id;

-- Add comments
COMMENT ON TABLE booth_reviews IS 'User reviews and ratings for photo booths';
COMMENT ON COLUMN booth_reviews.rating IS 'Star rating from 1 to 5';
COMMENT ON COLUMN booth_reviews.status IS 'Moderation status: pending, approved, or rejected';
COMMENT ON COLUMN booth_reviews.photos IS 'Array of photo URLs attached to the review';
COMMENT ON COLUMN booth_reviews.helpful_count IS 'Number of users who found this review helpful';
