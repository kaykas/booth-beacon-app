#!/bin/bash
set -a
source .env.local
set +a
npx tsx scripts/check-chicago-country.ts
