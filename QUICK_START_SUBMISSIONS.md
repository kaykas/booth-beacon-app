# Booth Submissions - Quick Start Guide

## 🚀 Getting Started (3 Steps)

### Step 1: Apply Database Migration (REQUIRED)

**Go to**: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new

**Run this SQL**:
```sql
-- Copy contents from: supabase/migrations/20260103_create_booth_submissions_table.sql
-- Paste into SQL editor and click "Run"
```

### Step 2: Deploy to Production

```bash
git add .
git commit -m "Add booth submissions admin review system"
git push origin main
```

Vercel will auto-deploy in ~2 minutes.

### Step 3: Test It!

1. **Submit**: https://your-app.com/submit
2. **Review**: https://your-app.com/admin/submissions
3. **Approve/Reject**: Click buttons, done!

---

## 📋 What You Get

### For Users
- Submit booth → Goes to review queue
- Clear status: "Pending review"
- Same easy form, nothing changes

### For Admins
- New page: `/admin/submissions`
- See all pending submissions
- Approve = Creates booth in main table
- Reject = Mark with reason, stays in queue
- Beautiful card UI with photos

### Admin Dashboard Updates
- New "Review Submissions" card (blue)
- Shows pending count with badge
- Quick stats bar updated

---

## 🎯 Key Features

✅ **Quality Control** - All submissions reviewed before going live
✅ **Spam Prevention** - Bad submissions don't pollute main database
✅ **Audit Trail** - Track who submitted, who reviewed, when, why
✅ **Clean UX** - Clear feedback for both users and admins
✅ **Flexible** - Add admin notes, rejection reasons

---

## 📊 Database Flow

```
User submits booth
    ↓
booth_submissions table (status: pending)
    ↓
Admin reviews at /admin/submissions
    ↓
    ├─ APPROVE → Creates booth in booths table
    │            Links via approved_booth_id
    │            Status: approved
    │
    └─ REJECT  → Stays in booth_submissions
                 Status: rejected
                 Reason recorded
```

---

## 🔧 URLs to Know

- **Submit Form**: `/submit`
- **Admin Dashboard**: `/admin`
- **Submissions Review**: `/admin/submissions`
- **Supabase SQL Editor**: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new

---

## 📁 New Files

```
supabase/migrations/
  └── 20260103_create_booth_submissions_table.sql  ← Database schema

src/app/admin/submissions/
  └── page.tsx                                      ← Admin review UI

src/app/api/admin/submissions/
  ├── approve/route.ts                              ← Approve endpoint
  └── reject/route.ts                               ← Reject endpoint

Updated files:
  - src/app/submit/page.tsx                         ← Now uses submissions table
  - src/app/admin/page.tsx                          ← Added submissions card
```

---

## 🧪 Quick Test

```bash
# 1. Apply migration (see Step 1 above)

# 2. Start dev server
npm run dev

# 3. Test submission
open http://localhost:3000/submit
# Fill form → Submit

# 4. Test review
open http://localhost:3000/admin/submissions
# Click Approve or Reject

# 5. Verify booth created
open http://localhost:3000/map
# Search for your test booth
```

---

## 🆘 Troubleshooting

**Migration fails?**
```sql
-- Drop and retry:
DROP TABLE IF EXISTS booth_submissions CASCADE;
-- Then run migration again
```

**Can't see submissions?**
- Check you're logged in as admin
- Verify in Supabase: `profiles` table → `is_admin = true`

**Approve/Reject not working?**
- Check browser console for errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`

---

## 📚 Full Documentation

- **Implementation Details**: `BOOTH_SUBMISSIONS_IMPLEMENTATION.md`
- **Testing Guide**: `scripts/test-submission-system.md`

---

**That's it!** Apply migration → Deploy → Test. You're good to go! 🎉
