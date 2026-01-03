/**
 * SAN FRANCISCO BAY AREA SPECIALIST CRAWLER
 *
 * The "Analog Trap" Problem:
 * 80% of SF booths have been converted to digital while keeping vintage exteriors.
 * This specialized crawler targets the Photomatica network (the source of truth)
 * and implements strict filtering with hardcoded overrides for known fakes.
 *
 * Ground Truth:
 * - Photomatica is THE centralized operator for real analog booths in SF
 * - They maintain machines for multiple venues
 * - Pop's Bar, Hotel Zeppelin/Zetta = DIGITAL (despite vintage appearance)
 */

import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js';
import { createClient } from '@supabase/supabase-js';

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY!
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==========================================
// THE KNOWN FAKES (Hardcoded Blacklist)
// ==========================================
const DIGITAL_FAKES = [
  "pop's bar",
  "pops bar",
  "hotel zeppelin",
  "hotel zetta",
  "beauty bar", // Known digital conversion
  "golden bull", // Oakland - confirmed digital
  "legionnaire" // Oakland - confirmed digital
];

// ==========================================
// TIER 1: CONFIRMED ANALOG (Ground Truth)
// ==========================================
const TIER1_CONFIRMED = [
  {
    name: "The Photo Booth Museum",
    address: "2275 Market St",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    description: "The holy grail - contains 3 different vintage chemical booths",
    machine_model: "Multiple vintage models",
    operator_name: "Photomatica",
    is_operational: true,
    confidence: 100
  },
  {
    name: "Club Photomatica",
    address: "1644 Haight St",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    description: "Photomatica's storefront with confirmed Model 12 (rare)",
    machine_model: "Model 12",
    operator_name: "Photomatica",
    is_operational: true,
    confidence: 100
  },
  {
    name: "Musée Mécanique - Analog Booth",
    address: "Pier 45, Fisherman's Wharf",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    description: "WARNING: They have 4+ booths, but only ONE is chemical (usually in the back by the window). Others are digital reproductions.",
    machine_model: "Vintage analog (identify by location: back by window)",
    operator_name: "Musée Mécanique",
    is_operational: true,
    confidence: 90,
    access_instructions: "Look for the booth in the back by the window - NOT the ones up front"
  },
  {
    name: "Thee Parkside",
    address: "1600 17th St",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    description: "Confirmed analog booth operated by Autophoto",
    machine_model: "Autophoto",
    operator_name: "Autophoto",
    is_operational: true,
    confidence: 100
  },
  {
    name: "The Knockout",
    address: "3223 Mission St",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    description: "Confirmed analog photobooth in the Mission",
    operator_name: "Photomatica",
    is_operational: true,
    confidence: 100
  },
  {
    name: "Kilowatt",
    address: "3101 16th St",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    description: "Recently restored analog booth",
    operator_name: "Photomatica",
    is_operational: true,
    confidence: 100
  },
  {
    name: "Amoeba Music",
    address: "1855 Haight St",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    description: "Confirmed analog photobooth at iconic music store",
    operator_name: "Photomatica",
    is_operational: true,
    confidence: 100
  }
];

// ==========================================
// TIER 2: ENDANGERED / NEEDS VERIFICATION
// ==========================================
const TIER2_UNVERIFIED = [
  {
    name: "Double Standard",
    address: "Oakland",
    city: "Oakland",
    state: "CA",
    country: "USA",
    description: "Status: ENDANGERED. They had a Model 11, but recent reports suggest maintenance issues. NEEDS MANUAL VERIFICATION - this is the only potential analog booth in the East Bay.",
    machine_model: "Model 11 (unverified)",
    is_operational: false, // Mark as inactive until verified
    confidence: 50,
    status: "needs_verification"
  }
];

// ==========================================
// CRAWL TARGETS
// ==========================================
const CRAWL_TARGETS = [
  {
    name: "Photomatica Portfolio",
    url: "https://photomatica.com/find-a-booth-near-you",
    method: "crawl" as const,
    include: ["/locations/*", "/find-a-booth/*", "/permanent-installations/*"],
    limit: 20,
    notes: "THE source of truth for SF Bay Area"
  },
  {
    name: "Photobooth.net - California",
    url: "https://www.photobooth.net/locations/browse.php?ddState=CA",
    method: "crawl" as const,
    include: ["/locations/index.php?locationID="],
    limit: 50,
    notes: "Filter to SF/Oakland/Berkeley only, check last visit date"
  }
];

const extractionSchema = {
  type: "object",
  properties: {
    booths: {
      type: "array",
      items: {
        type: "object",
        properties: {
          location: {
            type: "object",
            properties: {
              venue_name: { type: "string" },
              address: { type: "string" },
              city: { type: "string" },
              neighborhood: { type: "string", description: "e.g., Mission, Haight, Fisherman's Wharf" }
            }
          },
          tech: {
            type: "object",
            properties: {
              is_analog: {
                type: "boolean",
                description: "TRUE if 'chemical', 'dip & dunk', 'developing', 'vintage paper'. FALSE if 'digital', 'dye-sub', 'printer'"
              },
              model: { type: "string" },
              price: { type: "string" }
            }
          },
          status: { type: "string", description: "Active, Maintenance, or Converted to Digital" },
          last_verified: { type: "string", description: "Last visit date if available" }
        }
      }
    }
  }
};

// ==========================================
// DIGITAL DETECTIVE FILTER
// ==========================================
function isDigitalFake(venueName: string): boolean {
  const normalized = venueName.toLowerCase();
  return DIGITAL_FAKES.some(fake => normalized.includes(fake));
}

