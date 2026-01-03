/**
 * NUCLEAR OPTION: FEDERATED MULTI-ECOSYSTEM CRAWLER
 *
 * Strategy: Target the three ecosystems where analog booths hide:
 * 1. "Keepers of the Flame" (Restorers & Operators) - 100% authentic
 * 2. "Analog Chains" (Venues with corporate contracts)
 * 3. "Lost & Found" (Forums & Archives with user reports)
 *
 * Goal: Make Booth Beacon the definitive global source
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
// TIER 1: THE OPERATORS (100% Authenticity)
// ==========================================
// These are technicians who restore the machines. If they list it, it's real.

const TIER1_OPERATORS = [
  {
    name: "A&A Studios",
    url: "https://www.aastudiosinc.com/locations",
    region: "USA (Midwest/East)",
    confidence: 100,
    method: "scrape" as const,
    notes: "They restore them - 100% authentic"
  },
  {
    name: "Phototronic",
    url: "https://phototronicbooths.com",
    region: "Canada (West)",
    confidence: 100,
    method: "scrape" as const,
    notes: "Controls the Vancouver analog booths"
  },
  {
    name: "Fotoautomat Wien",
    url: "https://fotoautomatwien.com",
    region: "Austria",
    confidence: 100,
    method: "scrape" as const,
    notes: "Official Austrian operator"
  },
  {
    name: "Fotoautomat FR/CZ",
    url: "https://fotoautomat.fr/en/our-adresses/",
    region: "France/Prague",
    confidence: 100,
    method: "scrape" as const,
    notes: "Multi-country operator"
  },
  {
    name: "Autofoto",
    url: "https://autofoto.org",
    region: "UK/Spain",
    confidence: 100,
    method: "scrape" as const,
    notes: "UK and Spain operator"
  },
  {
    name: "Photoautomat DE",
    url: "http://www.photoautomat.de/standorte.html",
    region: "Germany (Berlin)",
    confidence: 100,
    method: "scrape" as const,
    notes: "German operator - all locations page"
  },
  {
    name: "Fotoautomatica",
    url: "https://fotoautomatica.com/dove",
    region: "Italy",
    confidence: 100,
    method: "scrape" as const,
    notes: "Italian operator"
  },
  {
    name: "Automatfoto",
    url: "https://automatfoto.se",
    region: "Sweden",
    confidence: 100,
    method: "scrape" as const,
    notes: "Swedish operator"
  },
  {
    name: "Metro Auto Photo",
    url: "https://metroautophoto.au/locations",
    region: "Australia",
    confidence: 100,
    method: "scrape" as const,
    notes: "Australian operator"
  },
  {
    name: "Booth by Bryant",
    url: "https://www.boothbybryant.com",
    region: "USA (Orange County)",
    confidence: 100,
    method: "scrape" as const,
    notes: "Orange County operator"
  }
];

// ==========================================
// TIER 2: THE DIRECTORIES (Deep Crawl)
// ==========================================
// Large community sources - need deep crawling and filtering

const TIER2_DIRECTORIES = [
  {
    name: "Photobooth.net",
    url: "https://www.photobooth.net/locations/browse.php?ddState=0",
    confidence: 80,
    method: "crawl" as const,
    include: ["/locations/index.php?locationID="],
    limit: 500,
    notes: "The Archive - target ID pages directly"
  },
  {
    name: "Lomography",
    url: "https://www.lomography.com",
    confidence: 60,
    method: "crawl" as const,
    include: ["/homes/", "/locations/", "/magazine/"],
    exclude: ["/shop/", "/cart/", "/checkout/"],
    limit: 100,
    notes: "Mixed source - needs digital filtering"
  }
];

// ==========================================
// TIER 3: VENUE CHAINS (Corporate Contracts)
// ==========================================
// Hotels/bars known to maintain analog booths

const TIER3_VENUES = [
  {
    name: "The Hoxton Hotels",
    url: "https://thehoxton.com",
    confidence: 90,
    method: "crawl" as const,
    include: ["/locations/"],
    notes: "Chain known for analog booths"
  },
  {
    name: "25hours Hotels",
    url: "https://www.25hours-hotels.com",
    confidence: 90,
    method: "crawl" as const,
    include: ["/hotels/"],
    notes: "German chain with analog booths"
  }
];

// ==========================================
// UNIFIED EXTRACTION SCHEMA
// ==========================================

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
              venue_name: { type: "string", description: "Name of venue" },
              address: { type: "string", description: "Full street address" },
              city: { type: "string", description: "City name" },
              state_or_province: { type: "string" },
              country: { type: "string" },
              coordinates: {
                type: "object",
                properties: {
                  latitude: { type: "number" },
                  longitude: { type: "number" }
                }
              }
            },
            required: ["venue_name", "city", "country"]
          },
          tech: {
            type: "object",
            properties: {
              type: { type: "string", description: "Machine type: Analog, B&W, Color, Model number" },
              price: { type: "string" },
              payment: { type: "string" }
            }
          },
          authenticity: {
            type: "object",
            properties: {
              is_analog: {
                type: "boolean",
                description: "TRUE for chemical/dip-and-dunk. FALSE for digital/inkjet. Check for keywords: 'Chemical', 'Film', 'Developing' = TRUE. 'Digital', 'Dye-Sub', 'Inkjet' = FALSE"
              },
              confidence: { type: "integer", description: "1-10 score" },
              red_flags: {
                type: "array",
                items: { type: "string" },
                description: "List any mentions of 'digital', 'inkjet', 'instant print'"
              }
            },
            required: ["is_analog"]
          },
          is_active: { type: "boolean" },
          description: { type: "string" },
          operator: { type: "string" }
        },
        required: ["location", "authenticity"]
      }
    }
  },
  required: ["booths"]
};

// ==========================================
// DIGITAL BOOTH FILTERING SYSTEM
// ==========================================

const DIGITAL_RED_FLAGS = [
  'digital', 'inkjet', 'dye-sub', 'instant print', 'thermal',
  'no chemicals', 'green screen', 'ipad', 'tablet', 'touchscreen'
];

const ANALOG_GREEN_FLAGS = [
  'chemical', 'film', 'developing', 'dip and dunk', 'silver halide',
  'photo-me', 'model 11', 'model 14', 'model 17', 'anatol josepho'
];

function filterDigitalBooths(booths: any[]): any[] {
  return booths.filter(booth => {
    // Tier 1 operators: Trust 100%
    if (booth.source_confidence === 100) {
      return true;
    }

    // Check authenticity flags
    if (booth.authenticity) {
      if (booth.authenticity.is_analog === false) {
        console.log(`    [FILTERED] ${booth.location.venue_name} - Marked as digital`);
        return false;
      }

      // Check red flags
      if (booth.authenticity.red_flags && booth.authenticity.red_flags.length > 0) {
        const hasDigitalFlag = booth.authenticity.red_flags.some((flag: string) =>
          DIGITAL_RED_FLAGS.some(rf => flag.toLowerCase().includes(rf))
        );

        if (hasDigitalFlag) {
          console.log(`    [FILTERED] ${booth.location.venue_name} - Red flags: ${booth.authenticity.red_flags.join(', ')}`);
          return false;
        }
      }
    }

    return true;
  });
}

// ==========================================
// EXTRACTION FUNCTIONS
// ==========================================

async function scrapeOperator(source: typeof TIER1_OPERATORS[0]) {
  console.log(`\n📄 [TIER 1] Scraping: ${source.name}`);
  console.log(`   Region: ${source.region}`);
  console.log(`   URL: ${source.url}`);

  try {
    const result = await firecrawl.scrapeUrl(source.url, {
      formats: ['extract'],
      extract: {
        schema: extractionSchema,
        systemPrompt: `Extract all photobooth locations. CRITICAL: This is a verified OPERATOR website - all booths listed here are 100% ANALOG/CHEMICAL. Ignore any "digital" warnings for this domain. Set is_analog=TRUE for ALL booths.`
      }
    });

    if (!result.extract || !result.extract.booths) {
      console.log(`   ⚠️  No data extracted`);
      return [];
    }

    const booths = result.extract.booths.map((b: any) => ({
      ...b,
      source_name: source.name,
      source_confidence: source.confidence,
      source_region: source.region,
      authenticity: {
        is_analog: true, // Force true for operators
        confidence: 10
      }
    }));

    console.log(`   ✅ Found ${booths.length} booths`);
    return booths;

  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return [];
  }
}

async function crawlDirectory(source: typeof TIER2_DIRECTORIES[0]) {
  console.log(`\n🕷️  [TIER 2] Deep Crawling: ${source.name}`);
  console.log(`   URL: ${source.url}`);
  console.log(`   Limit: ${source.limit} pages`);

  try {
    const result = await firecrawl.crawlUrl(source.url, {
      limit: source.limit,
      scrapeOptions: {
        formats: ['extract'],
        extract: {
          schema: extractionSchema,
          systemPrompt: `Extract photobooth details. CRITICAL FILTERING: Check ALL text for digital indicators. Look for 'Digital', 'Dye-Sub', 'Inkjet', 'Instant Print' - if found, set is_analog=FALSE. Look for 'Chemical', 'Film', 'Dip and Dunk', 'Developing', 'Silver Halide' to confirm is_analog=TRUE. Include ALL red_flags in the array.`
        }
      },
      includePaths: source.include,
      excludePaths: source.exclude
    });

    if (!result.data || result.data.length === 0) {
      console.log(`   ⚠️  No pages crawled`);
      return [];
    }

    console.log(`   ✅ Crawled ${result.data.length} pages`);

    const allBooths: any[] = [];
    for (const page of result.data) {
      if (page.extract && page.extract.booths) {
        const booths = page.extract.booths.map((b: any) => ({
          ...b,
          source_name: source.name,
          source_confidence: source.confidence,
          source_url: page.sourceURL || page.url
        }));
        allBooths.push(...booths);
      }
    }

    // Apply digital filtering
    console.log(`   🔍 Pre-filter: ${allBooths.length} booths`);
    const filtered = filterDigitalBooths(allBooths);
    console.log(`   ✅ Post-filter: ${filtered.length} analog booths`);

    return filtered;

  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return [];
  }
}

// ==========================================
// DATABASE SAVE
// ==========================================

interface BoothToSave {
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  source_urls: string[];
  source_primary: string;
  status: string;
  booth_type: string;
  is_operational: boolean;
  description: string | null;
  cost: string | null;
  machine_model: string | null;
  accepts_cash: boolean;
  accepts_card: boolean;
  operator_name: string | null;
  last_verified: string | null;
}

function transformBooth(booth: any): BoothToSave | null {
  try {
    const location = booth.location || {};
    const tech = booth.tech || {};

    const payment = tech.payment?.toLowerCase() || '';
    const acceptsCash = payment.includes('cash') || payment.includes('coin');
    const acceptsCard = payment.includes('card') || payment.includes('credit');

    const techType = tech.type?.toLowerCase() || '';
    const boothType = techType.includes('digital') ? 'digital' : 'analog';

    return {
      name: location.venue_name || location.address || 'Unknown',
      address: location.address || location.city || '',
      city: location.city || null,
      state: location.state_or_province || null,
      country: location.country || booth.source_region || 'Unknown',
      latitude: location.coordinates?.latitude || null,
      longitude: location.coordinates?.longitude || null,
      source_urls: [booth.source_url || ''],
      source_primary: booth.source_name,
      status: booth.is_active ? 'active' : 'inactive',
      booth_type: boothType,
      is_operational: booth.is_active || false,
      description: booth.description || null,
      cost: tech.price || null,
      machine_model: tech.type || null,
      accepts_cash: acceptsCash,
      accepts_card: acceptsCard,
      operator_name: booth.operator || booth.source_name,
      last_verified: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error transforming booth:', error);
    return null;
  }
}

async function saveBooths(booths: BoothToSave[]) {
  let saved = 0;
  let skipped = 0;
  let errors = 0;

  for (const booth of booths) {
    try {
      const { data: existing } = await supabase
        .from('booths')
        .select('id')
        .eq('name', booth.name)
        .eq('city', booth.city)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('booths')
          .update(booth)
          .eq('id', existing.id);

        if (error) {
          console.error(`  ❌ ${booth.name}: ${error.message}`);
          errors++;
        } else {
          console.log(`  ♻️  Updated: ${booth.name}`);
          saved++;
        }
      } else {
        const { error } = await supabase
          .from('booths')
          .insert(booth);

        if (error) {
          console.error(`  ❌ ${booth.name}: ${error.message}`);
          errors++;
        } else {
          console.log(`  ✅ Saved: ${booth.name}`);
          saved++;
        }
      }
    } catch (error) {
      console.error(`  ❌ ${booth.name}:`, error);
      errors++;
    }
  }

  return { saved, skipped, errors };
}

// ==========================================
// MAIN EXECUTION
// ==========================================

async function main() {
  console.log('🚀 NUCLEAR OPTION: FEDERATED CRAWLER INITIALIZED');
  console.log('🎯 Target: World Domination\n');
  console.log('='.repeat(60));

  const allBooths: any[] = [];
  const stats = {
    tier1: 0,
    tier2: 0,
    tier3: 0,
    filtered: 0
  };

  // PHASE 1: Tier 1 Operators (100% Authentic)
  console.log('\n📍 PHASE 1: THE OPERATORS (100% Authenticity)');
  console.log('='.repeat(60));

  for (const operator of TIER1_OPERATORS) {
    const booths = await scrapeOperator(operator);
    allBooths.push(...booths);
    stats.tier1 += booths.length;

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // PHASE 2: Tier 2 Directories (Deep Crawl + Filter)
  console.log('\n\n📍 PHASE 2: THE DIRECTORIES (Deep Crawl)');
  console.log('='.repeat(60));

  for (const directory of TIER2_DIRECTORIES) {
    const booths = await crawlDirectory(directory);
    allBooths.push(...booths);
    stats.tier2 += booths.length;

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n\n📊 EXTRACTION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Tier 1 (Operators):    ${stats.tier1} booths`);
  console.log(`Tier 2 (Directories):  ${stats.tier2} booths`);
  console.log(`Total Analog Booths:   ${allBooths.length}`);
  console.log('='.repeat(60));

  // Transform and save
  if (allBooths.length > 0) {
    console.log('\n💾 Saving to database...\n');
    const transformed = allBooths
      .map(transformBooth)
      .filter((b): b is BoothToSave => b !== null);

    const { saved, errors } = await saveBooths(transformed);

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Saved/Updated: ${saved}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(60));
  }

  console.log('\n✨ MISSION COMPLETE: Booth Beacon is now the definitive source');
}

main().catch(console.error);
