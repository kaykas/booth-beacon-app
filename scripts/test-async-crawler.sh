#!/bin/bash
# Test Async Crawler with a specific source
#
# Usage:
#   ./test-async-crawler.sh [source_name]
#
# Examples:
#   ./test-async-crawler.sh "Photobooth.net"
#   ./test-async-crawler.sh "Time Out LA"

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_REF="tmgbmcbwfkvmylmfpkzy"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/unified-crawler"

# Check for service key
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required${NC}"
  echo ""
  echo "Usage:"
  echo "  SUPABASE_SERVICE_ROLE_KEY=\"your-key\" ./test-async-crawler.sh [source_name]"
  exit 1
fi

# Default to Photobooth.net if no source specified
SOURCE_NAME="${1:-Photobooth.net}"

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}🤖 Testing Async Crawler${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Source:${NC} $SOURCE_NAME"
echo -e "${GREEN}Mode:${NC} Async (non-blocking)"
echo -e "${GREEN}Force crawl:${NC} true"
echo ""

# Make the request
echo -e "${YELLOW}📡 Sending request to Edge Function...${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"source_name\": \"$SOURCE_NAME\",
    \"async\": true,
    \"force_crawl\": true,
    \"stream\": false
  }")

# Extract body and status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo -e "${GREEN}Response (HTTP $HTTP_CODE):${NC}"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Crawl job started successfully!${NC}"
  echo ""

  # Extract job ID if available
  JOB_ID=$(echo "$HTTP_BODY" | jq -r '.jobId // .job_id // empty' 2>/dev/null)

  if [ -n "$JOB_ID" ]; then
    echo -e "${BLUE}Job ID:${NC} $JOB_ID"
    echo ""
    echo -e "${YELLOW}📊 Check job status:${NC}"
    echo ""
    echo "  node -e \""
    echo "    const { createClient } = require('@supabase/supabase-js');"
    echo "    const supabase = createClient("
    echo "      'https://${PROJECT_REF}.supabase.co',"
    echo "      process.env.SUPABASE_SERVICE_ROLE_KEY"
    echo "    );"
    echo "    supabase.from('crawl_jobs')"
    echo "      .select('*')"
    echo "      .eq('job_id', '$JOB_ID')"
    echo "      .single()"
    echo "      .then(({data, error}) => {"
    echo "        if (error) console.error(error);"
    echo "        else console.log(JSON.stringify(data, null, 2));"
    echo "      });"
    echo "  \""
  fi

  echo ""
  echo -e "${YELLOW}📋 View all recent jobs:${NC}"
  echo ""
  echo "  SUPABASE_SERVICE_ROLE_KEY=\"\$SUPABASE_SERVICE_ROLE_KEY\" \\"
  echo "  node -e \""
  echo "    const { createClient } = require('@supabase/supabase-js');"
  echo "    const supabase = createClient("
  echo "      'https://${PROJECT_REF}.supabase.co',"
  echo "      process.env.SUPABASE_SERVICE_ROLE_KEY"
  echo "    );"
  echo "    supabase.from('crawl_jobs')"
  echo "      .select('job_id, source_name, status, pages_crawled, booths_found, created_at')"
  echo "      .order('created_at', { ascending: false })"
  echo "      .limit(5)"
  echo "      .then(({data}) => console.table(data));"
  echo "  \""

else
  echo -e "${RED}❌ Request failed (HTTP $HTTP_CODE)${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Test complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
