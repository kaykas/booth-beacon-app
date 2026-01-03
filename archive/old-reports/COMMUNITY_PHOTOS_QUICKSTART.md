# Community Photos - Quick Start Guide

**Setup Time:** 5 minutes  
**Status:** Ready to Deploy

---

## 1. Deploy Database Schema (2 minutes)

```bash
cd /Users/jkw/Projects/booth-beacon-app

# Run automated setup
bash scripts/setup-community-photos.sh
```

Expected output:
```
✓ booth_photos table created successfully
✓ Storage bucket configured successfully
Community Photos Setup Complete!
```

---

## 2. Verify Installation (1 minute)

```bash
# Check table exists
supabase db diff

# Query to verify table structure
psql $DATABASE_URL -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'booth_photos';"
```

---

## 3. Test Upload (TypeScript)

Copy this into your upload component:

```typescript
import { createClient } from '@supabase/supabase-js';
import { PHOTO_UPLOAD_CONFIG } from '@/types/booth-photos';

const supabase = createClient(/* your config */);

async function uploadPhoto(boothId: string, file: File) {
  // 1. Validate
  if (file.size > PHOTO_UPLOAD_CONFIG.maxFileSize) {
    throw new Error('File too large (max 5MB)');
  }

  // 2. Get user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 3. Generate path
  const ext = file.name.split('.').pop();
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const path = `uploads/${user.id}/${boothId}/${timestamp}_${random}.${ext}`;

  // 4. Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('booth-community-photos')
    .upload(path, file);

  if (uploadError) throw uploadError;

  // 5. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('booth-community-photos')
    .getPublicUrl(path);

  // 6. Create DB record
  const { data, error } = await supabase
    .from('booth_photos')
    .insert({
      booth_id: boothId,
      user_id: user.id,
      photo_url: publicUrl,
      photo_type: 'exterior', // or interior, strips, other
      notes: 'Optional user notes',
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

## 4. Display Photos (TypeScript)

Get approved photos for a booth:

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

---

## 5. Admin Moderation

### Get Pending Queue

```typescript
async function getModerationQueue() {
  const { data, error } = await supabase
    .from('booth_photos_moderation_queue')
    .select('*');

  if (error) throw error;
  return data;
}
```

### Approve Photo

```typescript
async function approvePhoto(photoId: string) {
  const { error } = await supabase
    .from('booth_photos')
    .update({ status: 'approved' })
    .eq('id', photoId);

  if (error) throw error;
}
```

### Reject Photo

```typescript
async function rejectPhoto(photoId: string) {
  const { error } = await supabase
    .from('booth_photos')
    .update({ status: 'rejected' })
    .eq('id', photoId);

  if (error) throw error;
}
```

---

## 6. Check Statistics

```sql
-- Pending count
SELECT COUNT(*) FROM booth_photos WHERE status = 'pending';

-- Per-booth stats
SELECT * FROM booth_photo_stats WHERE booth_id = 'YOUR_BOOTH_ID';

-- Overall stats
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(DISTINCT booth_id) as booths_with_photos
FROM booth_photos;
```

---

## Files Created

| File | Purpose | Size |
|------|---------|------|
| `supabase/migrations/20260102_create_booth_photos_table.sql` | Database schema | 6.9KB |
| `supabase/migrations/20260102_create_booth_photos_storage.sql` | Storage config | 3.8KB |
| `scripts/setup-community-photos.sh` | Deployment script | 2.5KB |
| `src/types/booth-photos.ts` | TypeScript types | 2.1KB |
| `docs/COMMUNITY_PHOTOS_SETUP.md` | Full documentation | 9.0KB |
| `docs/booth-photos-queries.sql` | SQL reference | 5.8KB |
| `COMMUNITY_PHOTOS_IMPLEMENTATION.md` | Implementation guide | 8.7KB |

---

## Key Features

- ✓ Secure authenticated uploads
- ✓ Moderation workflow (pending → approved/rejected)
- ✓ 5MB file size limit
- ✓ JPEG, PNG, WebP support
- ✓ Row-level security (RLS)
- ✓ Storage bucket policies
- ✓ Admin moderation interface
- ✓ Photo statistics and views
- ✓ 24-hour edit window for users
- ✓ Automatic timestamp management

---

## Security Model

| Action | Permission |
|--------|------------|
| Upload | Authenticated users only |
| View Approved | Public (anyone) |
| View Own | User (any status) |
| View All | Admin only |
| Moderate | Admin only |
| Edit Own (24h) | User (pending only) |
| Delete Own (24h) | User (pending only) |

---

## Next Steps

1. **Deploy:** Run setup script
2. **Test:** Upload a test photo
3. **Moderate:** Approve test photo as admin
4. **Integrate:** Add upload UI to booth detail pages
5. **Monitor:** Check moderation queue regularly

---

## Support

- **Full Docs:** `docs/COMMUNITY_PHOTOS_SETUP.md`
- **SQL Queries:** `docs/booth-photos-queries.sql`
- **Implementation:** `COMMUNITY_PHOTOS_IMPLEMENTATION.md`

---

**Ready to go!** 🚀
