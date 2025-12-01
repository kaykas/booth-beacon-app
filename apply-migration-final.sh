#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}  AI-Generated Images Migration - Final Attempt${NC}"
echo -e "${BLUE}===================================================${NC}"
echo ""

# Project details
PROJECT_REF="tmgbmcbwfkvmylmfpkzy"
MIGRATION_FILE="supabase/migrations/20250130_add_ai_generated_images.sql"

echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found at $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Migration file found${NC}"
echo ""

# Check if user wants to try database password
echo -e "${YELLOW}Step 2: Do you have the Supabase database password?${NC}"
echo "You can find it at:"
echo "https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
echo ""
read -p "Enter database password (or press Enter to skip): " DB_PASSWORD
echo ""

if [ -n "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}Attempting to apply migration with password...${NC}"

    PGPASSWORD="$DB_PASSWORD" psql \
        -h "db.$PROJECT_REF.supabase.co" \
        -p 5432 \
        -U postgres \
        -d postgres \
        -f "$MIGRATION_FILE"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Migration applied successfully!${NC}"
        echo ""
        echo -e "${YELLOW}Verifying migration...${NC}"
        node apply-migration.mjs
        exit 0
    else
        echo -e "${RED}✗ Failed to apply migration with password${NC}"
        echo -e "${YELLOW}Falling back to manual method...${NC}"
        echo ""
    fi
fi

# Manual method
echo -e "${YELLOW}Step 3: Using Supabase Dashboard (Manual)${NC}"
echo ""
echo "1. Opening SQL Editor in your browser..."
open "https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
sleep 2

echo "2. Copying migration SQL to clipboard..."
cat "$MIGRATION_FILE" | pbcopy
echo -e "${GREEN}✓ SQL copied to clipboard!${NC}"
echo ""

echo -e "${BLUE}Please complete these steps in your browser:${NC}"
echo "  1. The Supabase SQL Editor should be open"
echo "  2. Press Cmd+V (or Ctrl+V) to paste the migration SQL"
echo "  3. Click the green 'RUN' button"
echo "  4. Wait for 'Success' message"
echo ""

read -p "Press Enter after running the migration in the browser..."

echo ""
echo -e "${YELLOW}Verifying migration...${NC}"
node apply-migration.mjs

echo ""
echo -e "${GREEN}===================================================${NC}"
echo -e "${GREEN}  Migration process complete!${NC}"
echo -e "${GREEN}===================================================${NC}"
