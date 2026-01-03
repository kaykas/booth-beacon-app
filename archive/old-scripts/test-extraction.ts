import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testExtraction() {
  console.log('=== TESTING EXTRACTION ON CACHED DATA ===\n');

  // Get a few samples of raw content for sources with 0 booths
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('enabled', true);

  if (!sources) {
    console.log('No sources found');
    return;
  }

  // Find sources with raw content but 0 booths
  for (const source of sources.slice(0, 5)) {
    const { count: boothCount } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true })
      .eq('source_id', source.id);

    const { data: rawContent, count: rawCount } = await supabase
      .from('crawl_raw_content')
      .select('*', { count: 'exact' })
      .eq('source_id', source.id)
      .limit(1);

    if ((boothCount || 0) === 0 && rawCount && rawCount > 0 && rawContent && rawContent.length > 0) {
      const content = rawContent[0];
      console.log(`\n=== ${source.source_name} ===`);
      console.log(`URL: ${content.url}`);
      console.log(`Booths in DB: ${boothCount || 0}`);
      console.log(`Extractor type: ${source.extractor_type}`);
      console.log(`Markdown length: ${content.raw_markdown?.length || 0}`);
      console.log(`HTML length: ${content.raw_html?.length || 0}`);

      // Save markdown content to file for inspection
      const filename = `/tmp/${source.source_name.replace(/[^a-z0-9]/gi, '_')}_content.txt`;
      fs.writeFileSync(filename, content.raw_markdown || content.raw_html || '');
      console.log(`Content saved to: ${filename}`);

      // Show a snippet of the content
      const contentText = content.raw_markdown || content.raw_html || '';
      console.log(`\nContent preview (first 1000 chars):`);
      console.log('-'.repeat(80));
      console.log(contentText.slice(0, 1000));
      console.log('-'.repeat(80));

      // Look for potential booth indicators
      const keywords = ['photo booth', 'address', 'location', 'street', 'avenue', 'blvd', 'machine', 'analog'];
      const foundKeywords = keywords.filter(kw =>
        contentText.toLowerCase().includes(kw)
      );
      console.log(`\nKeywords found: ${foundKeywords.join(', ')}`);

      // Try to identify obvious booth mentions
      const lines = contentText.split('\n');
      const potentialBooths = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if ((line.includes('photo') || line.includes('booth')) &&
            (line.includes('address') || line.includes('location') || /\d+\s+\w+\s+(st|ave|blvd|rd|street|avenue)/.test(line))) {
          potentialBooths.push(lines[i]);
        }
      }

      if (potentialBooths.length > 0) {
        console.log(`\nPotential booth mentions found (${potentialBooths.length}):`);
        potentialBooths.slice(0, 5).forEach(booth => {
          console.log(`  - ${booth.trim()}`);
        });
      }

      console.log('\n' + '='.repeat(80));
    }
  }

  // Now test a specific source with raw content
  console.log('\n\n=== DETAILED ANALYSIS OF SPECIFIC SOURCE ===\n');

  const testSources = ['autophoto.org', 'Time Out LA', 'Block Club Chicago'];

  for (const testSourceName of testSources) {
    const { data: testSource } = await supabase
      .from('crawl_sources')
      .select('*')
      .ilike('source_name', `%${testSourceName}%`)
      .single();

    if (!testSource) continue;

    const { data: rawContent } = await supabase
      .from('crawl_raw_content')
      .select('*')
      .eq('source_id', testSource.id)
      .limit(1);

    if (rawContent && rawContent.length > 0) {
      const content = rawContent[0];
      console.log(`\n=== ${testSource.source_name} ===`);
      console.log(`URL: ${content.url}`);
      console.log(`Extractor type: ${testSource.extractor_type}`);

      const contentText = content.raw_markdown || content.raw_html || '';

      // More detailed pattern matching
      console.log('\n--- Searching for structured booth data ---');

      // Pattern 1: Look for address-like patterns
      const addressRegex = /\b\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir)\b/gi;
      const addresses = contentText.match(addressRegex);
      if (addresses) {
        console.log(`\nAddress patterns found (${addresses.length}):`);
        addresses.slice(0, 10).forEach(addr => console.log(`  ${addr}`));
      }

      // Pattern 2: Look for venue names with addresses
      const lines = contentText.split('\n');
      const venueWithAddress = [];
      for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].length > 0 && lines[i].length < 100 && !lines[i].startsWith('#')) {
          if (addressRegex.test(lines[i + 1]) || /\d+/.test(lines[i + 1])) {
            venueWithAddress.push(`${lines[i]} | ${lines[i + 1]}`);
          }
        }
      }

      if (venueWithAddress.length > 0) {
        console.log(`\nPotential venue + address pairs (${venueWithAddress.length}):`);
        venueWithAddress.slice(0, 10).forEach(pair => console.log(`  ${pair.trim()}`));
      }

      // Save full content
      const filename = `/tmp/${testSource.source_name.replace(/[^a-z0-9]/gi, '_')}_FULL.txt`;
      fs.writeFileSync(filename, contentText);
      console.log(`\nFull content saved to: ${filename}`);
    }
  }
}

testExtraction().catch(console.error);
