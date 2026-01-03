#!/bin/bash

###############################################################################
# Generate AI Preview Images for 5 Chicago Booths
###############################################################################
#
# This script generates AI preview images for the following Chicago booths:
# 1. Schubas (schubas-chicago-1)
# 2. Reckless Records (reckless-records-chicago-1)
# 3. Quimby's Bookstore (quimby-s-bookstore-chicago-1)
# 4. Sheffield's (sheffield-s-chicago-1)
# 5. Charleston (charleston-chicago)
#
# PREREQUISITE: OpenAI account must have available credits
#               (billing limit issue must be resolved)
#
###############################################################################

set -e  # Exit on error

echo "=================================================="
echo "Chicago Booth AI Preview Generation"
echo "=================================================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with required environment variables"
    exit 1
fi

# Load environment variables from .env.local
echo "📋 Loading environment variables from .env.local..."
export $(grep -v '^#' .env.local | xargs)

# Verify required variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not set"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY not set"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY not set"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Run the generation script
echo "🎨 Starting AI preview generation..."
echo ""

npx tsx scripts/generate-chicago-previews-direct.ts

echo ""
echo "=================================================="
echo "Generation complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Verify images in Supabase storage bucket: booth-images/ai-previews/"
echo "2. Check booth pages on https://boothbeacon.org"
echo "3. Review CHICAGO_PREVIEW_GENERATION_REPORT.md for details"
