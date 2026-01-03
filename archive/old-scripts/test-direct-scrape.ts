/**
 * Test: Direct scrape of browse.php without extra parameters
 */

import { FirecrawlAppV1 } from '@mendable/firecrawl-js';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';
const firecrawl = new FirecrawlAppV1({ apiKey: FIRECRAWL_API_KEY });

async function testDirectScrape() {
  const url = 'http://www.photobooth.net/locations/browse.php?ddState=0';

  console.log('\n🔍 Testing direct scrape of:', url);
  console.log('='.repeat(80), '\n');

  const result = await firecrawl.scrapeUrl(url, {
    formats: ['markdown']
  });

  if (!result.success) {
    console.error('❌ Scrape failed:', result);
    return;
  }

  console.log('✅ Scrape successful!');
  console.log(`Content length: ${(result.markdown || '').length} chars\n`);
  console.log('First 2000 chars:');
  console.log('='.repeat(80));
  console.log(result.markdown?.substring(0, 2000));
  console.log('='.repeat(80));
  console.log(`\nLast 500 chars:`);
  console.log('='.repeat(80));
  console.log(result.markdown?.substring((result.markdown?.length || 0) - 500));
  console.log('='.repeat(80));
}

testDirectScrape().catch(console.error);
