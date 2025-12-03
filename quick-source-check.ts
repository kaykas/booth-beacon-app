import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSources() {
  // Get all working sources that need review
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('enabled', true)
    .gt('total_booths_found', 0)
    .order('total_booths_found', { ascending: false });

  console.log('\n📊 QUICK SOURCE REVIEW - WORKING SOURCES\n');
  console.log('Total working sources:', sources?.length || 0);
  console.log('\n' + '='.repeat(80) + '\n');

  for (const source of sources || []) {
    console.log(`📍 ${source.source_name || 'Unnamed'}`);
    console.log(`   URL: ${source.source_url}`);
    console.log(`   Extractor: ${source.extractor_type}`);
    console.log(`   Booths: ${source.total_booths_found}`);
    console.log(`   Last crawled: ${source.last_crawled_at ? new Date(source.last_crawled_at).toLocaleDateString() : 'Never'}`);
    console.log('');
  }

  // Now check "needs testing" sources (0 booths but enabled)
  const { data: needsTesting } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('enabled', true)
    .or('total_booths_found.is.null,total_booths_found.eq.0')
    .order('priority');

  console.log('\n⏳ NEEDS TESTING (0 booths extracted)\n');
  console.log('Total:', needsTesting?.length || 0);
  console.log('\n' + '='.repeat(80) + '\n');

  for (const source of needsTesting || []) {
    console.log(`🔍 ${source.source_name || 'Unnamed'}`);
    console.log(`   URL: ${source.source_url}`);
    console.log(`   Extractor: ${source.extractor_type || 'NOT SET'}`);
    console.log(`   Status: ${source.status}`);
    console.log('');
  }
}

checkSources().catch(console.error);
