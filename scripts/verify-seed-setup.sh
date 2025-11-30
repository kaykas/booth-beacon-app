#!/bin/bash
# Verification script for city guides seed setup
# Checks that all prerequisites are met before running the seeder

echo "🔍 Booth Beacon - City Guides Setup Verification"
echo "================================================"
echo ""

ERRORS=0
WARNINGS=0

# Check files exist
echo "📁 Checking files..."
if [ -f scripts/seed-city-guides.ts ]; then
  echo "   ✅ seed-city-guides.ts exists"
else
  echo "   ❌ seed-city-guides.ts missing"
  ERRORS=$((ERRORS + 1))
fi

if [ -f scripts/run-seed-guides.sh ]; then
  echo "   ✅ run-seed-guides.sh exists"
else
  echo "   ❌ run-seed-guides.sh missing"
  ERRORS=$((ERRORS + 1))
fi

if [ -f scripts/CITY-GUIDES-README.md ]; then
  echo "   ✅ CITY-GUIDES-README.md exists"
else
  echo "   ⚠️  CITY-GUIDES-README.md missing (optional)"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Check executables
echo "🔧 Checking executables..."
if [ -x scripts/seed-city-guides.ts ]; then
  echo "   ✅ seed-city-guides.ts is executable"
else
  echo "   ⚠️  seed-city-guides.ts not executable (will still work with tsx)"
  WARNINGS=$((WARNINGS + 1))
fi

if [ -x scripts/run-seed-guides.sh ]; then
  echo "   ✅ run-seed-guides.sh is executable"
else
  echo "   ❌ run-seed-guides.sh not executable"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# Check Node.js and tsx
echo "🟢 Checking Node.js environment..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo "   ✅ Node.js installed: $NODE_VERSION"
else
  echo "   ❌ Node.js not found"
  ERRORS=$((ERRORS + 1))
fi

if command -v npx &> /dev/null; then
  echo "   ✅ npx available"
  if npx tsx --version &> /dev/null; then
    TSX_VERSION=$(npx tsx --version | head -1)
    echo "   ✅ tsx available: $TSX_VERSION"
  else
    echo "   ❌ tsx not available"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "   ❌ npx not found"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# Check environment variables
echo "🔐 Checking environment variables..."
if [ -f .env.local ]; then
  echo "   ✅ .env.local exists"

  # Check for required variables in .env.local
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
    echo "   ✅ NEXT_PUBLIC_SUPABASE_URL found in .env.local"
  else
    echo "   ❌ NEXT_PUBLIC_SUPABASE_URL missing from .env.local"
    ERRORS=$((ERRORS + 1))
  fi

  if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
    echo "   ✅ SUPABASE_SERVICE_ROLE_KEY found in .env.local"
  else
    echo "   ❌ SUPABASE_SERVICE_ROLE_KEY missing from .env.local"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "   ❌ .env.local not found"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# Check package.json
echo "📦 Checking package.json..."
if [ -f package.json ]; then
  echo "   ✅ package.json exists"

  if grep -q '"seed:guides"' package.json; then
    echo "   ✅ npm script 'seed:guides' found"
  else
    echo "   ⚠️  npm script 'seed:guides' not found (optional)"
    WARNINGS=$((WARNINGS + 1))
  fi

  if grep -q '"@supabase/supabase-js"' package.json; then
    echo "   ✅ @supabase/supabase-js dependency found"
  else
    echo "   ❌ @supabase/supabase-js dependency missing"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "   ❌ package.json not found"
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo "================================================"
echo "📊 Summary"
echo "================================================"
echo "   Errors: $ERRORS"
echo "   Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo "✅ Setup complete! Ready to seed city guides."
  echo ""
  echo "To run the seeder, use one of:"
  echo "   • npm run seed:guides"
  echo "   • ./scripts/run-seed-guides.sh"
  echo "   • npx tsx scripts/seed-city-guides.ts"
  echo ""
  exit 0
else
  echo "❌ Setup incomplete. Please fix the errors above."
  echo ""
  if [ $ERRORS -gt 0 ]; then
    echo "Common fixes:"
    echo "   • Install dependencies: npm install"
    echo "   • Create .env.local with required variables"
    echo "   • Make scripts executable: chmod +x scripts/*.sh"
  fi
  echo ""
  exit 1
fi
