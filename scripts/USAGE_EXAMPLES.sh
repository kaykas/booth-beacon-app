#!/bin/bash

# ============================================================================
# BATCH GEOCODING SCRIPT - USAGE EXAMPLES
# ============================================================================
#
# This file shows how to use the fix-geocoding-batch.ts script in different
# scenarios. Copy and paste the examples that match your use case.
#
# ============================================================================

# Prerequisites: Set these environment variables once
# (They will be saved for the session)

echo "Setting up environment variables..."
source <(grep SUPABASE_SERVICE_ROLE_KEY /Users/jkw/Projects/booth-beacon-app/.env.local)
export NEXT_PUBLIC_SUPABASE_URL="https://tmgbmcbwfkvmylmfpkzy.supabase.co"

cd /Users/jkw/Projects/booth-beacon-app

# ============================================================================
# EXAMPLE 1: Process a CSV from the Audit Agent
# ============================================================================
#
# Use case: You received a CSV file from the audit agent with problematic
# booth IDs, and you want to re-geocode them.
#
# The CSV should have a header row and one booth ID per line:
#   booth_id
#   booth_1
#   booth_2
#   booth_3

example_1_process_csv() {
  echo "EXAMPLE 1: Processing CSV from audit agent"
  echo "==========================================="
  echo ""
  echo "Usage:"
  echo "  npx ts-node scripts/fix-geocoding-batch.ts --csv audit_results.csv"
  echo ""
  echo "If CSV is in a different location:"
  echo "  npx ts-node scripts/fix-geocoding-batch.ts --csv /path/to/audit_results.csv"
  echo ""
  echo "Expected output:"
  echo "  - Real-time progress for each booth"
  echo "  - Confidence level (HIGH/MEDIUM/LOW)"
  echo "  - Coordinates for verification"
  echo "  - Summary at end"
  echo "  - JSON report saved to: scripts/geocoding-report-YYYY-MM-DD.json"
}

# ============================================================================
# EXAMPLE 2: Process Specific Booth IDs
# ============================================================================
#
# Use case: You know exactly which booths need fixing and want to specify
# them directly without creating a CSV file.

example_2_process_specific_ids() {
  echo "EXAMPLE 2: Processing specific booth IDs"
  echo "========================================"
  echo ""
  echo "Usage (one booth):"
  echo "  npx ts-node scripts/fix-geocoding-batch.ts --booth-ids 'booth-id-1'"
  echo ""
  echo "Usage (multiple booths, comma-separated):"
  echo "  npx ts-node scripts/fix-geocoding-batch.ts --booth-ids 'booth-id-1,booth-id-2,booth-id-3'"
  echo ""
  echo "Real example:"
  echo "  npx ts-node scripts/fix-geocoding-batch.ts --booth-ids 'heebe-jeebe-general-store-petaluma-1,another-booth-id'"
}

# ============================================================================
# EXAMPLE 3: Process All Booths
# ============================================================================
#
# Use case: You want to re-geocode all booths in the database to ensure
# data quality across the entire system.

example_3_process_all() {
  echo "EXAMPLE 3: Processing all booths"
  echo "=================================="
  echo ""
  echo "Usage:"
  echo "  npx ts-node scripts/fix-geocoding-batch.ts --all"
  echo ""
  echo "WARNING: This will process ALL booths in the database."
  echo "Expected duration: ~0.83 booths/second due to Nominatim rate limit"
  echo "  - 100 booths: ~2 minutes"
  echo "  - 1000 booths: ~20 minutes"
  echo ""
  echo "Tip: You can interrupt the script at any time with Ctrl+C"
  echo "     Processed booths are saved immediately to database"
}

# ============================================================================
# EXAMPLE 4: Understanding the Report
# ============================================================================
#
# After running the script, you'll get a JSON report with detailed results.

