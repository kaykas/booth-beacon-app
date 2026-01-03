#!/bin/bash

# Fix Vercel Environment Variables for Booth Pages
# This script adds the missing SUPABASE_SERVICE_ROLE_KEY to Vercel

echo "======================================"
echo "Adding SUPABASE_SERVICE_ROLE_KEY to Vercel"
echo "======================================"
echo ""

# Read the key from .env.local
SERVICE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d'=' -f2)

if [ -z "$SERVICE_KEY" ]; then
  echo "❌ ERROR: Could not find SUPABASE_SERVICE_ROLE_KEY in .env.local"
  exit 1
fi

echo "✓ Found SUPABASE_SERVICE_ROLE_KEY in .env.local"
echo ""

# Add to Vercel (production, preview, and development)
echo "Adding to Vercel environment variables..."
echo ""

npx vercel env add SUPABASE_SERVICE_ROLE_KEY production <<EOF
$SERVICE_KEY
EOF

npx vercel env add SUPABASE_SERVICE_ROLE_KEY preview <<EOF
$SERVICE_KEY
EOF

echo ""
echo "======================================"
echo "✅ Environment variable added to Vercel!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Redeploy the project to apply the changes"
echo "2. Test a booth page: https://boothbeacon.org/booth/kmart-7618-west-jordan"
echo ""
