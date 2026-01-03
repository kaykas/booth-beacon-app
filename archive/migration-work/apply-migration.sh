#!/bin/bash

# Apply Security Migration Script
# This script applies the security fixes migration to the Supabase database

set -e

# Load environment variables
source .env.local 2>/dev/null || true

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing Supabase credentials in .env.local"
  exit 1
fi

PROJECT_REF="tmgbmcbwfkvmylmfpkzy"
MIGRATION_FILE="supabase/migrations/20260103_fix_security_issues.sql"

echo "🔐 Applying security fixes migration..."
echo ""
echo "📋 Migration will fix:"
echo "   • Remove SECURITY DEFINER from 4 views"
echo "   • Enable RLS on 3 tables"
echo "   • Add SET search_path to 22 functions"
echo "   • Document PostGIS extension"
echo ""

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "✅ Migration file found"
echo ""

# Try to apply using curl to Supabase Management API
echo "Attempting to apply migration via Supabase Management API..."
echo ""

# Read the SQL file
SQL_CONTENT=$(cat "$MIGRATION_FILE")

# Try using psql if available
if command -v psql &> /dev/null; then
  echo "📡 psql found, attempting database connection..."
  echo ""
  echo "⚠️  You will need the database password from:"
  echo "   https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
  echo ""
  echo "Press Ctrl+C to cancel, or press Enter to continue..."
  read

  PGPASSWORD_PROMPT=1 psql \
    "postgresql://postgres.$PROJECT_REF@db.$PROJECT_REF.supabase.co:5432/postgres" \
    -f "$MIGRATION_FILE"

  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "⚠️  Manual action required:"
    echo "   Enable leaked password protection at:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/auth/settings"
    exit 0
  else
    echo "❌ Failed to apply migration via psql"
  fi
else
  echo "⚠️  psql not found"
fi

echo ""
echo "📋 Please apply the migration manually:"
echo ""
echo "Method 1: Supabase SQL Editor (Recommended)"
echo "  1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo "  2. Copy the contents of: $MIGRATION_FILE"
echo "  3. Paste into the editor"
echo "  4. Click 'Run'"
echo ""
echo "Method 2: Install psql and run:"
echo "  PGPASSWORD=<your-password> psql \\"
echo "    'postgresql://postgres.$PROJECT_REF@db.$PROJECT_REF.supabase.co:5432/postgres' \\"
echo "    -f $MIGRATION_FILE"
echo ""
echo "After applying, enable leaked password protection:"
echo "  https://supabase.com/dashboard/project/$PROJECT_REF/auth/settings"
