import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listSources() {
  const { data, error } = await supabase
    .from('crawl_sources')
    .select('id, name, source_url, extractor_type, enabled')
    .eq('enabled', true)
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`\n✓ Found ${data?.length || 0} enabled sources:\n`);
  data?.forEach((source, i) => {
    console.log(`${i + 1}. ${source.name}`);
    console.log(`   URL: ${source.source_url}`);
    console.log(`   Type: ${source.extractor_type}\n`);
  });
}

listSources().catch(console.error);