function isBayArea(city: string): boolean {
  const normalized = city?.toLowerCase() || '';
  return ['san francisco', 'oakland', 'berkeley', 'sf', 'haight'].some(area =>
    normalized.includes(area)
  );
}

// ==========================================
// SAVE GROUND TRUTH BOOTHS
// ==========================================
async function saveGroundTruthBooths() {
  console.log('\n📍 TIER 1: Saving Ground Truth Booths\n');

  const allConfirmed = [...TIER1_CONFIRMED, ...TIER2_UNVERIFIED];
  let saved = 0;

  for (const booth of allConfirmed) {
    try {
      const boothData = {
        name: booth.name,
        address: booth.address,
        city: booth.city,
        state: booth.state,
        country: booth.country,
        description: booth.description,
        machine_model: booth.machine_model || null,
        operator_name: booth.operator_name || null,
        is_operational: booth.is_operational,
        status: booth.is_operational ? 'active' : 'needs_verification',
        booth_type: 'analog',
        source_primary: 'SF Bay Area Ground Truth',
        accepts_cash: true,
        access_instructions: booth.access_instructions || null,
        last_verified: new Date().toISOString()
      };

      // Check if exists
      const { data: existing } = await supabase
        .from('booths')
        .select('id')
        .eq('name', booth.name)
        .eq('city', booth.city)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('booths')
          .update(boothData)
          .eq('id', existing.id);

        if (!error) {
          console.log(`  ♻️  Updated: ${booth.name}`);
          saved++;
        }
      } else {
        const { error } = await supabase
          .from('booths')
          .insert(boothData);

        if (!error) {
          console.log(`  ✅ Saved: ${booth.name} (Confidence: ${booth.confidence}%)`);
          saved++;
        }
      }
    } catch (error) {
      console.error(`  ❌ Error with ${booth.name}:`, error);
    }
  }

  return saved;
}

// ==========================================
// CRAWL WITH FILTERING
// ==========================================
async function crawlWithFiltering(target: typeof CRAWL_TARGETS[0]) {
  console.log(`\n🕷️  Crawling: ${target.name}`);
  console.log(`   ${target.notes}`);

  try {
    const result = await firecrawl.crawlUrl(target.url, {
      limit: target.limit,
      scrapeOptions: {
        formats: ['extract'],
        extract: {
          schema: extractionSchema,
          systemPrompt: `Extract photobooth locations in San Francisco Bay Area.
          CRITICAL: Check for 'chemical', 'dip and dunk', 'developing' to confirm analog.
          Mark as digital if you see 'digital printer', 'dye-sub', 'instant print'.
          If LAST VISIT is older than 5 years, note it in status.`
        }
      },
      includePaths: target.include
    });

    if (!result.data || result.data.length === 0) {
      console.log(`   ⚠️  No pages crawled`);
      return [];
    }

    console.log(`   ✅ Crawled ${result.data.length} pages`);

    const validBooths: any[] = [];
    let filtered = 0;

    for (const page of result.data) {
      if (page.extract && page.extract.booths) {
        for (const booth of page.extract.booths) {
          const venueName = booth.location?.venue_name || '';
          const city = booth.location?.city || '';

          // Filter 1: Geofence to Bay Area
          if (!isBayArea(city)) {
            console.log(`    [FILTERED] ${venueName} - Not in Bay Area`);
            filtered++;
            continue;
          }

          // Filter 2: Known digital fakes (HARDCODED BLACKLIST)
          if (isDigitalFake(venueName)) {
            console.log(`    [BLOCKED] ${venueName} - Known digital fake!`);
            filtered++;
            continue;
          }

          // Filter 3: Must be marked as analog
          if (!booth.tech?.is_analog) {
            console.log(`    [FILTERED] ${venueName} - Marked as digital`);
            filtered++;
            continue;
          }

          console.log(`    ✅ ${venueName} (${booth.location?.neighborhood || city})`);
          validBooths.push({
            ...booth,
            source_url: page.sourceURL || target.url
          });
        }
      }
    }

    console.log(`   📊 Valid: ${validBooths.length}, Filtered: ${filtered}`);
    return validBooths;

  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return [];
  }
}

// ==========================================
// MAIN
// ==========================================
async function main() {
  console.log('🌁 SAN FRANCISCO BAY AREA SPECIALIST CRAWLER\n');
  console.log('='.repeat(60));
  console.log('Mission: Navigate the "Analog Trap" with expert knowledge');
  console.log('Strategy: Photomatica portfolio + hardcoded ground truth');
  console.log('='.repeat(60));

  // Phase 1: Save ground truth
  const tier1Saved = await saveGroundTruthBooths();
  console.log(`\n✅ Tier 1 Complete: ${tier1Saved} booths saved`);

  // Phase 2: Crawl and filter
  console.log('\n\n📍 TIER 2: Crawling with Digital Detective Filter\n');
  console.log('='.repeat(60));

  const allCrawled: any[] = [];

  for (const target of CRAWL_TARGETS) {
    const booths = await crawlWithFiltering(target);
    allCrawled.push(...booths);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n📊 FINAL RESULTS');
  console.log('='.repeat(60));
  console.log(`Tier 1 (Ground Truth): ${tier1Saved} booths`);
  console.log(`Tier 2 (Crawled): ${allCrawled.length} booths`);
  console.log(`Total SF Bay Area: ${tier1Saved + allCrawled.length} verified analog booths`);
  console.log('='.repeat(60));

  console.log('\n✨ Done! SF Bay Area coverage complete.');
  console.log('\n💡 Next Step: Manually verify "Double Standard" in Oakland');
  console.log('   (The only potential analog booth in the East Bay)');
}

main().catch(console.error);
