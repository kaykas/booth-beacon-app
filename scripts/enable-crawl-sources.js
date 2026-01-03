#!/usr/bin/env node
/**
 * Enable and populate crawl_sources table for async crawler
 *
 * This script:
 * 1. Checks current crawl_sources status
 * 2. Enables sources that have extractor_type configured
 * 3. Sets them to 'active' status for crawling
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  console.log('=== CRAWL SOURCES ANALYSIS & ENABLEMENT ===\n');

  // 1. Fetch all sources
  const { data: allSources, error: fetchError } = await supabase
    .from('crawl_sources')
    .select('*')
    .order('priority', { ascending: false });

  if (fetchError) {
    console.error('Error fetching sources:', fetchError);
    process.exit(1);
  }

  console.log(`Total sources in database: ${allSources.length}\n`);

  // 2. Analyze current state
  const hasExtractor = allSources.filter(s => s.extractor_type);
  const enabled = allSources.filter(s => s.enabled);
  const active = allSources.filter(s => s.status === 'active');
  const readyToCrawl = allSources.filter(s => s.enabled && s.status === 'active' && s.extractor_type);

  console.log('Current Status:');
  console.log(`- Has extractor_type: ${hasExtractor.length}`);
  console.log(`- Enabled: ${enabled.length}`);
  console.log(`- Status 'active': ${active.length}`);
  console.log(`- Ready to crawl: ${readyToCrawl.length}\n`);

  // 3. Find sources that should be enabled (have extractor but aren't ready)
  const shouldEnable = allSources.filter(s =>
    s.extractor_type &&
    (!s.enabled || s.status !== 'active')
  );

  if (shouldEnable.length === 0) {
    console.log('✅ All sources with extractors are already enabled and active!');
    console.log('\n=== READY TO CRAWL SOURCES ===');
    readyToCrawl.forEach(s => {
      const lastCrawl = s.last_crawl_timestamp
        ? new Date(s.last_crawl_timestamp).toISOString().split('T')[0]
        : 'never';
      console.log(`✓ ${s.source_name} (${s.extractor_type}) - Priority: ${s.priority}, Last: ${lastCrawl}`);
    });
    return;
  }

  console.log(`Found ${shouldEnable.length} sources to enable:\n`);
  shouldEnable.forEach(s => {
    console.log(`- ${s.source_name} (${s.extractor_type})`);
    console.log(`  Current: enabled=${s.enabled}, status=${s.status}`);
  });

  console.log('\n🔄 Enabling sources...\n');

  // 4. Enable each source
  const results = [];
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
      console.log(`❌ Failed to enable ${source.source_name}: ${updateError.message}`);
      results.push({ name: source.source_name, success: false, error: updateError.message });
    } else {
      console.log(`✅ Enabled ${source.source_name}`);
      results.push({ name: source.source_name, success: true });
    }
  }

  // 5. Summary
  const successes = results.filter(r => r.success).length;
  const failures = results.filter(r => !r.success).length;

  console.log('\n=== SUMMARY ===');
  console.log(`Successfully enabled: ${successes}`);
  console.log(`Failed: ${failures}`);

  if (failures > 0) {
    console.log('\nFailed sources:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`- ${r.name}: ${r.error}`);
    });
  }

  // 6. Final count
  const { data: finalSources } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('enabled', true)
    .eq('status', 'active');

  console.log(`\n✅ Final count: ${finalSources.length} sources ready to crawl`);

  console.log('\n=== TOP PRIORITY SOURCES (Priority >= 80) ===');
  const topPriority = finalSources
    .filter(s => s.priority >= 80)
    .sort((a, b) => b.priority - a.priority);

  topPriority.forEach(s => {
    const lastCrawl = s.last_crawl_timestamp
      ? new Date(s.last_crawl_timestamp).toISOString().split('T')[0]
      : 'never';
    console.log(`${s.priority}: ${s.source_name} (${s.extractor_type}) - Last: ${lastCrawl}`);
  });
}

main().catch(console.error);
