# Vercel Environment Variables Setup

## Quick Setup via Vercel Dashboard

1. Go to your project on Vercel: https://vercel.com/dashboard
2. Select your project (booth-beacon-app)
3. Go to **Settings** > **Environment Variables**
4. Add each variable below with your actual values

## Required Environment Variables

### Supabase Configuration
Copy these from your `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=https://tmgbmcbwfkvmylmfpkzy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### API Keys
Copy these from your `.env.local` file:
```
ANTHROPIC_API_KEY=[your-anthropic-api-key]
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=[your-google-maps-api-key]
GOOGLE_IMAGEN_API_KEY=[your-google-imagen-api-key]
FIRECRAWL_API_KEY=[your-firecrawl-api-key]
```

### Google OAuth
Copy these from your `.env.local` file:
```
GOOGLE_CLIENT_ID=[your-google-client-id]
GOOGLE_CLIENT_SECRET=[your-google-client-secret]
```

### App Configuration
```
NEXT_PUBLIC_APP_URL=https://boothbeacon.org
```

## Alternative: Setup via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables one by one (you'll be prompted for values)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production
vercel env add GOOGLE_IMAGEN_API_KEY production
vercel env add FIRECRAWL_API_KEY production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add NEXT_PUBLIC_APP_URL production
```

## Quick Copy from .env.local

All your actual keys are in `.env.local` - copy them from there when adding to Vercel!

## After Adding Environment Variables

1. **Redeploy your project:**
   ```bash
   vercel --prod
   ```

   Or via Vercel Dashboard:
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

2. **Update Google OAuth Redirect URI:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Select your OAuth client ID
   - Add to **Authorized redirect URIs**:
     - `https://boothbeacon.org/auth/callback`
   - Save

3. **Update Supabase Redirect URLs:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Your Project > Authentication > URL Configuration
   - Add to **Redirect URLs**:
     - `https://boothbeacon.org/auth/callback`

## Verification Checklist

After deployment, verify:
- [ ] Homepage loads without errors
- [ ] Map displays with Google Maps (check browser console for API errors)
- [ ] User can sign up/login with Google OAuth
- [ ] Supabase data loads correctly
- [ ] All images display properly
- [ ] No environment variable errors in Vercel logs

## Troubleshooting

### Issue: "Invalid API Key" for Google Maps
**Fix:** Ensure the API key has these APIs enabled in Google Cloud Console:
- Maps JavaScript API
- Geocoding API
- Places API

### Issue: OAuth not working
**Fix:**
1. Check redirect URIs match exactly in Google Console
2. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
3. Check Supabase redirect URLs

### Issue: Supabase connection fails
**Fix:**
1. Verify all three Supabase keys are correct
2. Check Supabase project is not paused
3. Verify project ref in URL matches your anon key

## Security Notes

⚠️ **NEVER commit .env.local to git**
- Already in .gitignore
- Keep service role key secret
- Rotate keys if exposed

✅ **Safe to expose (client-side):**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- NEXT_PUBLIC_APP_URL

🔒 **Keep secret (server-side only):**
- SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_CLIENT_SECRET
- ANTHROPIC_API_KEY
- FIRECRAWL_API_KEY
