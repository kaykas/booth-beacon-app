# Community Photo Uploads - Setup Documentation

**Created:** 2026-01-02  
**Feature:** Allow users to upload and share photos of photo booths

---

## Overview

This feature enables authenticated users to upload photos of photo booths to help build a richer community-driven database. Photos are moderated by admins before appearing publicly.

## Database Schema

### Table: `booth_photos`

Main table for storing community-uploaded photos.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `booth_id` | UUID | Foreign key to booths table |
| `user_id` | UUID | Foreign key to auth.users (nullable for anonymous) |
| `photo_url` | TEXT | Full URL to stored photo |
| `thumbnail_url` | TEXT | Optional thumbnail version |
| `photo_type` | TEXT | Type: exterior, interior, strips, other |
| `notes` | TEXT | Optional user notes |
| `status` | TEXT | Moderation status: pending, approved, rejected |
| `approved_at` | TIMESTAMPTZ | When photo was approved |
| `approved_by` | UUID | Admin who approved |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Indexes

- `idx_booth_photos_booth_id` - Fast booth photo lookups
- `idx_booth_photos_status` - Moderation queue queries
- `idx_booth_photos_user_id` - User submission history
- `idx_booth_photos_approved_booth` - Approved photos by booth
- `idx_booth_photos_created_at` - Chronological sorting

### Views

#### `booth_photos_moderation_queue`
Shows pending photos with booth and user details for moderation.

```sql
SELECT * FROM booth_photos_moderation_queue;
```

#### `booth_photo_stats`
Aggregated statistics per booth.

```sql
SELECT * FROM booth_photo_stats WHERE booth_id = 'xxx';
```

## Storage Bucket

### Configuration

- **Bucket name:** `booth-community-photos`
- **Public:** Yes (for approved photos)
- **Max file size:** 5MB
- **Allowed types:** JPEG, PNG, WebP

### Storage Structure

```
booth-community-photos/
├── uploads/
│   └── {user_id}/
│       └── {booth_id}/
│           └── {timestamp}_{random}.{ext}
└── thumbnails/
    └── {user_id}/
        └── {booth_id}/
            └── {timestamp}_{random}.{ext}
```

## Row Level Security (RLS)

### Insert Policies

- **`booth_photos_insert_authenticated`**: Authenticated users can upload photos

### Select Policies

- **`booth_photos_select_approved`**: Anyone can view approved photos
- **`booth_photos_select_own`**: Users can view their own photos (any status)
- **`booth_photos_select_admin`**: Admins can view all photos

### Update Policies

- **`booth_photos_update_admin`**: Admins can update any photo (moderation)
- **`booth_photos_update_own_pending`**: Users can update own pending photos (24h window)

### Delete Policies

- **`booth_photos_delete_own_pending`**: Users can delete own pending photos (24h window)

## Storage RLS Policies

- **`booth_photos_upload_authenticated`**: Authenticated users can upload
- **`booth_photos_public_read`**: Public can read all files
- **`booth_photos_update_own`**: Users can update own uploads (24h)
- **`booth_photos_delete_own`**: Users can delete own uploads (24h)
- **`booth_photos_admin_update`**: Admins can update any photo
- **`booth_photos_admin_delete`**: Admins can delete any photo

## Installation

### Option 1: Automated Setup (Recommended)

```bash
bash scripts/setup-community-photos.sh
```

### Option 2: Manual Setup

```bash
# Apply table migration
supabase db push --file supabase/migrations/20260102_create_booth_photos_table.sql

# Apply storage migration
supabase db push --file supabase/migrations/20260102_create_booth_photos_storage.sql
```

## Usage Examples

### Upload a Photo (TypeScript)

