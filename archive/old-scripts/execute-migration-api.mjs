/**
 * Attempts to execute the migration using various Supabase API endpoints
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_REF = 'tmgbmcbwfkvmylmfpkzy';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

// Read migration SQL
const migrationSQL = readFileSync(
  join(__dirname, 'supabase/migrations/20250130_add_ai_generated_images.sql'),
  'utf8'
);

async function tryExecuteMigration() {
  console.log('Attempting to execute migration via Supabase APIs...\n');

  // Try Method 1: PostgREST query endpoint
  console.log('Method 1: Trying PostgREST query endpoint...');
  try {
    const response1 = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: migrationSQL })
    });

    console.log('Status:', response1.status);
    const text1 = await response1.text();
    console.log('Response:', text1.substring(0, 200));
  } catch (e) {
    console.log('Failed:', e.message);
  }

  console.log('\nMethod 2: Trying to execute statements individually...');

  // Split into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < Math.min(statements.length, 2); i++) {
    const stmt = statements[i];
    console.log(`\nStatement ${i + 1}:`, stmt.substring(0, 80) + '...');

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: stmt })
      });

      console.log('Status:', response.status);
      if (response.ok) {
        console.log('Success!');
      } else {
        const error = await response.text();
        console.log('Error:', error.substring(0, 200));
      }
    } catch (e) {
      console.log('Failed:', e.message);
    }
  }

  console.log('\n================================================');
  console.log('CONCLUSION');
  console.log('================================================');
  console.log('Direct SQL execution via REST API is not supported.');
  console.log('This is by design for security reasons.\n');
  console.log('Please use one of these methods:');
  console.log('1. Supabase Dashboard SQL Editor (easiest):');
  console.log('   https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/sql/new');
  console.log('');
  console.log('2. Or run: ./complete-migration.sh');
  console.log('   This will open the SQL Editor and copy the SQL to clipboard\n');
}

tryExecuteMigration();
