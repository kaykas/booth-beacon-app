#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testLightweightCrawl() {
  console.log('Testing lightweight crawl with lomography.com (small page limit)...\n');
  console.log('This source should be faster and less likely to timeout.\n');

  const startTime = Date.now();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-crawler`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_name: 'lomography.com',
        force_crawl: true,
        stream: false,
        // Request a small batch to test
        options: {
          pageLimit: 5  // Only crawl 5 pages for testing
        }
      }),
    });

    const duration = Date.now() - startTime;
    console.log(`Request completed in ${duration}ms\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Request failed with status ${response.status}`);
      console.log(`Error: ${errorText.substring(0, 500)}\n`);
      return;
    }

    const result = await response.json();
    console.log('✅ Crawl successful!\n');
    console.log('Results:');
    console.log(JSON.stringify(result, null, 2));

    // Check booth count
    const { count } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true });

    console.log(`\nTotal booths in database: ${count}`);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`❌ Exception after ${duration}ms: ${error.message}`);
  }
}

testLightweightCrawl();
