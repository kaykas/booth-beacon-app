import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  // Get both photobooth.net sources
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('*')
    .ilike('source_name', '%photobooth.net%');

  console.log(`Found ${sources?.length} photobooth.net sources\n`);

  for (const source of sources || []) {
    console.log(`\n=== ${source.source_name} ===`);
    console.log(`ID: ${source.id}`);
    console.log(`URL: ${source.source_url}`);
    console.log(`Extractor: ${source.extractor_type}`);
    console.log(`Enabled: ${source.enabled}`);

    const { count: boothCount } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true })
      .eq('source_id', source.id);

    console.log(`Booths: ${boothCount || 0}`);

    // Get sample booths
    if (boothCount && boothCount > 0) {
      const { data: booths } = await supabase
        .from('booths')
        .select('name, address, city, country')
        .eq('source_id', source.id)
        .limit(5);

      console.log(`\nSample booths:`);
      for (const booth of booths || []) {
        console.log(`  - ${booth.name}, ${booth.address}, ${booth.city}, ${booth.country}`);
      }
    }

    // Check raw content
    const { data: rawContent, count: rawCount } = await supabase
      .from('crawl_raw_content')
      .select('*', { count: 'exact' })
      .eq('source_id', source.id)
      .order('crawled_at', { ascending: false })
      .limit(1);

    console.log(`\nRaw content records: ${rawCount || 0}`);

    if (rawContent && rawContent.length > 0) {
      const content = rawContent[0];
      console.log(`Last crawled: ${content.crawled_at}`);
      console.log(`URL: ${content.url}`);
      console.log(`Markdown length: ${content.raw_markdown?.length || 0}`);

      // Save to file
      const filename = `/tmp/photobooth_net_${source.id.substring(0, 8)}.txt`;
      fs.writeFileSync(filename, content.raw_markdown || content.raw_html || '');
      console.log(`Content saved to: ${filename}`);

      // Analyze content
      const text = content.raw_markdown || content.raw_html || '';
      const lines = text.split('\n');

      console.log(`\nContent analysis:`);
      console.log(`  Total lines: ${lines.length}`);

      // Look for location patterns
      const locationLines = lines.filter(line =>
        line.toLowerCase().includes('location') ||
        line.toLowerCase().includes('address') ||
        /\d+\s+\w+\s+(st|street|ave|avenue|blvd|boulevard|rd|road)/i.test(line)
      );
      console.log(`  Lines with location info: ${locationLines.length}`);

      if (locationLines.length > 0) {
        console.log(`\n  Sample location lines:`);
        locationLines.slice(0, 10).forEach(line => {
          console.log(`    ${line.trim().substring(0, 100)}`);
        });
      }
    }
  }
}

main().catch(console.error);
