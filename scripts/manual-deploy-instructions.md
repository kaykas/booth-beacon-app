# Manual Deployment Instructions for geocode-booths Function

Since automated deployment requires a Supabase access token, here are manual deployment options:

## Option 1: Deploy via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/functions
2. Click "New Edge Function" or "Deploy Function"
3. Name: `geocode-booths`
4. Copy the contents from: `supabase/functions/geocode-booths/index.ts`
5. Click "Deploy"

## Option 2: Deploy via CLI with Access Token

1. Get your access token:
   - Go to https://supabase.com/dashboard/account/tokens
   - Generate a new token

2. Export the token:
   ```bash
   export SUPABASE_ACCESS_TOKEN=<your-token>
   ```

3. Run the deployment script:
   ```bash
   ./scripts/deploy-geocode-function.sh
   ```

   Or manually:
   ```bash
   supabase functions deploy geocode-booths \
     --project-ref tmgbmcbwfkvmylmfpkzy \
     --no-verify-jwt
   ```

## Option 3: Deploy via Supabase CLI Login

1. Login to Supabase:
   ```bash
   supabase login
   ```

2. Deploy the function:
   ```bash
   supabase functions deploy geocode-booths \
     --project-ref tmgbmcbwfkvmylmfpkzy \
     --no-verify-jwt
   ```

## After Deployment

Test the function:
```bash
curl -X POST https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/geocode-booths \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 5, "dry_run": true}'
```

Then run the full geocoding:
```bash
node scripts/run-geocoding.js
```
