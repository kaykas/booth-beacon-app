#!/usr/bin/env tsx

/**
 * Execute Crawler Operations Script
 *
 * This script executes a complete crawler operation cycle:
 * 1. Verifies Edge Function deployment
 * 2. Queries crawl_sources for top priority sources
 * 3. Triggers crawls for specific sources with staggered timing
 * 4. Monitors crawler_metrics for results
 * 5. Generates comprehensive report
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Top priority sources to test
const TOP_SOURCES = [
  'photobooth.net',
  'lomography.com',
  'photomatica.com',
  'autophoto.org',
  'photoautomat.de'
];

const STAGGER_DELAY_MS = 30000; // 30 seconds

interface CrawlResult {
  source_name: string;
  success: boolean;
  error?: string;
  duration_ms?: number;
  booths_found?: number;
  status_code?: number;
}

async function checkEdgeFunctionDeployment(): Promise<boolean> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 STEP 1: Check Edge Function Deployment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-crawler`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });

    if (response.status === 404) {
      console.log('❌ Edge Function NOT deployed');
      console.log('\n💡 To deploy, run:');
      console.log('   supabase functions deploy unified-crawler --project-ref tmgbmcbwfkvmylmfpkzy\n');
      return false;
    }

    console.log('✅ Edge Function is deployed and responding');
    console.log(`   Status: ${response.status}`);
    console.log('');
    return true;
  } catch (error: any) {
    console.log('⚠️  Edge Function check failed:', error.message);
    console.log('   Assuming function is deployed but protected\n');
    return true; // Assume deployed if we can't check
  }
}

async function queryCrawlSources() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 STEP 2: Query crawl_sources Table');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { data, error } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: false });

  if (error) {
    console.error('❌ Error querying crawl_sources:', error.message);
    return [];
  }

  console.log(`✅ Found ${data.length} enabled sources\n`);
  console.log('Top 5 Priority Sources:');
  console.log('─────────────────────────────────────────\n');

  const topSources = data.filter(s => TOP_SOURCES.includes(s.source_name));

  topSources.forEach((source, idx) => {
    console.log(`${idx + 1}. ${source.source_name}`);
    console.log(`   URL: ${source.source_url}`);
    console.log(`   Priority: ${source.priority}`);
    console.log(`   Type: ${source.extractor_type}`);
    console.log(`   Last Crawl: ${source.last_crawl_timestamp || 'Never'}`);
    console.log('');
  });

  return topSources;
}

async function triggerSingleCrawl(sourceName: string, index: number, total: number): Promise<CrawlResult> {
  console.log(`🚀 [${index}/${total}] Triggering crawl: ${sourceName}`);
  console.log(`   Timestamp: ${new Date().toISOString()}`);

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

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Failed (${response.status}): ${errorText.substring(0, 100)}`);
      return {
        source_name: sourceName,
        success: false,
        error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
        duration_ms: duration,
        status_code: response.status,
      };
    }

    const result = await response.json();
    console.log(`   ✅ Success (${duration}ms)`);
    console.log(`   Booths found: ${result.summary?.total_booths_found || 0}`);
    console.log(`   Booths added: ${result.summary?.total_booths_added || 0}`);
    console.log('');

    return {
      source_name: sourceName,
      success: true,
      duration_ms: duration,
      booths_found: result.summary?.total_booths_found || 0,
      status_code: response.status,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ Exception: ${error.message}`);
    console.log('');

    return {
      source_name: sourceName,
      success: false,
      error: error.message,
      duration_ms: duration,
    };
  }
}

async function triggerCrawls(sources: any[]): Promise<CrawlResult[]> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 STEP 3: Trigger Crawls (30-second stagger)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results: CrawlResult[] = [];

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const result = await triggerSingleCrawl(source.source_name, i + 1, sources.length);
    results.push(result);

    // Stagger requests (except for last one)
    if (i < sources.length - 1) {
      console.log(`⏳ Waiting ${STAGGER_DELAY_MS / 1000}s before next crawl...\n`);
      await new Promise(resolve => setTimeout(resolve, STAGGER_DELAY_MS));
    }
  }

  return results;
}

async function checkCrawlerMetrics() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 STEP 4: Check crawler_metrics Table');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get recent metrics (last hour)
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  const { data: metrics, error } = await supabase
    .from('crawler_metrics')
    .select('*')
    .gte('started_at', oneHourAgo)
    .order('started_at', { ascending: false });

  if (error) {
    console.error('❌ Error querying crawler_metrics:', error.message);
    return [];
  }

  console.log(`✅ Found ${metrics.length} crawl metrics in last hour\n`);

  if (metrics.length > 0) {
    console.log('Recent Crawl Metrics:');
    console.log('─────────────────────────────────────────\n');

    metrics.slice(0, 10).forEach((metric, idx) => {
      console.log(`${idx + 1}. ${metric.source_name}`);
      console.log(`   Status: ${metric.status}`);
      console.log(`   Booths extracted: ${metric.booths_extracted}`);
      console.log(`   Pages crawled: ${metric.pages_crawled}`);
      console.log(`   Duration: ${metric.duration_ms}ms`);
      console.log(`   Started: ${new Date(metric.started_at).toLocaleString()}`);
      if (metric.error_message) {
        console.log(`   Error: ${metric.error_message.substring(0, 100)}`);
      }
      console.log('');
    });
  }

  return metrics;
}

async function countNewBooths() {
  console.log('🔢 Counting total booths in database...\n');

  const { count, error } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error counting booths:', error.message);
    return 0;
  }

  console.log(`✅ Total booths in database: ${count}\n`);
  return count || 0;
}

function generateReport(sources: any[], crawlResults: CrawlResult[], metrics: any[], totalBooths: number) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 STEP 5: Final Report');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const successfulCrawls = crawlResults.filter(r => r.success);
  const failedCrawls = crawlResults.filter(r => !r.success);
  const totalBoothsExtracted = crawlResults.reduce((sum, r) => sum + (r.booths_found || 0), 0);
  const avgDuration = crawlResults.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / crawlResults.length;
  const successRate = (successfulCrawls.length / crawlResults.length) * 100;

  console.log('═══════════════════════════════════════════');
  console.log('           CRAWLER EXECUTION REPORT');
  console.log('═══════════════════════════════════════════\n');

  console.log('📊 EXECUTION SUMMARY');
  console.log('─────────────────────────────────────────');
  console.log(`Crawls executed:        ${crawlResults.length}`);
  console.log(`Successful:             ${successfulCrawls.length} (${successRate.toFixed(1)}%)`);
  console.log(`Failed:                 ${failedCrawls.length}`);
  console.log(`Average duration:       ${Math.round(avgDuration)}ms`);
  console.log('');

  console.log('📈 EXTRACTION RESULTS');
  console.log('─────────────────────────────────────────');
  console.log(`New booths extracted:   ${totalBoothsExtracted}`);
  console.log(`Total booths in DB:     ${totalBooths}`);
  console.log('');

  if (successfulCrawls.length > 0) {
    console.log('✅ SUCCESSFUL CRAWLS');
    console.log('─────────────────────────────────────────');
    successfulCrawls.forEach(result => {
      console.log(`• ${result.source_name}`);
      console.log(`  Booths found: ${result.booths_found || 0}`);
      console.log(`  Duration: ${result.duration_ms}ms`);
    });
    console.log('');
  }

  if (failedCrawls.length > 0) {
    console.log('❌ FAILED CRAWLS');
    console.log('─────────────────────────────────────────');
    failedCrawls.forEach(result => {
      console.log(`• ${result.source_name}`);
      console.log(`  Error: ${result.error}`);
      console.log(`  Status: ${result.status_code || 'N/A'}`);
    });
    console.log('');
  }

  console.log('📊 CRAWLER HEALTH METRICS');
  console.log('─────────────────────────────────────────');
  console.log(`Recent metrics logged:  ${metrics.length}`);
  const successfulMetrics = metrics.filter(m => m.status === 'success').length;
  const errorMetrics = metrics.filter(m => m.status === 'error').length;
  console.log(`Successful operations:  ${successfulMetrics}`);
  console.log(`Error operations:       ${errorMetrics}`);
  console.log('');

  console.log('═══════════════════════════════════════════');
  console.log('           END OF REPORT');
  console.log('═══════════════════════════════════════════\n');
}

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   BOOTH BEACON CRAWLER OPERATIONS         ║');
  console.log('║   Extract New Booths from Top Sources     ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');

  try {
    // Step 1: Check deployment
    const isDeployed = await checkEdgeFunctionDeployment();
    if (!isDeployed) {
      console.log('⚠️  Cannot proceed without deployed Edge Function');
      console.log('   Run deployment command above and try again.\n');
      process.exit(1);
    }

    // Step 2: Query sources
    const sources = await queryCrawlSources();
    if (sources.length === 0) {
      console.log('⚠️  No matching sources found. Exiting.\n');
      process.exit(1);
    }

    // Step 3: Trigger crawls
    const crawlResults = await triggerCrawls(sources);

    // Step 4: Check metrics
    const metrics = await checkCrawlerMetrics();

    // Step 5: Count total booths
    const totalBooths = await countNewBooths();

    // Step 6: Generate report
    generateReport(sources, crawlResults, metrics, totalBooths);

    console.log('✅ Crawler operations completed successfully!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
