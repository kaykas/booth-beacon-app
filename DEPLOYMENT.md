# Vercel Deployment Guide

## Quick Fix for 404 NOT_FOUND Error

### Option 1: Deploy via Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option 2: Deploy via GitHub Integration
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next
4. Add Environment Variables (CRITICAL):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
5. Click Deploy

### Option 3: Redeploy Existing Project
```bash
# In Vercel dashboard
1. Go to your project
2. Click "Deployments" tab
3. Click "..." menu on latest deployment
4. Click "Redeploy"
```

## Environment Variables Required

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# Optional
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Troubleshooting

### Issue: 404 NOT_FOUND
**Cause**: Deployment not created or failed silently
**Fix**: Use Vercel CLI to deploy directly (Option 1 above)

### Issue: Build succeeds but site doesn't work
**Cause**: Missing environment variables
**Fix**: Add all env vars in Vercel dashboard, then redeploy

### Issue: "This Serverless Function has crashed"
**Cause**: Runtime error in API routes or server components
**Fix**: Check function logs in Vercel dashboard

### Issue: Images not loading
**Cause**: Image domains not configured
**Fix**: Already configured in next.config.ts

## Verification Steps

After deployment:
1. Check deployment logs for errors
2. Visit the deployment URL
3. Test authentication flow
4. Check browser console for errors
5. Verify Supabase connection works

## Getting Help

If still having issues, share:
1. Full build log from Vercel
2. Error message from browser console
3. Network tab errors (if any)
