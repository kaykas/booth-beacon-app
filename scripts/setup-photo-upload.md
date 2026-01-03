# Photo Upload Setup Instructions

This guide will help you set up the community photo upload feature for Booth Beacon.

## Prerequisites

1. Access to Supabase Dashboard
2. Project Reference: `tmgbmcbwfkvmylmfpkzy`
3. Environment variables configured in `.env.local`

---

## Step 1: Run Database Migrations

### Option A: Using Supabase CLI (Recommended)

1. Login to Supabase CLI:
   ```bash
   supabase login
   ```

2. Link project (if not already linked):
   ```bash
   supabase link --project-ref tmgbmcbwfkvmylmfpkzy
   ```

3. Push migrations:
   ```bash
   supabase db push --linked
   ```

### Option B: Manual SQL Execution

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/editor
2. Open SQL Editor
3. Execute these files in order:
   - `/supabase/migrations/20260102_create_booth_photos_table.sql`
   - `/supabase/migrations/20260102_create_booth_photos_storage.sql`

---

## Step 2: Create Storage Bucket (If Not Auto-Created)

1. Go to Storage: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/storage/buckets

2. Check if `booth-community-photos` bucket exists:
   - If YES: Skip to Step 3
   - If NO: Continue below

3. Click "Create Bucket"

4. Configure bucket:
   - Name: `booth-community-photos`
   - Public: ✅ Yes
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/jpeg, image/png, image/webp`

5. Click "Create"

---

## Step 3: Verify Storage Policies

1. Go to bucket settings
2. Click on "Policies" tab
3. Verify these policies exist:
   - ✅ `booth_photos_upload_authenticated` (INSERT)
   - ✅ `booth_photos_public_read` (SELECT)
   - ✅ `booth_photos_update_own` (UPDATE)
   - ✅ `booth_photos_delete_own` (DELETE)
   - ✅ `booth_photos_admin_update` (UPDATE)
   - ✅ `booth_photos_admin_delete` (DELETE)

If any are missing, run the storage migration again.

---

## Step 4: Verify Database Table

1. Go to Table Editor: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/editor

2. Find `booth_photos` table

3. Verify columns:
   - id (uuid)
   - booth_id (uuid)
   - user_id (uuid, nullable)
   - photo_url (text)
   - thumbnail_url (text, nullable)
   - photo_type (text)
   - notes (text, nullable)
   - status (text)
   - approved_at (timestamptz, nullable)
   - approved_by (uuid, nullable)
   - created_at (timestamptz)
   - updated_at (timestamptz)

4. Verify indexes:
   - idx_booth_photos_booth_id
   - idx_booth_photos_status
   - idx_booth_photos_user_id
   - idx_booth_photos_approved_booth
   - idx_booth_photos_created_at

---

## Step 5: Test Upload

1. Start development server:
   ```bash
   npm run dev
   ```

2. Navigate to any booth detail page:
   ```
   http://localhost:3000/booth/[any-booth-slug]
   ```

3. Look for "Help others discover this booth!" card

4. Click "Share Photos"

5. Upload a test image:
   - Select 1-3 images
   - Choose photo type
   - Add notes (optional)
   - Click "Submit Photos"

6. Verify success message appears

---

## Step 6: Verify in Supabase Dashboard

### Check Storage:
1. Go to Storage → booth-community-photos
2. Verify uploaded files appear
3. Note the filename format: `booth-{id}-{timestamp}-{random}.{ext}`

### Check Database:
1. Go to Table Editor → booth_photos
2. Verify new records exist
3. Check fields:
   - ✅ booth_id matches your booth
   - ✅ photo_url has correct URL
   - ✅ status = 'pending'
   - ✅ created_at is recent

---

## Step 7: Test Different Scenarios

### Test 1: Multiple Files
- Upload 3-5 images at once
- Verify all appear in storage and database

### Test 2: File Validation
- Try uploading > 5MB file → Should show error
- Try uploading non-image → Should show error
- Try uploading > 5 files → Should show error

### Test 3: Anonymous Upload
- Log out (or use incognito)
- Upload photo
- Verify user_id is NULL in database

### Test 4: Authenticated Upload
- Log in
- Upload photo
- Verify user_id is set correctly

---

## Troubleshooting

### Issue: "Bucket not found"
**Solution:**
1. Create bucket manually (see Step 2)
2. Or run storage migration again

### Issue: "Permission denied" errors
**Solution:**
1. Check RLS policies are enabled
2. Verify storage policies exist
3. Check SUPABASE_SERVICE_ROLE_KEY in .env.local

### Issue: "File too large"
**Solution:**
- Files must be < 5MB
- Compress images before upload
- Or increase bucket file_size_limit

### Issue: Uploads succeed but files not visible
**Solution:**
1. Check status is 'pending' (not 'approved')
2. Photos need moderation before appearing
3. Create admin interface to approve

### Issue: API route not found
**Solution:**
1. Verify `/src/app/api/photos/upload/route.ts` exists
2. Restart dev server
3. Check Next.js logs for compilation errors

---

## Next Steps

1. ✅ Test basic upload flow
2. ✅ Verify storage and database
3. 🔄 Create admin moderation interface
4. 🔄 Display approved photos on booth pages
5. 🔄 Add thumbnail generation
6. 🔄 Implement image compression

---

## Quick Reference

### Important URLs
- Supabase Dashboard: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy
- Storage: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/storage/buckets
- Database: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/editor

### Key Files
- Component: `/src/components/booth/CommunityPhotoUpload.tsx`
- API Route: `/src/app/api/photos/upload/route.ts`
- Migrations: `/supabase/migrations/20260102_*.sql`
- Types: `/src/types/index.ts`
- Docs: `/docs/PHOTO_UPLOAD_IMPLEMENTATION.md`

### Useful SQL Queries

Check pending photos:
```sql
SELECT * FROM booth_photos WHERE status = 'pending' ORDER BY created_at DESC;
```

Count photos by booth:
```sql
SELECT booth_id, COUNT(*) FROM booth_photos GROUP BY booth_id;
```

View moderation queue:
```sql
SELECT * FROM booth_photos_moderation_queue;
```

Approve a photo:
```sql
UPDATE booth_photos SET status = 'approved', approved_at = NOW() WHERE id = 'uuid-here';
```

---

## Support

For issues or questions, refer to:
- `/docs/PHOTO_UPLOAD_IMPLEMENTATION.md` - Full technical documentation
- Component comments in source code
- Supabase documentation: https://supabase.com/docs
