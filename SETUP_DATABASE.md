# 🚀 Booth Beacon Database Setup

## Why the site isn't working yet

Your Vercel deployment is live, but **the Supabase database is empty**. You need to run the schema to create all the tables.

## Quick Setup (5 minutes)

### Step 1: Run the Database Schema

1. **Open Supabase SQL Editor:**
   👉 https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new

2. **Copy the entire contents** of `supabase/schema.sql`

3. **Paste into the SQL Editor**

4. **Click "RUN"** (bottom right corner)

5. **Wait for success message:** ✅ "Success. No rows returned"

### Step 2: Verify Tables Created

1. Go to **Table Editor**: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/editor

2. You should see these tables:
   - ✅ booths
   - ✅ profiles
   - ✅ operators
   - ✅ machine_models
   - ✅ city_guides
   - ✅ booth_bookmarks
   - ✅ collections
   - ✅ booth_comments
   - ✅ booth_user_photos

3. Click on **booths** table - you should see 3 sample booths (Berlin, NYC, London)

### Step 3: Test Your Site

1. **Visit your Vercel site:** https://boothbeacon.org

2. **You should now see:**
   - ✅ Homepage loads with stats
   - ✅ Featured booths appear
   - ✅ Map shows booth markers
   - ✅ Search works
   - ✅ Individual booth pages load

## What the Schema Creates

### Core Tables

**booths** - All photo booth locations worldwide
- Location data (address, lat/lng)
- Machine details (model, type, photos)
- Operational status
- Sample data: 3 booths in Berlin, NYC, London

**profiles** - User profiles (extends Supabase auth)
- Links to auth.users
- Full name, avatar, bio
- Social links

**operators** - Booth operators/companies
- Company info, story, location
- Used for "Operators" pages

**machine_models** - Photo booth machine types
- Model details, manufacturer
- Collector notes, features
- Used for "Machines" pages

### Community Tables

**booth_bookmarks** - User saved booths
- Personal notes
- Visited tracking
- Collections support

**collections** - User-created booth lists
- Public/private
- Custom names and descriptions

**booth_comments** - Reviews and tips
- Star ratings
- Community feedback

**booth_user_photos** - User-submitted photo strips
- Moderation system
- Photo gallery feature

**city_guides** - Curated walking tours
- Multi-booth routes
- Tips and estimated time

### Security (RLS Policies)

All tables have Row Level Security enabled:
- ✅ Public data viewable by everyone
- ✅ Users can only modify their own data
- ✅ Admin functions protected

## Troubleshooting

### Issue: "relation 'public.booths' does not exist"
**Fix:** You haven't run the schema yet. Go to Step 1 above.

### Issue: SQL errors when running schema
**Fix:**
1. Make sure you're in the correct Supabase project
2. Try running the schema in sections if it fails
3. Check for any pre-existing tables with same names

### Issue: Sample data doesn't appear
**Fix:** The INSERT statement at the end has `ON CONFLICT DO NOTHING`, so if data exists it won't duplicate. This is normal.

### Issue: Authentication doesn't work
**Fix:**
1. Check Google OAuth is configured (see VERCEL_ENV_SETUP.md)
2. Verify redirect URLs in Supabase Auth settings
3. Make sure environment variables are set in Vercel

## Next Steps After Setup

1. ✅ **Add More Booth Data:**
   - Use the "Add a Booth" feature
   - Or bulk import via SQL

2. ✅ **Test Features:**
   - Create an account
   - Bookmark booths
   - Leave comments
   - Upload photos

3. ✅ **Configure Google Maps:**
   - Enable Maps JavaScript API
   - Enable Geocoding API
   - Enable Places API
   - In Google Cloud Console

4. ✅ **Update OAuth Redirect URLs:**
   - See VERCEL_ENV_SETUP.md Step 2-3

## Questions?

If you run into issues:
1. Check Supabase logs: Dashboard > Logs
2. Check Vercel logs: Dashboard > Logs
3. Check browser console for errors
4. Verify all environment variables are set

---

**Pro Tip:** Bookmark the Supabase Table Editor - you'll use it often to view/edit data during development.
