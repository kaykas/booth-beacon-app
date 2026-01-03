# Street View Validation - Quick Start Guide

This guide will help you deploy the Street View validation system in 5 minutes.

## Step 1: Apply Database Migration

Choose one method:

### Method A: Using Supabase CLI (Recommended)
```bash
cd /Users/jkw/Projects/booth-beacon-app
supabase db push
```

### Method B: Using psql Directly
```bash
cd /Users/jkw/Projects/booth-beacon-app

# Get your Supabase password from .env.local
cat supabase/migrations/20260102_add_street_view_validation.sql | \
  PGPASSWORD="your-password" psql \
  "postgresql://postgres.tmgbmcbwfkvmylmfpkzy:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

### Method C: Using Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/editor
2. Click "SQL Editor"
3. Paste contents of `supabase/migrations/20260102_add_street_view_validation.sql`
4. Click "Run"

## Step 2: Start Dev Server

```bash
npm run dev
```

## Step 3: Test with 10 Booths (Dry Run)

```bash
# Make sure SUPABASE_SERVICE_ROLE_KEY is in your .env.local
SUPABASE_SERVICE_ROLE_KEY=xxx DRY_RUN=true BATCH_SIZE=10 node scripts/validate-street-views.js
```

## Step 4: Validate 10 Real Booths

```bash
SUPABASE_SERVICE_ROLE_KEY=xxx BATCH_SIZE=10 node scripts/validate-street-views.js
```

You should see output like:

```
======================================================================
Street View Batch Validation
======================================================================
Mode: LIVE
Resume: No (re-validate all)
Rate Limit: 10 requests/second
Batch Size: 10
======================================================================

Found 10 booths needing validation

Starting validation...

[████████████████████████████████████████] 100% | 10/10 booths | ✓ 8 available | ✗ 2 unavailable | ⚠ 0 errors

======================================================================
Validation Complete!
======================================================================
Total Processed: 10/10
Street View Available: 8 (80%)
Street View Unavailable: 2 (20%)
Errors: 0
======================================================================
```

## Step 5: Check Results

Visit a booth page that was validated:
```
http://localhost:3000/booth/[any-booth-slug]
```

You should see:
- Street View with distance indicator (if available)
- Distance warning alert (if >25m away)
- OR "Street View Not Available" message (if unavailable)

## Step 6: Validate All Booths

Once you've confirmed it works:

```bash
# Validate all ~912 booths
SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/validate-street-views.js
```

This will take about 2 minutes at 10 requests/second.

## Step 7: Deploy to Production

```bash
git add .
git commit -m "Add Street View validation system

- Add database columns for validation tracking
- Implement validation API with Google Street View Metadata API
- Create batch validation script
- Update StreetViewEmbed component with distance warnings
- Update booth detail page to check validation status"
git push origin main
```

## Troubleshooting

### Migration Failed
- Check if columns already exist: `SELECT * FROM information_schema.columns WHERE table_name = 'booths' AND column_name LIKE 'street_view%'`
- Drop columns if needed: `ALTER TABLE booths DROP COLUMN street_view_available CASCADE;`

### API Returns 500
- Check Google Maps API key: `echo $NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Test endpoint: `curl -X POST http://localhost:3000/api/street-view/validate -H "Content-Type: application/json" -d '{"boothId":"test","latitude":37.7749,"longitude":-122.4194}'`

### Validation Script Fails
- Check service key: `echo $SUPABASE_SERVICE_ROLE_KEY`
- Lower rate limit: `RATE_LIMIT=5 node scripts/validate-street-views.js`
- Run with smaller batch: `BATCH_SIZE=5 node scripts/validate-street-views.js`

## What's Next?

After validation completes:

1. **Check coverage:**
   ```sql
   SELECT
     COUNT(*) as total_with_coords,
     COUNT(street_view_validated_at) as validated,
     COUNT(CASE WHEN street_view_available = true THEN 1 END) as available
   FROM booths
   WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
   ```

2. **Set up quarterly re-validation:**
   - Add to cron: `0 0 1 */3 * cd /path/to/project && SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/validate-street-views.js`

3. **Monitor validation metrics:**
   - Check average distance: `SELECT AVG(street_view_distance_meters) FROM booths WHERE street_view_available = true;`
   - Check availability rate: `SELECT COUNT(*) FILTER (WHERE street_view_available = true) * 100.0 / COUNT(*) FROM booths WHERE street_view_validated_at IS NOT NULL;`

## Full Documentation

See `/Users/jkw/Projects/booth-beacon-app/docs/STREET_VIEW_VALIDATION_IMPLEMENTATION.md` for complete details.
