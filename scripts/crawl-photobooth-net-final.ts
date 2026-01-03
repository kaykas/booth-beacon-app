#!/usr/bin/env tsx

/**
 * Final attempt to crawl photobooth.net - the most reliable source
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  PHOTOBOOTH.NET CRAWL TEST                            ║');
  console.log('║  Most reliable source - expecting significant results ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  console.log('Starting crawl at:', new Date().toLocaleTimeString(), '\n');

  const startTime = Date.now();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-crawler`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_name: 'photobooth.net',
        force_crawl: true,
        stream: false,
      }),
    });

    const duration = Date.now() - startTime;
    const duration_s = (duration / 1000).toFixed(1);

    console.log(`\nResponse received after ${duration_s}s`);
    console.log(`Status code: ${response.status}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ FAILED');
      console.log(`Error: ${errorText.substring(0, 300)}\n`);
      return;
    }

    const result = await response.json();
    const crawl = result.results?.[0] || {};

    console.log('✅ SUCCESS\n');
    console.log('═'.repeat(60));
    console.log('RESULTS');
    console.log('═'.repeat(60));
    console.log(`Status:          ${crawl.status}`);
    console.log(`Booths found:    ${crawl.booths_found || 0}`);
    console.log(`Booths added:    ${crawl.booths_added || 0}`);
    console.log(`Booths updated:  ${crawl.booths_updated || 0}`);
    console.log(`Pages crawled:   ${crawl.pages_crawled || 0}`);
    console.log(`Extraction time: ${((crawl.extraction_time_ms || 0) / 1000).toFixed(1)}s`);
    console.log(`Total duration:  ${((crawl.crawl_duration_ms || 0) / 1000).toFixed(1)}s`);
    console.log('═'.repeat(60));
    console.log('');

    // Check total booth count
    const { count } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📈 Total booths in database: ${count}`);

    const boothsBeforeThisSession = 1214;  // Starting count
    const totalAdded = count! - boothsBeforeThisSession;

    console.log(`📊 New booths added this session: ${totalAdded}`);
    console.log('\n✅ Crawl complete!\n');

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`\n❌ EXCEPTION after ${(duration / 1000).toFixed(1)}s`);
    console.log(`Error: ${error.message}\n`);
  }
}

main();
