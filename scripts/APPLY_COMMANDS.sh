#!/bin/bash
# Quick command reference for applying performance indices

set -e

echo "=================================================="
echo "Performance Indices Application - Quick Commands"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project ref
PROJECT_REF="tmgbmcbwfkvmylmfpkzy"

echo -e "${BLUE}Option 1: Apply via Supabase CLI (Recommended)${NC}"
echo "cd /Users/jkw/Projects/booth-beacon-app"
echo "supabase db execute -f scripts/apply-new-indices.sql --project-ref $PROJECT_REF"
echo ""

echo -e "${BLUE}Option 2: Verify indices after application${NC}"
echo "supabase db execute -f scripts/verify-indices.sql --project-ref $PROJECT_REF"
echo ""

echo -e "${BLUE}Option 3: Check existing indices${NC}"
echo "supabase db execute -f scripts/check-indices.sql --project-ref $PROJECT_REF"
echo ""

echo -e "${YELLOW}Files created:${NC}"
echo "  • scripts/apply-new-indices.sql      - New indices to apply"
echo "  • scripts/verify-indices.sql         - Verification queries"
echo "  • scripts/check-indices.sql          - Check existing indices"
echo "  • scripts/INDEX_COMPARISON.md        - Detailed comparison"
echo "  • scripts/APPLY_INDICES_GUIDE.md     - Complete guide"
echo ""

echo -e "${GREEN}Ready to apply? Run:${NC}"
echo "bash scripts/APPLY_COMMANDS.sh apply"
echo ""

# If argument is 'apply', actually run the command
if [ "$1" = "apply" ]; then
  echo -e "${GREEN}Applying new indices...${NC}"
  cd /Users/jkw/Projects/booth-beacon-app
  supabase db execute -f scripts/apply-new-indices.sql --project-ref $PROJECT_REF

  echo ""
  echo -e "${GREEN}✓ Indices applied successfully!${NC}"
  echo ""
  echo -e "${BLUE}Running verification...${NC}"
  supabase db execute -f scripts/verify-indices.sql --project-ref $PROJECT_REF
fi

# If argument is 'verify', run verification
if [ "$1" = "verify" ]; then
  echo -e "${BLUE}Running verification...${NC}"
  cd /Users/jkw/Projects/booth-beacon-app
  supabase db execute -f scripts/verify-indices.sql --project-ref $PROJECT_REF
fi

# If argument is 'check', check existing
if [ "$1" = "check" ]; then
  echo -e "${BLUE}Checking existing indices...${NC}"
  cd /Users/jkw/Projects/booth-beacon-app
  supabase db execute -f scripts/check-indices.sql --project-ref $PROJECT_REF
fi
