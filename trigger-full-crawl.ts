#!/usr/bin/env node
/**
 * Trigger Full Crawler Run
 *
 * Triggers all enabled sources with real-time SSE monitoring
 */

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx trigger-full-crawl.ts');
  process.exit(1);
}

interface SSEEvent {
  type: string;
  [key: string]: any;
}

async function triggerCrawlWithMonitoring() {
  console.log('🚀 Triggering Full Crawl of ALL Enabled Sources\n');
  console.log('📡 Connecting to SSE stream for real-time updates...\n');
  console.log('=' .repeat(80));

  const url = `${SUPABASE_URL}/functions/v1/unified-crawler?stream=true&force_crawl=true`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Accept': 'text/event-stream',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error ${response.status}: ${errorText}`);
      process.exit(1);
    }

    if (!response.body) {
      console.error('❌ No response body received');
      process.exit(1);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const stats = {
      totalSources: 0,
      sourcesProcessed: 0,
      boothsFound: 0,
      boothsAdded: 0,
      boothsUpdated: 0,
      errors: [] as string[],
      sourceResults: [] as any[],
      startTime: Date.now(),
    };

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('\n' + '='.repeat(80));
        console.log('📊 FINAL SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total Sources: ${stats.totalSources}`);
        console.log(`Sources Processed: ${stats.sourcesProcessed}`);
        console.log(`Booths Found: ${stats.boothsFound}`);
        console.log(`Booths Added: ${stats.boothsAdded}`);
        console.log(`Booths Updated: ${stats.boothsUpdated}`);
        console.log(`Errors: ${stats.errors.length}`);
        console.log(`Duration: ${Math.round((Date.now() - stats.startTime) / 1000)}s`);
        console.log('='.repeat(80));

        if (stats.sourceResults.length > 0) {
          console.log('\n📋 DETAILED RESULTS BY SOURCE:');
          stats.sourceResults.forEach(result => {
            console.log(`\n  ${result.source_name}:`);
            console.log(`    Status: ${result.status}`);
            console.log(`    Booths Found: ${result.booths_found}`);
            console.log(`    Booths Added: ${result.booths_added}`);
            console.log(`    Booths Updated: ${result.booths_updated}`);
            if (result.pages_crawled) {
              console.log(`    Pages Crawled: ${result.pages_crawled}`);
            }
            if (result.error_message) {
              console.log(`    Error: ${result.error_message}`);
            }
          });
        }

        if (stats.errors.length > 0) {
          console.log('\n⚠️  ERRORS:');
          stats.errors.forEach(err => console.log(`  - ${err}`));
        }

        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const event: SSEEvent = JSON.parse(data);
            handleEvent(event, stats);
          } catch (e) {
            console.error('Failed to parse SSE event:', data);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

function handleEvent(event: SSEEvent, stats: any) {
  switch (event.type) {
    case 'start':
      stats.totalSources = event.total_sources;
      console.log(`\n🎯 Starting crawl of ${event.total_sources} enabled sources`);
      console.log(`⏰ Started at: ${new Date(event.timestamp).toLocaleTimeString()}\n`);
      break;

    case 'progress':
      if (event.status === 'starting') {
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`📍 [${event.current}/${event.total}] Processing: ${event.source_name}`);
        console.log(`${'─'.repeat(80)}`);
      } else if (event.status === 'complete') {
        stats.sourcesProcessed++;
        const result = event.result;
        if (result) {
          stats.boothsFound += result.booths_found || 0;
          stats.boothsAdded += result.booths_added || 0;
          stats.boothsUpdated += result.booths_updated || 0;
          stats.sourceResults.push(result);

          console.log(`✅ Completed ${event.source_name}:`);
          console.log(`   Booths Found: ${result.booths_found}`);
          console.log(`   Booths Added: ${result.booths_added}`);
          console.log(`   Booths Updated: ${result.booths_updated}`);
          if (result.pages_crawled) {
            console.log(`   Pages Crawled: ${result.pages_crawled}`);
          }
          console.log(`   Duration: ${Math.round(result.crawl_duration_ms / 1000)}s`);
        }
      } else if (event.status === 'skipped') {
        stats.sourcesProcessed++;
        console.log(`⏭️  Skipped ${event.source_name} (recently crawled)`);
      }
      break;

    case 'batch_start':
      console.log(`  🔄 Batch #${event.batch_number}: Pages ${event.start_page}-${event.end_page} (${event.progress_percent}% complete)`);
      console.log(`     Booths so far: ${event.booths_so_far}`);
      break;

    case 'batch_crawled':
      console.log(`     ✓ Crawled ${event.pages_crawled} pages`);
      break;

    case 'extraction_start':
      console.log(`     📊 Extracting booths from ${event.total_pages} pages...`);
      break;

    case 'extraction_progress':
      // Silent progress - only show every 5 pages to reduce noise
      if (event.page_index % 5 === 0) {
        console.log(`        Processing page ${event.page_index}/${event.total_pages}...`);
      }
      break;

    case 'extraction_complete':
      console.log(`     ✅ Extracted ${event.booths_extracted} booths in ${Math.round(event.extraction_duration_ms / 1000)}s`);
      break;

    case 'batch_complete':
      console.log(`  ✅ Batch #${event.batch_number} complete: ${event.booths_so_far} booths total`);
      if (!event.is_complete) {
        console.log(`     Progress: ${event.current_page}/${event.total_pages} pages (${event.progress_percent}%)`);
      }
      break;

    case 'batch_timeout':
      console.log(`  ⏰ Batch timeout: ${event.current_page}/${event.total_pages} pages complete`);
      console.log(`     Booths collected: ${event.booths_so_far}`);
      console.log(`     Will resume on next run`);
      break;

    case 'batch_error':
      const errorMsg = `Batch #${event.batch_number} error: ${event.error}`;
      stats.errors.push(errorMsg);
      console.log(`  ❌ ${errorMsg}`);
      break;

    case 'source_complete':
      console.log(`  🎉 Source complete! ${event.total_batches} batches, ${event.total_pages_crawled} pages, ${event.total_booths_found} booths`);
      break;

    case 'complete':
      // Handled after stream closes
      break;

    case 'error':
      stats.errors.push(event.error);
      console.log(`\n❌ ERROR: ${event.error}`);
      break;

    default:
      // Unknown event type - log for debugging
      console.log(`  [${event.type}]`, JSON.stringify(event).slice(0, 100));
  }
}

// Run the crawler
triggerCrawlWithMonitoring().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
