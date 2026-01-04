# Booth Submission Workflow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER SUBMISSION FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

   👤 User                           🗄️ Database                    👨‍💼 Admin
     │                                    │                              │
     │ 1. Visit /submit                  │                              │
     │ ─────────────────>                │                              │
     │                                    │                              │
     │ 2. Fill form & submit             │                              │
     │ ──────────────────────────────>   │                              │
     │                                    │                              │
     │                              INSERT INTO                          │
     │                          booth_submissions                        │
     │                          status: 'pending'                        │
     │                                    │                              │
     │ 3. See success message             │                              │
     │    "Pending review"                │                              │
     │ <──────────────────────────────   │                              │
     │                                    │                              │
     │                                    │   4. Visit /admin            │
     │                                    │   ────────────────────────>  │
     │                                    │                              │
     │                                    │   5. See pending count       │
     │                                    │   <──────────────────────    │
     │                                    │       "1 pending"            │
     │                                    │                              │
     │                                    │   6. Click "Review           │
     │                                    │      Submissions"            │
     │                                    │   ────────────────────────>  │
     │                                    │                              │
     │                                    │   7. View submission         │
     │                              SELECT FROM                          │
     │                          booth_submissions                        │
     │                           WHERE status =                          │
     │                              'pending'                            │
     │                                    │   <──────────────────────    │
     │                                    │                              │
     │                                    │   8a. APPROVE ───┐           │
     │                                    │                  │           │
     │                              INSERT INTO            │           │
     │                                 booths              │           │
     │                          (create new booth)        │           │
     │                                    │                  │           │
     │                              UPDATE                  │           │
     │                          booth_submissions          │           │
     │                          status: 'approved'         │           │
     │                         approved_booth_id: X        │           │
     │                                    │   <──────────────┘           │
     │                                    │                              │
     │                                    │   8b. REJECT ─────┐          │
     │                                    │                   │          │
     │                              UPDATE                   │          │
     │                          booth_submissions           │          │
     │                          status: 'rejected'          │          │
     │                         rejection_reason: "..."      │          │
     │                                    │   <───────────────┘          │
     │                                    │                              │
     │                                    │   9. See success toast       │
     │                                    │   ────────────────────────>  │
     │                                    │                              │
     │                                    │  10. Submission updated      │
     │                                    │   <──────────────────────    │
     │                                    │                              │
     └────────────────────────────────────┴──────────────────────────────┘
```

## Database Schema Relationships

```
┌──────────────────────┐         ┌──────────────────────┐
│   auth.users         │         │      profiles        │
│──────────────────────│         │──────────────────────│
│ id (PK)              │◄────────│ id (FK)              │
│ email                │         │ is_admin             │
└──────────────────────┘         └──────────────────────┘
         ▲                                   ▲
         │                                   │
         │ submitted_by                      │ reviewed_by
         │                                   │
┌────────┴─────────────────────┐            │
│   booth_submissions          │            │
│──────────────────────────────│            │
│ id (PK)                      │            │
│ name                         │            │
│ address                      │            │
│ city                         │            │
│ country                      │            │
│ status ('pending', etc.)     │            │
│ submitted_by (FK) ───────────┘            │
│ reviewed_by (FK) ─────────────────────────┘
│ approved_booth_id (FK) ──┐
│ rejection_reason         │
│ admin_notes              │
└──────────────────────────┘
                           │
                           │
                           ▼
┌──────────────────────────┐
│         booths           │
│──────────────────────────│
│ id (PK) ◄────────────────┘
│ name                     │
│ slug (unique)            │
│ address                  │
│ city                     │
│ country                  │
│ status ('unverified')    │
│ latitude                 │
│ longitude                │
│ ...                      │
└──────────────────────────┘
```

## Status Flow

```
                    booth_submissions
                           │
                           │
          ┌────────────────┴────────────────┐
          │                                  │
          │         status: 'pending'        │
          │                                  │
          └────────────┬─────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
   APPROVE                        REJECT
        │                             │
        ▼                             ▼
┌───────────────────┐      ┌──────────────────────┐
│ status: 'approved'│      │  status: 'rejected'  │
│                   │      │                      │
│ ✓ Creates booth   │      │ ✗ No booth created   │
│ ✓ Links booth ID  │      │ ✓ Reason recorded    │
│ ✓ Admin notes     │      │ ✓ Admin notes        │
└───────────────────┘      └──────────────────────┘
        │
        └──> New booth in 'booths' table
             - status: 'unverified'
             - ingested_by: 'contributor'
             - Can be promoted to 'active' later
