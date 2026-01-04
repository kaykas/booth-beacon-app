# Booth Submissions Admin Review System

## Overview

A complete admin review system for booth submissions has been implemented. User submissions now go into a separate `booth_submissions` table for admin review before being added to the main `booths` table.

## What Was Changed

### 1. Database Migration (NEW)

**File**: `/Users/jkw/Projects/booth-beacon-app/supabase/migrations/20260103_create_booth_submissions_table.sql`

Creates the `booth_submissions` table with:
- All necessary booth fields (name, address, city, country, etc.)
- Submission metadata (submitted_by, submitted_at, status)
- Review metadata (reviewed_by, reviewed_at, rejection_reason, admin_notes)
- Reference to approved booth (approved_booth_id)
- RLS policies for users and admins
- Performance indexes

**Status values**: `pending`, `approved`, `rejected`

### 2. Submit Form Updated

**File**: `/Users/jkw/Projects/booth-beacon-app/src/app/submit/page.tsx`

**Changes**:
- Now inserts into `booth_submissions` table instead of `booths`
- Uses `useAuth()` to get current user ID
- Sets `status: 'pending'` for all new submissions
- Simplified data structure (removed slug generation, coordinates, etc.)
- Updated success message to mention "pending review"

### 3. Admin Submissions Review Page (NEW)

**File**: `/Users/jkw/Projects/booth-beacon-app/src/app/admin/submissions/page.tsx`

**Features**:
- View all submissions with filter tabs (Pending, Approved, Rejected, All)
- Beautiful card layout showing submission details
- Photo preview for submissions with images
- Approve or Reject buttons for pending submissions
- Modal for review actions with:
  - Rejection reason field (required for rejections)
  - Admin notes field (optional)
- Real-time pending count badge
- Shows submitter email and submission date
- Displays rejection reasons and admin notes for reviewed submissions

### 4. Approve API Endpoint (NEW)

**File**: `/Users/jkw/Projects/booth-beacon-app/src/app/api/admin/submissions/approve/route.ts`

**Functionality**:
- Validates submission exists and is pending
- Generates unique slug for the booth
- Creates new booth in `booths` table with:
  - All submission data
  - `status: 'unverified'` (can be promoted to active later)
  - `ingested_by: 'contributor'`
  - `source_primary: 'user_submission'`
- Updates submission with:
  - `status: 'approved'`
  - `reviewed_at` timestamp
  - `admin_notes` (if provided)
  - `approved_booth_id` reference to created booth

### 5. Reject API Endpoint (NEW)

**File**: `/Users/jkw/Projects/booth-beacon-app/src/app/api/admin/submissions/reject/route.ts`

**Functionality**:
- Validates submission exists and is pending
- Requires rejection reason
- Updates submission with:
  - `status: 'rejected'`
  - `reviewed_at` timestamp
  - `rejection_reason` (required)
  - `admin_notes` (optional)

### 6. Admin Dashboard Updated

**File**: `/Users/jkw/Projects/booth-beacon-app/src/app/admin/page.tsx`

**Changes**:
- Added "Review Submissions" card to primary actions (now 4 cards)
- Shows pending submissions count with blue badge
- Highlights card with blue border when submissions are pending
- Added pending submissions to quick stats bar
- Link to `/admin/submissions` page

## How to Deploy

### Step 1: Apply Database Migration

You need to apply the migration to create the `booth_submissions` table. You have several options:

#### Option A: Using Supabase SQL Editor (RECOMMENDED)
1. Go to https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new
2. Copy the contents of `supabase/migrations/20260103_create_booth_submissions_table.sql`
3. Paste into the SQL editor
4. Click "Run"

#### Option B: Using Supabase CLI
```bash
supabase login
supabase db push --project-ref tmgbmcbwfkvmylmfpkzy
```

#### Option C: Using the provided script
```bash
chmod +x scripts/apply-submissions-table.sh
./scripts/apply-submissions-table.sh
```

### Step 2: Deploy to Vercel

The code changes will be deployed automatically on your next git push to main.

```bash
git add .
git commit -m "Add booth submissions admin review system"
git push origin main
```

### Step 3: Verify Deployment

1. Go to https://booth-beacon.vercel.app/submit
2. Submit a test booth (must be logged in)
3. Go to https://booth-beacon.vercel.app/admin/submissions
4. Verify you can see the submission
5. Test approving and rejecting submissions

