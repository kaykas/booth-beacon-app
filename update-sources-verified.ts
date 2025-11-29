/**
 * UPDATE CRAWL SOURCES WITH VERIFIED URLS
 *
 * Replaces old, unverified URLs with the definitive list from user research.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// SECTION 1: CONFIRMED MASTER LISTS (Booth Operators)
const masterSources = [
  {
    name: 'Photoautomat Germany',
    source_url: 'http://www.photoautomat.de/standorte.html',
    base_url: 'http://www.photoautomat.de',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 1,
  },
  {
    name: 'Fotoautomat France/Czechia',
    source_url: 'http://www.fotoautomat.fr/standorte.html',
    base_url: 'http://www.fotoautomat.fr',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 1,
  },
  {
    name: 'AutoFoto UK',
    source_url: 'https://www.autofoto.org/locations',
    base_url: 'https://www.autofoto.org',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 1,
  },
  {
    name: 'A&A Studios Chicago',
    source_url: 'https://www.aastudiosinc.com/locations',
    base_url: 'https://www.aastudiosinc.com',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 1,
  },
  {
    name: 'Metro Auto Photo Australia',
    source_url: 'https://metroautophoto.com.au/locations',
    base_url: 'https://metroautophoto.com.au',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 1,
  },
  {
    name: 'Photomatica West Coast',
    source_url: 'https://photomatica.com/locations',
    base_url: 'https://photomatica.com',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 1,
  },
  {
    name: 'Classic Photo Booth East Coast',
    source_url: 'https://classicphotobooth.net/locations-2/',
    base_url: 'https://classicphotobooth.net',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 1,
  },
  {
    name: 'Booth by Bryant',
    source_url: 'https://www.boothbybryant.com',
    base_url: 'https://www.boothbybryant.com',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 1,
  },
  {
    name: 'Fotoautomatica Florence',
    source_url: 'https://www.fotoautomatica.com/',
    base_url: 'https://www.fotoautomatica.com',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 1,
  },
];

// SECTION 2: VERIFIED REGIONAL SOURCES
const regionalSources = [
  {
    name: 'Dip and Dunk Project USA',
    source_url: 'https://louiedespres.com/photobooth-project',
    base_url: 'https://louiedespres.com',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 2,
  },
  {
    name: 'Find My Film Lab LA',
    source_url: 'https://findmyfilmlab.com/photobooths',
    base_url: 'https://findmyfilmlab.com',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 2,
  },
  {
    name: 'Girl in Florence Italy',
    source_url: 'https://girlinflorence.com/2012/01/24/the-perfect-guide-to-the-best-vintage-photo-shoot/',
    base_url: 'https://girlinflorence.com',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 2,
  },
  {
    name: 'Phelt Magazine Berlin',
    source_url: 'https://pheltmagazine.co/photo-booths-of-berlin/',
    base_url: 'https://pheltmagazine.co',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 2,
  },
  {
    name: 'Eternalog Seoul',
    source_url: 'https://eternalog-fotobooth.com',
    base_url: 'https://eternalog-fotobooth.com',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 2,
  },
  {
    name: 'Airial Travel Brooklyn',
    source_url: 'https://www.airialtravel.com/brooklyn-photo-booths',
    base_url: 'https://www.airialtravel.com',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 2,
  },
  {
    name: 'Secret Los Angeles',
    source_url: 'https://secretlosangeles.com/booth-by-bryant-costa-mesa/',
    base_url: 'https://secretlosangeles.com',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 2,
  },
];

// SECTION 3: DEEP RESEARCH SOURCES
const researchSources = [
  {
    name: 'Photo Systems Inc',
    source_url: 'https://photosys.com/',
    base_url: 'https://photosys.com',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 3,
  },
  {
    name: 'AutoPhoto Exhibitions',
    source_url: 'https://autophoto.org/exhibitions',
    base_url: 'https://autophoto.org',
    source_type: 'web',
    extractor_type: 'universal',
    enabled: true,
    priority: 3,
  },
];

// Keep these from original list (they worked well)
const keepOriginal = [
  'Time Out Chicago',
  'Time Out LA',
  'Block Club Chicago',
  'Photobooth.net', // We have JSON API for this
];

async function updateSources() {
  console.log('\n='.repeat(80));
  console.log('UPDATING CRAWL SOURCES WITH VERIFIED URLS');
  console.log('='.repeat(80) + '\n');

  // Disable all existing sources first
  console.log('1. Disabling all existing sources...');
  const { error: disableError } = await supabase
    .from('crawl_sources')
    .update({ enabled: false })
    .neq('name', 'photobooth.net'); // Keep photobooth.net enabled (we have JSON API)

  if (disableError) {
    console.error('Error disabling sources:', disableError);
    return;
  }
  console.log('   ✓ Disabled old sources\n');

  // Re-enable sources we want to keep from original list
  console.log('2. Re-enabling proven sources from original list...');
  for (const name of keepOriginal) {
    await supabase
      .from('crawl_sources')
      .update({ enabled: true })
      .eq('name', name);
    console.log(`   ✓ ${name}`);
  }
  console.log();

  // Insert new master sources
  console.log('3. Inserting MASTER SOURCES (Booth Operators)...');
  for (const source of masterSources) {
    const { error } = await supabase
      .from('crawl_sources')
      .insert(source);

    if (error) {
      console.log(`   ⚠️  ${source.name}: ${error.message}`);
    } else {
      console.log(`   ✓ ${source.name}`);
    }
  }
  console.log();

  // Insert regional sources
  console.log('4. Inserting REGIONAL SOURCES...');
  for (const source of regionalSources) {
    const { error } = await supabase
      .from('crawl_sources')
      .insert(source);

    if (error) {
      console.log(`   ⚠️  ${source.name}: ${error.message}`);
    } else {
      console.log(`   ✓ ${source.name}`);
    }
  }
  console.log();

  // Insert research sources
  console.log('5. Inserting RESEARCH SOURCES...');
  for (const source of researchSources) {
    const { error } = await supabase
      .from('crawl_sources')
      .insert(source);

    if (error) {
      console.log(`   ⚠️  ${source.name}: ${error.message}`);
    } else {
      console.log(`   ✓ ${source.name}`);
    }
  }
  console.log();

  // Count enabled sources
  const { count } = await supabase
    .from('crawl_sources')
    .select('*', { count: 'exact', head: true })
    .eq('enabled', true);

  console.log('='.repeat(80));
  console.log(`✅ COMPLETE - ${count} enabled sources ready to crawl`);
  console.log('='.repeat(80) + '\n');
}

updateSources().catch(console.error);