example_4_understand_report() {
  echo "EXAMPLE 4: Understanding the JSON Report"
  echo "========================================"
  echo ""
  echo "Location: scripts/geocoding-report-YYYY-MM-DD.json"
  echo ""
  echo "Summary section:"
  echo "  - total: Number of booths processed"
  echo "  - successful: Booths with HIGH/MEDIUM confidence"
  echo "  - lowConfidence: Booths with LOW confidence (manual review recommended)"
  echo "  - failed: Booths where geocoding completely failed"
  echo "  - successRate: Percentage of successful geocodings"
  echo ""
  echo "Updates section (array of objects):"
  echo "  - boothId: Booth ID"
  echo "  - boothName: Human-readable booth name"
  echo "  - oldLatitude/oldLongitude: Previous coordinates (backup)"
  echo "  - newLatitude/newLongitude: New coordinates"
  echo "  - confidence: HIGH, MEDIUM, or LOW"
  echo "  - provider: google, nominatim, or none"
  echo "  - addressWasIncomplete: true if address lacked street number"
  echo "  - status: success, low_confidence, or failed"
  echo "  - error: Error message if status is failed"
  echo ""
  echo "To view the report:"
  echo "  cat scripts/geocoding-report-*.json | jq ."
  echo "  # or use your favorite JSON viewer"
}

# ============================================================================
# EXAMPLE 5: Verification & Manual Review
# ============================================================================
#
# For LOW CONFIDENCE results, you should manually verify the locations.

example_5_verification() {
  echo "EXAMPLE 5: Manual Verification"
  echo "==============================="
  echo ""
  echo "For LOW CONFIDENCE results, verify on Google Maps:"
  echo ""
  echo "1. Get the booth ID from the report"
  echo "2. Find the coordinates in the report"
  echo "3. Open in Street View:"
  echo "   https://www.google.com/maps/@LATITUDE,LONGITUDE,19z"
  echo ""
  echo "Example from report:"
  echo '  "boothId": "booth-123"'
  echo '  "newLatitude": 38.2333537'
  echo '  "newLongitude": -122.6408153'
  echo ""
  echo "Open:"
  echo "  https://www.google.com/maps/@38.2333537,-122.6408153,19z"
  echo ""
  echo "If the location looks wrong:"
  echo "1. Find the correct address online"
  echo "2. Update the address field in the database"
  echo "3. Run the script again for that booth"
}

# ============================================================================
# EXAMPLE 6: Workflow for Audit Agent Integration
# ============================================================================
#
# Complete workflow showing how to use this with the audit agent.

example_6_audit_workflow() {
  echo "EXAMPLE 6: Audit Agent Integration Workflow"
  echo "==========================================="
  echo ""
  echo "Step 1: Audit agent identifies problematic booths"
  echo "       → Outputs CSV: audit_results.csv with booth IDs"
  echo ""
  echo "Step 2: Run batch geocoding"
  echo "       Command:"
  echo "       npx ts-node scripts/fix-geocoding-batch.ts --csv audit_results.csv"
  echo ""
  echo "Step 3: Script processes all booths"
  echo "       - Geocodes each booth"
  echo "       - Updates database immediately"
  echo "       - Generates JSON report"
  echo ""
  echo "Step 4: Review results"
  echo "       - Check JSON report for summary"
  echo "       - Manually verify LOW CONFIDENCE results"
  echo "       - Identify FAILED booths needing manual address correction"
  echo ""
  echo "Step 5: Optional - Manual corrections"
  echo "       - For FAILED booths, update address in database"
  echo "       - Re-run geocoding for those specific booths"
  echo ""
  echo "Step 6: Deploy to production"
  echo "       - Changes are already in database!"
  echo "       - Map view will automatically update"
  echo "       - Verify on map that booths appear correctly"
  echo ""
  echo "Total time for 100 booths: ~2 minutes"
}

# ============================================================================
# EXAMPLE 7: Common Issues & Solutions
# ============================================================================

