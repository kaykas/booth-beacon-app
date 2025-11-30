# Vercel Environment Variables Setup

## Problem
The booth pages were hanging/timing out because Supabase environment variables weren't configured in Vercel production.

## Solution
Configure these environment variables in your Vercel project:

### Required Environment Variables

Go to your Vercel project settings → Environment Variables and add:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: `https://tmgbmcbwfkvmylmfpkzy.supabase.co`
   - Environment: Production, Preview, Development

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTExOTksImV4cCI6MjA3OTc2NzE5OX0.nVAPKx30OTNSaZ92Koeg_gUonm3Zols3FOTvfO5TrrA`
   - Environment: Production, Preview, Development

3. **NEXT_PUBLIC_GOOGLE_MAPS_API_KEY**
   - Value: `AIzaSyD8EsT8nSCCtkkShAbRwHg67hrPMXPoeHo`
   - Environment: Production, Preview, Development

4. **NEXT_PUBLIC_APP_URL**
   - Value: `https://boothbeacon.org`
   - Environment: Production, Preview, Development

### Optional (for crawler/admin features)

5. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: (see .env.local)
   - Environment: Production only

6. **ANTHROPIC_API_KEY**
   - Value: (see .env.local)
   - Environment: Production only

7. **FIRECRAWL_API_KEY**
   - Value: (see .env.local)
   - Environment: Production only

## How to Set Variables in Vercel

### Via Vercel Dashboard:
1. Go to https://vercel.com/your-project/settings/environment-variables
2. Add each variable with its value
3. Select which environments (Production/Preview/Development)
4. Click Save

### Via Vercel CLI:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste value when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste value when prompted
```

## Trigger Redeploy

After adding environment variables:
1. Go to Vercel → Deployments
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Code Changes Made

Modified `src/lib/supabase/client.ts`:
- Changed `createPublicServerClient()` to **throw errors** instead of returning broken clients
- Now fails fast with clear error messages
- No more silent timeouts when env vars are missing
