import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAllSources() {
  console.log('\n📊 Checking all crawl sources...\n');

  const { data: sources, error } = await supabase
    .from('crawl_sources')
    .select('*')
    .order('enabled', { ascending: false })
    .order('priority', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Total sources: ${sources?.length || 0}\n`);

  // Group by status
  const enabled = sources?.filter(s => s.enabled) || [];
  const disabled = sources?.filter(s => !s.enabled) || [];

  console.log(`✅ Enabled: ${enabled.length}`);
  console.log(`❌ Disabled: ${disabled.length}\n`);

  console.log('📋 Enabled Sources:\n');
  enabled.forEach((s, i) => {
    console.log(`${i + 1}. ${s.name}`);
    console.log(`   URL: ${s.source_url}`);
    console.log(`   Type: ${s.extractor_type}`);
    console.log(`   Priority: ${s.priority}`);
    console.log('');
  });

  console.log('\n⚠️  Note: Schema-based extraction (like we built for photobooth.net)');
  console.log('    requires custom schemas for each source\'s unique structure.');
  console.log('    The generic crawler can run on all sources, but with less accuracy.\n');
}

checkAllSources().catch(console.error);
