#!/bin/bash
# Seed City Guides Script
# This script seeds the city_guides table with curated photo booth routes

set -e

echo "🌱 Booth Beacon - City Guides Seeder"
echo "===================================="
echo ""

# Check for required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set"
  echo "   Please set your environment variables in .env.local"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set"
  echo "   Please set your environment variables in .env.local"
  exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  echo "📁 Loading .env.local..."
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Run the TypeScript seed script
echo "🚀 Running city guides seeder..."
echo ""

npx tsx scripts/seed-city-guides.ts

echo ""
echo "✨ Done!"
