import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkScrape() {
  const { data, error } = await supabase
    .from('crawl_raw_content')
    .select('raw_markdown, url, created_at')
    .ilike('url', '%photobooth.net%')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('URL:', data.url);
  console.log('Created:', data.created_at);
  console.log('\nContent (first 2000 chars):');
  console.log('='.repeat(80));
  console.log(data.raw_markdown.substring(0, 2000));
  console.log('='.repeat(80));
  console.log('\nTotal length:', data.raw_markdown.length, 'chars');
}

checkScrape().catch(console.error);
