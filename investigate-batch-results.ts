import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function investigate() {
  console.log('\n🔍 Investigating Batch Crawl Results...\n');

  // Get total booth count
  const { count: totalBooths } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  console.log('📊 Total Booths in Database:', totalBooths);

  // Get booths added in last 10 minutes
  const tenMinutesAgo = new Date();
  tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

  const { count: recentBooths } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', tenMinutesAgo.toISOString());

  console.log('🆕 Booths Added (Last 10 min):', recentBooths);

  // Get sample of recent booths
  const { data: samples } = await supabase
    .from('booths')
    .select('name, city, country, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('\n📋 Most Recent Booths:');
  samples?.forEach((b, i) => {
    const time = new Date(b.created_at).toLocaleTimeString();
    console.log(`  ${i+1}. ${b.name} in ${b.city || '?'}, ${b.country || '?'} (${time})`);
  });

  // Check for potential duplicates in recent insertions
  if (recentBooths && recentBooths > 0) {
    const { data: nameCounts } = await supabase
      .from('booths')
      .select('name')
      .gte('created_at', tenMinutesAgo.toISOString());

    const duplicates: Record<string, number> = {};
    nameCounts?.forEach(b => {
      duplicates[b.name] = (duplicates[b.name] || 0) + 1;
    });

    const dupeCount = Object.values(duplicates).filter(count => count > 1).length;
    console.log('\n🔄 Duplicate Names (Last 10 min):', dupeCount);

    if (dupeCount > 0) {
      console.log('\n⚠️  LIKELY CAUSE: Duplicate booth names detected');
      console.log('   Database may have unique constraints preventing insertions');
    }
  }

  // Check if there's a unique constraint on booth names
  console.log('\n💡 Checking for duplicate prevention...');
  const { data: existingBerlin } = await supabase
    .from('booths')
    .select('name')
    .ilike('name', '%Mauerpark%')
    .limit(5);

  if (existingBerlin && existingBerlin.length > 0) {
    console.log('   Found existing booths with similar names:');
    existingBerlin.forEach(b => console.log(`     - ${b.name}`));
    console.log('\n✓ EXPLANATION: Many booths were already in the database');
    console.log('   The batch crawler tried to insert 178 booths, but most were duplicates');
  }
}

investigate().catch(console.error);
