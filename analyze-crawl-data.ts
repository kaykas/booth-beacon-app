import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeCrawlData() {
  console.log('=== CRAWL DATA ANALYSIS ===\n');

  // 1. Get all crawl sources with their booth counts
  console.log('1. Crawl Sources with Booth Counts:');
  const { data: sources, error: sourcesError } = await supabase
    .from('crawl_sources')
    .select('*')
    .order('name');

  if (sourcesError) {
    console.error('Error fetching sources:', sourcesError);
    return;
  }

  // Get booth counts for each source
  for (const source of sources || []) {
    const { count } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true })
      .eq('source_id', source.id);

    console.log(`  ${source.name} (${source.url})`);
    console.log(`    Active: ${source.is_active}`);
    console.log(`    Booths extracted: ${count || 0}`);
    console.log(`    Source ID: ${source.id}`);
    console.log('');
  }

  // 2. Get crawl cache statistics
  console.log('\n2. Crawl Cache Statistics:');
  const { data: cacheStats } = await supabase
    .from('crawl_cache')
    .select('source_id, content_type, created_at')
    .order('created_at', { ascending: false });

  const cacheBySource = new Map<string, number>();
  for (const cache of cacheStats || []) {
    const count = cacheBySource.get(cache.source_id) || 0;
    cacheBySource.set(cache.source_id, count + 1);
  }

  console.log('  Cached pages by source:');
  for (const [sourceId, count] of cacheBySource.entries()) {
    const source = sources?.find(s => s.id === sourceId);
    console.log(`    ${source?.name || sourceId}: ${count} pages`);
  }

  // 3. Find sources with low extraction rates
  console.log('\n3. Sources with Low Extraction Rates:');
  const lowExtractionSources = [];

  for (const source of sources || []) {
    const { count: boothCount } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true })
      .eq('source_id', source.id);

    const cacheCount = cacheBySource.get(source.id) || 0;

    if (cacheCount > 0 && (boothCount || 0) < 5) {
      lowExtractionSources.push({
        source,
        boothCount: boothCount || 0,
        cacheCount
      });
    }
  }

  for (const { source, boothCount, cacheCount } of lowExtractionSources) {
    console.log(`  ${source.name}:`);
    console.log(`    Cached pages: ${cacheCount}`);
    console.log(`    Booths extracted: ${boothCount}`);
    console.log(`    Extraction rate: ${boothCount}/${cacheCount}`);
    console.log('');
  }

  // 4. Show sample cached content for low-extraction sources
  console.log('\n4. Sample Cached Content for Low Extraction Sources:');
  for (const { source } of lowExtractionSources.slice(0, 3)) {
    console.log(`\n  === ${source.name} ===`);

    const { data: cacheData } = await supabase
      .from('crawl_cache')
      .select('url, content_type, content_length, markdown_content, html_content')
      .eq('source_id', source.id)
      .limit(1)
      .single();

    if (cacheData) {
      console.log(`    URL: ${cacheData.url}`);
      console.log(`    Content Type: ${cacheData.content_type}`);
      console.log(`    Content Length: ${cacheData.content_length}`);

      // Show snippet of markdown content
      const content = cacheData.markdown_content || cacheData.html_content;
      if (content) {
        const snippet = content.slice(0, 500);
        console.log(`    Content Preview:\n${snippet}...\n`);
      }
    }
  }

  // 5. Get crawler metrics
  console.log('\n5. Recent Crawler Metrics:');
  const { data: metrics } = await supabase
    .from('crawler_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  for (const metric of metrics || []) {
    const source = sources?.find(s => s.id === metric.source_id);
    console.log(`  ${source?.name || metric.source_id} (${new Date(metric.created_at).toLocaleString()}):`);
    console.log(`    Status: ${metric.status}`);
    console.log(`    Booths found: ${metric.booths_found}`);
    console.log(`    Duration: ${metric.duration_ms}ms`);
    if (metric.error_message) {
      console.log(`    Error: ${metric.error_message}`);
    }
    console.log('');
  }
}

analyzeCrawlData().catch(console.error);
