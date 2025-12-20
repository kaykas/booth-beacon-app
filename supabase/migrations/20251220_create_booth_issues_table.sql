-- =====================================================
-- Booth Issue Reporting System
-- Date: 2025-12-20
-- Purpose: Allow users to report issues with booth data
-- =====================================================

-- Create booth_issues table
CREATE TABLE IF NOT EXISTS booth_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Issue details
  issue_type TEXT NOT NULL CHECK (issue_type IN (
    'closed',
    'incorrect_info',
    'inappropriate_photo',
    'other'
  )),
  description TEXT,

  -- Metadata
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'reviewed',
    'resolved',
    'dismissed'
  )),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,

  -- Admin notes
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for efficient queries
CREATE INDEX idx_booth_issues_booth_id ON booth_issues(booth_id);
CREATE INDEX idx_booth_issues_user_id ON booth_issues(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_booth_issues_status ON booth_issues(status);
CREATE INDEX idx_booth_issues_created_at ON booth_issues(created_at DESC);

-- Enable Row Level Security
ALTER TABLE booth_issues ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read issues (for transparency)
CREATE POLICY "booth_issues_read_all" ON booth_issues
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can create issues
CREATE POLICY "booth_issues_create_authenticated" ON booth_issues
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own issues (for 24 hours)
CREATE POLICY "booth_issues_update_own" ON booth_issues
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND created_at > NOW() - INTERVAL '24 hours'
  )
  WITH CHECK (
    auth.uid() = user_id
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Policy: Admins can update any issue
CREATE POLICY "booth_issues_update_admin" ON booth_issues
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_booth_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER booth_issues_updated_at
  BEFORE UPDATE ON booth_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_booth_issues_updated_at();

-- Create a view for issue statistics per booth
CREATE OR REPLACE VIEW booth_issue_stats AS
SELECT
  booth_id,
  COUNT(*) as total_issues,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_issues,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_issues,
  COUNT(*) FILTER (WHERE issue_type = 'closed') as closed_reports,
  COUNT(*) FILTER (WHERE issue_type = 'incorrect_info') as incorrect_info_reports,
  COUNT(*) FILTER (WHERE issue_type = 'inappropriate_photo') as inappropriate_photo_reports,
  MAX(created_at) as last_issue_created_at
FROM booth_issues
GROUP BY booth_id;

-- Grant access to view
GRANT SELECT ON booth_issue_stats TO authenticated, anon;
