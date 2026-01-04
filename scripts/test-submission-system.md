# Testing the Booth Submission System

## Quick Test Guide

### 1. Apply the Migration First

Before testing, you MUST apply the database migration. Choose one method:

#### Via Supabase Dashboard (Easiest)
1. Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new
2. Open file: `supabase/migrations/20260103_create_booth_submissions_table.sql`
3. Copy all contents
4. Paste into SQL editor
5. Click "Run"
6. Wait for success message

### 2. Test Submission Flow

#### A. Submit a Test Booth
1. Go to: http://localhost:3000/submit (or your deployed URL)
2. Sign in (required)
3. Fill out the form with test data:
   ```
   Name: Test Photo Booth
   Address: 123 Test Street
   City: San Francisco
   Country: USA
   Description: This is a test submission
   ```
4. Click "Submit Booth"
5. You should see: "Your booth submission has been received and is pending review"

#### B. View in Admin Dashboard
1. Go to: http://localhost:3000/admin
2. You should see:
   - "Review Submissions" card with badge showing "1 pending"
   - Quick stats bar showing "1" under "Pending Submissions"
3. Card should have blue highlighting if submissions are pending

#### C. Review the Submission
1. Click "Review Submissions" or go to: http://localhost:3000/admin/submissions
2. You should see your test submission in a card
3. Verify all details are correct:
   - Name, address, city, country
   - Description
   - Submitter email
   - Submission date

#### D. Test Approval
1. Click "Approve" button on the submission
2. Modal appears - optionally add admin notes
3. Click "Approve & Add to Booths"
4. Wait for success toast: "Submission approved and added to booths!"
5. Submission should disappear from pending list
6. Check filters:
   - Click "Approved" tab to see approved submission
   - Note shows admin notes if you added any

#### E. Verify Booth Creation
1. Go to: http://localhost:3000/map
2. Search for your test booth (may need to refresh)
3. It should appear with `status: 'unverified'`
4. Or query database directly:
   ```sql
   SELECT * FROM booths WHERE name = 'Test Photo Booth';
   ```

#### F. Test Rejection
1. Submit another test booth from `/submit`
2. Go to `/admin/submissions`
3. Click "Reject" button
4. Modal appears
5. Enter rejection reason: "Test rejection - invalid address"
6. Optionally add admin notes
7. Click "Reject Submission"
8. Success toast: "Submission rejected"
9. Click "Rejected" tab to see rejected submission
10. Verify rejection reason displays

### 3. Test Filters

In `/admin/submissions`:

- **Pending**: Should show only pending submissions
- **Approved**: Should show approved submissions with booth reference
- **Rejected**: Should show rejected submissions with reason
- **All**: Should show all submissions regardless of status

### 4. Test Edge Cases

#### A. Duplicate Slug Handling
1. Submit two booths with the same name
2. Approve both
3. Second booth should get slug with `-1` suffix
4. Verify in database:
   ```sql
   SELECT slug FROM booths WHERE name LIKE '%Test Photo Booth%';
   ```

#### B. Already Reviewed Submission
1. Try to approve a submission that's already approved
2. Should get error: "Submission has already been reviewed"

#### C. Missing Rejection Reason
1. Click reject without entering a reason
2. Should get error: "Please provide a rejection reason"

#### D. Not Logged In
1. Log out
2. Try to access `/admin/submissions`
3. Should redirect to home with "Authentication Required" message

#### E. Not Admin
1. Log in as regular user (not admin)
2. Try to access `/admin/submissions`
3. Should see "Access Denied" message

### 5. Database Verification

After testing, verify data integrity:

```sql
-- Check submissions were created
SELECT COUNT(*) FROM booth_submissions;

-- Check approved submissions created booths
SELECT
  bs.name as submission_name,
  bs.status,
  b.name as booth_name,
  b.slug
FROM booth_submissions bs
LEFT JOIN booths b ON bs.approved_booth_id = b.id
WHERE bs.status = 'approved';

-- Check rejected submissions
SELECT name, rejection_reason, admin_notes
FROM booth_submissions
WHERE status = 'rejected';

-- Verify RLS policies work
-- (Query as regular user - should only see own submissions)
SELECT * FROM booth_submissions WHERE submitted_by = auth.uid();
```

### 6. Performance Test

Submit multiple booths to test:

```bash
# Submit 10 test booths (you'll need to do this manually or create a script)
# Then check admin page performance:
# - Page should load quickly
# - Filtering should be instant
# - No lag when reviewing submissions
```

### 7. Clean Up Test Data

After testing, remove test submissions:

```sql
-- Delete test booths
DELETE FROM booths WHERE name LIKE '%Test Photo Booth%';

-- Delete test submissions
DELETE FROM booth_submissions WHERE name LIKE '%Test Photo Booth%';
```

## Common Issues & Solutions

### Issue: Migration fails
**Solution**: Check if table already exists. Drop and recreate:
```sql
DROP TABLE IF EXISTS booth_submissions CASCADE;
-- Then run migration again
```

### Issue: Can't see submissions in admin
**Solution**:
1. Check you're logged in as admin
2. Verify admin status in `profiles` table
3. Check browser console for errors

### Issue: Approve/Reject not working
**Solution**:
1. Check browser console for API errors
2. Verify Supabase service role key is set
3. Check API routes are accessible

### Issue: Pending count not updating
**Solution**:
1. Refresh the admin page
2. Check if submission was actually created
3. Verify status is 'pending' in database

## Success Criteria

- ✅ Can submit booth from form
- ✅ Submission appears in admin with pending status
- ✅ Can approve submission (creates booth)
- ✅ Can reject submission (with reason)
- ✅ Filters work correctly
- ✅ Pending count displays accurately
- ✅ Rejection reason displays for rejected submissions
- ✅ Admin notes display correctly
- ✅ Approved booth has correct slug
- ✅ RLS policies prevent unauthorized access

## Automated Testing (Future)

Consider adding E2E tests with Playwright:

```typescript
test('submit and approve booth flow', async ({ page }) => {
  // Login as user
  await page.goto('/submit');
  // Fill form
  // Submit

  // Login as admin
  await page.goto('/admin/submissions');
  // Verify submission appears
  // Click approve
  // Verify success

  // Check booth was created
  await page.goto('/map');
  // Search for booth
  // Verify it appears
});
```

---

**Ready to test!** Start with step 1 (applying migration), then proceed through each test case.
