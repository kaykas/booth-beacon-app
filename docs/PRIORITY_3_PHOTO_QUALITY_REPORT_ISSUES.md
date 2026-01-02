# Priority 3: Photo Quality Indicators + Report Issues Implementation

**Date:** December 20, 2025
**Status:** ✅ Complete - Ready for Database Migration
**UX Recommendations:** #11 and #12 from UX_RECOMMENDATIONS.md

---

## Summary

Implemented two key content quality improvements:

1. **Photo Quality Indicators** - Visual badges showing photo sources (Community, AI Generated, AI Preview)
2. **Quick Report Issue System** - Streamlined issue reporting with specific categories and database storage

---

## 1. Photo Quality Indicators

### Implementation

**File Modified:** `/Users/jkw/Projects/booth-beacon-app/src/components/booth/BoothImage.tsx`

**Changes:**
- Added semi-transparent badge overlays on all booth images
- Three badge types with distinct styling:
  - 📸 **Community Photo** - Green badge for user-uploaded real photos
  - 🤖 **AI Generated** - Purple badge for AI-generated art
  - **AI Preview** - Black badge for placeholder images

**Visual Design:**
- Small text (text-xs) with semi-transparent backgrounds (bg-{color}/90)
- Backdrop blur effect for readability (backdrop-blur-sm)
- Shadow for depth (shadow-sm)
- Positioned at bottom-right (absolute bottom-2 right-2)
- Emoji icons for quick visual recognition

**Badge Logic:**
```typescript
{showAiBadge && (
  <>
    {hasAiGenerated && (
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-purple-600/90 text-white text-xs rounded backdrop-blur-sm flex items-center gap-1 shadow-sm z-10">
        <span className="text-[10px]">🤖</span> AI Generated
      </div>
    )}
    {hasAiPreview && (
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded backdrop-blur-sm shadow-sm z-10">
        AI Preview
      </div>
    )}
    {booth.photo_exterior_url && !hasAiGenerated && !hasAiPreview && (
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-green-600/90 text-white text-xs rounded backdrop-blur-sm flex items-center gap-1 shadow-sm z-10">
        <span className="text-[10px]">📸</span> Community Photo
      </div>
    )}
  </>
)}
```

---

## 2. Quick Report Issue System

### Database Schema

**Migration File:** `/Users/jkw/Projects/booth-beacon-app/supabase/migrations/20251220_create_booth_issues_table.sql`

**Table: `booth_issues`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `booth_id` | UUID | Foreign key to booths table |
| `user_id` | UUID | Foreign key to auth.users (nullable for anonymous) |
| `issue_type` | TEXT | Enum: 'closed', 'incorrect_info', 'inappropriate_photo', 'other' |
| `description` | TEXT | Optional detailed description |
| `status` | TEXT | Enum: 'pending', 'reviewed', 'resolved', 'dismissed' |
| `created_at` | TIMESTAMPTZ | Automatic timestamp |
| `updated_at` | TIMESTAMPTZ | Auto-updated on changes |
| `resolved_at` | TIMESTAMPTZ | Timestamp when resolved |
| `admin_notes` | TEXT | Admin comments on the issue |
| `resolved_by` | UUID | Admin who resolved it |

**Indexes:**
- `idx_booth_issues_booth_id` - Fast lookups by booth
- `idx_booth_issues_user_id` - User's submitted issues
- `idx_booth_issues_status` - Filter by status
- `idx_booth_issues_created_at` - Recent issues first

**Security:**
- Row Level Security (RLS) enabled
- Public read access (transparency)
- Authenticated users can create issues
- Users can update their own issues (24-hour window)
- Admins can update any issue

**View: `booth_issue_stats`**
- Aggregated statistics per booth
- Total, pending, and resolved counts
- Issue type breakdown
- Last issue timestamp

### Components Created

#### 1. ReportIssueDialog.tsx
**Location:** `/Users/jkw/Projects/booth-beacon-app/src/components/booth/ReportIssueDialog.tsx`

**Features:**
- Modal dialog with clear issue type selection
- Four issue categories:
  1. **Booth is Closed/Removed** (🚫) - Permanent closure
  2. **Information is Incorrect** (⚠️) - Wrong hours, address, cost, etc.
  3. **Photo is Inappropriate** (📷) - Offensive or incorrect images
  4. **Other Issue** (🚩) - Catch-all category
