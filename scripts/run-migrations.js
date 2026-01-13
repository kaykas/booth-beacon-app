#!/usr/bin/env node
/**
 * Run database migrations for booth_reviews and booth_verifications tables
 *
 * Usage:
 *   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres" node scripts/run-migrations.js
 *
 * Or get the connection string from Supabase Dashboard:
 *   Project Settings > Database > Connection String > URI
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.error('');
    console.error('Get your connection string from Supabase Dashboard:');
    console.error('  Project Settings > Database > Connection String > URI');
    console.error('');
    console.error('Then run:');
    console.error('  DATABASE_URL="your-connection-string" node scripts/run-migrations.js');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const migrationFiles = [
      '20260111_create_booth_verifications_table.sql',
      '20260111_create_booth_reviews_table.sql'
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ Migration file not found: ${file}`);
        continue;
      }

      console.log(`\n📄 Running migration: ${file}`);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await client.query(sql);
        console.log(`✅ Migration completed: ${file}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`⏭️  Skipped (already exists): ${file}`);
        } else {
          console.error(`❌ Migration failed: ${file}`);
          console.error(`   Error: ${err.message}`);
        }
      }
    }

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');

    const verifyQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('booth_verifications', 'booth_reviews')
      ORDER BY table_name;
    `;

    const result = await client.query(verifyQuery);

    if (result.rows.length === 2) {
      console.log('✅ Both tables created successfully:');
      result.rows.forEach(row => console.log(`   - ${row.table_name}`));
    } else if (result.rows.length === 0) {
      console.log('❌ No tables were created');
    } else {
      console.log(`⚠️  Only ${result.rows.length} table(s) created:`);
      result.rows.forEach(row => console.log(`   - ${row.table_name}`));
    }

    // Check for new columns in booths table
    const columnsQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'booths'
      AND column_name IN ('rating_average', 'rating_count', 'last_community_verified_at', 'last_community_verification_type')
      ORDER BY column_name;
    `;

    const columnsResult = await client.query(columnsQuery);
    console.log(`\n📊 New columns in booths table: ${columnsResult.rows.length}/4`);
    columnsResult.rows.forEach(row => console.log(`   - ${row.column_name}`));

    console.log('\n🎉 Migration process complete!');

  } catch (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigrations();
