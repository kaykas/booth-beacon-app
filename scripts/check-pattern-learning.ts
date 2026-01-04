import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Check extraction_patterns table for all patterns
  const { data: patterns, count } = await supabase
    .from('extraction_patterns')
    .select('*', { count: 'exact' });

  console.log('\n🧠 Pattern Learning Status:\n');
  console.log(`Total patterns learned: ${count || 0}`);

  if (patterns && patterns.length > 0) {
    console.log('\nRecent Patterns:');
    patterns.slice(-10).forEach(p => {
      console.log(`  Source ID: ${p.source_id}`);
      console.log(`  Pattern Type: ${p.pattern_type}`);
      console.log(`  Confidence: ${p.confidence}`);
      console.log(`  Created: ${new Date(p.created_at).toLocaleString()}\n`);
    });
  } else {
    console.log('\n  ⚠️  No patterns learned yet');
    console.log('  Pattern learning should trigger after successful Agent extraction\n');
  }

  // Check source pattern_learning_status
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('source_name, pattern_learning_status, pattern_learned_at')
    .or('source_name.ilike.%Photomatica%,source_name.ilike.%LocalWiki%,source_name.ilike.%Do The Bay%')
    .order('source_name');

  if (sources && sources.length > 0) {
    console.log('📊 Source Pattern Learning Status:\n');
    sources.forEach(s => {
      console.log(`  ${s.source_name}`);
      console.log(`    Status: ${s.pattern_learning_status || 'not_started'}`);
      console.log(`    Learned At: ${s.pattern_learned_at || 'N/A'}\n`);
    });
  }
}

main();
