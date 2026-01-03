import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  // Get all enabled sources
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('enabled', true)
    .order('source_name');

  console.log('=== ENABLED SOURCES - URL ANALYSIS ===\n');

  for (const source of sources || []) {
    const { count: boothCount } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true })
      .eq('source_id', source.id);

    console.log(`${source.source_name}`);
    console.log(`  URL: ${source.source_url}`);
    console.log(`  Extractor: ${source.extractor_type}`);
    console.log(`  Booths: ${boothCount || 0}`);
    console.log(`  Priority: ${source.priority || 'none'}`);
    console.log(`  Pages per batch: ${source.pages_per_batch || 'default'}`);

    // Check if URL looks like it would contain booth data
    const url = source.source_url.toLowerCase();
    const goodKeywords = ['location', 'booth', 'where', 'find', 'map', 'directory', 'list'];
    const hasGoodKeyword = goodKeywords.some(kw => url.includes(kw));

    const badKeywords = ['blog', 'news', 'article', 'post'];
    const hasBadKeyword = badKeywords.some(kw => url.includes(kw));

    if (hasGoodKeyword) {
      console.log(`  ✓ URL looks like a location page`);
    }
    if (hasBadKeyword || (!hasGoodKeyword && url === url.match(/https?:\/\/[^\/]+\/?$/)?.[0])) {
      console.log(`  ⚠ WARNING: URL might be homepage or blog, not location data`);
    }

    console.log('');
  }

  // Specific problematic sources
  console.log('\n=== SPECIFIC PROBLEM SOURCES ===\n');

  const problemSources = [
    'photobooth.net',
    'autophoto.org',
    'lomography.com',
    'Time Out LA',
    'Block Club Chicago',
    'Classic Photo Booth'
  ];

  for (const name of problemSources) {
    const { data: source } = await supabase
      .from('crawl_sources')
      .select('*')
      .ilike('source_name', `%${name}%`)
      .single();

    if (!source) continue;

    const { count: boothCount } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true })
      .eq('source_id', source.id);

    console.log(`${source.source_name}`);
    console.log(`  Current URL: ${source.source_url}`);
    console.log(`  Extractor: ${source.extractor_type}`);
    console.log(`  Booths extracted: ${boothCount || 0}`);
    console.log(`  Enabled: ${source.enabled}`);

    // Suggest better URLs
    if (source.source_name.toLowerCase().includes('photobooth.net')) {
      console.log(`  🔧 SUGGESTED URL: https://www.photobooth.net/locations/ (actual directory)`);
    }
    if (source.source_name.toLowerCase().includes('autophoto')) {
      console.log(`  🔧 SUGGESTED URL: https://autophoto.org/booth-locator (map page with locations)`);
    }
    if (source.source_name.toLowerCase().includes('lomography')) {
      console.log(`  🔧 SUGGESTED URL: https://www.lomography.com/magazine/tipster/2013/01/17/photobooth-locations`);
    }

    console.log('');
  }
}

main().catch(console.error);
