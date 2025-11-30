import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  // Get sources with URL info
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('*')
    .order('source_name');

  if (!sources) {
    console.log('No sources found');
    return;
  }

  console.log(`Found ${sources.length} sources:\n`);

  for (const source of sources) {
    const { count } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true })
      .eq('source_id', source.id);

    console.log(`${source.source_name}`);
    console.log(`  URL: ${source.source_url}`);
    console.log(`  Extractor Type: ${source.extractor_type}`);
    console.log(`  Enabled: ${source.enabled}`);
    console.log(`  Booths: ${count || 0}`);
    console.log(`  Last crawl: ${source.last_crawl_timestamp || 'never'}`);
    console.log('');
  }

  // Get raw content
  const { data: rawContent, count: rawCount } = await supabase
    .from('crawl_raw_content')
    .select('*', { count: 'exact' })
    .limit(5);

  console.log(`\n\nRaw content records: ${rawCount || 0}`);
  if (rawContent && rawContent.length > 0) {
    console.log('\nSample raw content:');
    for (const record of rawContent) {
      console.log(`\n  URL: ${record.url}`);
      console.log(`  Source ID: ${record.source_id}`);
      console.log(`  Crawled at: ${record.crawled_at}`);
      console.log(`  Markdown length: ${record.raw_markdown?.length || 0}`);
      console.log(`  HTML length: ${record.raw_html?.length || 0}`);

      // Show snippet of markdown
      if (record.raw_markdown) {
        console.log(`  Markdown preview:\n${record.raw_markdown.slice(0, 500)}...\n`);
      }
    }
  }
}

main().catch(console.error);