```typescript
import { createClient } from '@supabase/supabase-js';
import { BoothPhotoInsert, PHOTO_UPLOAD_CONFIG } from '@/types/booth-photos';

const supabase = createClient(/* ... */);

async function uploadBoothPhoto(
  boothId: string,
  file: File,
  photoType: 'exterior' | 'interior' | 'strips' | 'other',
  notes?: string
) {
  // 1. Validate file
  if (file.size > PHOTO_UPLOAD_CONFIG.maxFileSize) {
    throw new Error('File too large (max 5MB)');
  }
  
  if (!PHOTO_UPLOAD_CONFIG.allowedMimeTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  // 2. Get user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 3. Generate storage path
  const fileExt = file.name.split('.').pop();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const random = Math.random().toString(36).substring(7);
  const storagePath = `uploads/${user.id}/${boothId}/${timestamp}_${random}.${fileExt}`;

  // 4. Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_UPLOAD_CONFIG.bucketName)
    .upload(storagePath, file);

  if (uploadError) throw uploadError;

  // 5. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(PHOTO_UPLOAD_CONFIG.bucketName)
    .getPublicUrl(storagePath);

  // 6. Create database record
  const photoData: BoothPhotoInsert = {
    booth_id: boothId,
    user_id: user.id,
    photo_url: publicUrl,
    photo_type: photoType,
    notes: notes || null,
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('booth_photos')
    .insert(photoData)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Get Approved Photos for a Booth

```typescript
async function getBoothPhotos(boothId: string) {
  const { data, error } = await supabase
    .from('booth_photos')
    .select('*')
    .eq('booth_id', boothId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

### Moderate Photos (Admin Only)

```typescript
async function approvePhoto(photoId: string) {
  const { error } = await supabase
    .from('booth_photos')
    .update({
      status: 'approved',
      // approved_at and approved_by are set automatically by trigger
    })
    .eq('id', photoId);

  if (error) throw error;
}

async function rejectPhoto(photoId: string) {
  const { error } = await supabase
    .from('booth_photos')
    .update({ status: 'rejected' })
    .eq('id', photoId);

  if (error) throw error;
}
```

### Get Moderation Queue (Admin)

```typescript
async function getModerationQueue() {
  const { data, error } = await supabase
    .from('booth_photos_moderation_queue')
    .select('*');

  if (error) throw error;
  return data;
}
```

## Triggers

### `booth_photos_updated_at`
Automatically updates `updated_at` field on any update.

### `booth_photos_set_approved_at`
Automatically sets `approved_at` and `approved_by` when status changes to 'approved'.

## Helper Functions

### `get_booth_photo_storage_path(user_id, booth_id, file_extension)`
Generates unique storage path for uploads.

### `get_booth_photo_public_url(storage_path)`
Generates public URL for stored photos.

## Security Considerations

1. **File Size Limit:** 5MB enforced at bucket level
2. **MIME Type Validation:** Only JPEG, PNG, WebP allowed
3. **Authentication Required:** Must be logged in to upload
4. **Moderation Required:** Photos pending until admin approves
5. **24-hour Edit Window:** Users can only edit/delete recent uploads
6. **Admin Verification:** RLS checks `profiles.is_admin` column

## Monitoring

### Check Pending Photos Count

```sql
SELECT COUNT(*) FROM booth_photos WHERE status = 'pending';
```

### Get User Upload Statistics

```sql
SELECT
  user_id,
  COUNT(*) as total_uploads,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected
FROM booth_photos
WHERE user_id IS NOT NULL
GROUP BY user_id
ORDER BY total_uploads DESC;
```

### Most Active Booths (by photos)

```sql
SELECT
  b.name,
  b.city,
  bps.total_photos,
  bps.approved_photos
FROM booth_photo_stats bps
JOIN booths b ON bps.booth_id = b.id
ORDER BY bps.total_photos DESC
LIMIT 20;
```

## Troubleshooting

### Issue: Photos not uploading

1. Check authentication: `supabase.auth.getUser()`
2. Verify file size < 5MB
3. Verify MIME type in allowed list
4. Check browser console for errors

### Issue: Can't view uploaded photos

1. Check photo status (only 'approved' visible publicly)
2. Verify RLS policies are enabled
3. Check storage bucket is public

### Issue: Admins can't moderate

1. Verify `profiles.is_admin = true` for admin user
2. Check RLS policies include admin checks
3. Verify admin is authenticated

## Future Enhancements

Potential improvements for v2:

- [ ] Automatic thumbnail generation
- [ ] Image optimization/compression
- [ ] Duplicate photo detection
- [ ] Photo reporting system
- [ ] Batch photo uploads
- [ ] Photo tagging/categorization
- [ ] EXIF data extraction
- [ ] Geolocation validation

---

**Files Created:**
1. `/supabase/migrations/20260102_create_booth_photos_table.sql`
2. `/supabase/migrations/20260102_create_booth_photos_storage.sql`
3. `/scripts/setup-community-photos.sh`
4. `/src/types/booth-photos.ts`
5. `/docs/COMMUNITY_PHOTOS_SETUP.md`
