#!/bin/bash

# Async Crawler Deployment Script
# Automates deployment of async crawler with webhook support

set -e  # Exit on error

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     ASYNC CRAWLER DEPLOYMENT - Fixes Timeout Issues!         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

PROJECT_REF="tmgbmcbwfkvmylmfpkzy"
PROJECT_DIR="/Users/jkw/Projects/booth-beacon-app"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Supabase CLI
echo "📋 Step 1: Checking Supabase CLI..."
echo ""

if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install with: brew install supabase/tap/supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Step 2: Check Supabase auth status
echo "📋 Step 2: Checking Supabase authentication..."
echo ""

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_ACCESS_TOKEN not set${NC}"
    echo ""
    echo "To get your access token:"
    echo "1. Go to: https://supabase.com/dashboard/account/tokens"
    echo "2. Click 'Generate new token'"
    echo "3. Copy the token"
    echo "4. Run: export SUPABASE_ACCESS_TOKEN='your-token-here'"
    echo ""
    echo -e "${YELLOW}Attempting automatic login...${NC}"
    echo ""

    # Try to check if already logged in
    if supabase projects list &> /dev/null; then
        echo -e "${GREEN}✅ Already authenticated${NC}"
    else
        echo -e "${RED}❌ Not authenticated${NC}"
        echo ""
        echo "Please run one of the following:"
        echo "  1. supabase login"
        echo "  2. export SUPABASE_ACCESS_TOKEN='your-token-here'"
        echo ""
        exit 1
    fi
else
    echo -e "${GREEN}✅ SUPABASE_ACCESS_TOKEN is set${NC}"
fi
echo ""

# Step 3: Database Migration
echo "📋 Step 3: Database Migration"
echo ""
echo "The crawl_jobs table needs to be created manually via Supabase Dashboard."
echo ""
echo "📖 Instructions:"
echo "  1. Open: https://supabase.com/dashboard/project/${PROJECT_REF}/editor"
echo "  2. Click 'SQL Editor' → 'New Query'"
echo "  3. Paste contents of: supabase/migrations/20260103_add_crawl_jobs_table.sql"
echo "  4. Click 'Run'"
echo ""
read -p "Press Enter once you've run the migration (or skip if already done)..."
echo ""

# Verify table exists
echo "Verifying crawl_jobs table..."
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://${PROJECT_REF}.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk'
);
(async () => {
  const { error } = await supabase.from('crawl_jobs').select('id').limit(1);
  if (error) {
    console.log('❌ crawl_jobs table not found');
    console.log('Please run the migration manually and try again.');
    process.exit(1);
  } else {
    console.log('✅ crawl_jobs table exists');
  }
})();
" 2>/dev/null || echo -e "${YELLOW}⚠️  Could not verify table (continuing anyway)${NC}"
echo ""

# Step 4: Deploy Edge Functions
echo "📋 Step 4: Deploying Edge Functions..."
echo ""

echo "Deploying firecrawl-webhook function..."
if supabase functions deploy firecrawl-webhook --project-ref $PROJECT_REF; then
    echo -e "${GREEN}✅ firecrawl-webhook deployed${NC}"
else
    echo -e "${RED}❌ firecrawl-webhook deployment failed${NC}"
    exit 1
fi
echo ""

echo "Deploying unified-crawler function..."
if supabase functions deploy unified-crawler --project-ref $PROJECT_REF; then
    echo -e "${GREEN}✅ unified-crawler deployed${NC}"
else
    echo -e "${RED}❌ unified-crawler deployment failed${NC}"
    exit 1
fi
echo ""

# Step 5: Verify deployment
echo "📋 Step 5: Verifying deployment..."
echo ""

if supabase functions list --project-ref $PROJECT_REF | grep -q "firecrawl-webhook"; then
    echo -e "${GREEN}✅ firecrawl-webhook is live${NC}"
else
    echo -e "${RED}❌ firecrawl-webhook not found${NC}"
fi

if supabase functions list --project-ref $PROJECT_REF | grep -q "unified-crawler"; then
    echo -e "${GREEN}✅ unified-crawler is live${NC}"
else
    echo -e "${RED}❌ unified-crawler not found${NC}"
fi
echo ""

# Step 6: Test async mode
echo "📋 Step 6: Testing async mode..."
echo ""
echo "Running test with photobooth.net (the source that previously timed out)..."
echo ""

node scripts/test-async-crawl.mjs photobooth.net

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    DEPLOYMENT COMPLETE!                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 Success! The async crawler is now deployed."
echo ""
echo "📊 Next steps:"
echo "  1. Check crawl job status in Supabase Dashboard"
echo "  2. Monitor crawl_jobs table for completion"
echo "  3. Verify new booths are being added"
echo ""
echo "📖 Documentation: ASYNC_CRAWLER_IMPLEMENTATION.md"
echo ""
