#!/bin/bash
#
# Test Improved Unified Crawler in Dry-Run Mode
# This script tests the improved crawler without modifying the database
#

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Unified Crawler - Dry Run Test${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Check if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}Error: SUPABASE_URL not set${NC}"
    echo "Set it with: export SUPABASE_URL=https://your-project.supabase.co"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}Error: SUPABASE_SERVICE_ROLE_KEY not set${NC}"
    echo "Set it with: export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    exit 1
fi

# Get source name from argument or use default
SOURCE_NAME=${1:-"photomatica.com"}

echo -e "${YELLOW}Testing source: ${SOURCE_NAME}${NC}"
echo -e "${YELLOW}Mode: DRY RUN (no database changes)${NC}\n"

# Run dry-run test
echo -e "${GREEN}Sending request...${NC}\n"

curl -X POST "${SUPABASE_URL}/functions/v1/unified-crawler" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"source_name\": \"${SOURCE_NAME}\",
    \"force_crawl\": true,
    \"dry_run\": true
  }" \
  | jq '.'

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Dry run test complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Note: No data was written to the database${NC}\n"