```

## API Endpoints Flow

### Approve Flow
```
POST /api/admin/submissions/approve
  │
  ├─> Validate submission exists
  ├─> Check status is 'pending'
  ├─> Generate unique slug
  │     └─> Check for conflicts
  │           └─> Add counter if needed
  │
  ├─> Create booth in 'booths' table
  │     └─> All submission data
  │
  └─> Update submission
        ├─> status: 'approved'
        ├─> reviewed_at: NOW()
        ├─> admin_notes: (optional)
        └─> approved_booth_id: <new booth id>
```

### Reject Flow
```
POST /api/admin/submissions/reject
  │
  ├─> Validate submission exists
  ├─> Check status is 'pending'
  ├─> Validate rejection reason provided
  │
  └─> Update submission
        ├─> status: 'rejected'
        ├─> reviewed_at: NOW()
        ├─> rejection_reason: (required)
        └─> admin_notes: (optional)
```

## UI Components Flow

```
/submit (User Form)
    │
    ├─> FormData state
    ├─> Validation
    ├─> useAuth() for user ID
    └─> Insert to booth_submissions
            └─> Success → Show thank you message

/admin (Dashboard)
    │
    ├─> Load stats
    │     └─> Count booth_submissions where status='pending'
    ├─> Display "Review Submissions" card
    │     └─> Badge with pending count
    └─> Link to /admin/submissions

/admin/submissions (Review Page)
    │
    ├─> Load submissions
    │     └─> Filter by status
    ├─> Display in card layout
    │     ├─> Photo preview
    │     ├─> Submission details
    │     └─> Approve/Reject buttons
    │
    ├─> Click Approve
    │     └─> Modal
    │           ├─> Optional admin notes
    │           └─> POST to /api/admin/submissions/approve
    │
    └─> Click Reject
          └─> Modal
                ├─> Required rejection reason
                ├─> Optional admin notes
                └─> POST to /api/admin/submissions/reject
```

## Row Level Security (RLS) Policies

```
booth_submissions table
    │
    ├─> SELECT (View)
    │     ├─> Users: Can view own submissions
    │     │     WHERE auth.uid() = submitted_by
    │     │
    │     └─> Admins: Can view all submissions
    │           WHERE auth.role() = 'service_role'
    │
    ├─> INSERT (Create)
    │     └─> Authenticated users only
    │           WHERE auth.role() = 'authenticated'
    │                 AND auth.uid() = submitted_by
    │
    └─> UPDATE (Modify)
          ├─> Users: Can update own pending submissions
          │     WHERE auth.uid() = submitted_by
          │           AND status = 'pending'
          │
          └─> Admins: Can update all submissions
                WHERE auth.role() = 'service_role'
```

## Key Design Decisions

### 1. Separate Table Approach
✅ **Why?**
- Clean separation of concerns
- Preserves original submission data
- Easy to audit and track changes
- Doesn't pollute main booths table
- Can implement different validation rules

### 2. Approved Booths Start as 'unverified'
✅ **Why?**
- Admin can review content separately
- Can be promoted to 'active' after verification
- Consistent with existing moderation flow
- Allows for gradual quality improvement

### 3. Rejection Reason Required
✅ **Why?**
- Provides feedback to submitters (future feature)
- Helps improve submission quality
- Creates audit trail
- Can be used for analytics

### 4. Admin Notes Optional
✅ **Why?**
- Flexible for internal communication
- Not always necessary
- Can add context for future reference
- Doesn't slow down review process

### 5. Link to Approved Booth
✅ **Why?**
- Easy to find final booth
- Track conversion rate
- Can update submission if booth changes
- Useful for analytics

## Performance Considerations

```
Indexes created:
  ├─> booth_submissions_status_idx
  │     └─> Fast filtering by status
  ├─> booth_submissions_submitted_by_idx
  │     └─> Fast user lookups
  ├─> booth_submissions_submitted_at_idx
  │     └─> Fast chronological queries
  └─> booth_submissions_pending_idx (partial)
        └─> Optimized for admin dashboard
            WHERE status = 'pending'
```

## Security Flow

```
API Request
    │
    ├─> Check authorization header
    │     └─> Reject if missing
    │
    ├─> Use service role key
    │     └─> Bypass RLS for admin operations
    │
    ├─> Validate request data
    │     └─> Check required fields
    │
    ├─> Execute database operation
    │     └─> Transaction-safe
    │
    └─> Return response
          ├─> Success with data
          └─> Error with details
```

---

## Next Steps (Future Enhancements)

1. **Email Notifications** 📧
   - Admin alert on new submission
   - User notification on review

2. **Bulk Actions** 🔄
   - Approve/reject multiple at once
   - Batch operations

3. **Submission Editing** ✏️
   - Admin can edit before approving
   - User can edit pending submissions

4. **Auto-geocoding** 🗺️
   - Geocode on approval
   - Add to processing queue

5. **Analytics Dashboard** 📊
   - Submission trends
   - Review time metrics
   - Approval/rejection rates

---

**Current Status**: ✅ Fully implemented and ready for deployment!
