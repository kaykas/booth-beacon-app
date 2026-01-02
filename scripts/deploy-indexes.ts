#!/usr/bin/env tsx
/**
 * Deploy Database Indexes
 * Executes the performance indexes migration using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function executeSQL(sql: string, description: string): Promise<boolean> {
  console.log(`\n${description}...`);

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: sql
    });

    if (error) {
      // Check if it's a benign error
      if (error.message.includes('already exists') ||
          error.message.includes('does not exist') ||
          error.code === '42P07') {
        console.log(`  ⚠️  Already exists, skipping`);
        return true;
      }

      console.error(`  ❌ Error: ${error.message}`);
      return false;
    }

    console.log(`  ✅ Success`);
    return true;
  } catch (error: any) {
    console.error(`  ❌ Exception: ${error.message}`);
    return false;
  }
}

async function deployIndexes() {
  console.log('📊 Deploying database indexes...\n');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // Define index creation statements
  const indexes = [
    {
      name: 'Geospatial GIST index (most important)',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booths_location_gist
            ON booths USING GIST (geography(ST_MakePoint(longitude, latitude)))
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL;`
    },
    {
      name: 'Active booths with coordinates',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booths_location_active
            ON booths (latitude, longitude, is_active)
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND is_active = true;`
    },
    {
      name: 'City/state/country filter',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booths_city_state_country
            ON booths (city, state, country) WHERE is_active = true;`
    },
    {
      name: 'US locations (most common)',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booths_us_locations
            ON booths (city, state)
            WHERE country = 'United States' AND is_active = true;`
    },
    {
      name: 'Admin dashboard queries',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booths_admin
            ON booths (created_at DESC, verification_status, is_active);`
    },
    {
      name: 'Geocoding status tracking',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booths_geocoding_status
            ON booths (latitude, longitude, updated_at)
            WHERE latitude IS NULL OR longitude IS NULL;`
    },
    {
      name: 'Verification workflows',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booths_verification
            ON booths (verification_status, last_verified, is_active);`
    },
  ];

  // Execute each index creation
  for (const index of indexes) {
    const success = await executeSQL(index.sql, `Creating: ${index.name}`);
    if (success) successCount++;
    else errorCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Completed: ${successCount} successful`);
  if (skipCount > 0) console.log(`⚠️  Skipped: ${skipCount}`);
  if (errorCount > 0) console.log(`❌ Failed: ${errorCount}`);
  console.log('='.repeat(60));

  if (errorCount > 0) {
    console.log('\n⚠️  Some indexes failed to create. This might be expected if running on Supabase free tier.');
    console.log('Consider creating indexes manually in the Supabase SQL editor.');
  }
}

deployIndexes();
