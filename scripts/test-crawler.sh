#!/bin/bash

# Test script for unified-crawler edge function
# Usage: ./scripts/test-crawler.sh [options]

set -e

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
SOURCE_NAME=""
FORCE_CRAWL="false"
STREAM="false"
LOCAL="false"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --source)
      SOURCE_NAME="$2"
      shift 2
      ;;
    --force)
      FORCE_CRAWL="true"
      shift
      ;;
    --stream)
      STREAM="true"
      shift
      ;;
    --local)
      LOCAL="true"
      SUPABASE_URL="http://localhost:54321"
      shift
      ;;
    --help)
      echo "Usage: ./scripts/test-crawler.sh [options]"
      echo ""
      echo "Options:"
      echo "  --source <name>  Crawl only the specified source"
      echo "  --force          Force crawl (ignore frequency limits)"
      echo "  --stream         Enable SSE streaming"
      echo "  --local          Use local Supabase instance"
      echo "  --help           Show this help message"
      echo ""
      echo "Examples:"
      echo "  ./scripts/test-crawler.sh                    # Crawl all sources"
      echo "  ./scripts/test-crawler.sh --source photobooth.net"
      echo "  ./scripts/test-crawler.sh --force --local"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate environment
if [ -z "$SUPABASE_URL" ]; then
  echo -e "${RED}Error: NEXT_PUBLIC_SUPABASE_URL not set${NC}"
  echo "Please set it in .env.local or export it"
  exit 1
fi

if [ -z "$SUPABASE_KEY" ]; then
  echo -e "${RED}Error: NEXT_PUBLIC_SUPABASE_ANON_KEY not set${NC}"
  echo "Please set it in .env.local or export it"
  exit 1
fi

# Build request body
REQUEST_BODY="{"
if [ -n "$SOURCE_NAME" ]; then
  REQUEST_BODY="${REQUEST_BODY}\"source_name\":\"${SOURCE_NAME}\","
fi
REQUEST_BODY="${REQUEST_BODY}\"force_crawl\":${FORCE_CRAWL},"
REQUEST_BODY="${REQUEST_BODY}\"stream\":${STREAM}"
REQUEST_BODY="${REQUEST_BODY}}"

echo -e "${YELLOW}Testing Unified Crawler${NC}"
echo "========================"
echo "URL: ${SUPABASE_URL}/functions/v1/unified-crawler"
echo "Body: ${REQUEST_BODY}"
echo ""

if [ "$LOCAL" = "true" ]; then
  echo -e "${YELLOW}Note: Make sure local Supabase is running:${NC}"
  echo "  supabase start"
  echo "  supabase functions serve unified-crawler --env-file .env.local"
  echo ""
fi

echo -e "${GREEN}Invoking crawler...${NC}"
echo ""

# Make the request
if [ "$STREAM" = "true" ]; then
  # Streaming request
  curl -N -X POST "${SUPABASE_URL}/functions/v1/unified-crawler" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d "${REQUEST_BODY}"
else
  # Regular request with formatted output
  curl -s -X POST "${SUPABASE_URL}/functions/v1/unified-crawler" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d "${REQUEST_BODY}" | jq .
fi

echo ""
echo -e "${GREEN}Done!${NC}"
