#!/bin/bash

# Setup Vercel Environment Variables
# This script adds all necessary environment variables to Vercel

echo "📝 Setting up Vercel environment variables..."
echo ""
echo "IMPORTANT: You need to be logged in to Vercel CLI first."
echo "If you haven't logged in yet, run: vercel login"
echo ""
read -p "Press Enter to continue..."

# Source the .env.local file to get the values
if [ ! -f ".env.local" ]; then
  echo "❌ Error: .env.local file not found"
  exit 1
fi

# Load environment variables from .env.local
export $(grep -v '^#' .env.local | xargs)

echo ""
echo "Adding environment variables to Vercel (Production, Preview, and Development)..."
echo ""

# Add NEXT_PUBLIC_SUPABASE_URL
echo "✓ Adding NEXT_PUBLIC_SUPABASE_URL..."
echo "$NEXT_PUBLIC_SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development

# Add NEXT_PUBLIC_SUPABASE_ANON_KEY
echo "✓ Adding NEXT_PUBLIC_SUPABASE_ANON_KEY..."
echo "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development

# Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
echo "✓ Adding NEXT_PUBLIC_GOOGLE_MAPS_API_KEY..."
echo "$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" | vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production preview development

# Add NEXT_PUBLIC_APP_URL
echo "✓ Adding NEXT_PUBLIC_APP_URL..."
echo "$NEXT_PUBLIC_APP_URL" | vercel env add NEXT_PUBLIC_APP_URL production preview development

echo ""
echo "✅ Environment variables added successfully!"
echo ""
echo "Next steps:"
echo "1. Go to Vercel dashboard → your project → Deployments"
echo "2. Click 'Redeploy' on the latest deployment"
echo "3. Wait for deployment to complete"
echo "4. Test: https://boothbeacon.org/booth/kmart-7624-draper"
echo ""
