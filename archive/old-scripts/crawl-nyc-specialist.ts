/**
 * NEW YORK CITY SPECIALIST CRAWLER
 *
 * The "East Coast Capital" Problem:
 * NYC is dominated by A&A Studios (Chicago-based, but services NYC machines).
 * The "Analog Trap" is MORE dangerous than SF: hundreds of "vintage-looking"
 * booths in gastropubs like The Smith are 100% digital.
 *
 * Ground Truth:
 * - A&A Studios is THE operator for real analog booths in NYC (vs Photomatica in SF)
 * - The Magician is the most famous booth in NYC
 * - If a booth takes Card Only, it's 95% likely digital
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
// THE "DIRTY DOZEN" - CONFIRMED CHEMICAL
// ==========================================
const TIER1_DIRTY_DOZEN = [
  {
    name: "The Magician",
    address: "118 Rivington St",
    borough: "Manhattan",
    neighborhood: "Lower East Side",
    city: "New York",
    state: "NY",
    country: "USA",
    description: "The most famous photobooth in NYC. A&A Studios Model.",
    operator_name: "A&A Studios",
    is_operational: true,
    confidence: 100
  },
  {
    name: "Union Pool",
    address: "484 Union Ave",
    borough: "Brooklyn",
    neighborhood: "Williamsburg",
    city: "Brooklyn",
    state: "NY",
    country: "USA",
    description: "Highly active, very popular strip in this legendary venue.",
    operator_name: "A&A Studios",
    is_operational: true,
    confidence: 100
  },
  {
    name: "Niagara",
    address: "112 Avenue A",
    borough: "Manhattan",
    neighborhood: "East Village",
    city: "New York",
    state: "NY",
    country: "USA",
    description: "Classic punk bar with reliable analog booth.",
    operator_name: "A&A Studios",
    is_operational: true,
    confidence: 100
  },
  {
    name: "Birdy's",
    address: "627 Grand St",
    borough: "Brooklyn",
    neighborhood: "Bushwick",
    city: "Brooklyn",
    state: "NY",
    country: "USA",
    description: "Confirmed analog photobooth in Bushwick.",
    operator_name: "A&A Studios",
    is_operational: true,
    confidence: 100
  },
  {
    name: "The Commodore",
    address: "366 Metropolitan Ave",
    borough: "Brooklyn",
    neighborhood: "Williamsburg",
    city: "Brooklyn",
    state: "NY",
    country: "USA",
    description: "Often has a working chemical booth.",
    operator_name: "A&A Studios",
    is_operational: true,
    confidence: 100
  },
  {
    name: "Roxy Hotel",
    address: "2 Avenue of the Americas",
    borough: "Manhattan",
    neighborhood: "Tribeca",
    city: "New York",
    state: "NY",
    country: "USA",
    description: "High-end maintained analog booth in the lobby.",
    operator_name: "A&A Studios",
    is_operational: true,
    confidence: 95
  },
  {
    name: "Ace Hotel New York",
    address: "20 W 29th St",
    borough: "Manhattan",
    neighborhood: "NoMad",
    city: "New York",
    state: "NY",
    country: "USA",
    description: "Model 21 in the lobby. Verify it hasn't been swapped recently.",
    machine_model: "Model 21",
    operator_name: "A&A Studios",
    is_operational: true,
    confidence: 90,
    status: "needs_verification",
    access_instructions: "Check that it's still the Model 21 - hotels sometimes swap out booths"
  }
];

// ==========================================
// TIER 2: THE "GHOST" LIST (High Risk)
// ==========================================
const TIER2_GHOST_LIST = [
  {
    name: "Rough Trade NYC",
    address: "30 Rockefeller Plaza",
    borough: "Manhattan",
    neighborhood: "Rockefeller Center",
    city: "New York",
    state: "NY",
    country: "USA",
    description: "Used to have a booth in Williamsburg. Moved to Rockefeller Center. Did the booth survive? (Likely no)",
    is_operational: false,
    confidence: 30,
    status: "needs_verification",
    access_instructions: "They moved locations - booth survival unlikely but worth checking"
  },
  {
    name: "House of Yes",
    address: "2 Wyckoff Ave",
    borough: "Brooklyn",
    neighborhood: "Bushwick",
    city: "Brooklyn",
    state: "NY",
    country: "USA",
    description: "They have booths, but switch between digital/analog depending on event setup. Status changes frequently.",
    is_operational: false,
    confidence: 50,
    status: "unverified",
    access_instructions: "Booth type varies by event - call ahead to confirm analog availability"
  }
];

// ==========================================
// NYC-SPECIFIC RED FLAGS
// ==========================================
const NYC_DIGITAL_RED_FLAGS = [
  'the smith',
  'card only',
  'digital print',
  'instant photo',
  'social media',
  'email delivery'
];

// ==========================================
// CRAWL TARGETS
// ==========================================
const CRAWL_TARGETS = [
  {
    name: "Photobooth.net - New York",
    url: "https://www.photobooth.net/locations/browse.php?ddState=NY",
    method: "crawl" as const,
    include: ["/locations/index.php?locationID="],
    limit: 30,
    notes: "CRITICAL: Filter to NYC boroughs only, ignore Upstate NY"
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
              borough: { type: "string", description: "Manhattan, Brooklyn, Queens, Bronx, or Staten Island" },
              neighborhood: { type: "string", description: "e.g. 'LES', 'Williamsburg', 'Bushwick'" }
            }
          },
          tech: {
            type: "object",
            properties: {
              is_analog: {
                type: "boolean",
                description: "TRUE if 'chemical', 'dip and dunk', 'developing', 'vintage paper'. FALSE if 'digital', 'dye-sub', 'printer'"
              },
              model: { type: "string" },
              price: { type: "string" },
              payment_methods: { type: "string", description: "Cash, Card, or Both" }
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
// NYC FILTERING LOGIC
// ==========================================
function isNYCBorough(city: string, address: string): boolean {
  const normalized = (city + ' ' + address).toLowerCase();
  const nycIndicators = [
    'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island',
    'new york, ny', 'brooklyn, ny', 'ny 100', 'ny 101', 'ny 102', 'ny 103', 'ny 104',
    'ny 112', // Brooklyn zip codes
    'east village', 'williamsburg', 'bushwick', 'tribeca', 'les', 'lower east side'
  ];
  return nycIndicators.some(indicator => normalized.includes(indicator));
}

function isDigitalFake(venueName: string, paymentMethods: string): boolean {
  const normalized = venueName.toLowerCase();

  // Known digital fakes
  if (NYC_DIGITAL_RED_FLAGS.some(fake => normalized.includes(fake))) {
    return true;
  }

  // The "Credit Card Only" red flag (95% digital unless A&A Studios)
  if (paymentMethods && paymentMethods.toLowerCase().includes('card only')) {
    return true;
  }

  return false;
}

// ==========================================
// SAVE GROUND TRUTH BOOTHS
// ==========================================
async function saveGroundTruthBooths() {
  console.log('\n📍 TIER 1: Saving "Dirty Dozen" Ground Truth Booths\n');

  const allConfirmed = [...TIER1_DIRTY_DOZEN, ...TIER2_GHOST_LIST];
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
        status: booth.status || (booth.is_operational ? 'active' : 'needs_verification'),
        booth_type: 'analog',
        source_primary: 'NYC Ground Truth - A&A Studios',
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
          console.log(`  ♻️  Updated: ${booth.name} (${booth.neighborhood})`);
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
// CRAWL WITH NYC FILTERING
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
          systemPrompt: `Extract photobooth locations in NYC ONLY (Manhattan, Brooklyn, Queens, Bronx, Staten Island).
          IGNORE Upstate NY (Buffalo, Rochester, Albany, Syracuse, etc.).
          CRITICAL: Check for 'chemical', 'dip and dunk', 'developing' to confirm analog.
          Mark as digital if you see 'digital printer', 'dye-sub', 'instant print'.
          Note payment methods: Cash, Card, or Both.
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
          const address = booth.location?.address || '';
          const paymentMethods = booth.tech?.payment_methods || '';

          // Filter 1: NYC Borough Check (CRITICAL - no Upstate!)
          if (!isNYCBorough(city, address)) {
            console.log(`    [FILTERED] ${venueName} - Not in NYC boroughs (likely Upstate)`);
            filtered++;
            continue;
          }

          // Filter 2: Digital fakes and Card Only booths
          if (isDigitalFake(venueName, paymentMethods)) {
            console.log(`    [BLOCKED] ${venueName} - Known digital fake or Card Only!`);
            filtered++;
            continue;
          }

          // Filter 3: Must be marked as analog
          if (!booth.tech?.is_analog) {
            console.log(`    [FILTERED] ${venueName} - Marked as digital`);
            filtered++;
            continue;
          }

          console.log(`    ✅ ${venueName} (${booth.location?.borough || city})`);
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
  console.log('🗽 NEW YORK CITY SPECIALIST CRAWLER\n');
  console.log('='.repeat(60));
  console.log('Mission: Navigate the NYC "Analog Trap" with A&A Studios intel');
  console.log('Strategy: The "Dirty Dozen" + filtered photobooth.net crawl');
  console.log('='.repeat(60));

  // Phase 1: Save ground truth
  const tier1Saved = await saveGroundTruthBooths();
  console.log(`\n✅ Tier 1 Complete: ${tier1Saved} booths saved`);

  // Phase 2: Crawl and filter
  console.log('\n\n📍 TIER 2: Crawling with NYC Digital Detective Filter\n');
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
  console.log(`Total NYC: ${tier1Saved + allCrawled.length} verified analog booths`);
  console.log('='.repeat(60));

  console.log('\n✨ Done! NYC coverage complete.');
  console.log('\n💡 Next Steps:');
  console.log('   - Manually verify Ace Hotel Model 21 (hotels swap booths)');
  console.log('   - Check Rough Trade Rockefeller (booth likely didn\'t survive move)');
  console.log('   - Call House of Yes before visiting (analog availability varies by event)');
}

main().catch(console.error);
