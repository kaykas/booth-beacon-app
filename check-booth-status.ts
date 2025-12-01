import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('\n=== BOOTH DATABASE STATUS ===\n');

  // Get total booth count
  const { count: totalBooths } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  console.log('📊 Total Booths:', totalBooths || 0);

  // Get booths with coordinates
  const { count: geocoded } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  console.log(
    '📍 Booths with Coordinates:',
    geocoded || 0,
    '(' + Math.round(((geocoded || 0) / (totalBooths || 1)) * 100) + '%)'
  );

  // Get active operational booths
  const { count: active } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('is_operational', true);

  console.log('✅ Active & Operational:', active || 0);

  // Get booths by ingestion source
  const { data: sources } = await supabase
    .from('booths')
    .select('ingested_by')
    .not('ingested_by', 'is', null);

  const sourceStats = sources?.reduce((acc: Record<string, number>, b: { ingested_by: string }) => {
    acc[b.ingested_by] = (acc[b.ingested_by] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📥 Booths by Source:');
  Object.entries(sourceStats || {}).forEach(([source, count]) => {
    console.log('  -', source + ':', count);
  });

  // Check recent booth additions
  const { data: recentBooths } = await supabase
    .from('booths')
    .select('created_at, name, city, country')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n🆕 Most Recent Booths:');
  recentBooths?.forEach((b: { created_at: string; name: string; city: string; country: string }) => {
    const date = new Date(b.created_at).toLocaleString();
    console.log('  -', b.name, 'in', b.city + ',', b.country, '(' + date + ')');
  });

  console.log('\n');
}

main();
