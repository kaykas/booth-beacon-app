import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeSources() {
  console.log('\n=== COMPREHENSIVE SOURCE ANALYSIS ===\n');

  // Get all sources with their details
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('*')
    .order('enabled', { ascending: false })
    .order('total_booths_found', { ascending: false });

  if (!sources || sources.length === 0) {
    console.log('No sources found');
    return;
  }

  // Group by status
  const enabled = sources.filter(s => s.enabled);
  const disabled = sources.filter(s => !s.enabled);

  console.log('📊 OVERVIEW:');
  console.log('  Total Sources:', sources.length);
  console.log('  Enabled:', enabled.length);
  console.log('  Disabled:', disabled.length);
  console.log('\n' + '='.repeat(80));

  // Show enabled sources with booth counts
  console.log('\n✅ ENABLED SOURCES (sorted by booth count):\n');
  enabled.forEach((s, i) => {
    const count = s.total_booths_found || 0;
    const status = s.status || 'unknown';
    const lastCrawl = s.last_successful_crawl
      ? new Date(s.last_successful_crawl).toLocaleDateString()
      : 'Never';
    console.log(`  ${i+1}. ${s.source_name}`);
    console.log(`     URL: ${s.source_url}`);
    console.log(`     Booths: ${count} | Status: ${status} | Last: ${lastCrawl}`);
    console.log('');
  });

  console.log('='.repeat(80));

  // Show disabled sources
  console.log(`\n❌ DISABLED SOURCES (${disabled.length} total):\n`);
  disabled.slice(0, 20).forEach((s, i) => {
    const count = s.total_booths_found || 0;
    const reason = s.disabled_reason || s.last_error_message || 'Not specified';
    console.log(`  ${i+1}. ${s.source_name}`);
    console.log(`     URL: ${s.source_url}`);
    console.log(`     Last found: ${count} booths`);
    console.log(`     Reason: ${reason.substring(0, 80)}`);
    console.log('');
  });

  if (disabled.length > 20) {
    console.log(`  ... and ${disabled.length - 20} more disabled sources`);
  }

  console.log('='.repeat(80));

  // Find photobooth.net specifically
  const photoboothNet = sources.find(s => s.source_url?.includes('photobooth.net'));
  if (photoboothNet) {
    console.log('\n🎯 PHOTOBOOTH.NET STATUS:');
    console.log('  Name:', photoboothNet.source_name);
    console.log('  URL:', photoboothNet.source_url);
    console.log('  Enabled:', photoboothNet.enabled);
    console.log('  Booths Found:', photoboothNet.total_booths_found || 0);
    console.log('  Status:', photoboothNet.status || 'unknown');
    console.log('  Last Crawled:', photoboothNet.last_successful_crawl
      ? new Date(photoboothNet.last_successful_crawl).toLocaleDateString()
      : 'Never');

    // Check if it's the biggest
    const maxBooths = Math.max(...enabled.map(s => s.total_booths_found || 0));
    if ((photoboothNet.total_booths_found || 0) === maxBooths) {
      console.log('  ✓ This IS the largest source!');
    } else {
      console.log(`  ⚠️ Not the largest. Top source has ${maxBooths} booths`);
    }
  }

  console.log('\n');
}

analyzeSources().catch(console.error);
