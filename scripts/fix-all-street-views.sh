#!/bin/bash

# URGENT: Fix All Street Views Across All 810 Booths
# Run this script once you have the Google Maps API key

set -e

echo "🚨 CRITICAL FIX: Street View Validation for All Booths"
echo "================================================================"
echo ""

# Check if API key provided as argument
if [ -z "$1" ]; then
  echo "❌ ERROR: No API key provided"
  echo ""
  echo "Usage: bash scripts/fix-all-street-views.sh YOUR_GOOGLE_API_KEY"
  echo ""
  echo "Example:"
  echo "bash scripts/fix-all-street-views.sh AIzaSyDk3j4_dG5fH7I8kL9mN0pQ1rS2tT3uU4vV5wW6xX7yY8zZ9"
  exit 1
fi

API_KEY="$1"

echo "📝 Step 1: Setting API key in Supabase secrets..."
echo ""

SUPABASE_ACCESS_TOKEN="sbp_14a867610b4ad9f9171b6266d6fb4fae43ed0896" \
supabase secrets set GOOGLE_MAPS_API_KEY="$API_KEY" \
--project-ref tmgbmcbwfkvmylmfpkzy

if [ $? -eq 0 ]; then
  echo "✅ API key configured in Supabase"
else
  echo "❌ Failed to set API key"
  exit 1
fi

echo ""
echo "📝 Step 2: Testing API key with single booth..."
echo ""

# Test with a single booth first
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk" \
npx tsx -e "
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

// Get a test booth
const { data: booth } = await supabase
  .from('booths')
  .select('id, name, slug')
  .ilike('name', '%smith%lincoln%')
  .single();

if (!booth) {
  console.log('❌ Test booth not found');
  process.exit(1);
}

console.log('Testing with booth:', booth.name);
console.log('Calling validation Edge Function...');

const response = await fetch('https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/validate-street-view', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  body: JSON.stringify({ boothId: booth.id }),
});

const result = await response.json();

if (result.success && result.available && result.panoramaId) {
  console.log('✅ SUCCESS! API key is working');
  console.log('   Panorama ID:', result.panoramaId);
  console.log('   Distance:', result.distance + 'm');
  console.log('   Heading:', result.heading + '°');
  process.exit(0);
} else {
  console.log('❌ FAILED:', JSON.stringify(result, null, 2));
  process.exit(1);
}
"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ API key test successful!"
  echo ""
else
  echo ""
  echo "❌ API key test failed. Check:"
  echo "   1. Is Street View Static API enabled?"
  echo "   2. Is billing enabled?"
  echo "   3. Are application restrictions set to 'None'?"
  exit 1
fi

echo "================================================================"
echo "📝 Step 3: Running universal validation on ALL 810 booths..."
echo "================================================================"
echo ""
echo "⏱️  This will take approximately 14 minutes (1 request/second)"
echo "   You can monitor progress in real-time below"
echo ""
echo "Press ENTER to continue or Ctrl+C to cancel..."
read

echo ""
echo "🚀 Starting validation..."
echo ""

SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk" \
npx tsx scripts/validate-street-view-universal.ts

if [ $? -eq 0 ]; then
  echo ""
  echo "================================================================"
  echo "🎉 SUCCESS! All 810 booths validated"
  echo "================================================================"
  echo ""
  echo "✅ Street Views now show correct locations"
  echo "✅ No more wrong businesses"
  echo "✅ Every booth has specific panorama ID"
  echo ""
  echo "🧪 Test it now:"
  echo "   https://boothbeacon.org/booth/the-smith-lincoln-center-new-york"
  echo ""
else
  echo ""
  echo "⚠️  Validation completed with some errors"
  echo "   Check the summary above for details"
  echo ""
fi
