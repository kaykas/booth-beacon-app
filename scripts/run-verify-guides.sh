#!/bin/bash
set -a
source .env.local
set +a
npx tsx scripts/verify-city-guides.ts
