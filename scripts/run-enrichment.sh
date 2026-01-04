#!/bin/bash

# Booth Beacon Data Enrichment Runner
# Runs all enrichment scripts in sequence

echo "========================================================================"
echo "BOOTH BEACON DATA ENRICHMENT"
echo "========================================================================"
echo ""
echo "This will run all enrichment scripts in sequence:"
echo "  1. Pattern extraction (enrich-booth-data.ts)"
echo "  2. Enhanced patterns (enrich-booth-data-v2.ts)"
echo "  3. Conservative inference - DRY RUN (preview changes)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "========================================================================"
echo "STEP 1: Pattern Extraction"
echo "========================================================================"
npx tsx scripts/enrich-booth-data.ts

echo ""
echo "========================================================================"
echo "STEP 2: Enhanced Patterns"
echo "========================================================================"
npx tsx scripts/enrich-booth-data-v2.ts

echo ""
echo "========================================================================"
echo "STEP 3: Conservative Inference (DRY RUN)"
echo "========================================================================"
npx tsx scripts/apply-conservative-inference.ts

echo ""
echo "========================================================================"
echo "PREVIEW COMPLETE"
echo "========================================================================"
echo ""
echo "To apply conservative inference rules, run:"
echo "  npx tsx scripts/apply-conservative-inference.ts --live"
echo ""
echo "To generate final report, run:"
echo "  npx tsx scripts/final-enrichment-report.ts"
echo ""
