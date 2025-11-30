import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  // Check all raw content
  const { data: allRawContent, count } = await supabase
    .from('crawl_raw_content')
    .select('*', { count: 'exact' })
    .order('crawled_at', { ascending: false })
    .limit(10);

  console.log(`Total raw content records: ${count}`);

  if (!allRawContent || allRawContent.length === 0) {
    console.log('No raw content found!');
    return;
  }

  console.log(`\nShowing ${allRawContent.length} most recent records:\n`);

  for (const content of allRawContent) {
    // Get source name
    const { data: source } = await supabase
      .from('crawl_sources')
      .select('source_name, extractor_type')
      .eq('id', content.source_id)
      .single();

    console.log(`\n=== ${source?.source_name || 'Unknown'} ===`);
    console.log(`URL: ${content.url}`);
    console.log(`Source ID: ${content.source_id}`);
    console.log(`Extractor type: ${source?.extractor_type}`);
    console.log(`Crawled at: ${content.crawled_at}`);
    console.log(`Markdown length: ${content.raw_markdown?.length || 0} chars`);
    console.log(`HTML length: ${content.raw_html?.length || 0} chars`);

    const markdown = content.raw_markdown || '';
    const html = content.raw_html || '';

    // Show snippet
    if (markdown.length > 0) {
      console.log(`\nMarkdown snippet:`);
      console.log('-'.repeat(80));
      console.log(markdown.slice(0, 800));
      console.log('...');
      console.log('-'.repeat(80));

      // Save to file
      const filename = `/tmp/${source?.source_name.replace(/[^a-z0-9]/gi, '_')}_markdown.txt`;
      fs.writeFileSync(filename, markdown);
      console.log(`Full markdown saved to: ${filename}`);
    }

    // Look for booth indicators
    const text = markdown || html;
    const hasAddresses = /\d+\s+[A-Za-z\s]+(St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road)/i.test(text);
    const hasBoothMention = /photo\s*booth/i.test(text);
    const hasLocation = /location|address|where/i.test(text);

    console.log(`\nContent analysis:`);
    console.log(`  Contains addresses: ${hasAddresses}`);
    console.log(`  Mentions photo booths: ${hasBoothMention}`);
    console.log(`  Contains location keywords: ${hasLocation}`);
  }
}

main().catch(console.error);
