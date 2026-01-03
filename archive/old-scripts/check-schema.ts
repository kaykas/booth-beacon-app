import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
  // Get one source to see what columns exist
  const { data, error } = await supabase
    .from('crawl_sources')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('\ncrawl_sources columns:');
    console.log(Object.keys(data || {}).join(', '));
    console.log('\nSample row:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkSchema();
