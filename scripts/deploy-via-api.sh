#!/bin/bash

# Deploy Edge Function via Supabase Management API
# This attempts to use the service role key for deployment

set -e

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

PROJECT_REF="tmgbmcbwfkvmylmfpkzy"
FUNCTION_NAME="geocode-booths"
FUNCTION_PATH="supabase/functions/geocode-booths/index.ts"

echo "=========================================="
echo "Deploying $FUNCTION_NAME via Management API"
echo "=========================================="
echo ""

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: SUPABASE_SERVICE_ROLE_KEY not found"
  exit 1
fi

# Read the function code
FUNCTION_CODE=$(cat "$FUNCTION_PATH" | jq -Rs .)

# Try to deploy via Management API
echo "Attempting deployment..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://$PROJECT_REF.supabase.co/functions/v1/_deployment" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"slug\": \"$FUNCTION_NAME\",
    \"body\": $FUNCTION_CODE,
    \"verify_jwt\": false
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo ""
  echo "=========================================="
  echo "Deployment successful!"
  echo "=========================================="
  exit 0
else
  echo ""
  echo "=========================================="
  echo "Deployment failed"
  echo "=========================================="
  echo ""
  echo "This approach may not be supported. Please try:"
  echo "1. Manual deployment via Supabase Dashboard"
  echo "2. CLI deployment with access token"
  echo ""
  echo "See: scripts/manual-deploy-instructions.md"
  exit 1
fi
