#!/bin/bash

# Load environment variables
set -a
source .env.local
set +a

# Run the checker
npx tsx scripts/check-city-booth-details.ts
