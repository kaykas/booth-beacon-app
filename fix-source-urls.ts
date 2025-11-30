/**
 * FIX SOURCE URLs - Based on Google's CRAWLING_STRATEGY_ANALYSIS.md
 * Updates broken/incorrect URLs to working ones
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface URLFix {
  name: string;
  oldUrl: string;
  newUrl: string;
  reason: string;
  priority?: number;
}

const urlFixes: URLFix[] = [
  // CRITICAL FIXES - Sources with 0 booths
  {
    name: 'Autophoto Chicago/Midwest',
    oldUrl: 'https://autophoto.org/locations',
    newUrl: 'https://autophoto.org/booth-locator',
    reason: '105 chars scraped, 0 booths - wrong page. Should use booth locator map.',
    priority: 90 // Upgrade to TIER 1
  },
  {
    name: 'autophoto.org',
    oldUrl: 'https://autophoto.org/locations',
    newUrl: 'https://autophoto.org/booth-locator',
    reason: 'Duplicate entry - same fix as above',
    priority: 90
  },
  {
    name: 'Photomatica SF/LA',
    oldUrl: 'https://photomatica.com/locations',
    newUrl: 'https://www.photomatica.com/photo-booth-museum',
    reason: '775 chars scraped, 0 booths - wrong page. Should crawl museum pages.',
    priority: 80 // Keep TIER 2
  },

  // CITY GUIDES - Correct article URLs
  {
    name: 'Time Out LA',
    oldUrl: 'https://www.timeout.com/los-angeles/news/vintage-photo-booths-are-having-a-moment-we-found-some-of-l-a-s-remaining-ones-121324',
    newUrl: 'https://www.timeout.com/los-angeles/news/vintage-photo-booths-are-having-a-moment-we-found-some-of-l-a-s-remaining-ones-121324',
    reason: 'URL already correct but extraction failing - need better prompt'
  },
  {
    name: 'Block Club Chicago',
    oldUrl: 'https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-making-a-comeback-heres-where-to-find-them',
    newUrl: 'https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed-meet-the-women-trying-to-keep-them-alive/',
    reason: 'Wrong article URL - should be March 2025 article about women keeping them alive'
  },
];

const sourcesToDisable = [
  {
    name: 'Classic Photo Booth NYC/Philly',
    reason: '404 error - /locations-2/ page does not exist'
  },
  {
    name: 'Autofoto London/Barcelona',
    reason: '108 chars scraped - likely wrong URL or domain issue'
  },
  {
    name: 'Fotoautomat Paris/Prague',
    reason: '148 chars scraped - wrong page or broken link'
  },
  {
    name: 'Louie Despres Project',
    reason: '109 chars scraped - page not found or wrong URL'
  },
  {
    name: 'Photo Systems Inc',
    reason: 'Rental service homepage, not location directory'
  },
  {
    name: 'Autophoto Exhibitions (Technicians)',
    reason: 'Exhibitions page, not booth locations'
  },
  {
    name: 'AutoPhoto Exhibitions',
    reason: 'Duplicate - exhibitions page, not booth locations'
  },
  {
    name: 'Photrio Forum (Slavich Search)',
    reason: 'Forum search results, not booth directory'
  },
  {
    name: 'Eternalog Fotobooth Seoul',
    reason: 'Korean digital purikura, not analog photo booths'
  },
  {
    name: 'Berlin Enthusiast Blog',
    reason: 'Personal blog search results, not comprehensive directory'
  },
  {
    name: 'Phelt Magazine Berlin Guide',
    reason: '705 chars scraped - page too short or broken'
  },
  {
    name: 'Girl in Florence Guide',
    reason: '194 chars scraped - page broken or redirecting'
  },
  {
    name: 'Puddles Photo Booth Portland',
    reason: '237 chars scraped - page broken or not found'
  },
  {
    name: 'Secret Los Angeles',
    reason: '360 chars scraped - single booth profile, not directory'
  }
];

async function fixSourceURLs() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 FIXING SOURCE URLs - Based on Google\'s Analysis');
  console.log('='.repeat(80) + '\n');

  let fixed = 0;
  let disabled = 0;
  let errors = 0;

  // Apply URL fixes
  console.log('📝 Updating URLs...\n');
  for (const fix of urlFixes) {
    console.log(`🔄 ${fix.name}`);
    console.log(`   OLD: ${fix.oldUrl}`);
    console.log(`   NEW: ${fix.newUrl}`);
    console.log(`   REASON: ${fix.reason}`);

    const updateData: any = {
      source_url: fix.newUrl,
      base_url: fix.newUrl,
    };

    if (fix.priority) {
      updateData.priority = fix.priority;
    }

    const { error } = await supabase
      .from('crawl_sources')
      .update(updateData)
      .eq('name', fix.name);

    if (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
      errors++;
    } else {
      console.log(`   ✅ Updated${fix.priority ? ` (Priority ${fix.priority})` : ''}\n`);
      fixed++;
    }
  }

  // Disable broken sources
  console.log('\n🚫 Disabling broken sources...\n');
  for (const source of sourcesToDisable) {
    console.log(`❌ ${source.name}`);
    console.log(`   REASON: ${source.reason}`);

    const { error } = await supabase
      .from('crawl_sources')
      .update({
        enabled: false,
        notes: `DISABLED: ${source.reason}`
      })
      .eq('name', source.name);

    if (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
      errors++;
    } else {
      console.log(`   ✅ Disabled\n`);
      disabled++;
    }
  }

  // Summary
  console.log('='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`   URLs fixed: ${fixed}`);
  console.log(`   Sources disabled: ${disabled}`);
  console.log(`   Errors: ${errors}`);
  console.log('='.repeat(80) + '\n');

  if (errors === 0) {
    console.log('✅ All fixes applied successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Re-run crawler for fixed sources: Autophoto, Photomatica');
    console.log('   2. Improve extraction prompt for TimeOut LA (has good content, failing extraction)');
    console.log('   3. Verify disabled sources and check if alternative URLs exist');
  } else {
    console.log('⚠️  Some fixes failed - review errors above');
  }
}

fixSourceURLs().catch(console.error);
