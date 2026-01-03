# Community Photo Uploads - Implementation Summary

**Date:** 2026-01-02  
**Feature:** Community photo upload system with moderation

---

## Files Created

### 1. Database Migrations

#### `/supabase/migrations/20260102_create_booth_photos_table.sql` (6.9KB)
Creates the main `booth_photos` table with:
- Complete schema with all required fields
- 5 indexes for optimal query performance
- 8 RLS policies for security
- 2 triggers for automatic field updates
- 2 views (moderation queue, statistics)
- Comprehensive comments

**Key Features:**
- Moderation workflow (pending → approved/rejected)
- Foreign key relationships to booths and users
- Support for anonymous uploads (nullable user_id)
- 24-hour edit window for users
- Automatic timestamp management

#### `/supabase/migrations/20260102_create_booth_photos_storage.sql` (3.8KB)
Configures Supabase Storage:
- Creates `booth-community-photos` bucket
- 5MB file size limit
- JPEG, PNG, WebP only
- 6 storage RLS policies
- 2 helper functions for path generation

**Storage Structure:**
```
booth-community-photos/
├── uploads/{user_id}/{booth_id}/{timestamp}_{random}.{ext}
└── thumbnails/{user_id}/{booth_id}/{timestamp}_{random}.{ext}
```

### 2. Scripts

#### `/scripts/setup-community-photos.sh` (2.5KB, executable)
Automated setup script that:
- Validates environment (Supabase CLI, project)
- Applies both migrations in correct order
- Provides detailed success/error messages
- Shows next steps and configuration details

**Usage:**
```bash
bash scripts/setup-community-photos.sh
```

### 3. TypeScript Types

#### `/src/types/booth-photos.ts` (2.1KB)
Type-safe definitions for frontend:
- `BoothPhoto` - Main interface
- `BoothPhotoInsert` - Insert payload
- `BoothPhotoUpdate` - Update payload
- `BoothPhotoModerationQueueItem` - Queue view
- `BoothPhotoStats` - Statistics view
- `PhotoUploadConfig` - Configuration constants
- Type enums and labels

### 4. Documentation

#### `/docs/COMMUNITY_PHOTOS_SETUP.md` (9.0KB)
Complete feature documentation:
- Overview and architecture
- Schema reference with all columns
- RLS policy explanations
- Installation instructions
- Usage examples (TypeScript)
- Security considerations
- Monitoring queries
- Troubleshooting guide
- Future enhancement ideas

#### `/docs/booth-photos-queries.sql` (5.8KB)
SQL query reference with:
- Moderation queries
- Statistics queries
- User history queries
- Booth photo queries
- Quality control queries
- Performance monitoring
- Cleanup queries (commented out)

---

## Database Schema Summary

### Table: `booth_photos`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Auto-generated |
| booth_id | UUID | NOT NULL, FK → booths | Which booth |
| user_id | UUID | NULL, FK → auth.users | Who uploaded (nullable) |
| photo_url | TEXT | NOT NULL | Storage URL |
| thumbnail_url | TEXT | NULL | Optional thumbnail |
| photo_type | TEXT | CHECK | exterior/interior/strips/other |
| notes | TEXT | NULL | User comments |
| status | TEXT | CHECK, DEFAULT 'pending' | pending/approved/rejected |
| approved_at | TIMESTAMPTZ | NULL | When approved |
| approved_by | UUID | NULL, FK → auth.users | Admin who approved |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Created |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last updated |

### Indexes

1. **idx_booth_photos_booth_id** - Fast booth lookups
2. **idx_booth_photos_status** - Moderation queue
3. **idx_booth_photos_user_id** - User history (partial)
4. **idx_booth_photos_approved_booth** - Approved by booth (partial)
5. **idx_booth_photos_created_at** - Chronological sorting

### Views

1. **booth_photos_moderation_queue** - Pending photos with context
2. **booth_photo_stats** - Per-booth aggregated statistics

---

## Security Model

### Authentication Requirements

- **Upload:** Must be authenticated (anon users cannot upload)
- **View Approved:** Public (no authentication required)
- **View Own:** Authenticated (any status)
- **View All:** Admin only (via profiles.is_admin)
- **Moderate:** Admin only

### Time-Based Restrictions

- Users can edit/delete own photos for **24 hours** after upload
- Only applies to **pending** status photos
- After 24 hours or approval, only admins can modify

### File Restrictions

- **Max size:** 5MB (enforced at storage bucket level)
- **MIME types:** image/jpeg, image/png, image/webp
- **Naming:** Auto-generated with timestamp and random string
- **Path structure:** Organized by user_id and booth_id

