# Vercel Environment Variables Setup

## Problem
The booth detail pages were hanging because Supabase environment variables weren't configured in Vercel.

## Required Environment Variables

Go to your Vercel project → Settings → Environment Variables and add these from your `.env.local` file:

### Required (for booth pages to work):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_APP_URL`

### Optional (for crawler/admin features):
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `FIRECRAWL_API_KEY`

## How to Set Variables

### Via Vercel Dashboard:
1. Go to your Vercel project settings
2. Click "Environment Variables"
3. Add each variable name and copy value from `.env.local`
4. Select environments (Production/Preview/Development)
5. Save

### Via Vercel CLI:
```bash
vercel env pull .env.vercel.local  # Download existing vars
# Or add new ones:
vercel env add NEXT_PUBLIC_SUPABASE_URL production
```

## After Adding Variables

Trigger a redeploy:
- Go to Vercel → Deployments
- Click "Redeploy" on latest deployment

## What Was Fixed

Modified `src/lib/supabase/client.ts`:
- `createPublicServerClient()` now throws errors immediately when env vars are missing
- No more silent timeouts - you'll see clear error messages
- Error message: "NEXT_PUBLIC_SUPABASE_URL is not configured. Please set it in Vercel environment variables."