- Optional description field for additional details
- Success state with confirmation message
- Handles both authenticated and anonymous users
- Toast notifications for feedback
- Loading states during submission

**User Experience:**
- Single-click issue type selection
- Visual feedback with checkmarks
- Auto-closes after successful submission
- Clear error handling

#### 2. ReportIssueButton.tsx
**Location:** `/Users/jkw/Projects/booth-beacon-app/src/components/booth/ReportIssueButton.tsx`

**Features:**
- Card-based container matching site design
- Flag icon for visual recognition
- Descriptive text explaining purpose
- Opens ReportIssueDialog on click
- Integrates seamlessly into booth detail sidebar

### Integration

**File Modified:** `/Users/jkw/Projects/booth-beacon-app/src/app/booth/[slug]/page.tsx`

**Changes:**
1. Added import: `import { ReportIssueButton } from '@/components/booth/ReportIssueButton';`
2. Replaced static "Report Issue" card with dynamic component:
   ```tsx
   {/* Report Issue - Priority 3 Implementation */}
   <ReportIssueButton boothId={booth.id} boothName={booth.name} />
   ```

**Location in Page:**
- Right sidebar, below Visit Checklist
- Above discovery sections
- Always visible for easy access

---

## Database Migration Instructions

### Option 1: Supabase Dashboard (Recommended)

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new)
2. Copy the contents of `/Users/jkw/Projects/booth-beacon-app/supabase/migrations/20251220_create_booth_issues_table.sql`
3. Paste into the SQL editor
4. Click "Run" to execute the migration
5. Verify table creation:
   ```sql
   SELECT * FROM booth_issues LIMIT 1;
   SELECT * FROM booth_issue_stats LIMIT 5;
   ```

### Option 2: Supabase CLI

```bash
# Ensure you're logged in
supabase login

# Link to the project (if not already linked)
supabase link --project-ref tmgbmcbwfkvmylmfpkzy

# Push the migration
supabase db push
```

### Option 3: Direct psql

```bash
# Using the service role key from .env.local
PGPASSWORD="your-service-role-key" psql \
  "postgresql://postgres.tmgbmcbwfkvmylmfpkzy@aws-0-us-west-1.pooler.supabase.com:5432/postgres" \
  -f supabase/migrations/20251220_create_booth_issues_table.sql
```

### Verification

After migration, verify the setup:

```sql
-- Check table exists
\d booth_issues

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'booth_issues';

-- Check view
SELECT * FROM booth_issue_stats LIMIT 5;

-- Test insert (will fail without auth, which is expected)
INSERT INTO booth_issues (booth_id, issue_type, description)
VALUES (
  (SELECT id FROM booths LIMIT 1),
  'other',
  'Test issue'
);
```

---

## Testing Checklist

### Photo Quality Indicators
- [ ] Community photos show green "📸 Community Photo" badge
- [ ] AI-generated images show purple "🤖 AI Generated" badge
- [ ] AI preview images show black "AI Preview" badge
- [ ] Badges are visible on all image sizes (thumbnail, card, hero)
- [ ] Badges have proper contrast and readability
- [ ] Hover tooltips still work correctly

### Report Issue System
- [ ] Report button appears in booth detail sidebar
- [ ] Dialog opens when clicking "Report Issue"
- [ ] All four issue types are selectable
- [ ] Visual feedback (checkmark) when issue type selected
- [ ] Optional description field works
- [ ] Submit button disabled until issue type selected
- [ ] Loading state shows during submission
- [ ] Success message appears after submission
- [ ] Dialog auto-closes after success
- [ ] Toast notification confirms submission
- [ ] Works for both authenticated and anonymous users
- [ ] Database record created correctly
- [ ] Status defaults to 'pending'
- [ ] Timestamps set automatically

### Admin Testing (Future)
- [ ] Admin can view all issues
- [ ] Admin can change issue status
- [ ] Admin can add notes
- [ ] Admin can resolve issues
- [ ] Resolved_at timestamp set correctly
- [ ] View `booth_issue_stats` shows accurate counts

---

## Impact & Metrics

### Photo Quality Indicators
**Goal:** Increase trust and reduce confusion about photo sources

**Metrics to Track:**
- User feedback on photo clarity
- Reduction in "wrong photo" reports
- Increase in community photo uploads
- Time on booth pages (should increase with trust)

