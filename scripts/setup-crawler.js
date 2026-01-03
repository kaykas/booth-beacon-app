#!/usr/bin/env node
/**
 * Complete Crawler Setup & Status Check
 *
 * This script:
 * 1. Verifies crawl_jobs table exists
 * 2. Checks crawl_sources configuration
 * 3. Enables sources with extractors
 * 4. Shows ready-to-crawl sources
 * 5. Provides next steps for testing
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('\nUsage:');
  console.log('  SUPABASE_SERVICE_ROLE_KEY="your-key" node setup-crawler.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkCrawlJobsTable() {
  console.log('📋 Checking crawl_jobs table...');

  const { data, error } = await supabase
    .from('crawl_jobs')
    .select('id')
    .limit(1);

  if (error) {
    if (error.message.includes('relation "public.crawl_jobs" does not exist')) {
      console.log('❌ crawl_jobs table does not exist!');
      console.log('   Run migration: supabase/migrations/20260103_add_crawl_jobs_table.sql');
      return false;
    }
    console.log(`⚠️  Error checking crawl_jobs: ${error.message}`);
    return false;
  }

  console.log('✅ crawl_jobs table exists');
  return true;
}

async function analyzeAndEnableSources() {
  console.log('\n📊 Analyzing crawl_sources...');

  // Fetch all sources
  const { data: allSources, error: fetchError } = await supabase
    .from('crawl_sources')
    .select('*')
    .order('priority', { ascending: false });

  if (fetchError) {
    console.error('❌ Error fetching sources:', fetchError);
    return null;
  }

  console.log(`   Total sources: ${allSources.length}`);

  // Analyze
  const hasExtractor = allSources.filter(s => s.extractor_type);
  const enabled = allSources.filter(s => s.enabled);
  const active = allSources.filter(s => s.status === 'active');
  const readyToCrawl = allSources.filter(s =>
    s.enabled && s.status === 'active' && s.extractor_type
  );

  console.log(`   Has extractor_type: ${hasExtractor.length}`);
  console.log(`   Enabled: ${enabled.length}`);
  console.log(`   Status 'active': ${active.length}`);
  console.log(`   ✅ Ready to crawl: ${readyToCrawl.length}`);

  // Find sources that should be enabled
  const shouldEnable = allSources.filter(s =>
    s.extractor_type &&
    (!s.enabled || s.status !== 'active')
  );

  if (shouldEnable.length > 0) {
    console.log(`\n🔧 Found ${shouldEnable.length} sources to enable:`);
    shouldEnable.forEach(s => {
      console.log(`   - ${s.source_name} (${s.extractor_type})`);
    });

    console.log('\n🔄 Enabling sources...');

    let successCount = 0;
    for (const source of shouldEnable) {
      const { error: updateError } = await supabase
        .from('crawl_sources')
        .update({
          enabled: true,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', source.id);

      if (updateError) {
        console.log(`   ❌ ${source.source_name}: ${updateError.message}`);
      } else {
        console.log(`   ✅ ${source.source_name}`);
        successCount++;
      }
    }

    console.log(`\n   Enabled ${successCount}/${shouldEnable.length} sources`);

    // Re-fetch to get updated list
    const { data: updatedSources } = await supabase
      .from('crawl_sources')
      .select('*')
      .eq('enabled', true)
      .eq('status', 'active')
      .not('extractor_type', 'is', null)
      .order('priority', { ascending: false });

    return updatedSources || [];
  }

  return readyToCrawl;
}

async function showReadySources(sources) {
  if (!sources || sources.length === 0) {
    console.log('\n⚠️  No sources ready to crawl!');
    return;
  }

  console.log(`\n✅ ${sources.length} SOURCES READY TO CRAWL\n`);

  // Group by tier
  const tier1 = sources.filter(s => s.priority >= 90);
  const tier2 = sources.filter(s => s.priority >= 70 && s.priority < 90);
  const tier3 = sources.filter(s => s.priority >= 50 && s.priority < 70);
  const tier4 = sources.filter(s => s.priority < 50);

  if (tier1.length > 0) {
    console.log('🥇 TIER 1 - Gold Standard (Priority 90+):');
    tier1.forEach(s => {
      const lastCrawl = s.last_crawl_timestamp
        ? new Date(s.last_crawl_timestamp).toISOString().split('T')[0]
        : 'never';
      console.log(`   ${s.priority}: ${s.source_name}`);
      console.log(`       Type: ${s.extractor_type}, Last: ${lastCrawl}`);
    });
    console.log();
  }

  if (tier2.length > 0) {
    console.log('🥈 TIER 2 - Regional Directories (Priority 70-89):');
    tier2.slice(0, 5).forEach(s => {
      console.log(`   ${s.priority}: ${s.source_name} (${s.extractor_type})`);
    });
    if (tier2.length > 5) {
      console.log(`   ... and ${tier2.length - 5} more`);
    }
    console.log();
  }

  if (tier3.length > 0) {
    console.log(`🥉 TIER 3 - City Guides (Priority 50-69): ${tier3.length} sources`);
  }

  if (tier4.length > 0) {
    console.log(`📌 TIER 4 - Community/Blogs (Priority <50): ${tier4.length} sources`);
  }

  // Show crawl stats
  console.log('\n📈 CRAWL STATISTICS:');
  const crawled = sources.filter(s => s.last_crawl_timestamp);
  const neverCrawled = sources.filter(s => !s.last_crawl_timestamp);
  const hasBooths = sources.filter(s => s.total_booths_found > 0);

  console.log(`   Crawled at least once: ${crawled.length}/${sources.length}`);
  console.log(`   Never crawled: ${neverCrawled.length}`);
  console.log(`   Found booths: ${hasBooths.length}`);

  const totalBooths = sources.reduce((sum, s) => sum + (s.total_booths_found || 0), 0);
  console.log(`   Total booths found: ${totalBooths}`);
}

async function showNextSteps() {
  console.log('\n🚀 NEXT STEPS:\n');

  console.log('1. Test async crawler with a single source:');
  console.log('   curl -X POST "https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/unified-crawler" \\');
  console.log('     -H "Authorization: Bearer ' + serviceKey.substring(0, 20) + '..." \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"source_name": "Photobooth.net", "async": true, "force_crawl": true}\'');

  console.log('\n2. Check job status:');
  console.log('   node -e "');
  console.log('     const { createClient } = require(\'@supabase/supabase-js\');');
  console.log('     const supabase = createClient(\'https://tmgbmcbwfkvmylmfpkzy.supabase.co\', process.env.SUPABASE_SERVICE_ROLE_KEY);');
  console.log('     supabase.from(\'crawl_jobs\').select(\'*\').order(\'created_at\', {ascending: false}).limit(5)');
  console.log('       .then(({data}) => console.log(JSON.stringify(data, null, 2)));');
  console.log('   "');

  console.log('\n3. Run batch crawl for all tier 1 sources:');
  console.log('   (Create a script to iterate through tier 1 sources)');

  console.log('\n4. Monitor crawler_metrics:');
  console.log('   SELECT source_name, booths_found, status FROM crawler_metrics ORDER BY created_at DESC LIMIT 10;');

  console.log('\n📚 Documentation:');
  console.log('   - Crawler: supabase/functions/unified-crawler/');
  console.log('   - Async mode: supabase/functions/unified-crawler/async-crawler.ts');
  console.log('   - Report: CRAWL_SOURCES_REPORT.md');
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('🤖 BOOTH BEACON CRAWLER SETUP');
  console.log('═══════════════════════════════════════════════\n');

  // Step 1: Check crawl_jobs table
  const jobsTableExists = await checkCrawlJobsTable();

  // Step 2: Analyze and enable sources
  const readySources = await analyzeAndEnableSources();

  // Step 3: Show ready sources
  if (readySources) {
    await showReadySources(readySources);
  }

  // Step 4: Show next steps
  await showNextSteps();

  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ SETUP COMPLETE');
  console.log('═══════════════════════════════════════════════\n');

  if (!jobsTableExists) {
    console.log('⚠️  WARNING: crawl_jobs table is missing!');
    console.log('    Async crawler will not work until you run the migration.\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
