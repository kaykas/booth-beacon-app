# Geocoding Validation System - Quick Deployment Guide

## Prerequisites

- Supabase CLI installed and authenticated
- Access to Supabase project: `tmgbmcbwfkvmylmfpkzy`
- Database credentials or admin access

## Step 1: Apply Database Migration

### Option A: Via Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new
2. Copy the contents of: `/supabase/migrations/20251208_add_geocode_validation_fields.sql`
3. Paste into SQL Editor
4. Click "Run"

### Option B: Via Supabase CLI

```bash
# Make sure you're authenticated
supabase login

# Push the migration
supabase db push --linked
```

### Verify Migration

Run this query to verify the new columns exist:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'booths'
  AND column_name IN (
    'geocode_match_score',
    'geocode_validation_issues',
    'geocode_validated_at',
    'needs_geocode_review'
  );
```

Expected: 4 rows returned

## Step 2: Deploy Edge Function

### Option A: Via Supabase CLI

```bash
# Set your access token
export SUPABASE_ACCESS_TOKEN=your_token_here

# Deploy the function
supabase functions deploy geocode-booths --project-ref tmgbmcbwfkvmylmfpkzy
```

### Option B: Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/functions
2. Click on `geocode-booths` function
3. Click "Edit"
4. Copy contents of:
   - `/supabase/functions/geocode-booths/index.ts`
   - `/supabase/functions/geocode-booths/validation.ts`
5. Update the function code
6. Click "Deploy"

### Verify Deployment

```bash
# Test the function
curl -X POST \
  https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/geocode-booths \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"limit": 1, "dry_run": true}'
```

Expected: Stream of events with validation messages

## Step 3: Test with Dry Run

Before running on real data, test with a small batch:

```bash
# Dry run with 10 booths
SUPABASE_SERVICE_ROLE_KEY=your_key_here \
node scripts/run-geocoding.js --limit 10 --dry-run
```

Expected output:
```
Starting geocoding with 4-layer validation (limit: 10, dry_run: true)...
Found 10 booths missing coordinates

✓ Booth Name (1/10) - high confidence
○ Booth Name (2/10) - medium confidence [NEEDS REVIEW]
⊘ Rejected Booth Name: Missing street number
...

Geocoding complete: X successful, Y errors, Z skipped, N validation rejected, M need review
```

## Step 4: Run Full Geocoding

Once verified, run on all booths:

```bash
# Geocode in batches of 50
bash scripts/geocode-all-batches.sh
```

Or manually:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_key_here \
node scripts/run-geocoding.js --limit 50
```

## Step 5: Review Results

### Check Overall Stats

```sql
SELECT
  geocode_confidence,
  COUNT(*) as count,
  ROUND(AVG(geocode_match_score), 2) as avg_match_score
FROM booths
WHERE geocode_confidence IS NOT NULL
GROUP BY geocode_confidence
ORDER BY
  CASE geocode_confidence
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
    WHEN 'reject' THEN 4
  END;
```

### Check Booths Needing Review

```sql
SELECT
  id, name, address, city,
  geocode_confidence,
  geocode_match_score,
  geocode_validation_issues,
  latitude, longitude
FROM booths
WHERE needs_geocode_review = true
ORDER BY geocode_match_score ASC NULLS LAST
LIMIT 20;
```

### Check Validation Issues

```sql
SELECT
  unnest(geocode_validation_issues) as issue,
  COUNT(*) as count
FROM booths
WHERE geocode_validation_issues IS NOT NULL
GROUP BY issue
ORDER BY count DESC;
```

## Troubleshooting

### Migration Fails

**Error:** Column already exists

**Solution:** The migration is idempotent. If columns exist, it's safe to skip.

### Function Deployment Fails

**Error:** Unauthorized

**Solution:**
1. Check your access token: `supabase functions list`
2. Re-authenticate: `supabase login`
3. Try deploying again

### No Booths Geocoded

**Possible causes:**
1. All booths already have coordinates
2. All addresses failing validation (check validation_rejected count)
3. Nominatim API rate limiting (wait 1 minute between batches)

### High Rejection Rate

**If >30% of booths rejected:**
1. Check common issues: `SELECT unnest(geocode_validation_issues), COUNT(*)`
2. Review address quality in database
3. Consider address normalization before geocoding

## Monitoring

### Create View for Easy Monitoring

```sql
CREATE OR REPLACE VIEW geocoding_health AS
SELECT
  COUNT(*) FILTER (WHERE latitude IS NOT NULL) as geocoded_count,
  COUNT(*) FILTER (WHERE latitude IS NULL) as missing_count,
  COUNT(*) FILTER (WHERE geocode_confidence = 'high') as high_conf,
  COUNT(*) FILTER (WHERE geocode_confidence = 'medium') as medium_conf,
  COUNT(*) FILTER (WHERE geocode_confidence = 'low') as low_conf,
  COUNT(*) FILTER (WHERE needs_geocode_review = true) as needs_review,
  ROUND(AVG(geocode_match_score) FILTER (WHERE geocode_match_score IS NOT NULL), 2) as avg_match_score
FROM booths;

-- Check health
SELECT * FROM geocoding_health;
```

### Set Up Alerts (Optional)

```sql
-- Alert if too many booths need review
SELECT
  CASE
    WHEN review_pct > 20 THEN 'ALERT: High review rate'
    WHEN review_pct > 10 THEN 'WARNING: Elevated review rate'
    ELSE 'OK'
  END as status,
  review_pct
FROM (
  SELECT
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE needs_geocode_review = true) /
      NULLIF(COUNT(*) FILTER (WHERE latitude IS NOT NULL), 0),
      2
    ) as review_pct
  FROM booths
) t;
```

## Success Criteria

After deployment, you should see:

- [ ] Migration applied successfully (4 new columns)
- [ ] Edge Function deployed and responding
- [ ] Dry run completes without errors
- [ ] Validation rejection rate 15-25% (expected for incomplete addresses)
- [ ] Success rate >70% for valid addresses
- [ ] Average match score >65 for successful geocodes
- [ ] Manual review queue <30% of geocoded booths

## Rollback (If Needed)

### Rollback Migration

```sql
-- Remove validation columns
ALTER TABLE booths
  DROP COLUMN IF EXISTS geocode_match_score,
  DROP COLUMN IF EXISTS geocode_validation_issues,
  DROP COLUMN IF EXISTS geocode_validated_at,
  DROP COLUMN IF EXISTS needs_geocode_review;
```

### Rollback Edge Function

Deploy the previous version:

```bash
git checkout HEAD~1 -- supabase/functions/geocode-booths/
supabase functions deploy geocode-booths
```

## Next Steps

After successful deployment:

1. **Manual Review**: Review flagged booths in admin panel
2. **Address Cleanup**: Fix incomplete addresses in database
3. **Re-geocode**: Run geocoding again on fixed addresses
4. **Monitor**: Set up regular health checks
5. **Optimize**: Adjust confidence thresholds based on results

---

**Need Help?**
- Test validation: `npx tsx test-geocoding-validation.ts`
- Check function logs: Supabase Dashboard > Edge Functions > geocode-booths > Logs
- Review documentation: `docs/GEOCODING_VALIDATION_SYSTEM.md`
