#!/bin/bash

# Geocode all booths in batches
# This script runs the geocoding process multiple times until all booths have coordinates

set -e

# Load environment variables
if [ -f .env.local ]; then
  export SUPABASE_SERVICE_ROLE_KEY=$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d= -f2)
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
  exit 1
fi

BATCH_SIZE=100
MAX_ITERATIONS=20  # Safety limit

echo "=========================================="
echo "Batch Geocoding Process"
echo "=========================================="
echo "Batch size: $BATCH_SIZE booths"
echo "Max iterations: $MAX_ITERATIONS"
echo ""

iteration=1

while [ $iteration -le $MAX_ITERATIONS ]; do
  echo ""
  echo "----------------------------------------"
  echo "Iteration $iteration / $MAX_ITERATIONS"
  echo "----------------------------------------"
  echo ""

  # Check how many booths still need geocoding
  echo "Checking status..."
  node scripts/check-missing-coordinates.js > /tmp/geocode-status.txt
  cat /tmp/geocode-status.txt

  # Extract the missing count
  missing=$(grep "Missing coordinates:" /tmp/geocode-status.txt | awk '{print $3}')

  if [ "$missing" = "0" ]; then
    echo ""
    echo "=========================================="
    echo "SUCCESS! All booths have been geocoded!"
    echo "=========================================="
    exit 0
  fi

  echo ""
  echo "Processing next batch of $BATCH_SIZE booths..."
  echo ""

  # Run geocoding for one batch
  node scripts/run-geocoding.js

  echo ""
  echo "Batch complete. Waiting 5 seconds before next batch..."
  sleep 5

  iteration=$((iteration + 1))
done

echo ""
echo "=========================================="
echo "WARNING: Max iterations reached"
echo "=========================================="
echo ""
echo "Some booths may still need geocoding."
echo "Run this script again or check manually:"
echo "  node scripts/check-missing-coordinates.js"
