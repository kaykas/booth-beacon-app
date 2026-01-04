-- Create booth_submissions table for pending user submissions
-- This separates user submissions from the main booths table for admin review

CREATE TABLE IF NOT EXISTS booth_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Information
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,

  -- Machine Details
  machine_model TEXT,
  booth_type TEXT CHECK (booth_type IN ('analog', 'chemical', 'digital', 'instant')),
  photo_type TEXT CHECK (photo_type IN ('black-and-white', 'color', 'both')),

  -- Visit Information
  cost TEXT,
  hours TEXT,
  accepts_cash BOOLEAN DEFAULT true,
  accepts_card BOOLEAN DEFAULT false,

  -- Additional Information
  description TEXT,
  photo_url TEXT,

  -- Submission Metadata
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,

  -- Track if approved submission was moved to booths table
  approved_booth_id UUID REFERENCES booths(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE booth_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON booth_submissions FOR SELECT
  USING (auth.uid() = submitted_by);

-- Authenticated users can create submissions
CREATE POLICY "Authenticated users can submit booths"
  ON booth_submissions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = submitted_by);

-- Users can update their own pending submissions
CREATE POLICY "Users can update own pending submissions"
  ON booth_submissions FOR UPDATE
  USING (auth.uid() = submitted_by AND status = 'pending');

-- Admin policies (service role can do everything)
CREATE POLICY "Admins can view all submissions"
  ON booth_submissions FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can update submissions"
  ON booth_submissions FOR UPDATE
  USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX booth_submissions_status_idx ON booth_submissions(status);
CREATE INDEX booth_submissions_submitted_by_idx ON booth_submissions(submitted_by);
CREATE INDEX booth_submissions_submitted_at_idx ON booth_submissions(submitted_at DESC);
CREATE INDEX booth_submissions_pending_idx ON booth_submissions(status, submitted_at DESC) WHERE status = 'pending';

-- Add trigger for updated_at
CREATE TRIGGER update_booth_submissions_updated_at
  BEFORE UPDATE ON booth_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ booth_submissions table created successfully!';
END $$;
