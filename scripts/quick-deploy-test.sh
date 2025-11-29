#!/bin/bash

# Quick test to see if the function is deployed
# If not, provides deployment instructions

set -e

if [ -f .env.local ]; then
  export SUPABASE_SERVICE_ROLE_KEY=$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d= -f2)
fi

PROJECT_REF="tmgbmcbwfkvmylmfpkzy"
FUNCTION_NAME="geocode-booths"
FUNCTION_URL="https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME"

echo "=========================================="
echo "Testing $FUNCTION_NAME deployment"
echo "=========================================="
echo ""
echo "Function URL: $FUNCTION_URL"
echo ""

# Test with a dry run request
response=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 1, "dry_run": true}' \
  --max-time 5)

http_code=$(echo "$response" | tail -n1)

echo "HTTP Status: $http_code"
echo ""

if [ "$http_code" = "200" ]; then
  echo "✓ Function is deployed and working!"
  echo ""
  echo "You can now run geocoding:"
  echo "  export SUPABASE_SERVICE_ROLE_KEY=\$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d= -f2)"
  echo "  node scripts/run-geocoding.js"
  echo ""
  echo "Or geocode all in batches:"
  echo "  ./scripts/geocode-all-batches.sh"
  exit 0
elif [ "$http_code" = "404" ]; then
  echo "✗ Function NOT deployed (404 Not Found)"
  echo ""
  echo "Please deploy the function first:"
  echo ""
  echo "Option 1: Via Supabase Dashboard (Recommended)"
  echo "  1. Go to: https://app.supabase.com/project/$PROJECT_REF/functions"
  echo "  2. Click 'New Edge Function'"
  echo "  3. Name: $FUNCTION_NAME"
  echo "  4. Copy contents from: supabase/functions/$FUNCTION_NAME/index.ts"
  echo "  5. Deploy"
  echo ""
  echo "Option 2: Via CLI"
  echo "  1. Get access token: https://supabase.com/dashboard/account/tokens"
  echo "  2. export SUPABASE_ACCESS_TOKEN=<your-token>"
  echo "  3. supabase functions deploy $FUNCTION_NAME --project-ref $PROJECT_REF --no-verify-jwt"
  echo ""
  echo "See scripts/GEOCODING-README.md for detailed instructions"
  exit 1
else
  echo "✗ Unexpected response: $http_code"
  echo ""
  echo "Response body:"
  echo "$response" | sed '$d'
  exit 1
fi
