#!/bin/bash

# Comprehensive Geocoding Audit Script
# Identifies all booths with geocoding problems
#
# Usage:
#   export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)
#   bash scripts/geocoding-audit.sh

set -e

SUPABASE_URL="https://tmgbmcbwfkvmylmfpkzy.supabase.co"
REPORT_FILE="geocoding-audit-report.json"
CSV_FILE="affected-booths.csv"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check environment variable
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set${NC}"
  echo "Load it from .env.local: export \$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)"
  exit 1
fi

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}BOOTH BEACON GEOCODING AUDIT${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Function to make API request
fetch_booths() {
  local endpoint="$1"
  local query="$2"

  curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/${endpoint}?${query}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Accept: application/json"
}

echo "Fetching booths from database..."

# Get total booth count
TOTAL_COUNT=$(fetch_booths "booths" "select=count&limit=1" | jq 'length')

# Get all booths with relevant columns
BOOTHS=$(fetch_booths "booths" "select=id,name,address,city,country,latitude,longitude,geocode_confidence,geocode_provider,created_at&limit=10000")

echo "Retrieved $(echo "$BOOTHS" | jq 'length') booths from database"
echo ""

# Analyze with jq
ANALYSIS=$(echo "$BOOTHS" | jq -r '
[
  .[] |
  {
    id,
    name,
    address: (.address // "[NO ADDRESS]"),
    city,
    country,
    latitude,
    longitude,
    geocode_confidence,
    geocode_provider,
    created_at,
    problems: (
      [
        # Missing address
        (if (.address | length) == 0 then
          {category: "MISSING_ADDRESS", severity: "CRITICAL", description: "Address is NULL or empty"}
        else empty end),

        # No street number
        (if (.address | test("[0-9]") | not) then
          {category: "NO_STREET_NUMBER", severity: "HIGH", description: "Address contains no digits (likely incomplete)"}
        else empty end),

        # Name only
        (if (.address | ascii_downcase) == (.name | ascii_downcase) then
          {category: "NAME_ONLY", severity: "HIGH", description: "Address is the same as business name"}
        else empty end),

        # Too short
        (if (.address | length) < 10 then
          {category: "TOO_SHORT", severity: "MEDIUM", description: "Address too short (\(.address | length) chars)"}
        else empty end),

        # Missing coordinates
        (if (.latitude == null or .longitude == null) then
          {category: "MISSING_COORDINATES", severity: "CRITICAL", description: "Latitude or longitude is NULL"}
        else empty end),

        # Low confidence
        (if .geocode_confidence == "low" then
          {category: "LOW_CONFIDENCE", severity: "MEDIUM", description: "Geocoding confidence is low"}
        else empty end)
      ]
    )
  }
] |
map(select(.problems | length > 0)) |
sort_by(
  if .problems[0].severity == "CRITICAL" then 0
  elif .problems[0].severity == "HIGH" then 1
  elif .problems[0].severity == "MEDIUM" then 2
  else 3 end
) |
{
  total_booths: (. as $all |
    ($BOOTHS | length) // 0),
  booths_with_problems: (. | length),
  critical_count: (map(select(.problems[] | select(.severity == "CRITICAL"))) | length),
  high_count: (map(select(.problems[] | select(.severity == "HIGH"))) | length),
  medium_count: (map(select(.problems[] | select(.severity == "MEDIUM"))) | length),
  affected_booths: .[0:20]
}
')

# Display summary
echo -e "${YELLOW}SUMMARY STATISTICS${NC}"
echo "-".repeat(80)

TOTAL=$(echo "$ANALYSIS" | jq '.total_booths')
WITH_PROBLEMS=$(echo "$ANALYSIS" | jq '.booths_with_problems')
CRITICAL=$(echo "$ANALYSIS" | jq '.critical_count')
HIGH=$(echo "$ANALYSIS" | jq '.high_count')
MEDIUM=$(echo "$ANALYSIS" | jq '.medium_count')
PERCENT=$(echo "scale=2; ($WITH_PROBLEMS / $TOTAL) * 100" | bc 2>/dev/null || echo "?")

echo "Total Booths: $TOTAL"
echo "Booths with Problems: $WITH_PROBLEMS ($PERCENT%)"
echo ""
echo "By Severity:"
echo "  CRITICAL: $CRITICAL"
echo "  HIGH:     $HIGH"
echo "  MEDIUM:   $MEDIUM"
echo ""

# Display critical cases
CRITICAL_CASES=$(echo "$ANALYSIS" | jq '.affected_booths[] | select(.problems[].severity == "CRITICAL")'  2>/dev/null | head -20)

if [ -z "$CRITICAL_CASES" ]; then
  echo -e "${GREEN}No critical cases found!${NC}"
else
  echo -e "${RED}CRITICAL CASES (Top 20)${NC}"
  echo "$CRITICAL_CASES" | jq -r '[.name, .address, .city + ", " + .country, (.problems[] | .category)] | @tsv' 2>/dev/null | head -10
fi

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}AUDIT COMPLETE${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo "Note: Full JSON report and CSV export would be written to:"
echo "  - $REPORT_FILE"
echo "  - $CSV_FILE"
echo ""
echo "For the complete Node.js implementation, run:"
echo "  export \$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)"
echo "  node scripts/geocoding-audit.js"
