#!/bin/bash

# Booth Deduplication - All Passes
# Runs complete deduplication process across all three passes

set -e

echo "======================================================================"
echo "BOOTH DEDUPLICATION - COMPLETE PROCESS"
echo "======================================================================"
echo ""
echo "This will run all three deduplication passes:"
echo "  1. Smart address-based deduplication"
echo "  2. Aggressive numbered entry cleanup"
echo "  3. Final targeted cleanup"
echo ""
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo ""
echo "======================================================================"
echo "PASS 1: Smart Address-Based Deduplication"
echo "======================================================================"
echo ""
npx tsx scripts/smart-deduplicate-booths.ts

echo ""
echo "======================================================================"
echo "PASS 2: Aggressive Deduplication"
echo "======================================================================"
echo ""
npx tsx scripts/aggressive-deduplicate-remaining.ts

echo ""
echo "======================================================================"
echo "PASS 3: Final Targeted Cleanup"
echo "======================================================================"
echo ""
npx tsx scripts/final-targeted-deduplication.ts

echo ""
echo "======================================================================"
echo "VERIFICATION"
echo "======================================================================"
echo ""
npx tsx check-final-booth-stats.ts

echo ""
echo "======================================================================"
echo "DEDUPLICATION COMPLETE!"
echo "======================================================================"
echo ""
echo "Review the following files for details:"
echo "  - scripts/deduplication-plan-enhanced.json"
echo "  - scripts/deduplication-plan-pass2.json"
echo "  - scripts/deduplication-plan-pass3.json"
echo ""
echo "See DEDUPLICATION_SUMMARY.md for full report"
echo "======================================================================"
