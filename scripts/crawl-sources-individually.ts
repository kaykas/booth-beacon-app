#!/usr/bin/env tsx

/**
 * Crawl each source individually with detailed logging
 * This helps identify which sources work and which timeout
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface CrawlResult {
  source_name: string;
  success: boolean;
  duration_s: number;
  booths_found: number;
  booths_added: number;
  booths_updated: number;
  pages_crawled: number;
  status: string;
  error?: string;
}

const SOURCES = [
  'lomography.com',      // Just tested, works but found 0
  'photoautomat.de',     // Not recently crawled
  'photomatica.com',     // Not recently crawled
  'autophoto.org',       // Recently attempted, timed out
];

async function crawlSource(sourceName: string): Promise<CrawlResult> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Crawling: ${sourceName}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Time: ${new Date().toLocaleTimeString()}\n`);

  const startTime = Date.now();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-crawler`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_name: sourceName,
        force_crawl: true,
        stream: false,
      }),
    });

    const duration = Date.now() - startTime;
    const duration_s = duration / 1000;

    console.log(`Response received after ${duration_s.toFixed(1)}s`);
    console.log(`Status code: ${response.status}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ FAILED`);
      console.log(`Error: ${errorText.substring(0, 200)}\n`);

      return {
        source_name: sourceName,
        success: false,
        duration_s,
        booths_found: 0,
        booths_added: 0,
        booths_updated: 0,
        pages_crawled: 0,
        status: 'error',
        error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
      };
    }

    const result = await response.json();
    const crawl = result.results?.[0] || {};

    console.log('✅ SUCCESS');
    console.log(`Booths found: ${crawl.booths_found || 0}`);
    console.log(`Booths added: ${crawl.booths_added || 0}`);
    console.log(`Booths updated: ${crawl.booths_updated || 0}`);
    console.log(`Pages crawled: ${crawl.pages_crawled || 0}`);
    console.log(`Status: ${crawl.status || 'unknown'}\n`);

    return {
      source_name: sourceName,
      success: true,
      duration_s,
      booths_found: crawl.booths_found || 0,
      booths_added: crawl.booths_added || 0,
      booths_updated: crawl.booths_updated || 0,
      pages_crawled: crawl.pages_crawled || 0,
      status: crawl.status || 'unknown',
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    const duration_s = duration / 1000;

    console.log(`❌ EXCEPTION after ${duration_s.toFixed(1)}s`);
    console.log(`Error: ${error.message}\n`);

    return {
      source_name: sourceName,
      success: false,
      duration_s,
      booths_found: 0,
      booths_added: 0,
      booths_updated: 0,
      pages_crawled: 0,
      status: 'exception',
      error: error.message,
    };
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  INDIVIDUAL SOURCE CRAWLER TEST                       ║');
  console.log('║  Testing 4 sources with 45s delays between requests   ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  const results: CrawlResult[] = [];

  for (let i = 0; i < SOURCES.length; i++) {
    const source = SOURCES[i];
    const result = await crawlSource(source);
    results.push(result);

    // Delay between requests (except for last one)
    if (i < SOURCES.length - 1) {
      console.log(`⏳ Waiting 45 seconds before next crawl...\n`);
      await new Promise(resolve => setTimeout(resolve, 45000));
    }
  }

  // Final report
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  FINAL REPORT                                         ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalBooths = results.reduce((sum, r) => sum + r.booths_added, 0);
  const successRate = (successful.length / results.length) * 100;

  console.log('📊 Summary:');
  console.log(`  Total sources tested: ${results.length}`);
  console.log(`  Successful: ${successful.length} (${successRate.toFixed(0)}%)`);
  console.log(`  Failed: ${failed.length}`);
  console.log(`  Total new booths added: ${totalBooths}\n`);

  if (successful.length > 0) {
    console.log('✅ Successful crawls:');
    successful.forEach(r => {
      console.log(`  • ${r.source_name}`);
      console.log(`    Duration: ${r.duration_s.toFixed(1)}s`);
      console.log(`    Booths added: ${r.booths_added}`);
      console.log(`    Pages: ${r.pages_crawled}`);
    });
    console.log('');
  }

  if (failed.length > 0) {
    console.log('❌ Failed crawls:');
    failed.forEach(r => {
      console.log(`  • ${r.source_name}`);
      console.log(`    Duration: ${r.duration_s.toFixed(1)}s`);
      console.log(`    Error: ${r.error}`);
    });
    console.log('');
  }

  // Check final booth count
  const { count } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📈 Total booths in database: ${count}`);
  console.log('\n✅ Crawler test complete!\n');
}

main();