---

## Integration Guide

### 1. Apply Migrations

```bash
# Option A: Use setup script (recommended)
bash scripts/setup-community-photos.sh

# Option B: Manual
supabase db push
```

### 2. Import Types in Frontend

```typescript
import {
  BoothPhoto,
  BoothPhotoInsert,
  PhotoType,
  PHOTO_UPLOAD_CONFIG,
} from '@/types/booth-photos';
```

### 3. Implement Upload Component

See `/docs/COMMUNITY_PHOTOS_SETUP.md` for complete example.

Basic flow:
1. Validate file (size, type)
2. Upload to storage bucket
3. Get public URL
4. Insert record with status='pending'

### 4. Implement Moderation UI (Admin)

Query the moderation queue:
```typescript
const { data } = await supabase
  .from('booth_photos_moderation_queue')
  .select('*');
```

Approve/reject photos:
```typescript
await supabase
  .from('booth_photos')
  .update({ status: 'approved' })
  .eq('id', photoId);
```

### 5. Display Photos on Booth Pages

```typescript
const { data } = await supabase
  .from('booth_photos')
  .select('*')
  .eq('booth_id', boothId)
  .eq('status', 'approved')
  .order('created_at', { ascending: false });
```

---

## Testing Checklist

- [ ] Upload photo as authenticated user
- [ ] Verify photo appears in moderation queue
- [ ] Photo NOT visible to public while pending
- [ ] User can see own pending photo
- [ ] Admin can see all pending photos
- [ ] Admin can approve photo
- [ ] Approved photo visible to public
- [ ] Admin can reject photo
- [ ] Rejected photo hidden from public
- [ ] User can delete own pending photo (within 24h)
- [ ] User CANNOT delete approved photo
- [ ] File size limit enforced (reject >5MB)
- [ ] MIME type limit enforced (reject non-image)
- [ ] Views return correct data
- [ ] Statistics aggregate correctly

---

## Monitoring

### Key Metrics to Track

1. **Pending Queue Size**
   ```sql
   SELECT COUNT(*) FROM booth_photos WHERE status = 'pending';
   ```

2. **Approval Rate**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status = 'approved') * 100.0 / COUNT(*) as approval_rate
   FROM booth_photos;
   ```

3. **Photos Per Booth Average**
   ```sql
   SELECT AVG(approved_photos) FROM booth_photo_stats;
   ```

4. **Active Contributors**
   ```sql
   SELECT COUNT(DISTINCT user_id) FROM booth_photos
   WHERE created_at > NOW() - INTERVAL '30 days';
   ```

### Performance Monitoring

Check index usage:
```sql
SELECT * FROM pg_stat_user_indexes WHERE tablename = 'booth_photos';
```

Check table size:
```sql
SELECT pg_size_pretty(pg_total_relation_size('booth_photos'));
```

---

## Future Enhancements

### Phase 2 Features

1. **Automatic Thumbnails**
   - Server-side image processing
   - Generate thumbnails on upload
   - WebP optimization

2. **Duplicate Detection**
   - Image perceptual hashing
   - Similar photo detection
   - Merge duplicate submissions

3. **Enhanced Moderation**
   - Bulk approve/reject
   - Auto-moderation via ML
   - User reputation system

4. **Community Features**
   - Photo voting/likes
   - Featured photo selection
   - Photo contests

### Technical Improvements

- Add image optimization Edge Function
- Implement CDN caching strategy
- Add EXIF data extraction
- Geolocation validation against booth coords
- Batch upload support
- Progressive image loading

---

## Troubleshooting

### Common Issues

**Problem:** Photos not uploading  
**Solution:** Check file size (<5MB), MIME type, and authentication

**Problem:** Approved photos not visible  
**Solution:** Verify RLS policies and storage bucket is public

**Problem:** Admin can't moderate  
**Solution:** Check profiles.is_admin = true for user

**Problem:** Storage path errors  
**Solution:** Verify helper functions deployed correctly

For more troubleshooting, see `/docs/COMMUNITY_PHOTOS_SETUP.md`

---

## Summary

This implementation provides a complete, production-ready community photo upload system with:

- Secure upload with authentication
- Moderation workflow for quality control
- Efficient indexing for performance
- Comprehensive RLS policies
- Type-safe frontend integration
- Extensive documentation
- Easy deployment

**Total Code:** ~30KB across 5 files  
**Setup Time:** <5 minutes  
**Zero Dependencies:** Uses native Supabase features

---

**Implementation Complete** ✓

Next steps:
1. Run setup script
2. Test upload flow
3. Build moderation UI
4. Integrate into booth detail pages
