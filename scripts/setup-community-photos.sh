#!/bin/bash

# =====================================================
# Setup Community Photos Feature
# Applies migrations and configures storage bucket
# =====================================================

set -e # Exit on error

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "=================================================="
echo "Setting up Community Photos Feature"
echo "=================================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "ERROR: Supabase CLI is not installed"
    echo "Install with: brew install supabase/tap/supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "$PROJECT_ROOT/supabase/config.toml" ]; then
    echo "ERROR: Not in a Supabase project directory"
    echo "Run this script from the project root"
    exit 1
fi

echo "Step 1: Applying booth_photos table migration..."
echo "------------------------------------------------"
supabase db push --file "$PROJECT_ROOT/supabase/migrations/20260102_create_booth_photos_table.sql"

if [ $? -eq 0 ]; then
    echo "✓ booth_photos table created successfully"
else
    echo "✗ Failed to create booth_photos table"
    exit 1
fi

echo ""
echo "Step 2: Setting up storage bucket and policies..."
echo "------------------------------------------------"
supabase db push --file "$PROJECT_ROOT/supabase/migrations/20260102_create_booth_photos_storage.sql"

if [ $? -eq 0 ]; then
    echo "✓ Storage bucket configured successfully"
else
    echo "✗ Failed to configure storage bucket"
    exit 1
fi

echo ""
echo "=================================================="
echo "Community Photos Setup Complete!"
echo "=================================================="
echo ""
echo "What was created:"
echo "  ✓ booth_photos table with moderation fields"
echo "  ✓ Indexes for fast queries (booth_id, status, user_id)"
echo "  ✓ RLS policies for secure access control"
echo "  ✓ Storage bucket: booth-community-photos"
echo "  ✓ Storage policies for authenticated uploads"
echo "  ✓ Moderation queue view"
echo "  ✓ Photo statistics view"
echo ""
echo "Next steps:"
echo "  1. Verify tables: supabase db diff"
echo "  2. Test upload in your app"
echo "  3. Check moderation queue: SELECT * FROM booth_photos_moderation_queue"
echo ""
echo "Storage bucket details:"
echo "  - Name: booth-community-photos"
echo "  - Max file size: 5MB"
echo "  - Allowed types: JPEG, PNG, WebP"
echo "  - Public access: Yes (for approved photos)"
echo ""
