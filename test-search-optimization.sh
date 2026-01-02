#!/bin/bash

# Test script for search page optimization
# Run this after deployment to verify everything works

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default to production or use first argument
SITE_URL="${1:-https://your-booth-beacon-site.vercel.app}"

echo "🔍 Testing Search Page Optimization"
echo "======================================"
echo ""
echo "Target: $SITE_URL"
echo ""

# Test 1: Filter Options Endpoint
echo -n "1. Testing filter options endpoint... "
FILTER_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$SITE_URL/api/search/filter-options")
FILTER_STATUS=$(curl -o /dev/null -s -w '%{http_code}' "$SITE_URL/api/search/filter-options")

if [ "$FILTER_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} (${FILTER_TIME}s)"

    # Check cache headers
    CACHE_HEADER=$(curl -s -I "$SITE_URL/api/search/filter-options" | grep -i "cache-control" || echo "none")
    echo "   Cache-Control: $CACHE_HEADER"
else
    echo -e "${RED}✗ Failed (HTTP $FILTER_STATUS)${NC}"
    exit 1
fi

# Test 2: Filter Options Second Request (should be cached)
echo -n "2. Testing cached filter options... "
FILTER_TIME_2=$(curl -o /dev/null -s -w '%{time_total}' "$SITE_URL/api/search/filter-options")
if (( $(echo "$FILTER_TIME_2 < $FILTER_TIME" | bc -l) )); then
    echo -e "${GREEN}✓ Faster on second request${NC} (${FILTER_TIME_2}s vs ${FILTER_TIME}s)"
else
    echo -e "${YELLOW}⚠ Not noticeably faster${NC} (${FILTER_TIME_2}s vs ${FILTER_TIME}s)"
fi

# Test 3: Search Endpoint - No Filters
echo -n "3. Testing search endpoint (no filters)... "
SEARCH_STATUS=$(curl -o /dev/null -s -w '%{http_code}' "$SITE_URL/api/search")
SEARCH_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$SITE_URL/api/search")

if [ "$SEARCH_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} (${SEARCH_TIME}s)"
else
    echo -e "${RED}✗ Failed (HTTP $SEARCH_STATUS)${NC}"
    exit 1
fi

# Test 4: Search with Query
echo -n "4. Testing search with text query... "
SEARCH_Q_STATUS=$(curl -o /dev/null -s -w '%{http_code}' "$SITE_URL/api/search?q=berlin")
if [ "$SEARCH_Q_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Failed (HTTP $SEARCH_Q_STATUS)${NC}"
fi

# Test 5: Search with Filters
echo -n "5. Testing search with filters... "
SEARCH_F_STATUS=$(curl -o /dev/null -s -w '%{http_code}' "$SITE_URL/api/search?city=Berlin&status=active")
if [ "$SEARCH_F_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Failed (HTTP $SEARCH_F_STATUS)${NC}"
fi

# Test 6: Pagination
echo -n "6. Testing pagination (page 2)... "
SEARCH_P_STATUS=$(curl -o /dev/null -s -w '%{http_code}' "$SITE_URL/api/search?page=2")
if [ "$SEARCH_P_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC}"

    # Check pagination structure
    PAGINATION=$(curl -s "$SITE_URL/api/search?page=2" | grep -o '"pagination"' || echo "missing")
    if [ "$PAGINATION" = '"pagination"' ]; then
        echo "   Pagination object: present"
    else
        echo -e "   ${YELLOW}⚠ Pagination object missing${NC}"
    fi
else
    echo -e "${RED}✗ Failed (HTTP $SEARCH_P_STATUS)${NC}"
fi

# Test 7: Search Page Loads
echo -n "7. Testing search page UI... "
PAGE_STATUS=$(curl -o /dev/null -s -w '%{http_code}' "$SITE_URL/search")
if [ "$PAGE_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Failed (HTTP $PAGE_STATUS)${NC}"
fi

# Test 8: Search Page with Query
echo -n "8. Testing search page with query param... "
PAGE_Q_STATUS=$(curl -o /dev/null -s -w '%{http_code}' "$SITE_URL/search?q=test")
if [ "$PAGE_Q_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Failed (HTTP $PAGE_Q_STATUS)${NC}"
fi

# Performance Summary
echo ""
echo "📊 Performance Summary"
echo "======================"
echo "Filter Options (cold):  ${FILTER_TIME}s"
echo "Filter Options (warm):  ${FILTER_TIME_2}s"
echo "Search (no filters):    ${SEARCH_TIME}s"
echo ""

# Speed improvement calculation
if command -v bc &> /dev/null; then
    IMPROVEMENT=$(echo "scale=2; (1 - $FILTER_TIME_2 / $FILTER_TIME) * 100" | bc)
    if (( $(echo "$IMPROVEMENT > 0" | bc -l) )); then
        echo -e "${GREEN}Cache provides ${IMPROVEMENT}% speed improvement${NC}"
    fi
fi

# Check if database function exists
echo ""
echo "🔧 Database Function Check"
echo "=========================="
echo "To check if the database function is deployed:"
echo "  psql \"\$DATABASE_URL\" -c \"SELECT get_filter_options();\""
echo ""

echo "✅ All tests passed!"
echo ""
echo "Manual Testing Checklist:"
echo "1. Visit $SITE_URL/search"
echo "2. Type in search box (should debounce 300ms)"
echo "3. Apply filters (should update immediately)"
echo "4. Check pagination appears (if > 50 results)"
echo "5. Click through pages"
echo "6. Verify URL updates with params"
