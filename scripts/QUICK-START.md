# Geocoding Quick Start

## Current Status
- 909 out of 912 booths need geocoding (99.7%)
- Estimated time: 15-20 minutes

## 3-Step Process

### 1. Deploy Function (Manual)

Go to: https://app.supabase.com/project/tmgbmcbwfkvmylmfpkzy/functions

1. Click "New Edge Function"
2. Name: `geocode-booths`
3. Copy from: `supabase/functions/geocode-booths/index.ts`
4. Deploy

### 2. Test Deployment

```bash
./scripts/quick-deploy-test.sh
```

Should show: `✓ Function is deployed and working!`

### 3. Run Geocoding

```bash
./scripts/geocode-all-batches.sh
```

This will automatically process all 909 booths in ~15 minutes.

## Verify

```bash
export SUPABASE_SERVICE_ROLE_KEY=$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d= -f2)
node scripts/check-missing-coordinates.js
```

Should show: `Missing coordinates: 0`

## That's It!

For detailed instructions, see: `scripts/DEPLOYMENT-GUIDE.md`
