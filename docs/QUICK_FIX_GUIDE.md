# 🚀 Quick Fix Guide - 3 Minutes

## Step 1: Open SQL Editor (1 min)
**Click here:** https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new

## Step 2: Run Migration (1 min)
1. Open file: `supabase/migrations/20260103_fix_security_issues.sql`
2. Copy all (Cmd+A, Cmd+C)
3. Paste in SQL Editor (Cmd+V)
4. Click **"Run"** or press **Cmd+Enter**
5. Wait for success message

## Step 3: Enable Auth Protection (1 min)
**Click here:** https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/auth/settings

1. Scroll to **"Security"**
2. Enable **"Leaked Password Protection"**
3. Click **"Save"**

---

## ✅ Done!
All security issues fixed. Your database is now fully compliant.

---

## What Got Fixed?
- ✅ 4 SECURITY DEFINER views removed
- ✅ 3 tables now have RLS enabled
- ✅ 22 functions secured with search_path
- ✅ Leaked password protection enabled

---

## Verification (Optional)
Run this in SQL Editor to verify:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('spatial_ref_sys', 'crawl_jobs', 'crawl_raw_content');
```
All should show `rowsecurity = true`

---

**Need more details?** See `SECURITY_FIXES_SUMMARY.md`

**Having issues?** See `SECURITY_FIXES_README.md`

**Want a visual guide?** Open `apply-security-fixes.html` in your browser
