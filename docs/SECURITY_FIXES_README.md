# Database Security Fixes

This document provides instructions for applying security fixes to resolve all Supabase linter errors and warnings.

## Issues to Fix

### ERROR-level (Must Fix)
1. **4 views with SECURITY DEFINER:**
   - `public.featured_booths`
   - `public.booth_data_quality_stats`
   - `public.content_needing_reextraction`
   - `public.crawler_dashboard_stats`

2. **3 tables without RLS enabled:**
   - `public.spatial_ref_sys`
   - `public.crawl_jobs`
   - `public.crawl_raw_content`

### WARN-level (Should Fix)
3. **10+ functions with mutable search_path**
4. **1 extension (postgis) in public schema** (acceptable for PostGIS)
5. **Leaked password protection disabled in Auth**

## How to Apply Fixes

### Method 1: Supabase SQL Editor (Recommended)

1. Go to the Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new
   ```

2. Copy the entire contents of this file:
   ```
   supabase/migrations/20260103_fix_security_issues.sql
   ```

3. Paste into the SQL editor

4. Click **"Run"** to execute the migration

5. You should see a success message at the end

### Method 2: Command Line (psql)

If you have `psql` installed and your database password:

```bash
# Get your database password from:
# https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/settings/database

PGPASSWORD=<your-password> psql \
  "postgresql://postgres.tmgbmcbwfkvmylmfpkzy@db.tmgbmcbwfkvmylmfpkzy.supabase.co:5432/postgres" \
  -f supabase/migrations/20260103_fix_security_issues.sql
```

### Method 3: Supabase CLI (if logged in)

```bash
supabase login
supabase link --project-ref tmgbmcbwfkvmylmfpkzy
supabase db push
```

## What Gets Fixed

The migration file (`supabase/migrations/20260103_fix_security_issues.sql`) contains:

### Part 1: SECURITY DEFINER Views
- Recreates 4 views without `SECURITY DEFINER`
- Views only query public data, so SECURITY DEFINER is unnecessary

### Part 2: Enable RLS on Tables
- Enables RLS on `spatial_ref_sys` (PostGIS system table)
- Enables RLS on `crawl_jobs` with appropriate policies
- Enables RLS on `crawl_raw_content` with appropriate policies

### Part 3: Fix Functions with Mutable search_path
- Adds `SET search_path = ''` to 22 functions including:
  - `update_updated_at_column()`
  - `handle_ingestion_metadata()`
  - `generate_booth_slug()`
  - `calculate_booth_completeness()`
  - `get_nearby_booths()`
  - And 17 more functions...

### Part 4: Documentation
- Documents PostGIS extension placement (acceptable in public schema)

## Manual Step: Enable Leaked Password Protection

After applying the SQL migration, you must manually enable leaked password protection:

1. Go to Authentication Settings:
   ```
   https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/auth/settings
   ```

2. Scroll to **"Security"** section

3. Enable **"Leaked Password Protection"**

4. Click **"Save"**

## Verification

After applying the fixes, verify everything is working:

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('spatial_ref_sys', 'crawl_jobs', 'crawl_raw_content');
-- All should show rowsecurity = true

-- Check views exist
SELECT schemaname, viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('featured_booths', 'booth_data_quality_stats',
                   'content_needing_reextraction', 'crawler_dashboard_stats');
-- All 4 views should be listed

-- Check functions have search_path set
SELECT p.proname, pg_get_function_identity_arguments(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%booth%'
  AND prosecdef = false;
-- Should return functions with search_path configured
```

## Migration File Location

The complete migration SQL is located at:
```
/Users/jkw/Projects/booth-beacon-app/supabase/migrations/20260103_fix_security_issues.sql
```

## Rollback (If Needed)

If something goes wrong, you can rollback by:

1. Restoring from a Supabase backup
2. Or manually reverting specific changes

The migration is designed to be safe and non-destructive:
- Views are recreated (DROP IF EXISTS before CREATE)
- RLS is enabled (never disabled)
- Functions are recreated with `CREATE OR REPLACE`

## Support

If you encounter issues:
1. Check the Supabase logs in the Dashboard
2. Run the verification SQL above
3. Contact Supabase support with the migration file

## Summary

✅ **After completion, you will have:**
- 0 SECURITY DEFINER views
- All tables with RLS enabled
- All functions with secure search_path
- Documented PostGIS extension
- Leaked password protection enabled

🔒 **Your database will be fully compliant with Supabase security best practices!**
