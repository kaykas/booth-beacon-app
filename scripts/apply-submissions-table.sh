#!/bin/bash

# Load environment variables
set -a
source .env.local
set +a

# Apply the migration using psql
psql "postgresql://postgres.tmgbmcbwfkvmylmfpkzy:${SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres" < supabase/migrations/20260103_create_booth_submissions_table.sql

echo "Migration applied!"
