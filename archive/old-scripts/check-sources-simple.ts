import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('crawl_sources')
    .select('name, source_url, enabled, priority')
    .eq('enabled', true)
    .order('priority', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\nTop enabled sources:');
  data?.forEach(s => {
    console.log(`- ${s.name}: ${s.source_url} (priority: ${s.priority})`);
  });

  console.log(`\nTotal enabled sources: ${data?.length}`);
}

main();
