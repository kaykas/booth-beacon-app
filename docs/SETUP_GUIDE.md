# Booth Beacon Setup Guide

## 🗄️ Database Setup (Required)

You need to run 2 SQL migrations in your Supabase dashboard.

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your booth-beacon-app project
3. Click "SQL Editor" in the left sidebar
4. Click "+ New query"

### Step 2: Run Migration 1 - Crawler System

Copy and paste this file's contents into the SQL editor and click "Run":
```
/Users/jkw/Projects/booth-beacon-app/supabase/migrations/001_crawler_system.sql
```

This creates:
- `crawl_sources` table (define data sources)
- `crawler_jobs` table (track crawl jobs)
- `crawler_metrics` table (performance tracking)
- `booth_duplicates` table (deduplication)
- `admin_users` table (admin access control)
- Helper function `is_admin(user_id)`

### Step 3: Run Migration 2 - Crawler Schema Extensions

Copy and paste this file's contents into the SQL editor and click "Run":
```
/Users/jkw/Projects/booth-beacon-app/supabase/migrations/20251127_crawler_schema.sql
```

This extends:
- `booths` table with source tracking columns
- `crawl_sources` with unified-crawler fields
- Creates `crawl_logs` for detailed logging

---

## 🔐 Make Yourself an Admin

After running the migrations, make yourself an admin:

1. In Supabase dashboard, go to **Authentication > Users**
2. Find your user and copy your **User ID**
3. Go to **SQL Editor** and run:

```sql
-- Replace YOUR_USER_ID with your actual user ID
INSERT INTO admin_users (user_id, role, granted_at)
VALUES ('YOUR_USER_ID', 'super_admin', NOW());
```

4. Now you can access `/admin` in the app!

---

## 🚀 Deploy Crawler Edge Function

### Option A: Via Supabase CLI (Recommended)

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the crawler
supabase functions deploy unified-crawler

# Set environment variables
supabase secrets set ANTHROPIC_API_KEY=your_key_here
supabase secrets set FIRECRAWL_API_KEY=your_key_here
```

### Option B: Via Dashboard

1. Go to Supabase Dashboard > Edge Functions
2. Click "+ New Function"
3. Name it `unified-crawler`
4. Copy the contents of `/supabase/functions/unified-crawler/index.ts`
5. Paste and deploy

**Set Environment Variables:**
- Go to Project Settings > Edge Functions > Secrets
- Add:
  - `ANTHROPIC_API_KEY` (for AI extraction)
  - `FIRECRAWL_API_KEY` (for web crawling)
  - `RESEND_API_KEY` (optional, for email notifications)

---

## ✅ Verify Everything Works

### Test 1: Admin Access
1. Go to https://boothbeacon.org/admin
2. You should see the admin dashboard (not "Access Denied")

### Test 2: Bookmarking
1. Browse to any booth detail page
2. Click the heart icon to bookmark
3. Go to `/bookmarks` to see your saved booths

### Test 3: Submit a Booth
1. Go to `/submit`
2. Fill out the form with test data
3. Submit - should show success message
4. Check `/admin` to see pending submission

### Test 4: Collections
1. Go to `/collections`
2. Click on a country or city
3. Should see booths filtered by location

### Test 5: Crawler (Manual Trigger)
1. In Supabase Dashboard > Edge Functions
2. Find `unified-crawler`
3. Click "Invoke"
4. Send payload: `{"sources": ["photobooth.net"], "force": true}`
5. Check `crawler_jobs` table for results

---

## 📦 What Was Built

### ✅ Features Implemented
- [x] Admin authentication & dashboard
- [x] Bookmarking system with notes & visited tracking
- [x] Booth submission form
- [x] Geographic collections (SEO-optimized)
- [x] Unified crawler system (26 files, 7+ sources)
- [x] Dark theme throughout
- [x] Mobile responsive

### 🚧 Coming Next (From Original Site)
- [ ] User authentication (login/signup)
- [ ] Comments & ratings
- [ ] Photo uploads
- [ ] User profiles
- [ ] Activity feed
- [ ] Visit reminders
- [ ] Operator & machine profile pages
- [ ] AI semantic search

---

## 🛠️ Troubleshooting

### "Access Denied" on Admin Page
- Make sure you added yourself to `admin_users` table
- Check that the `is_admin()` function was created
- Verify RLS policies are enabled

### Crawler Not Running
- Check Edge Function logs in Supabase dashboard
- Verify environment variables are set (ANTHROPIC_API_KEY, etc.)
- Check `crawler_jobs` table for error messages
- Make sure `crawl_sources` table has enabled sources

### Bookmarks Not Saving
- Check you're logged in
- Verify `booth_bookmarks` table exists
- Check RLS policies allow INSERT for authenticated users

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

---

## 📚 Documentation Locations

- **Feature Evaluation:** `/FEATURE_EVALUATION.md`
- **Crawler Documentation:** `/supabase/functions/unified-crawler/README.md`
- **Collections Helper:** `/src/lib/collections.ts` (has JSDoc comments)
- **Admin Auth:** `/src/lib/adminAuth.ts` (has JSDoc comments)

---

## 🎯 Quick Start Checklist

- [ ] Apply database migrations (001_crawler_system.sql)
- [ ] Apply crawler schema (20251127_crawler_schema.sql)
- [ ] Make yourself an admin
- [ ] Test admin dashboard access
- [ ] Deploy unified-crawler edge function
- [ ] Set edge function environment variables
- [ ] Test crawler with one source
- [ ] Test bookmarking feature
- [ ] Test submission form
- [ ] Verify collections pages work
- [ ] Set up scheduled crawler job (optional)

---

## 🚀 Production Deployment

Your app is already deployed on Vercel. After applying migrations:

1. Push any local changes:
```bash
git add .
git commit -m "feat: Add admin, bookmarks, collections, submission form, and crawler"
git push
```

2. Vercel will auto-deploy

3. Test on production: https://boothbeacon.org

---

**Need Help?**
- Check the error logs in Supabase Dashboard > Logs
- Check Vercel deployment logs
- Review migration SQL files for any conflicts