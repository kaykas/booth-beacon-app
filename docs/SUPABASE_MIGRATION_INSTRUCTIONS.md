# Supabase Dashboard Migration Instructions

## Apply Job Queue Migration (006_crawl_job_queue.sql)

Follow these exact steps to apply the crawl job queue database migration via the Supabase Dashboard:

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Sign in with your credentials
3. Select your project: **tmgbmcbwfkvmylmfpkzy** (Booth Beacon)

### Step 2: Open SQL Editor
1. In the left sidebar, click **"SQL Editor"**
2. Click **"New query"** button (top right)

### Step 3: Copy Migration SQL
Open the migration file at: `supabase/migrations/006_crawl_job_queue.sql`

Copy the ENTIRE contents of the file (all 65 lines)

### Step 4: Paste and Execute
1. Paste the SQL into the SQL Editor
2. Click **"Run"** button (or press Cmd+Enter / Ctrl+Enter)

### Step 5: Verify Success
You should see output similar to:
```
Success. No rows returned
```

If you see errors about objects already existing, that's OK - the migration uses `IF NOT EXISTS` clauses.

### Step 6: Verify Table Created
1. In left sidebar, click **"Table Editor"**
2. Look for table named **"crawl_job_queue"**
3. Click on it to see the empty table structure
4. You should see columns: id, source_id, source_name, priority, status, scheduled_for, etc.

### Step 7: Test in App
1. Go to your admin panel: https://boothbeacon.org/admin
2. Navigate to the **"Job Queue"** tab
3. You should now see the job queue interface working
4. Try adding a test job to verify it's working

## Troubleshooting

**If you see "relation already exists" errors:**
- This is normal if the table was created in a previous attempt
- Check Table Editor to confirm the table exists
- If it exists, you're done!

**If you see permission errors:**
- Make sure you're signed in as the project owner
- Check that your account has admin access to the project

**If the Job Queue tab shows errors:**
- Check browser console (F12) for JavaScript errors
- Verify the table name matches exactly: `crawl_job_queue`
- Check that RLS policies were created successfully

##Done!
The crawl job queue feature should now be fully functional in your admin panel.
