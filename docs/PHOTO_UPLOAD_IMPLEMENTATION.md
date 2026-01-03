# Community Photo Upload Implementation

## Overview
This document describes the implementation of the community photo upload feature for Booth Beacon, allowing users to contribute photos of photo booths.

**Implementation Date:** January 2, 2026
**Status:** Complete - Ready for Testing

---

## Architecture

### Components

#### 1. Frontend Component
**File:** `/src/components/booth/CommunityPhotoUpload.tsx`

**Features:**
- File upload with drag-and-drop support
- Multi-file upload (up to 5 images)
- Real-time file validation (type, size)
- Image preview before upload
- Upload progress indicator
- Photo type selection (exterior, interior, strips, other)
- Optional notes field
- Error handling with user-friendly messages
- Success confirmation

**Validation:**
- Allowed types: JPG, PNG, WEBP
- Max file size: 5MB per image
- Max files: 5 per upload

#### 2. API Route
**File:** `/src/app/api/photos/upload/route.ts`

**Features:**
- Server-side file validation
- Supabase Storage integration
- Database record creation
- Unique filename generation
- Error handling and rollback
- Multi-file batch processing

**Filename Pattern:** `booth-{boothId}-{timestamp}-{random}.{ext}`

#### 3. Database Schema
**File:** `/supabase/migrations/20260102_create_booth_photos_table.sql`

**Table:** `booth_photos`