### Report Issue System
**Goal:** Crowdsource data quality improvements

**Metrics to Track:**
- Number of issues reported per week
- Issue type distribution
- Resolution time (pending → resolved)
- Percentage of valid vs. invalid reports
- Booths with multiple reports (may need review)

**Expected Outcomes:**
- Faster identification of closed booths
- More accurate booth information
- Community engagement and trust
- Reduced manual moderation burden

---

## Future Enhancements

### Short Term
1. Email notifications for admins on new issues
2. Admin dashboard for issue management
3. Bulk issue operations (mark multiple as resolved)
4. Issue history view on booth detail pages (for transparency)

### Medium Term
1. Reputation system for reporters (flag spam/abuse)
2. Auto-close booths with multiple "closed" reports
3. Issue templates for common problems
4. Photo upload during issue reporting
5. Location verification for "moved" reports

### Long Term
1. Machine learning to detect duplicate reports
2. Community voting on issue validity
3. Badge system for helpful reporters
4. Integration with verification workflow
5. Mobile app push notifications for nearby issues

---

## Files Changed

### New Files
1. `/Users/jkw/Projects/booth-beacon-app/src/components/booth/ReportIssueDialog.tsx` (210 lines)
2. `/Users/jkw/Projects/booth-beacon-app/src/components/booth/ReportIssueButton.tsx` (40 lines)
3. `/Users/jkw/Projects/booth-beacon-app/supabase/migrations/20251220_create_booth_issues_table.sql` (129 lines)
4. `/Users/jkw/Projects/booth-beacon-app/scripts/apply-booth-issues-migration.js` (89 lines)
5. This documentation file

### Modified Files
1. `/Users/jkw/Projects/booth-beacon-app/src/components/booth/BoothImage.tsx`
   - Added photo source badges logic
   - ~20 lines changed

2. `/Users/jkw/Projects/booth-beacon-app/src/app/booth/[slug]/page.tsx`
   - Added ReportIssueButton import
   - Replaced static report card with dynamic component
   - ~3 lines changed

**Total Lines Added:** ~468 lines
**Total Lines Modified:** ~23 lines
**Total Files:** 7 (5 new, 2 modified)

---

## Deployment Notes

### Build Status
✅ **Build successful** - No TypeScript or compilation errors

### Pre-Deployment Checklist
- [x] All components implemented
- [x] TypeScript compilation passes
- [x] Build completes successfully
- [ ] Database migration applied
- [ ] Migration verified with test data
- [ ] Visual QA on staging
- [ ] User acceptance testing

### Post-Deployment Monitoring
1. Watch for errors in Sentry/logging
2. Monitor issue submission rate
3. Check database performance
4. Review first week of reports for patterns
5. Adjust issue categories if needed

---

## Support & Maintenance

### Common Issues

**Q: Report submission fails with "unauthorized"**
A: Check RLS policies are enabled and configured correctly. Anonymous users should be able to insert (auth policy).

**Q: Badges not showing on images**
A: Verify `showAiBadge` prop is true and image URL fields are set correctly.

**Q: Migration fails to apply**
A: Check for conflicting table names or policy names. Drop and retry if safe.

### Database Maintenance

```sql
-- Clean up old resolved issues (optional, run periodically)
DELETE FROM booth_issues
WHERE status = 'resolved'
AND resolved_at < NOW() - INTERVAL '1 year';

-- Find booths with many pending issues
SELECT b.name, b.slug, COUNT(*) as pending_issues
FROM booth_issues i
JOIN booths b ON i.booth_id = b.id
WHERE i.status = 'pending'
GROUP BY b.id, b.name, b.slug
HAVING COUNT(*) > 3
ORDER BY pending_issues DESC;

-- Issue type distribution
SELECT issue_type, COUNT(*) as count
FROM booth_issues
GROUP BY issue_type
ORDER BY count DESC;
```

---

## Credits

**Implemented by:** Claude AI (Sonnet 4.5)
**Based on:** UX Recommendations #11 and #12
**For:** Booth Beacon - booth-beacon-app
**Date:** December 20, 2025

---

**Next Steps:**
1. Apply database migration (see instructions above)
2. Test on staging environment
3. Deploy to production
4. Monitor metrics for first week
5. Iterate based on user feedback