## User Flow

### Submitter Flow
1. User visits `/submit`
2. Fills out booth information form
3. Clicks "Submit Booth"
4. Submission goes to `booth_submissions` table with `status: 'pending'`
5. User sees success message: "Your booth submission has been received and is pending review"

### Admin Review Flow
1. Admin visits `/admin` dashboard
2. Sees "Review Submissions" card with pending count
3. Clicks to go to `/admin/submissions`
4. Views all pending submissions in card layout
5. For each submission, admin can:
   - **Approve**: Creates booth in main table, marks submission as approved
   - **Reject**: Marks submission as rejected with reason
6. Submission status updates in real-time

## Benefits

1. **Quality Control**: All user submissions are reviewed before going live
2. **Spam Prevention**: Bad actors can't pollute the main database
3. **Audit Trail**: Complete history of who submitted, reviewed, and why
4. **Better UX**: Users get clear feedback about submission status
5. **Flexible**: Admins can add notes for future reference
6. **Safe**: Original submission data is preserved even after review

## Database Schema

```sql
booth_submissions (
  id uuid PRIMARY KEY,

  -- Booth details
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text,
  country text NOT NULL,
  postal_code text,
  machine_model text,
  booth_type text,
  photo_type text,
  cost text,
  hours text,
  accepts_cash boolean DEFAULT true,
  accepts_card boolean DEFAULT false,
  description text,
  photo_url text,

  -- Submission metadata
  submitted_by uuid REFERENCES auth.users(id),
  submitted_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending', -- pending | approved | rejected

  -- Review metadata
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  admin_notes text,

  -- Reference to approved booth
  approved_booth_id uuid REFERENCES booths(id),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

## RLS Policies

- **Users**: Can view and create their own submissions
- **Admins**: Can view and update all submissions
- **Service Role**: Full access for API operations

## API Endpoints

### POST `/api/admin/submissions/approve`
```json
{
  "submissionId": "uuid",
  "adminNotes": "optional admin notes"
}
```

**Response**:
```json
{
  "success": true,
  "boothId": "uuid",
  "slug": "generated-slug"
}
```

### POST `/api/admin/submissions/reject`
```json
{
  "submissionId": "uuid",
  "rejectionReason": "required reason",
  "adminNotes": "optional admin notes"
}
```

**Response**:
```json
{
  "success": true
}
```

## Future Enhancements (Optional)

1. **Email Notifications**
   - Send email to admin when new submission arrives
   - Send email to submitter when reviewed (approved/rejected)
   - Can use Supabase Edge Functions + SendGrid/Resend

2. **Bulk Actions**
   - Approve/reject multiple submissions at once
   - Batch operations for efficiency

3. **Submission Analytics**
   - Track review time
   - Measure approval/rejection rates
   - Popular submission locations

4. **Auto-geocoding**
   - Automatically geocode approved submissions
   - Add to geocoding queue on approval

5. **Editing**
   - Allow admins to edit submission details before approving
   - Let users edit their pending submissions

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Can submit booth from `/submit` page
- [ ] Submission appears in admin dashboard with count
- [ ] Can view submission at `/admin/submissions`
- [ ] Can approve submission (creates booth)
- [ ] Can reject submission with reason
- [ ] Filter tabs work (Pending, Approved, Rejected, All)
- [ ] Rejection reason displays correctly
- [ ] Admin notes display correctly
- [ ] Pending count updates after review

## Files Modified

1. `supabase/migrations/20260103_create_booth_submissions_table.sql` (NEW)
2. `src/app/submit/page.tsx` (MODIFIED)
3. `src/app/admin/submissions/page.tsx` (NEW)
4. `src/app/api/admin/submissions/approve/route.ts` (NEW)
5. `src/app/api/admin/submissions/reject/route.ts` (NEW)
6. `src/app/admin/page.tsx` (MODIFIED)

## Notes

- Approved submissions create booths with `status: 'unverified'` - they can be promoted to `active` later via the moderation system
- Submissions preserve the original data even after approval
- The `approved_booth_id` field links approved submissions to their booth
- Rejected submissions are kept for audit purposes
- All review actions are timestamped and attributed to the reviewing admin

---

**Implementation Date**: January 3, 2026
**Status**: Ready for deployment (pending migration)