example_7_troubleshooting() {
  echo "EXAMPLE 7: Troubleshooting"
  echo "========================="
  echo ""
  echo "Issue: 'Missing SUPABASE_SERVICE_ROLE_KEY'"
  echo "Fix:"
  echo "  source <(grep SUPABASE_SERVICE_ROLE_KEY .env.local)"
  echo ""
  echo "Issue: 'Cannot find module @supabase/supabase-js'"
  echo "Fix:"
  echo "  cd /Users/jkw/Projects/booth-beacon-app"
  echo "  npx ts-node scripts/fix-geocoding-batch.ts ..."
  echo ""
  echo "Issue: 'CSV file not found'"
  echo "Fix:"
  echo "  ls -la audit_results.csv  # Check if file exists"
  echo "  # Use absolute path if needed"
  echo ""
  echo "Issue: 'Script seems stuck'"
  echo "Fix:"
  echo "  This is normal - Nominatim has 1 req/sec rate limit"
  echo "  100 booths = ~2 minutes is expected"
  echo "  You can Ctrl+C to stop - processed booths are saved!"
}

# ============================================================================
# REAL COMMAND EXAMPLES - Copy and paste these!
# ============================================================================

real_example_csv() {
  echo ""
  echo "REAL EXAMPLE: Using CSV from audit agent"
  echo "========================================"
  echo ""
  echo "Step 1: Verify environment is set"
  echo "  $ echo \$SUPABASE_SERVICE_ROLE_KEY | cut -c1-20"
  echo "  eyJhbGciOiJIUzI1NiI..."
  echo ""
  echo "Step 2: Create sample CSV"
  echo "  $ cat > audit_results.csv << 'EOF'"
  echo "  booth_id"
  echo "  heebe-jeebe-general-store-petaluma-1"
  echo "  EOF"
  echo ""
  echo "Step 3: Run batch geocoding"
  echo "  $ npx ts-node scripts/fix-geocoding-batch.ts --csv audit_results.csv"
  echo ""
  echo "Step 4: Check results"
  echo "  $ cat scripts/geocoding-report-*.json | jq '.summary'"
}

real_example_specific() {
  echo ""
  echo "REAL EXAMPLE: Fixing specific booths"
  echo "===================================="
  echo ""
  echo "$ npx ts-node scripts/fix-geocoding-batch.ts --booth-ids 'booth-1,booth-2,booth-3'"
  echo ""
  echo "Output:"
  echo "  [1/3] Booth Name 1"
  echo "  ✅ HIGH (google): 38.123456, -122.456789"
  echo "  [2/3] Booth Name 2"
  echo "  ⚠️  LOW CONFIDENCE (nominatim): 37.987654, -122.345678"
  echo "  [3/3] Booth Name 3"
  echo "  ❌ Failed to geocode"
}

# ============================================================================
# MAIN - Show all examples
# ============================================================================

if [ "$1" == "" ]; then
  echo "BATCH GEOCODING SCRIPT - USAGE EXAMPLES"
  echo "======================================"
  echo ""
  echo "Choose an example:"
  echo "  1 - Process CSV from audit agent"
  echo "  2 - Process specific booth IDs"
  echo "  3 - Process all booths"
  echo "  4 - Understanding the JSON report"
  echo "  5 - Manual verification process"
  echo "  6 - Complete audit agent workflow"
  echo "  7 - Troubleshooting"
  echo "  all - Show all examples"
  echo ""
  echo "Usage:"
  echo "  bash scripts/USAGE_EXAMPLES.sh 1"
  echo "  bash scripts/USAGE_EXAMPLES.sh all"
else
  case $1 in
    1) example_1_process_csv ;;
    2) example_2_process_specific_ids ;;
    3) example_3_process_all ;;
    4) example_4_understand_report ;;
    5) example_5_verification ;;
    6) example_6_audit_workflow ;;
    7) example_7_troubleshooting ;;
    all)
      example_1_process_csv
      echo ""
      example_2_process_specific_ids
      echo ""
      example_3_process_all
      echo ""
      example_4_understand_report
      echo ""
      example_5_verification
      echo ""
      example_6_audit_workflow
      echo ""
      example_7_troubleshooting
      echo ""
      real_example_csv
      echo ""
      real_example_specific
      ;;
    *)
      echo "Unknown example: $1"
      echo "Use: bash scripts/USAGE_EXAMPLES.sh 1"
      ;;
  esac
fi
