#!/bin/bash

# Deploy Unified Crawler with Agent Integration
# This script deploys the updated unified-crawler to Supabase

echo "🚀 Deploying Unified Crawler with Firecrawl Agent Integration"
echo "=============================================================="
echo ""

# Check if logged in
if ! supabase functions deploy unified-crawler --project-ref tmgbmcbwfkvmylmfpkzy 2>&1 | grep -q "Unauthorized"; then
    echo "✅ Deployment initiated..."
    supabase functions deploy unified-crawler --project-ref tmgbmcbwfkvmylmfpkzy

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployment successful!"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Test with a city guide source"
        echo "2. Monitor logs for any errors"
        echo "3. Verify booths are being extracted correctly"
        echo ""
        echo "Test command:"
        echo 'curl -X POST \'
        echo '  "https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/unified-crawler" \'
        echo '  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \'
        echo '  -H "Content-Type: application/json" \'
        echo '  -d '"'"'{"source_name": "Time Out Chicago", "force_crawl": true}'"'"
    else
        echo ""
        echo "❌ Deployment failed"
        echo "Check the error message above"
    fi
else
    echo "❌ Not logged in to Supabase"
    echo ""
    echo "Please login first:"
    echo "  supabase login"
    echo ""
    echo "Or set your access token:"
    echo "  export SUPABASE_ACCESS_TOKEN=your_token_here"
    echo ""
    echo "Get your token from: https://supabase.com/dashboard/account/tokens"
fi
