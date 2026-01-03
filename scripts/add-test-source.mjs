#!/usr/bin/env node

/**
 * Add a test source to the crawl_sources table
 */

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

async function addTestSource() {
  console.log('Adding test source to database...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/crawl_sources`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: 'test-single-booth-page',
        source_name: 'test-single-booth-page',
        source_type: 'photobooth_net',
        source_url: 'https://www.photobooth.net/locations/photo.php?PhotographID=1',
        base_url: 'https://www.photobooth.net',
        extractor_type: 'photobooth_net',
        enabled: true,
        pages_per_batch: 1,
        priority: 1
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to add source:');
      console.error(error);
      return;
    }

    const data = await response.json();
    console.log('✅ Test source added successfully!');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    console.log('You can now run: node scripts/test-async-e2e.mjs\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addTestSource();
