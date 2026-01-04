#!/bin/bash

# On-Demand Revalidation Setup Script
# Generates secure token and provides commands to configure environments

set -e

echo "🔧 On-Demand Revalidation Setup"
echo "================================"
echo ""

# Generate secure random token
echo "📝 Generating secure token..."
TOKEN=$(openssl rand -base64 32 | tr -d '=' | tr '+/' '-_')

echo "✅ Token generated: $TOKEN"
echo ""

echo "📋 NEXT STEPS:"
echo "================================"
echo ""

echo "1️⃣  Set token in Vercel (for Next.js API route):"
echo ""
echo "   Option A - Via Vercel CLI:"
echo "   vercel env add REVALIDATE_TOKEN production"
echo "   (Paste token when prompted: $TOKEN)"
echo ""
echo "   Option B - Via Vercel Dashboard:"
echo "   - Go to: https://vercel.com/jkw/booth-beacon-app/settings/environment-variables"
echo "   - Add: REVALIDATE_TOKEN = $TOKEN"
echo "   - Environment: Production"
echo ""

echo "2️⃣  Set token in Supabase (for Edge Function):"
echo ""
echo "   SUPABASE_ACCESS_TOKEN=\"sbp_14a867610b4ad9f9171b6266d6fb4fae43ed0896\" \\"
echo "   supabase secrets set REVALIDATE_TOKEN=\"$TOKEN\" \\"
echo "   --project-ref tmgbmcbwfkvmylmfpkzy"
echo ""

echo "3️⃣  (Optional) Set APP_URL in Supabase (if not using boothbeacon.org):"
echo ""
echo "   SUPABASE_ACCESS_TOKEN=\"sbp_14a867610b4ad9f9171b6266d6fb4fae43ed0896\" \\"
echo "   supabase secrets set APP_URL=\"https://boothbeacon.org\" \\"
echo "   --project-ref tmgbmcbwfkvmylmfpkzy"
echo ""

echo "4️⃣  Deploy Edge Function:"
echo ""
echo "   SUPABASE_ACCESS_TOKEN=\"sbp_14a867610b4ad9f9171b6266d6fb4fae43ed0896\" \\"
echo "   supabase functions deploy enrich-booth --project-ref tmgbmcbwfkvmylmfpkzy"
echo ""

echo "5️⃣  Deploy Next.js app (triggers automatically on git push to main):"
echo ""
echo "   git add ."
echo "   git commit -m \"Add on-demand ISR revalidation\""
echo "   git push"
echo ""

echo "================================"
echo "✅ Setup script complete!"
echo ""
echo "⚠️  SAVE THIS TOKEN: $TOKEN"
echo "    You'll need it for the commands above."
echo ""
