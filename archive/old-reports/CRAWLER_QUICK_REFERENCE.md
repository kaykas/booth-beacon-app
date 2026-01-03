# Crawler Operations - Quick Reference

## 🚀 Execute Full Crawler Operation

```bash
tsx execute-crawler-operations.ts
```

**What it does:**
- Verifies Edge Function deployment
- Queries top 5 priority sources
- Triggers crawls with 30s stagger
- Monitors metrics
- Generates comprehensive report

**Expected time**: ~5-10 minutes (depends on source sizes)

---

## ✅ Pre-Flight Check

```bash
tsx check-crawler-readiness.ts
```

**What it checks:**
- Edge Function deployment status
- Database accessibility
- Enabled source configuration
- Recent crawler metrics
- System readiness

**Run this first** to verify everything is ready!

---

## 📊 Target Sources

| # | Source | Expected Booths | Type |
|---|--------|----------------|------|
| 1 | photobooth.net | 50-100+ | Directory |
| 2 | lomography.com | 20-30 | Community |
| 3 | photomatica.com | 15-25 | Operator |
| 4 | autophoto.org | 30-50 | Map |
| 5 | photoautomat.de | 10-20 | Operator |

**Total Expected**: 125-225 new booths

---

## 🔧 Troubleshooting

### Edge Function Not Deployed

```bash
supabase functions deploy unified-crawler --project-ref tmgbmcbwfkvmylmfpkzy
```

### Check Environment Variables

```bash
# Verify .env.local contains:
grep SUPABASE_SERVICE_ROLE_KEY .env.local
```

### Manual Database Query

```bash
# Count total booths
psql postgresql://postgres:your-password@db.tmgbmcbwfkvmylmfpkzy.supabase.co:5432/postgres \
  -c "SELECT COUNT(*) FROM booths;"
```

---

## 📈 Post-Execution Steps

### 1. Geocode New Booths
```bash
bash scripts/geocode-all-batches.sh
```

### 2. Verify Coordinates
```bash
node scripts/check-missing-coordinates.js
```

### 3. Check Frontend
```bash
npm run dev
# Visit http://localhost:3000
```

---

## 🎯 Success Criteria

- ✅ 100+ new booths extracted
- ✅ 80%+ success rate
- ✅ <10% extraction errors
- ✅ All 5 sources complete

---

## 📞 Quick Commands

```bash
# Full execution
tsx execute-crawler-operations.ts

# Readiness check
tsx check-crawler-readiness.ts

# Deploy Edge Function
supabase functions deploy unified-crawler --project-ref tmgbmcbwfkvmylmfpkzy

# Geocode results
bash scripts/geocode-all-batches.sh

# Start dev server
npm run dev
```

---

**Project**: Booth Beacon
**Location**: `/Users/jkw/Projects/booth-beacon-app/`
**Updated**: January 2, 2026
