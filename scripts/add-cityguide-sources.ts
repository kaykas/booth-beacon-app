#!/usr/bin/env node

/**
 * Add City Guide Sources to Booth Beacon Database
 *
 * This script adds all 13 city guide sources to the crawl_sources table
 * so they can be processed by the production-agent-crawler.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const cityGuideSources = [
  // BERLIN (3 sources)
  {
    name: 'Digital Cosmonaut Berlin',
    source_name: 'Digital Cosmonaut Berlin',
    source_type: 'city_guide',
    source_url: 'https://digitalcosmonaut.com/berlin-photoautomat-locations/',
    extractor_type: 'city_guide_berlin_digitalcosmonaut',
    enabled: true,
    priority: 80,
    crawl_frequency_days: 7,
    pages_per_batch: 1,
    total_pages_target: 1,
    notes: 'Berlin photo booth locations guide from Digital Cosmonaut'
  },
  {
    name: 'Phelt Magazine Berlin',
    source_name: 'Phelt Magazine Berlin',
    source_type: 'city_guide',
    source_url: 'https://pheltmagazine.co/photo-booths-of-berlin/',
    extractor_type: 'city_guide_berlin_phelt',
    enabled: true,
    priority: 80,
    crawl_frequency_days: 7,
    pages_per_batch: 1,
    total_pages_target: 1,
    notes: 'Berlin photo booth guide from Phelt Magazine'
  },
  {
    name: 'Aperture Tours Berlin',
    source_name: 'Aperture Tours Berlin',
    source_type: 'city_guide',
    source_url: 'https://www.aperturetours.com/blog/photoautomat-berlin',
    extractor_type: 'city_guide_berlin_aperture',
    enabled: true,
    priority: 75,
    crawl_frequency_days: 7,
    pages_per_batch: 1,
    total_pages_target: 1,
    notes: 'Berlin photoautomat guide from Aperture Tours'
  },

  // LONDON (3 sources)
  {
    name: 'Design My Night London',
    source_name: 'Design My Night London',
    source_type: 'city_guide',
    source_url: 'https://www.designmynight.com/london/whats-on/unusual-things-to-do/best-photo-booths-in-london',
    extractor_type: 'city_guide_london_designmynight',
    enabled: true,
    priority: 80,
    crawl_frequency_days: 7,
    pages_per_batch: 1,
    total_pages_target: 1,
    notes: 'Best photo booths in London from Design My Night'
  },
  {
    name: 'London World',
    source_name: 'London World',
    source_type: 'city_guide',
    source_url: 'https://londonworld.com/lifestyle/things-to-do/where-to-find-photo-booths-in-london',
    extractor_type: 'city_guide_london_world',
    enabled: true,
    priority: 75,
    crawl_frequency_days: 7,
    pages_per_batch: 1,
    total_pages_target: 1,
    notes: 'London photo booth locations from London World'
  },
  {
    name: 'Flash Pack London',
    source_name: 'Flash Pack London',
    source_type: 'city_guide',
    source_url: 'https://www.flashpack.com/blog/photo-booths-london/',
    extractor_type: 'city_guide_london_flashpack',
    enabled: true,
    priority: 80,
    crawl_frequency_days: 7,
    pages_per_batch: 1,
    total_pages_target: 1,
    notes: 'London photo booth guide from Flash Pack'
  },

  // LOS ANGELES (2 sources)
  {
    name: 'Time Out LA',
    source_name: 'Time Out LA',
    source_type: 'city_guide',
    source_url: 'https://www.timeout.com/los-angeles/things-to-do/photo-booths-in-los-angeles',
    extractor_type: 'city_guide_la_timeout',
    enabled: true,
    priority: 85,
    crawl_frequency_days: 7,
    pages_per_batch: 1,
    total_pages_target: 1,
    notes: 'Los Angeles photo booths from Time Out'
  },
  {
    name: 'Locale Magazine LA',
    source_name: 'Locale Magazine LA',
    source_type: 'city_guide',
    source_url: 'https://localemagazine.com/photo-booth-los-angeles/',
    extractor_type: 'city_guide_la_locale',
    enabled: true,
    priority: 80,
    crawl_frequency_days: 7,
    pages_per_batch: 1,
    total_pages_target: 1,
    notes: 'LA photo booth locations from Locale Magazine'
  },

  // CHICAGO (2 sources)
  {
    name: 'Time Out Chicago',
    source_name: 'Time Out Chicago',
    source_type: 'city_guide',
    source_url: 'https://www.timeout.com/chicago/things-to-do/photo-booths-in-chicago',
    extractor_type: 'city_guide_chicago_timeout',
    enabled: true,
    priority: 85,
    crawl_frequency_days: 7,
    pages_per_batch: 1,
    total_pages_target: 1,
    notes: 'Chicago photo booths from Time Out'
  },
  {
    name: 'Block Club Chicago',
    source_name: 'Block Club Chicago',
    source_type: 'city_guide',
    source_url: 'https://blockclubchicago.org/2023/08/14/chicago-photo-booths/',
    extractor_type: 'city_guide_chicago_blockclub',
    enabled: true,
    priority: 80,
    crawl_frequency_days: 7,
    pages_per_batch: 1,
    total_pages_target: 1,
    notes: 'Chicago photo booth guide from Block Club'
  },

  // NEW YORK (3 sources)
  {
    name: 'Design My Night NYC',
    source_name: 'Design My Night NYC',
    source_type: 'city_guide',
    source_url: 'https://www.designmynight.com/new-york/whats-on/unusual-things-to-do/best-photo-booths-in-new-york',
    extractor_type: 'city_guide_ny_designmynight',
    enabled: true,
    priority: 85,
    crawl_frequency_days: 7,
    pages_per_batch: 1,
    total_pages_target: 1,
    notes: 'Best photo booths in NYC from Design My Night'
  },
  {
    name: 'Roxy Hotel NYC',
    source_name: 'Roxy Hotel NYC',
    source_type: 'city_guide',
    source_url: 'https://www.roxyhotelnyc.com/blog/photo-booths-nyc',
    extractor_type: 'city_guide_ny_roxy',
    enabled: true,
    priority: 80,
    crawl_frequency_days: 7,
    pages_per_batch: 1,
    total_pages_target: 1,
    notes: 'NYC photo booth guide from Roxy Hotel'
  },
  {
    name: 'Airial Travel Brooklyn',
    source_name: 'Airial Travel Brooklyn',
    source_type: 'city_guide',
    source_url: 'https://www.airialtravel.com/blog/brooklyn-photo-booths',
    extractor_type: 'city_guide_ny_airial',
    enabled: true,
    priority: 80,
    crawl_frequency_days: 7,
    pages_per_batch: 1,
    total_pages_target: 1,
    notes: 'Brooklyn photo booth locations from Airial Travel'
  }
];

async function addSources() {
  console.log('🚀 Adding City Guide Sources to Database\n');
  console.log(`Total sources to add: ${cityGuideSources.length}\n`);

  let added = 0;
  let updated = 0;
  let errors = 0;

  for (const source of cityGuideSources) {
    try {
      // Extract base_url from source_url
      const url = new URL(source.source_url);
      const base_url = `${url.protocol}//${url.hostname}`;

      const sourceData = {
        ...source,
        base_url
      };

      // Check if source exists
      const { data: existing } = await supabase
        .from('crawl_sources')
        .select('id, source_name')
        .eq('source_url', source.source_url)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('crawl_sources')
          .update(sourceData)
          .eq('id', existing.id);

        if (error) throw error;
        console.log(`✅ Updated: ${source.source_name}`);
        updated++;
      } else {
        // Insert new
        const { error } = await supabase
          .from('crawl_sources')
          .insert(sourceData);

        if (error) throw error;
        console.log(`✨ Added: ${source.source_name}`);
        added++;
      }
    } catch (error: any) {
      console.error(`❌ Failed: ${source.source_name} - ${error.message}`);
      errors++;
    }
  }

  console.log('\n================================================================================');
  console.log('📊 SUMMARY');
  console.log('================================================================================\n');
  console.log(`Total sources processed: ${cityGuideSources.length}`);
  console.log(`Added: ${added}`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${errors}`);
  console.log('\n✅ City guide sources are now in the database!');
  console.log('\nNext step: Run the production crawler:');
  console.log('  npx tsx scripts/production-agent-crawler.ts --dry-run\n');
}

addSources().catch(console.error);
