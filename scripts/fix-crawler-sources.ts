import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCrawlerSources() {
  console.log('🔧 Fixing crawler sources based on research analysis...\n');

  // Part 1: Update working sources with correct URLs
  console.log('📝 Part 1: Updating working sources with correct URLs...');

  const urlUpdates = [
    {
      name: 'Time Out LA',
      url: 'https://www.timeout.com/los-angeles/news/vintage-photo-booths-are-having-a-moment-we-found-some-of-l-a-s-remaining-ones-121324'
    },
    {
      name: 'Locale Magazine LA',
      url: 'https://localemagazine.com/best-la-photo-booths/'
    },
    {
      name: 'Time Out Chicago',
      url: 'https://www.timeout.com/chicago/bars/20-chicago-bars-with-a-photo-booth'
    },
    {
      name: 'Block Club Chicago',
      url: 'https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed-meet-the-women-trying-to-keep-them-alive/'
    }
  ];

  for (const update of urlUpdates) {
    const { error } = await supabase
      .from('crawl_sources')
      .update({
        source_url: update.url,
        status: 'active'
      })
      .eq('source_name', update.name);

    if (error) {
      console.error(`❌ Failed to update ${update.name}:`, error.message);
    } else {
      console.log(`✅ Updated ${update.name}`);
    }
  }

  // Part 2: Disable broken sources
  console.log('\n🚫 Part 2: Disabling broken sources...');

  const disableSources = [
    { name: 'Photomatica Berlin', reason: 'Domain does not exist - DNS failure' },
    { name: 'Classic Photo Booth Co', reason: 'URL returns 404 - page not found' },
    { name: 'Autofoto', reason: 'Domain for sale - site no longer active' },
    { name: 'Digital Cosmonaut Berlin', reason: 'Wrong content - urban exploration blog' },
    { name: 'Design My Night London', reason: 'URL returns 404 - page not found' },
    { name: 'Design My Night NYC', reason: 'URL returns 404 - page not found' },
    { name: 'Solo Sophie Paris', reason: 'URL returns 404 - page not found' },
    { name: 'Japan Experience', reason: 'URL returns 404 - page not found' },
    { name: 'Smithsonian', reason: 'Historical article only, no current locations' }
  ];

  for (const source of disableSources) {
    const { error } = await supabase
      .from('crawl_sources')
      .update({
        enabled: false,
        status: 'inactive'
      })
      .eq('source_name', source.name);

    if (error) {
      console.error(`❌ Failed to disable ${source.name}:`, error.message);
    } else {
      console.log(`✅ Disabled ${source.name} - ${source.reason}`);
    }
  }

  // Part 3: Priority adjustments
  console.log('\n⬆️  Part 3: Adjusting priorities...');

  const priorityUpdates = [
    { name: 'Autophoto', priority: 90, reason: 'Upgrade to Tier 1 - NYC booth locator' },
    { name: 'Lomography Locations', priority: 60, reason: 'Downgrade to Tier 3 - scattered content' },
    { name: 'Flickr Photobooth Group', priority: 50, reason: 'Downgrade to Tier 3 - rate limiting' }
  ];

  for (const update of priorityUpdates) {
    const { error } = await supabase
      .from('crawl_sources')
      .update({ priority: update.priority })
      .eq('source_name', update.name);

    if (error) {
      console.error(`❌ Failed to update priority for ${update.name}:`, error.message);
    } else {
      console.log(`✅ ${update.name}: ${update.reason}`);
    }
  }

  // Summary
  console.log('\n📊 Summary of changes:');
  const { data: sources, error: fetchError } = await supabase
    .from('crawl_sources')
    .select('source_name, enabled, status, priority, source_url')
    .in('source_name', [
      ...urlUpdates.map(u => u.name),
      ...disableSources.map(s => s.name),
      ...priorityUpdates.map(u => u.name)
    ])
    .order('enabled', { ascending: false })
    .order('priority', { ascending: false });

  if (fetchError) {
    console.error('❌ Failed to fetch summary:', fetchError.message);
  } else {
    console.table(sources);

    const enabled = sources?.filter(s => s.enabled).length || 0;
    const disabled = sources?.filter(s => !s.enabled).length || 0;

    console.log(`\n✨ Complete! ${enabled} sources enabled, ${disabled} sources disabled\n`);
  }
}

fixCrawlerSources().catch(console.error);
