#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testPhotoboothNet() {
  console.log('Testing photobooth.net crawl (historically most reliable source)...\n');

  const startTime = Date.now();

  try {
    console.log('Sending request...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-crawler`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_name: 'photobooth.net',
        force_crawl: false,  // Respect the rate limiting
        stream: false,
      }),
    });

    const duration = Date.now() - startTime;
    console.log(`Request completed in ${(duration / 1000).toFixed(1)}s\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Request failed with status ${response.status}`);
      console.log(`Error: ${errorText.substring(0, 500)}\n`);
      return null;
    }

    const result = await response.json();
    console.log('✅ Crawl completed!\n');

    if (result.results && result.results.length > 0) {
      const crawl = result.results[0];
      console.log('📊 Results:');
      console.log(`  Status: ${crawl.status}`);
      console.log(`  Booths found: ${crawl.booths_found}`);
      console.log(`  Booths added: ${crawl.booths_added}`);
      console.log(`  Booths updated: ${crawl.booths_updated}`);
      console.log(`  Pages crawled: ${crawl.pages_crawled}`);
      console.log(`  Extraction time: ${(crawl.extraction_time_ms / 1000).toFixed(1)}s`);
      console.log(`  Total duration: ${(crawl.crawl_duration_ms / 1000).toFixed(1)}s\n`);

      if (crawl.error_message) {
        console.log(`  Error: ${crawl.error_message}\n`);
      }
    }

    // Check booth count
    const { count } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true });

    console.log(`Total booths in database: ${count}`);
    return result;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`❌ Exception after ${(duration / 1000).toFixed(1)}s: ${error.message}`);
    return null;
  }
}

testPhotoboothNet();
