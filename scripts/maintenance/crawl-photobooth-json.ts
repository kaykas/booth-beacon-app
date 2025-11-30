/**
 * PHOTOBOOTH.NET JSON API CRAWLER
 *
 * Uses the JSON API that the map page uses - gets ALL booths in one call!
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface PhotoboothNetBooth {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  id: string;
  type: number;  // 1-2 = active (blue), 3-5 = closed (red)
}

async function crawlFromJSON() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 PHOTOBOOTH.NET JSON API CRAWLER`);
  console.log(`${'='.repeat(80)}\n`);

  const startTime = Date.now();

  // Fetch the JSON API
  console.log('📡 Fetching JSON API: https://www.photobooth.net/locations/dumpxml2.php\n');

  try {
    const response = await fetch('https://www.photobooth.net/locations/dumpxml2.php');

    if (!response.ok) {
      console.error(`❌ API returned ${response.status}`);
      return;
    }

    const booths: PhotoboothNetBooth[] = await response.json();
    console.log(`✓ Fetched ${booths.length} booths from JSON API\n`);

    // Get source from database
    const { data: sources } = await supabase
      .from('crawl_sources')
      .select('*')
      .eq('extractor_type', 'photobooth_net')
      .limit(1);

    if (!sources || sources.length === 0) {
      console.error('❌ Source not found in database');
      return;
    }

    const source = sources[0];

    // Insert booths
    console.log('💾 Inserting booths into database...\n');

    let inserted = 0;
    let failed = 0;

    for (const booth of booths) {
      // Determine status from type field
      // type 1-2 = active (blue markers)
      // type 3-5 = closed/inactive (red markers)
      const status = booth.type <= 2 ? 'active' : 'closed';

      // Build detail page URL for reference
      const detailUrl = `https://www.photobooth.net/locations/browse.php?locationID=${booth.id}`;

      const { error } = await supabase
        .from('booths')
        .insert({
          name: booth.name,
          address: booth.address || '',
          city: booth.city,
          country: 'United States',  // photobooth.net is US-only
          status: status,
          source_names: [source.name],
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.log(`  ⚠️  ${booth.name}: ${error.message}`);
        failed++;
      } else {
        console.log(`  ✓ ${booth.name} - ${booth.city}, ${booth.state} (${status})`);
        inserted++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ JSON API CRAWL COMPLETE`);
    console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Total booths: ${booths.length}`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Failed: ${failed}`);
    console.log(`${'='.repeat(80)}\n`);

  } catch (error: any) {
    console.error('❌ Crawl failed:', error.message);
    console.error(error.stack);
  }
}

crawlFromJSON().catch(console.error);
