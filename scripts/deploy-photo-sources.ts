import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const photoSources = [
  {
    name: 'Instagram #photobooth NYC',
    source_name: 'Instagram #photobooth NYC',
    source_url: 'https://www.instagram.com/explore/tags/photobooth/',
    base_url: 'https://www.instagram.com',
    source_type: 'social_media',
    extractor_type: 'instagram',
    enabled: true,
    priority: 85,
    crawl_frequency_days: 7,
    country_focus: 'US',
    notes: 'High-quality user photos of photo booths in NYC. Extract: photos, location tags, captions'
  },
  {
    name: 'Instagram #photoautomat Berlin',
    source_name: 'Instagram #photoautomat Berlin',
    source_url: 'https://www.instagram.com/explore/tags/photoautomat/',
    base_url: 'https://www.instagram.com',
    source_type: 'social_media',
    extractor_type: 'instagram',
    enabled: true,
    priority: 85,
    crawl_frequency_days: 7,
    country_focus: 'DE',
    notes: 'German photo booth photos with location tags'
  },
  {
    name: 'Instagram #photomaton Paris',
    source_name: 'Instagram #photomaton Paris',
    source_url: 'https://www.instagram.com/explore/tags/photomaton/',
    base_url: 'https://www.instagram.com',
    source_type: 'social_media',
    extractor_type: 'instagram',
    enabled: true,
    priority: 85,
    crawl_frequency_days: 7,
    country_focus: 'FR',
    notes: 'French photo booth photos with location tags'
  },
  {
    name: 'Flickr Photobooths Pool',
    source_name: 'Flickr Photobooths Pool',
    source_url: 'https://www.flickr.com/groups/photobooths/pool/',
    base_url: 'https://www.flickr.com',
    source_type: 'social_media',
    extractor_type: 'flickr',
    enabled: true,
    priority: 80,
    crawl_frequency_days: 14,
    country_focus: 'GLOBAL',
    notes: 'Large community-curated collection of photo booth photos with EXIF data and location tags'
  },
  {
    name: 'Flickr Classic Photobooths',
    source_name: 'Flickr Classic Photobooths',
    source_url: 'https://www.flickr.com/search/?text=classic%20photobooth&license=1%2C2%2C3%2C4%2C5%2C6',
    base_url: 'https://www.flickr.com',
    source_type: 'social_media',
    extractor_type: 'flickr',
    enabled: true,
    priority: 75,
    crawl_frequency_days: 14,
    country_focus: 'GLOBAL',
    notes: 'Creative Commons licensed photos of vintage analog photo booths'
  },
  {
    name: 'Pinterest Photo Booth Locations',
    source_name: 'Pinterest Photo Booth Locations',
    source_url: 'https://www.pinterest.com/search/pins/?q=photo%20booth%20location',
    base_url: 'https://www.pinterest.com',
    source_type: 'social_media',
    extractor_type: 'pinterest',
    enabled: true,
    priority: 70,
    crawl_frequency_days: 21,
    country_focus: 'GLOBAL',
    notes: 'User-curated pins showing photo booth locations with images'
  },
  {
    name: 'Reddit r/photobooth',
    source_name: 'Reddit r/photobooth',
    source_url: 'https://www.reddit.com/r/photobooth/',
    base_url: 'https://www.reddit.com',
    source_type: 'community',
    extractor_type: 'reddit',
    enabled: true,
    priority: 75,
    crawl_frequency_days: 7,
    country_focus: 'GLOBAL',
    notes: 'Active community sharing photo booth finds with photos and locations'
  },
  {
    name: 'Reddit r/analog Photobooth Posts',
    source_name: 'Reddit r/analog Photobooth Posts',
    source_url: 'https://www.reddit.com/r/analog/search/?q=photobooth',
    base_url: 'https://www.reddit.com',
    source_type: 'community',
    extractor_type: 'reddit',
    enabled: true,
    priority: 70,
    crawl_frequency_days: 14,
    country_focus: 'GLOBAL',
    notes: 'Analog photography community sharing photobooth experiences'
  }
];

async function main() {
  console.log('\n=== DEPLOYING PHOTO-RICH SOURCES ===\n');

  try {
    // Insert photo sources
    console.log('📄 Adding 8 photo-rich sources...\n');

    const { data, error } = await supabase
      .from('crawl_sources')
      .insert(photoSources)
      .select();

    if (error) {
      if (error.code === '23505') {
        console.log('⚠️  Some sources already exist, skipping duplicates...\n');

        // Try updating existing sources instead
        for (const source of photoSources) {
          const { error: updateError } = await supabase
            .from('crawl_sources')
            .update({
              enabled: source.enabled,
              priority: source.priority,
              crawl_frequency_days: source.crawl_frequency_days,
              notes: source.notes
            })
            .eq('source_name', source.source_name);

          if (!updateError) {
            console.log(`   ✅ Updated: ${source.source_name}`);
          }
        }
      } else {
        throw error;
      }
    } else {
      console.log(`✅ Successfully added ${data.length} photo-rich sources!\n`);
      data.forEach(source => {
        console.log(`   • ${source.source_name} (${source.source_type})`);
      });
    }

    // Update existing Flickr source if it exists
    const { error: updateError } = await supabase
      .from('crawl_sources')
      .update({
        enabled: true,
        priority: 80,
        crawl_frequency_days: 14,
        notes: 'Re-enabled: High-quality photo source for booth enrichment'
      })
      .eq('source_name', 'Flickr Photobooth Group')
      .eq('enabled', false);

    if (!updateError) {
      console.log('\n   ✅ Re-enabled existing Flickr source');
    }

    // Report
    const { data: stats, error: statsError } = await supabase
      .from('crawl_sources')
      .select('*', { count: 'exact' })
      .in('source_type', ['social_media', 'community'])
      .eq('enabled', true)
      .ilike('notes', '%photo%');

    if (!statsError && stats) {
      console.log('\n📊 Results:');
      console.log({
        status: 'Photo-Rich Sources Added/Updated',
        count: stats.length
      });
      console.log('');
    }

  } catch (error: any) {
    console.error('❌ Error deploying photo sources:', error.message);
    throw error;
  }
}

main();
