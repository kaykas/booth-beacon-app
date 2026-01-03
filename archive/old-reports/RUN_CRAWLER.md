# 🚀 Run Crawler - Quick Start

## Execute Crawler Operations

```bash
tsx execute-crawler-operations.ts
```

**This command will:**
- Check Edge Function deployment ✅
- Query top 5 sources 📊
- Trigger crawls (30s stagger) 🎯
- Monitor extraction 📈
- Generate report 📊

**Expected time:** 5-10 minutes
**Expected result:** 100+ new booths

---

## What It Does

```
╔═══════════════════════════════════════════╗
║   BOOTH BEACON CRAWLER OPERATIONS         ║
╚═══════════════════════════════════════════╝

📋 Check deployment → ✅
📊 Query sources → ✅ (5 sources)
🎯 Trigger crawls → 🚀 photobooth.net
                    ⏳ 30s wait
                    🚀 lomography.com
                    ⏳ 30s wait
                    🚀 photomatica.com
                    ⏳ 30s wait
                    🚀 autophoto.org
                    ⏳ 30s wait
                    🚀 photoautomat.de
📈 Monitor metrics → ✅
📊 Generate report → ✅

Result: 167 new booths extracted!
```

---

## Pre-Flight Check (Optional)

```bash
tsx check-crawler-readiness.ts
```

Verifies system is ready before execution.

---

## View Results (After Execution)

```bash
tsx view-crawler-results.ts
```

Shows detailed statistics and health metrics.

---

## If Edge Function Not Deployed

```bash
supabase functions deploy unified-crawler --project-ref tmgbmcbwfkvmylmfpkzy
```

---

## After Crawler Completes

```bash
# Geocode new booths
bash scripts/geocode-all-batches.sh

# Verify coordinates
node scripts/check-missing-coordinates.js

# Test frontend
npm run dev
```

---

## 🎯 Target Sources

1. **photobooth.net** → 50-100+ booths
2. **lomography.com** → 20-30 booths
3. **photomatica.com** → 15-25 booths
4. **autophoto.org** → 30-50 booths
5. **photoautomat.de** → 10-20 booths

**Total: 125-225 new booths**

---

## 📊 Success Looks Like

```
═══════════════════════════════════════════
           CRAWLER EXECUTION REPORT
═══════════════════════════════════════════

📊 EXECUTION SUMMARY
Crawls executed:        5
Successful:             5 (100.0%)
Failed:                 0
Average duration:       38000ms

📈 EXTRACTION RESULTS
New booths extracted:   167
Total booths in DB:     1079

✅ SUCCESSFUL CRAWLS
• photobooth.net - 87 booths (45s)
• lomography.com - 24 booths (32s)
• photomatica.com - 19 booths (28s)
• autophoto.org - 31 booths (52s)
• photoautomat.de - 6 booths (23s)

✅ Crawler operations completed successfully!
```

---

## 📞 Need Help?

- **Execution guide**: `CRAWLER_EXECUTION_GUIDE.md`
- **Quick reference**: `CRAWLER_QUICK_REFERENCE.md`
- **Full summary**: `CRAWLER_EXECUTION_SUMMARY.md`

---

**Ready to run?**

```bash
tsx execute-crawler-operations.ts
```

