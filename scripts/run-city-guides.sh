#!/bin/bash

# Load environment variables
set -a
source .env.local
set +a

# Run the city guides seeder
npx tsx scripts/seed-city-guides.ts
