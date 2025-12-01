# Migration Instructions: Add AI-Generated Images Support

## Migration File
Location: `/Users/jkw/Projects/booth-beacon-app/supabase/migrations/20250130_add_ai_generated_images.sql`

## Status
**NOT YET APPLIED** - The migration needs to be applied to the database.

## What This Migration Does
1. Adds three new columns to the `booths` table:
   - `ai_generated_image_url` (TEXT) - Stores the URL of AI-generated images
   - `ai_image_prompt` (TEXT) - Stores the prompt used to generate the image
   - `ai_image_generated_at` (TIMESTAMPTZ) - Stores when the image was generated

2. Creates an index on `ai_generated_image_url` for efficient queries

3. Creates a `booth-images` storage bucket (if it doesn't exist) for storing images

4. Sets up Row Level Security (RLS) policies for the storage bucket:
   - Public read access for all booth images
   - Service role can upload, update, and delete images

## Option 1: Apply via Supabase Dashboard (Recommended)

1. Go to the SQL Editor in your Supabase Dashboard:
   https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new

2. Copy the SQL from the migration file:
   ```bash
   cat /Users/jkw/Projects/booth-beacon-app/supabase/migrations/20250130_add_ai_generated_images.sql
   ```

3. Paste it into the SQL Editor

4. Click "Run" to execute the migration

5. Verify success by running:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'booths'
   AND column_name LIKE 'ai_%';
   ```

## Option 2: Apply via Supabase CLI (Requires Database Password)

If you have the database password, you can use:

```bash
cd /Users/jkw/Projects/booth-beacon-app
npx supabase db push --db-url "postgres://postgres:[YOUR_DB_PASSWORD]@db.tmgbmcbwfkvmylmfpkzy.supabase.co:5432/postgres"
```

To get your database password:
1. Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/settings/database
2. Look for "Database Password" or "Reset Database Password"

## Option 3: Apply via psql (Requires Database Password)

```bash
PGPASSWORD="[YOUR_DB_PASSWORD]" psql \\
  -h db.tmgbmcbwfkvmylmfpkzy.supabase.co \\
  -p 5432 \\
  -U postgres \\
  -d postgres \\
  -f /Users/jkw/Projects/booth-beacon-app/supabase/migrations/20250130_add_ai_generated_images.sql
```

## Verification

After applying the migration, you can verify it was successful by running:

```bash
node /Users/jkw/Projects/booth-beacon-app/apply-migration.mjs
```

This script will check if the columns exist and confirm the migration status.

## Why Automated Application Failed

- The Supabase service role key (JWT token) is used for API authentication, not database authentication
- Direct database access requires the actual database password
- The Supabase REST API (PostgREST) doesn't support arbitrary SQL execution for security reasons
- SQL execution is only available through:
  - The Supabase Dashboard SQL Editor (web interface)
  - Direct PostgreSQL connection with database password
  - Supabase Management API with a personal access token (not service role key)

## Next Steps

Please use **Option 1** (Supabase Dashboard) as it's the quickest and most straightforward method.
