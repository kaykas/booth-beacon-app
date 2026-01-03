/**
 * Test: Scrape photobooth.net to understand its structure
 * Uses Firecrawl's scrape() to get raw markdown content
 */

import { FirecrawlAppV1 } from '@mendable/firecrawl-js';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';

if (!FIRECRAWL_API_KEY) {
  console.error('❌ Missing FIRECRAWL_API_KEY');
  process.exit(1);
}

const firecrawl = new FirecrawlAppV1({ apiKey: FIRECRAWL_API_KEY });

async function scrapePhotoboothNet() {
  const url = 'https://www.photobooth.net/locations/?includeInactiveBooths=1';

  console.log('\n🔍 Scraping photobooth.net to analyze structure...\n');
  console.log(`URL: ${url}\n`);

  try {
    // Step 1: Scrape with multiple formats
    console.log('📥 Scraping with Firecrawl...');
    const scrapeResult = await firecrawl.scrapeUrl(url, {
      formats: ['markdown', 'html', 'links'],
    });

    if (!scrapeResult.success) {
      console.error('❌ Scrape failed:', scrapeResult);
      return;
    }

    console.log('\n✅ Scrape successful!\n');

    // Analyze markdown content
    console.log('📄 MARKDOWN CONTENT (first 3000 chars):');
    console.log('='.repeat(80));
    console.log(scrapeResult.markdown?.substring(0, 3000));
    console.log('='.repeat(80));

    // Analyze links
    console.log('\n\n🔗 EXTRACTED LINKS:');
    console.log('='.repeat(80));
    if (scrapeResult.links && scrapeResult.links.length > 0) {
      scrapeResult.links.slice(0, 20).forEach((link, i) => {
        console.log(`${i + 1}. ${link}`);
      });
      console.log(`\n(Showing first 20 of ${scrapeResult.links.length} total links)`);
    } else {
      console.log('No links found');
    }
    console.log('='.repeat(80));

    // Save full content to file for analysis
    const fs = await import('fs/promises');
    await fs.writeFile(
      '/private/tmp/photobooth-net-scrape.md',
      scrapeResult.markdown || 'No markdown content',
      'utf-8'
    );
    console.log('\n💾 Full markdown saved to: /private/tmp/photobooth-net-scrape.md');

    // Analyze structure
    console.log('\n\n🔬 STRUCTURE ANALYSIS:');
    console.log('='.repeat(80));
    const markdown = scrapeResult.markdown || '';

    // Look for booth patterns
    const addressPattern = /\d+\s+[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}/g;
    const addresses = markdown.match(addressPattern);
    console.log(`📍 Found ${addresses?.length || 0} potential addresses with pattern "123 Street, ST 12345"`);

    // Look for booth names
    const boldPattern = /\*\*([^*]+)\*\*/g;
    const boldText = markdown.match(boldPattern);
    console.log(`🏢 Found ${boldText?.length || 0} bold text items (potential booth names)`);

    // Look for lists
    const listItemPattern = /^[\s]*[-*]\s+(.+)$/gm;
    const listItems = markdown.match(listItemPattern);
    console.log(`📋 Found ${listItems?.length || 0} list items`);

    // Look for tables
    const hasTable = markdown.includes('|');
    console.log(`📊 Contains table: ${hasTable}`);

    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

scrapePhotoboothNet().catch(console.error);
