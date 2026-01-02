# Firecrawl Agent Proof of Concept - README

## Quick Start

### 1. Run the POC Test

```bash
cd /Users/jkw/Projects/booth-beacon-app

FIRECRAWL_API_KEY=your_key_here \
SUPABASE_SERVICE_ROLE_KEY=your_key_here \
NEXT_PUBLIC_SUPABASE_URL=https://tmgbmcbwfkvmylmfpkzy.supabase.co \
npx tsx scripts/test-agent-crawler.ts
```

### 2. Review Results

- **Console Output:** Real-time progress and comparison
- **JSON Output:** `docs/agent-poc-results.json` (detailed data)

### 3. Analyze Findings

Check the evaluation document:
```bash
cat docs/FIRECRAWL_AGENT_EVALUATION.md
```

---

## What This Test Does

Tests Firecrawl's new Agent feature on 3 representative Booth Beacon sources:

| Source | Type | Challenge |
|--------|------|-----------|
| photobooth.net | Directory | 100+ pages, pagination |
| timeout.com/chicago | City Guide | Article with embedded list |
| fotoautomat-berlin.de | Operator | European site, different structure |

**Metrics Captured:**
- Number of booths found
- Field completion rate (% of fields populated)
- Extraction time
- Data quality (samples)

---

## Success Criteria

### Proceed to Pilot if:
- ✅ Agent finds **80%+** of booths vs. current system
- ✅ Field completion rate **>60%**
- ✅ Extraction time **<2 minutes per source**
- ✅ No critical errors

### Hybrid Approach if:
- ⚠️ Agent finds **60-80%** of booths
- ⚠️ Some sources work well, others don't
- ⚠️ Field completion **40-60%**

### More Testing Needed if:
- ❌ Agent finds **<60%** of booths
- ❌ High error rate
- ❌ Field completion **<40%**

---

## Expected Output

```
🚀 FIRECRAWL AGENT PROOF OF CONCEPT
Testing Agent capability for Booth Beacon

🤖 Testing AGENT approach for photobooth_net...
✅ Agent found 87 booths in 45231ms
📊 Field completion: 73.4%

🤖 Testing AGENT approach for timeout_chicago...
✅ Agent found 12 booths in 18542ms
📊 Field completion: 81.2%

🤖 Testing AGENT approach for fotoautomat_berlin...
✅ Agent found 23 booths in 22134ms
📊 Field completion: 68.9%

================================================================================
📊 AGENT vs. CURRENT SYSTEM COMPARISON
================================================================================

📈 SUMMARY STATISTICS:
   Total booths found by Agent: 122
   Average extraction time: 28636ms
   Average field completion: 74.5%

💡 RECOMMENDATION:
   ✅ PROCEED with Agent implementation
   Agent successfully extracted data with good completion rate

📁 Full results saved to: docs/agent-poc-results.json
```

---

## Troubleshooting

### Error: "Agent method not available in SDK"

**Solution:** The script will automatically fall back to direct API calls.

Check your Firecrawl SDK version:
```bash
npm list @mendable/firecrawl-js
```

Current: `v4.7.0`

Update if needed:
```bash
npm install @mendable/firecrawl-js@latest
```

### Error: "Agent API error: 404"

**Possible Causes:**
1. Agent feature not yet available in your region
2. API endpoint URL incorrect
3. Feature requires special access

**Solution:** Contact Firecrawl support or check documentation for Agent availability

### Error: "Rate limit exceeded"

**Solution:** Add delays between requests (already implemented as 2-second delays)

If needed, increase delay:
```typescript
// In test-agent-crawler.ts, line ~460
await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
```

### No booths extracted (result.length === 0)

**Possible Causes:**
1. Site structure different than expected
2. No analog photo booths on page
3. Agent needs more specific prompt

**Solution:** Refine the prompt in `test-agent-crawler.ts`:
```typescript
// Add more context specific to the source
const agentPrompt = `This is a [DIRECTORY/CITY GUIDE/OPERATOR] website listing analog photo booths...`;
```

---

## Next Steps After POC

### If Successful (✅ Criteria Met):

1. **Create hybrid crawler**
   ```bash
   # Create: scripts/hybrid-agent-crawler.ts
   # Try Agent first, fallback to current extractor
   ```

2. **Test on 10 sources**
   ```bash
   # Expand test to more sources
   # Monitor: success rate, costs, data quality
   ```

3. **Deploy to staging**
   ```bash
   # Update unified-crawler to use Agent
   # Test full crawl on staging environment
   ```

4. **Gradual rollout**
   ```bash
   # Migrate sources one by one
   # Compare data quality before/after
   ```

### If Hybrid Approach Needed (⚠️ Mixed Results):

1. **Identify which source types work best**
   - Directories? City guides? Operators?

2. **Use Agent for suitable sources**
   - Keep custom extractors for problematic sources

3. **Iterate on prompts**
   - Refine Agent prompts based on results

### If More Testing Needed (❌ Below Threshold):

1. **Analyze failure modes**
   - What types of sites failed?
   - What fields were missing?

2. **Test with different prompts**
   - More specific instructions
   - Schema definitions (Zod/Pydantic)

3. **Contact Firecrawl support**
   - Report issues
   - Request guidance

---

## Cost Estimation

**POC Test (3 sources):**
- Agent API: ~$0.15 (3 requests × $0.05 estimated)
- Total: **<$0.20**

**Full Production (46 sources):**
- Current system: ~$13.80 per full crawl
- With Agent: ~$2.30 per full crawl (estimated)
- **Savings: 83%**

*Note: Actual costs may vary. Monitor usage in Firecrawl dashboard.*

---

## Files Created

1. **docs/FIRECRAWL_AGENT_EVALUATION.md** - Comprehensive analysis (you're reading the README)
2. **scripts/test-agent-crawler.ts** - POC test script
3. **docs/AGENT_POC_README.md** - This file
4. **docs/agent-poc-results.json** - Generated after test run

---

## Questions?

- Review full evaluation: `docs/FIRECRAWL_AGENT_EVALUATION.md`
- Check Firecrawl docs: https://docs.firecrawl.dev/features/agent
- Ask in project chat or create GitHub issue

---

**Status:** 🟡 Ready to test
**Last Updated:** December 19, 2025
**Owner:** Jascha Kaykas-Wolff
