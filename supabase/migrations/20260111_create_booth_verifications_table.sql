-- Booth Verifications Table Migration
-- Adds crowd-sourced booth verification system

-- Create verification types enum-like check
-- verification_type: 'working' | 'not_working' | 'closed' | 'moved'

CREATE TABLE IF NOT EXISTS booth_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booth_id UUID REFERENCES booths(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('working', 'not_working', 'closed', 'moved')),
  notes TEXT,
  photo_url TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata for tracking
  ip_hash TEXT, -- Hashed IP for spam prevention (not raw IP for privacy)
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE booth_verifications ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can read verifications (public data)
CREATE POLICY "Verifications are viewable by everyone"
  ON booth_verifications FOR SELECT
  USING (true);

-- Authenticated users can create verifications
CREATE POLICY "Authenticated users can create verifications"
  ON booth_verifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow anonymous verifications with service role (handled by API)
CREATE POLICY "Service role can create verifications"
  ON booth_verifications FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Users can update/delete their own verifications
CREATE POLICY "Users can update own verifications"
  ON booth_verifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own verifications"
  ON booth_verifications FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX booth_verifications_booth_id_idx ON booth_verifications(booth_id);
CREATE INDEX booth_verifications_verified_at_idx ON booth_verifications(verified_at DESC);
CREATE INDEX booth_verifications_type_idx ON booth_verifications(verification_type);
CREATE INDEX booth_verifications_booth_verified_idx ON booth_verifications(booth_id, verified_at DESC);

-- Create function to get latest verification for a booth
CREATE OR REPLACE FUNCTION get_latest_verification(p_booth_id UUID)
RETURNS TABLE (
  id UUID,
  booth_id UUID,
  verification_type TEXT,
  notes TEXT,
  photo_url TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bv.id,
    bv.booth_id,
    bv.verification_type,
    bv.notes,
    bv.photo_url,
    bv.verified_at,
    bv.created_at
  FROM booth_verifications bv
  WHERE bv.booth_id = p_booth_id
  ORDER BY bv.verified_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get verification summary for a booth
CREATE OR REPLACE FUNCTION get_verification_summary(p_booth_id UUID)
RETURNS TABLE (
  total_verifications BIGINT,
  working_count BIGINT,
  not_working_count BIGINT,
  closed_count BIGINT,
  moved_count BIGINT,
  last_verified_at TIMESTAMPTZ,
  last_verification_type TEXT,
  days_since_verification INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_verifications,
    COUNT(*) FILTER (WHERE bv.verification_type = 'working') as working_count,
    COUNT(*) FILTER (WHERE bv.verification_type = 'not_working') as not_working_count,
    COUNT(*) FILTER (WHERE bv.verification_type = 'closed') as closed_count,
    COUNT(*) FILTER (WHERE bv.verification_type = 'moved') as moved_count,
    MAX(bv.verified_at) as last_verified_at,
    (SELECT bv2.verification_type FROM booth_verifications bv2 WHERE bv2.booth_id = p_booth_id ORDER BY bv2.verified_at DESC LIMIT 1) as last_verification_type,
    EXTRACT(DAY FROM NOW() - MAX(bv.verified_at))::INTEGER as days_since_verification
  FROM booth_verifications bv
  WHERE bv.booth_id = p_booth_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get verification history for a booth
CREATE OR REPLACE FUNCTION get_verification_history(p_booth_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  verification_type TEXT,
  notes TEXT,
  photo_url TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bv.id,
    bv.verification_type,
    bv.notes,
    bv.photo_url,
    bv.verified_at,
    bv.created_at
  FROM booth_verifications bv
  WHERE bv.booth_id = p_booth_id
  ORDER BY bv.verified_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_latest_verification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_verification(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_verification_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_verification_summary(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_verification_history(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_verification_history(UUID, INTEGER) TO anon;

-- Update booths table to track last community verification
-- This allows for efficient queries without joining every time
ALTER TABLE booths ADD COLUMN IF NOT EXISTS last_community_verified_at TIMESTAMPTZ;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS last_community_verification_type TEXT CHECK (last_community_verification_type IN ('working', 'not_working', 'closed', 'moved'));

-- Create trigger to update booth when verification is added
CREATE OR REPLACE FUNCTION update_booth_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE booths
  SET
    last_community_verified_at = NEW.verified_at,
    last_community_verification_type = NEW.verification_type,
    updated_at = NOW()
  WHERE id = NEW.booth_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_booth_verification
  AFTER INSERT ON booth_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_booth_verification_status();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Booth verifications table created successfully!';
END $$;
