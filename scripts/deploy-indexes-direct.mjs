#!/usr/bin/env node
/**
 * Deploy Database Indexes Directly via PostgreSQL
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connection configuration
// Using direct connection (not pooler)
const config = {
  host: 'aws-0-us-west-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.tmgbmcbwfkvmylmfpkzy',
  password: process.env.SUPABASE_SERVICE_ROLE_KEY || 'Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk',
  ssl: {
    rejectUnauthorized: false
  }
};

const client = new pg.Client(config);

async function deployIndexes() {
  console.log('📊 Deploying database indexes to Supabase...\n');

  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');

    // Critical indexes to create
    const indexes = [
      {
        name: 'Geospatial GIST index (CRITICAL for map performance)',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booths_location_gist
              ON booths USING GIST (geography(ST_MakePoint(longitude, latitude)))
              WHERE latitude IS NOT NULL AND longitude IS NOT NULL;`
      },
      {
        name: 'Active booths location index',
        sql: `CREATE INDEX IF NOT EXISTS idx_booths_location_active
              ON booths (latitude, longitude, is_active)
              WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND is_active = true;`
      },
      {
        name: 'City/state/country filter index',
        sql: `CREATE INDEX IF NOT EXISTS idx_booths_city_state_country
              ON booths (city, state, country) WHERE is_active = true;`
      },
      {
        name: 'Search vector column',
        sql: `ALTER TABLE booths ADD COLUMN IF NOT EXISTS search_vector tsvector;`
      },
      {
        name: 'Full-text search GIN index',
        sql: `CREATE INDEX IF NOT EXISTS idx_booths_search_vector
              ON booths USING GIN (search_vector);`
      },
      {
        name: 'Search vector trigger function',
        sql: `CREATE OR REPLACE FUNCTION update_booth_search_vector()
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
              $$ LANGUAGE plpgsql;`
      },
      {
        name: 'Search vector trigger',
        sql: `DROP TRIGGER IF EXISTS booth_search_vector_update ON booths;
              CREATE TRIGGER booth_search_vector_update
                BEFORE INSERT OR UPDATE ON booths
                FOR EACH ROW
                EXECUTE FUNCTION update_booth_search_vector();`
      },
      {
        name: 'Admin dashboard index',
        sql: `CREATE INDEX IF NOT EXISTS idx_booths_admin
              ON booths (created_at DESC, verification_status, is_active);`
      },
      {
        name: 'Geocoding status index',
        sql: `CREATE INDEX IF NOT EXISTS idx_booths_geocoding_status
              ON booths (latitude, longitude, updated_at)
              WHERE latitude IS NULL OR longitude IS NULL;`
      },
    ];

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (const index of indexes) {
      console.log(`\n${index.name}...`);
      try {
        await client.query(index.sql);
        console.log('  ✅ Success');
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('  ⚠️  Already exists, skipping');
          successCount++;
        } else {
          console.error(`  ❌ Error: ${error.message}`);
          errorCount++;
        }
      }
    }

    // Populate search vectors for existing records
    console.log('\n📝 Populating search vectors for existing booths...');
    try {
      const result = await client.query(`
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
      `);
      console.log(`  ✅ Updated ${result.rowCount} booths`);
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }

    // Analyze table for query optimizer
    console.log('\n📊 Analyzing table statistics...');
    try {
      await client.query('ANALYZE booths;');
      console.log('  ✅ Analysis complete');
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log(`✅ Deployment complete: ${successCount} successful, ${errorCount} errors`);
    console.log('='.repeat(70));

    // Verify indexes
    console.log('\n🔍 Verifying indexes...\n');
    const indexQuery = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'booths'
      ORDER BY indexname;
    `);

    console.log(`Found ${indexQuery.rows.length} indexes on booths table:`);
    indexQuery.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Disconnected from database');
  }
}

deployIndexes();
