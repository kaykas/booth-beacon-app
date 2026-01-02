#!/usr/bin/env npx tsx
/**
 * Deploy Database Indexes via Supabase REST API
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function executeSql(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function deployIndexes() {
  console.log('📊 Deploying Database Indexes to Supabase\n');
  console.log('='.repeat(80));
  console.log('');

  const indexes = [
    {
      name: '1. CRITICAL: Geospatial GIST Index',
      sql: `
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booths_location_gist
        ON booths USING GIST (geography(ST_MakePoint(longitude, latitude)))
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
      `,
    },
    {
      name: '2. Active Booths Location Index',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_booths_location_active
        ON booths (latitude, longitude, is_active)
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND is_active = true;
      `,
    },
    {
      name: '3. City/State/Country Filter Index',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_booths_city_state_country
        ON booths (city, state, country)
        WHERE is_active = true;
      `,
    },
    {
      name: '4. Add Search Vector Column',
      sql: `
        ALTER TABLE booths ADD COLUMN IF NOT EXISTS search_vector tsvector;
      `,
    },
    {
      name: '5. Full-Text Search GIN Index',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_booths_search_vector
        ON booths USING GIN (search_vector);
      `,
    },
    {
      name: '6. Search Vector Trigger Function',
      sql: `
        CREATE OR REPLACE FUNCTION update_booth_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.search_vector := to_tsvector('english',
            COALESCE(NEW.venue_name, '') || ' ' ||
            COALESCE(NEW.location_description, '') || ' ' ||
            COALESCE(NEW.city, '') || ' ' ||
            COALESCE(NEW.neighborhood, '') || ' ' ||
            COALESCE(NEW.address, '') || ' ' ||
            COALESCE(NEW.venue_type, '') || ' ' ||
            COALESCE(NEW.state, '') || ' ' ||
            COALESCE(NEW.country, '')
          );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
    },
    {
      name: '7. Search Vector Trigger',
      sql: `
        DROP TRIGGER IF EXISTS booth_search_vector_update ON booths;
        CREATE TRIGGER booth_search_vector_update
          BEFORE INSERT OR UPDATE ON booths
          FOR EACH ROW
          EXECUTE FUNCTION update_booth_search_vector();
      `,
    },
    {
      name: '8. Populate Existing Search Vectors',
      sql: `
        UPDATE booths
        SET search_vector = to_tsvector('english',
          COALESCE(venue_name, '') || ' ' ||
          COALESCE(location_description, '') || ' ' ||
          COALESCE(city, '') || ' ' ||
          COALESCE(neighborhood, '') || ' ' ||
          COALESCE(address, '') || ' ' ||
          COALESCE(venue_type, '') || ' ' ||
          COALESCE(state, '') || ' ' ||
          COALESCE(country, '')
        )
        WHERE search_vector IS NULL;
      `,
    },
    {
      name: '9. Admin Dashboard Index',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_booths_admin
        ON booths (created_at DESC, verification_status, is_active);
      `,
    },
    {
      name: '10. Geocoding Status Index',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_booths_geocoding_status
        ON booths (latitude, longitude, updated_at)
        WHERE latitude IS NULL OR longitude IS NULL;
      `,
    },
    {
      name: '11. Analyze Table',
      sql: `ANALYZE booths;`,
    },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const index of indexes) {
    console.log(`\n${index.name}...`);
    const result = await executeSql(index.sql);

    if (result.success) {
      console.log('  ✅ Success');
      successCount++;
    } else {
      if (result.error?.includes('already exists')) {
        console.log('  ⚠️  Already exists, skipping');
        successCount++;
      } else {
        console.error(`  ❌ Error: ${result.error}`);
        errorCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ Completed: ${successCount} successful, ${errorCount} errors\n`);

  if (errorCount > 0) {
    console.log('⚠️  Some indexes failed. This might be expected if exec_sql is not available.');
    console.log('You may need to execute the SQL manually in the Supabase SQL Editor.\n');
    process.exit(1);
  }

  // Verify indexes
  console.log('🔍 Verifying indexes...\n');
  const { data: indexes_result, error: verify_error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_indexes
      JOIN pg_class ON pg_class.relname = indexname
      WHERE tablename = 'booths'
      ORDER BY indexname;
    `
  });

  if (verify_error) {
    console.log('⚠️  Could not verify indexes');
  } else {
    console.log('✅ Indexes deployed successfully!\n');
  }
}

deployIndexes().catch(error => {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
});