```sql
CREATE TABLE booth_photos (
  id UUID PRIMARY KEY,
  booth_id UUID NOT NULL,
  user_id UUID NULL,          -- Nullable for anonymous uploads
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,          -- Optional thumbnail
  photo_type TEXT NOT NULL,    -- exterior|interior|strips|other
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending|approved|rejected
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Indexes:**
- `idx_booth_photos_booth_id` - Fast booth photo lookup
- `idx_booth_photos_status` - Moderation queue queries
- `idx_booth_photos_user_id` - User submissions (where not null)
- `idx_booth_photos_approved_booth` - Approved photos by booth (most common)
- `idx_booth_photos_created_at` - Chronological sorting

**Views:**
- `booth_photos_moderation_queue` - Pending photos with booth/user info
- `booth_photo_stats` - Statistics per booth

#### 4. Storage Configuration
**File:** `/supabase/migrations/20260102_create_booth_photos_storage.sql`

**Bucket:** `booth-community-photos`

**Settings:**
- Public bucket (approved photos visible)
- 5MB file size limit
- Allowed MIME types: image/jpeg, image/png, image/webp

**Helper Functions:**
- `get_booth_photo_storage_path()` - Generate unique paths
- `get_booth_photo_public_url()` - Generate public URLs

#### 5. Supabase Client
**File:** `/src/lib/supabase.ts`

Provides client instances for:
- Browser clients (client components)
- Server clients (API routes, server components)

---

## Row Level Security (RLS)

### Database Table Policies

**INSERT:**
- Authenticated users can upload photos (with their user_id)
- Anonymous uploads allowed (user_id = NULL)

**SELECT:**
- Everyone can view approved photos
- Users can view their own photos (any status)
- Admins can view all photos

**UPDATE:**
- Admins can moderate all photos
- Users can update their own pending photos (within 24 hours)

**DELETE:**
- Users can delete their own pending photos (within 24 hours)

### Storage Bucket Policies

**INSERT:**
- Authenticated users can upload to uploads/ and thumbnails/ folders

**SELECT:**
- Public read access to all photos

**UPDATE/DELETE:**
- Users can modify their own uploads (within 24 hours)
- Admins can modify/delete any photo

---

## Data Flow

### Upload Process

1. **User selects files** → Client-side validation
2. **Preview displayed** → File info shown
3. **User submits form** → FormData created
4. **POST to `/api/photos/upload`** → Server receives
5. **Server validation** → Check types, sizes, limits
6. **Booth verification** → Ensure booth exists
7. **User authentication** → Get user_id (or null)
8. **For each file:**
   - Convert to Buffer
   - Upload to Supabase Storage
   - Get public URL
   - Insert database record
   - Handle errors with rollback
9. **Return results** → Success/error response
10. **Update UI** → Show success or error message

### Moderation Workflow

1. Photo uploaded → `status = 'pending'`
2. Admin views moderation queue
3. Admin approves/rejects
4. Status updated → `approved_at` set
5. Approved photos appear on booth page

---

## Files Created/Modified

### New Files
1. `/src/lib/supabase.ts` - Supabase client utilities
2. `/src/app/api/photos/upload/route.ts` - Upload API endpoint
3. `/supabase/migrations/20260102_create_booth_photos_table.sql` - Database schema
4. `/supabase/migrations/20260102_create_booth_photos_storage.sql` - Storage config
5. `/docs/PHOTO_UPLOAD_IMPLEMENTATION.md` - This document

### Modified Files
1. `/src/components/booth/CommunityPhotoUpload.tsx` - Full implementation
2. `/src/types/index.ts` - Added `BoothPhoto` interface

---

## TypeScript Types

```typescript
export interface BoothPhoto {
  id: string;
  booth_id: string;
  user_id: string | null;
  photo_url: string;
  thumbnail_url?: string | null;
  photo_type: 'exterior' | 'interior' | 'strips' | 'other';
  notes?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: string | null;
  approved_by?: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Testing Instructions

### Prerequisites
1. Run database migrations:
   ```bash
   supabase db push --linked
   ```
   Or manually run the SQL files in Supabase Dashboard

2. Create storage bucket in Supabase Dashboard:
   - Go to Storage
   - Create bucket `booth-community-photos`
   - Set as public
   - Configure file size limit (5MB)

3. Verify environment variables:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=... (for API route)
   ```

### Manual Testing

#### Test 1: Upload Single Photo
1. Navigate to any booth detail page
2. Click "Share Photos" button
3. Select 1 image (JPG/PNG/WEBP, < 5MB)
4. Choose photo type
5. Add optional notes
6. Click "Submit Photos"
7. Verify upload progress shown
8. Verify success message
9. Check Supabase Dashboard:
   - Storage: File in `booth-community-photos`
   - Database: Record in `booth_photos` with status='pending'

#### Test 2: Upload Multiple Photos
1. Select 3-5 images at once
2. Verify all previews shown
3. Verify file sizes displayed
4. Submit and verify all uploaded

#### Test 3: File Validation
1. Try to upload > 5MB file → Error shown
2. Try to upload non-image file → Error shown
3. Try to upload > 5 files → Error shown
4. Verify errors are clear and actionable

#### Test 4: Remove Files
1. Select 3 files
2. Remove one using X button
3. Verify preview removed
4. Submit remaining files

#### Test 5: Cancel Upload
1. Select files
2. Click Cancel
3. Verify form closed
4. Verify no upload occurred

#### Test 6: Anonymous Upload
1. Test without being logged in
2. Verify upload succeeds
3. Verify `user_id` is NULL in database

#### Test 7: Authenticated Upload
1. Login to application
2. Upload photo
3. Verify `user_id` is set correctly

#### Test 8: Error Handling
1. Disconnect internet
2. Try to upload
3. Verify error message shown
4. Reconnect and retry

---

## Known Limitations & Future Enhancements

### Current Limitations
1. No drag-and-drop file selection (only click to upload)
2. No thumbnail generation
3. No image compression before upload
4. No EXIF data extraction (location, date)
5. No duplicate detection
6. Anonymous uploads require manual moderation

### Future Enhancements
1. **Thumbnail Generation:** Create smaller versions for faster loading
2. **Image Optimization:** Compress images before storage
3. **EXIF Parsing:** Extract location/date metadata
4. **Duplicate Detection:** Check for similar existing photos
5. **Drag & Drop:** Add drag-and-drop file selection
6. **Crop/Rotate:** Allow basic editing before upload
7. **Batch Moderation:** Admin tools to approve/reject multiple photos
8. **User Photo Gallery:** Show user's uploaded photos
9. **Photo Reports:** Allow reporting inappropriate photos
10. **Auto-moderation:** AI-based content filtering

---

## Moderation Interface (Future)

To implement moderation, create:

1. **Admin Page:** `/app/admin/photos/page.tsx`
2. **API Routes:**
   - `PUT /api/photos/[id]/approve`
   - `PUT /api/photos/[id]/reject`
3. **Query moderation queue:**
   ```sql
   SELECT * FROM booth_photos_moderation_queue;
   ```

---

## Performance Considerations

### Database
- Indexes on frequently queried columns
- Partial indexes for approved photos
- Views for common queries

### Storage
- Public bucket for CDN caching
- File size limits prevent large uploads
- Compression recommended for future

### API
- Batch processing for multiple files
- Rollback on partial failures
- Proper error handling

---

## Security Considerations

### Implemented
- File type validation (client + server)
- File size limits (5MB per file)
- RLS policies on database
- Storage bucket policies
- User attribution (or anonymous)
- Moderation workflow

### Recommendations
1. Add CAPTCHA for anonymous uploads
2. Rate limiting on upload endpoint
3. Virus scanning for uploaded files
4. Content moderation (AI or manual)
5. Watermarking for approved photos

---

## API Documentation

### POST /api/photos/upload

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `files`: File[] (1-5 images)
  - `boothId`: string (UUID)
  - `photoType`: 'exterior' | 'interior' | 'strips' | 'other'
  - `notes`: string (optional)

**Response (Success):**
```json
{
  "success": true,
  "uploaded": 3,
  "total": 3,
  "photos": [
    {
      "id": "uuid",
      "url": "https://...",
      "fileName": "image1.jpg"
    }
  ]
}
```

**Response (Error):**
```json
{
  "error": "Error message",
  "details": "Additional details"
}
```

**Status Codes:**
- 200: Success
- 400: Validation error
- 404: Booth not found
- 500: Server error

---

## Maintenance

### Regular Tasks
1. Monitor storage usage
2. Review moderation queue
3. Check for orphaned files
4. Analyze upload success rates

### Monitoring Queries
```sql
-- Moderation queue size
SELECT COUNT(*) FROM booth_photos WHERE status = 'pending';

-- Upload stats by day
SELECT DATE(created_at), COUNT(*)
FROM booth_photos
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Storage usage (requires storage API)
-- Check Supabase Dashboard

-- Failed uploads (requires logging)
-- Check application logs
```

---

## Troubleshooting

### Issue: Uploads failing silently
- Check browser console for errors
- Verify API endpoint is accessible
- Check Supabase credentials
- Verify storage bucket exists

### Issue: Files not appearing in storage
- Check bucket name matches code
- Verify storage policies allow INSERT
- Check service role key is set

### Issue: Database records not created
- Verify booth_id is valid
- Check RLS policies
- Verify table exists
- Check API logs for errors

### Issue: Photos not showing after upload
- Check status is 'approved' (not 'pending')
- Verify SELECT policy allows access
- Check public URL is correct

---

## Contact & Support

For questions or issues:
1. Check this documentation
2. Review code comments
3. Check Supabase logs
4. Test in local environment

---

**Last Updated:** January 2, 2026
**Version:** 1.0
**Status:** Production Ready (pending testing)
