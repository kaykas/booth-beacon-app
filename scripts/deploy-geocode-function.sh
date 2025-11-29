#!/bin/bash

# Deploy geocode-booths Edge Function to Supabase
# This script automates the deployment process

set -e

PROJECT_REF="tmgbmcbwfkvmylmfpkzy"
FUNCTION_NAME="geocode-booths"

echo "=========================================="
echo "Deploying $FUNCTION_NAME to Supabase"
echo "=========================================="
echo ""

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN environment variable not set"
  echo ""
  echo "To get your access token:"
  echo "1. Go to https://supabase.com/dashboard/account/tokens"
  echo "2. Generate a new access token"
  echo "3. Export it: export SUPABASE_ACCESS_TOKEN=<your-token>"
  echo ""
  echo "Or run: supabase login"
  exit 1
fi

echo "Deploying function..."
supabase functions deploy "$FUNCTION_NAME" \
  --project-ref "$PROJECT_REF" \
  --no-verify-jwt

echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
echo ""
echo "Function URL: https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME"
echo ""
echo "Test with:"
echo "curl -X POST https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME \\"
echo "  -H 'Authorization: Bearer \$SUPABASE_SERVICE_ROLE_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"limit\": 5, \"dry_run\": true}'"
