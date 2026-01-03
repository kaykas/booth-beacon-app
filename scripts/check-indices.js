#!/usr/bin/env node

/**
 * Check existing indices on the booths table
 */

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

async function checkIndices() {
  const query = `
    SELECT
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = 'booths'
      AND schemaname = 'public'
    ORDER BY indexname;
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      // Try direct SQL query
      const directQuery = `
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'booths' AND schemaname = 'public'
        ORDER BY indexname;
      `;

      const directResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql: directQuery })
      });

      if (!directResponse.ok) {
        console.error('Failed to query indices:', await directResponse.text());
        process.exit(1);
      }

      const data = await directResponse.json();
      console.log('Existing indices on booths table:');
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    const data = await response.json();
    console.log('Existing indices on booths table:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error checking indices:', error);
    process.exit(1);
  }
}

checkIndices();
