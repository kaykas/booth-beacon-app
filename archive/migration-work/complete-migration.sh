#!/bin/bash

echo "==================================================  "
echo "AI-Generated Images Migration"
echo "=================================================="
echo ""
echo "Migration file: supabase/migrations/20250130_add_ai_generated_images.sql"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Opening Supabase SQL Editor in your browser...${NC}"
open "https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new"
sleep 2

echo ""
echo -e "${YELLOW}Step 2: The SQL migration content has been copied to your clipboard!${NC}"
cat supabase/migrations/20250130_add_ai_generated_images.sql | pbcopy
echo "Just paste it into the SQL Editor and click 'Run'"

echo ""
echo -e "${GREEN}Instructions:${NC}"
echo "1. The Supabase SQL Editor should now be open in your browser"
echo "2. Press Cmd+V (or Ctrl+V) to paste the migration SQL"
echo "3. Click the 'Run' button"
echo "4. Wait for confirmation"
echo ""

read -p "Press Enter after you've run the migration..."

echo ""
echo -e "${YELLOW}Verifying migration...${NC}"
node apply-migration.mjs

echo ""
echo -e "${GREEN}Done!${NC}"
