# Quick Geocoding Reference

## HEEBE JEEBE BOOTH - FIXED

**Booth:** `heebe-jeebe-general-store-petaluma-1`
**Status:** ✅ Complete
**Address:** 46 Kentucky St, Petaluma, CA 94952
**Coordinates:** 38.2333537, -122.6408153
**Verify:** https://www.google.com/maps/@38.2333537,-122.6408153,19z

---

## BATCH GEOCODING SCRIPT

**Location:** `/scripts/fix-geocoding-batch.ts`

### Quick Start

```bash
cd /Users/jkw/Projects/booth-beacon-app
source <(grep SUPABASE_SERVICE_ROLE_KEY .env.local)
export NEXT_PUBLIC_SUPABASE_URL="https://tmgbmcbwfkvmylmfpkzy.supabase.co"
```

### Usage Options

**From CSV (from audit agent):**
```bash
npx ts-node scripts/fix-geocoding-batch.ts --csv audit_results.csv
```

**Specific IDs:**
```bash
npx ts-node scripts/fix-geocoding-batch.ts --booth-ids "id1,id2,id3"
```

**All booths:**
```bash
npx ts-node scripts/fix-geocoding-batch.ts --all
```

---

## WHAT THE SCRIPT DOES

1. **Validates addresses** - Checks if complete (street number, not just name)
2. **Geocodes with multiple providers:**
   - Google Maps (if available)
   - Nominatim/OpenStreetMap (always available)
   - City centroid (fallback)
3. **Tracks confidence:**
   - HIGH: Rooftop/precise
   - MEDIUM: Address-level
   - LOW: City-level or fallback
4. **Backs up old coordinates** - Stored in database for audit trail
5. **Generates report** - JSON file with all changes and confidence levels
6. **Respects rate limits** - 1 req/sec for Nominatim

---

## REPORTS & VERIFICATION

**JSON Report:** `scripts/geocoding-report-YYYY-MM-DD.json`

Contains:
- Summary: total, successful, low confidence, failed
- Details: booth ID, old/new coordinates, confidence, provider
- Error messages for failed geocoding

**Console Output:**
- Real-time progress per booth
- Confidence level and provider
- Coordinates for verification
- LOW CONFIDENCE and FAILED sections at end

---

## COMMON SCENARIOS

### Audit Agent provides list of bad booths
1. Get CSV from audit agent
2. Run: `npx ts-node scripts/fix-geocoding-batch.ts --csv audit_results.csv`
3. Review JSON report
4. Manual verify any LOW CONFIDENCE results
5. Done - database updated automatically

### Fix specific booth
1. Run: `npx ts-node scripts/fix-geocoding-batch.ts --booth-ids "booth-id"`
2. Check console output
3. Verify Street View link if geocoded

### Batch fix many booths
1. Create CSV with booth IDs
2. Run batch geocoding script
3. Wait (1.2 sec per booth due to Nominatim rate limit)
4. Review report and manual items
5. Deploy to production

---

## PERFORMANCE

- Processing speed: ~0.83 booths/second
- 10 booths: 12 seconds
- 100 booths: 2 minutes
- 1000 booths: 20 minutes

*Actual time varies by:*
- Google API response time
- Nominatim response time
- Backup storage time
- Network latency

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Missing SUPABASE_SERVICE_ROLE_KEY | `source <(grep SUPABASE_SERVICE_ROLE_KEY .env.local)` |
| Cannot find module | Run from `/Users/jkw/Projects/booth-beacon-app` |
| CSV not found | Use absolute path or verify file exists |
| Google API errors | Script falls back to Nominatim, check quota |
| Nominatim timeouts | Script retries automatically, recorded in report |

---

## FILES CREATED

| File | Purpose |
|------|---------|
| `scripts/fix-geocoding-batch.ts` | Main script (17KB, production-ready) |
| `scripts/BATCH_GEOCODING_USAGE.md` | Detailed documentation |
| `HEEBE_JEEBE_FIX_REPORT.md` | Complete implementation report |
| `QUICK_GEOCODING_REFERENCE.md` | This quick reference |

---

## DATABASE UPDATES

Script updates these columns:
- `latitude` - New coordinate
- `longitude` - New coordinate
- `geocoded_at` - Timestamp
- `geocode_provider` - Which service used
- `geocode_confidence` - Confidence level
- `previous_latitude` - Old coordinate backup
- `previous_longitude` - Old coordinate backup
- `updated_at` - Update timestamp

---

## VERIFICATION CHECKLIST

- [x] Heebe Jeebe booth fixed and verified
- [x] Address validation logic working
- [x] Multi-provider geocoding implemented
- [x] Confidence scoring working
- [x] Rate limiting enforced
- [x] JSON reporting complete
- [x] Error handling comprehensive
- [x] CSV parsing working
- [x] Backup storage implemented
- [x] Production-ready code
- [x] Documentation complete

---

## NEXT: INTEGRATION WITH AUDIT AGENT

Once audit agent identifies problem booths:

```bash
# 1. Export from audit agent as CSV
# audit_results.csv created

# 2. Run batch geocoding
npx ts-node scripts/fix-geocoding-batch.ts --csv audit_results.csv

# 3. Wait for completion and review report

# 4. Check for LOW CONFIDENCE results
# (Open Google Maps links in report to verify)

# 5. Deploy - changes already in database!
```

Ready to use!
