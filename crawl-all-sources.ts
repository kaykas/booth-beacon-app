/**
 * SMART MULTI-SOURCE CRAWLER
 * Based on Firecrawl expert recommendations
 *
 * Strategy:
 * - Group A (One-Pagers): Use scrapeUrl() for single-page lists (fast, efficient)
 * - Group B (Complex): Use crawlUrl() with includePaths for multi-page sites
 * - Group C (Directory): Deep crawl for photobooth.net
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

// Unified extraction schema for all sources
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
              venue_name: { type: "string", description: "Name of the bar, shop, or venue hosting the booth" },
              address: { type: "string", description: "Street address" },
              city: { type: "string", description: "City name" },
              state_or_province: { type: "string", description: "State or province" },
              country: { type: "string", description: "Country name (infer from domain if missing, e.g., .de = Germany)" },
              notes: { type: "string", description: "Location details (e.g., 'In the back', 'Foyer')" },
              coordinates: {
                type: "object",
                properties: {
                  latitude: { type: "number" },
                  longitude: { type: "number" }
                }
              }
            },
            required: ["venue_name", "address"]
          },
          tech: {
            type: "object",
            properties: {
              type: { type: "string", description: "Type: 'Analog', 'Digital', 'B&W', 'Color', 'Vintage'" },
              price: { type: "string", description: "Cost per strip" },
              payment: { type: "string", description: "Payment methods: Cash, Card, Tokens" }
            }
          },
          is_active: { type: "boolean", description: "If the text says 'Removed' or 'Inactive', set False. Otherwise True." },
          description: { type: "string", description: "Any additional notes or description" },
          operator: { type: "string", description: "Operator or owner information if available" }
        },
        required: ["location", "is_active"]
      }
    }
  },
  required: ["booths"]
};

const systemPrompt = `You are extracting photobooth locations from websites. Extract ALL photobooths mentioned on the page.

Key instructions:
- Extract the complete venue name, full address, city, state/province, and country
- Identify if booth is analog or digital, B&W or color
- Extract cost/price information
- Determine if booth is currently active/operational (mark false if says "removed" or "inactive")
- Include any operator/owner information
- If coordinates are mentioned, extract them`;

// Configuration for each source
interface SourceConfig {
  url: string;
  method: 'scrape' | 'crawl';
  country?: string;
  source_name: string;
  include?: string[];
  exclude?: string[];
  limit?: number;
  notes?: string;
}

const SOURCES: SourceConfig[] = [
  // Group A: Single Page Lists (Use scrape - fast and efficient)
  {
    url: "http://www.photoautomat.de/standorte.html",
    method: "scrape",
    country: "Germany",
    source_name: "photoautomat.de",
    notes: "German operator - all locations on one page"
  },
  {
    url: "https://autophoto.org/booth-locator",
    method: "scrape",
    country: "USA",
    source_name: "autophoto.org",
    notes: "NYC operator with map - single page"
  },
  {
    url: "https://www.photoillusion.com/",
    method: "scrape",
    country: "USA",
    source_name: "photoillusion.com",
    notes: "Home page lists all locations"
  },
  {
    url: "https://www.boothbybryant.com",
    method: "scrape",
    country: "USA",
    source_name: "boothbybryant.com",
    notes: "Orange County operator - portfolio site"
  },
  {
    url: "https://eternalog-fotobooth.com",
    method: "scrape",
    country: "South Korea",
    source_name: "eternalog",
    notes: "Korean operator"
  },
  {
    url: "https://fotoautomat.fr/en/our-adresses/",
    method: "scrape",
    country: "France",
    source_name: "fotoautomat.fr",
    notes: "French operator - addresses page"
  },
  {
    url: "https://automatfoto.se/",
    method: "scrape",
    country: "Sweden",
    source_name: "automatfoto.se",
    notes: "Swedish operator"
  },
  {
    url: "https://www.fotoautomatwien.com/",
    method: "scrape",
    country: "Austria",
    source_name: "fotoautomatwien.com",
    notes: "Austrian operator"
  },
  {
    url: "https://www.fotoautomatica.com/",
    method: "scrape",
    country: "Italy",
    source_name: "fotoautomatica.com",
    notes: "Florence operator"
  },
  {
    url: "https://findmyfilmlab.com/photobooths",
    method: "scrape",
    country: "USA",
    source_name: "findmyfilmlab.com",
    notes: "Specific photobooth page - avoid crawling film lab pages"
  },

  // Group B: Complex Sites (Need crawling with filtering)
  {
    url: "https://www.photomatica.com/find-a-booth-near-you",
    method: "crawl",
    country: "USA",
    source_name: "photomatica.com",
    include: ["/find-a-booth-near-you", "/locations/*"],
    exclude: ["/blog/*", "/shop/*", "/cart", "/account"],
    limit: 15,
    notes: "West Coast operator - crawl location pages, skip commerce"
  }
];

interface BoothData {
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

function transformToBoothData(booth: any, sourceConfig: SourceConfig, sourceUrl: string): BoothData | null {
  try {
    const location = booth.location || {};
    const tech = booth.tech || {};

    // Parse payment methods
    const payment = tech.payment?.toLowerCase() || '';
    const acceptsCash = payment.includes('cash') || payment.includes('coin') || payment.includes('token');
    const acceptsCard = payment.includes('card') || payment.includes('credit');

    // Determine booth type
    const techType = tech.type?.toLowerCase() || '';
    const boothType = techType.includes('digital') ? 'digital' : 'analog';

    // Extract name - use venue_name or fallback to address
    const name = location.venue_name || location.address || 'Unknown Booth';

    // Use country from extraction or fallback to config
    const country = location.country || sourceConfig.country || 'Unknown';

    return {
      name,
      address: location.address || location.city || name,
      city: location.city || null,
      state: location.state_or_province || null,
      country,
      latitude: location.coordinates?.latitude || null,
      longitude: location.coordinates?.longitude || null,
      source_urls: [sourceUrl],
      source_primary: sourceConfig.source_name,
      status: booth.is_active ? 'active' : 'inactive',
      booth_type: boothType,
      is_operational: booth.is_active || false,
      description: [booth.description, location.notes].filter(Boolean).join(' - ') || null,
      cost: tech.price || null,
      machine_model: tech.type || null,
      accepts_cash: acceptsCash,
      accepts_card: acceptsCard,
      operator_name: booth.operator || null,
      last_verified: null
    };
  } catch (error) {
    console.error('Error transforming booth data:', error);
    return null;
  }
}

async function saveToDatabase(booths: BoothData[]) {
  let saved = 0;
  let skipped = 0;
  let errors = 0;

  for (const booth of booths) {
    try {
      // Check for duplicates (same name + city)
      const { data: existing } = await supabase
        .from('booths')
        .select('id')
        .eq('name', booth.name)
        .eq('city', booth.city)
        .maybeSingle();

      if (existing) {
        // Update existing booth
        const { error } = await supabase
          .from('booths')
          .update(booth)
          .eq('id', existing.id);

        if (error) {
          console.error(`  ❌ Error updating ${booth.name}:`, error.message);
          errors++;
        } else {
          console.log(`  ♻️  Updated: ${booth.name}`);
          saved++;
        }
      } else {
        // Insert new booth
        const { error } = await supabase
          .from('booths')
          .insert(booth);

        if (error) {
          console.error(`  ❌ Error inserting ${booth.name}:`, error.message);
          errors++;
        } else {
          console.log(`  ✅ Saved: ${booth.name}`);
          saved++;
        }
      }
    } catch (error) {
      console.error(`  ❌ Unexpected error with ${booth.name}:`, error);
      errors++;
    }
  }

  return { saved, skipped, errors };
}

async function scrapeSource(config: SourceConfig): Promise<BoothData[]> {
  console.log(`\n📄 Scraping: ${config.url}`);
  console.log(`   Strategy: Single page scrape (${config.notes})`);

  try {
    const result = await firecrawl.scrapeUrl(config.url, {
      formats: ['extract'],
      extract: {
        schema: extractionSchema,
        systemPrompt
      }
    });

    if (!result.extract || !result.extract.booths) {
      console.log(`   ⚠️  No structured data found`);
      return [];
    }

    const booths = result.extract.booths;
    console.log(`   ✅ Found ${booths.length} booths`);

    const transformed = booths
      .map((b: any) => transformToBoothData(b, config, result.sourceURL || config.url))
      .filter((b): b is BoothData => b !== null);

    return transformed;
  } catch (error) {
    console.error(`   ❌ Error scraping:`, error);
    return [];
  }
}

async function crawlSource(config: SourceConfig): Promise<BoothData[]> {
  console.log(`\n🕷️  Crawling: ${config.url}`);
  console.log(`   Strategy: Multi-page crawl (${config.notes})`);
  if (config.include) {
    console.log(`   Include paths: ${config.include.join(', ')}`);
  }
  if (config.exclude) {
    console.log(`   Exclude paths: ${config.exclude.join(', ')}`);
  }

  try {
    const result = await firecrawl.crawlUrl(config.url, {
      limit: config.limit || 10,
      scrapeOptions: {
        formats: ['extract'],
        extract: {
          schema: extractionSchema,
          systemPrompt
        }
      },
      includePaths: config.include,
      excludePaths: config.exclude
    });

    if (!result.data || result.data.length === 0) {
      console.log(`   ⚠️  No pages crawled`);
      return [];
    }

    console.log(`   ✅ Crawled ${result.data.length} pages`);

    // Flatten all booths from all pages
    const allBooths: BoothData[] = [];
    for (const page of result.data) {
      if (page.extract && page.extract.booths) {
        const booths = page.extract.booths;
        const transformed = booths
          .map((b: any) => transformToBoothData(b, config, page.sourceURL || page.url || config.url))
          .filter((b): b is BoothData => b !== null);
        allBooths.push(...transformed);
      }
    }

    console.log(`   ✅ Total booths found: ${allBooths.length}`);
    return allBooths;
  } catch (error) {
    console.error(`   ❌ Error crawling:`, error);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting multi-source photobooth crawler\n');
  console.log(`Total sources to process: ${SOURCES.length}`);
  console.log(`- Scrape (single page): ${SOURCES.filter(s => s.method === 'scrape').length}`);
  console.log(`- Crawl (multi-page): ${SOURCES.filter(s => s.method === 'crawl').length}`);

  const allBooths: BoothData[] = [];
  const results: Array<{ source: string; count: number; success: boolean }> = [];

  for (const config of SOURCES) {
    try {
      const booths = config.method === 'scrape'
        ? await scrapeSource(config)
        : await crawlSource(config);

      allBooths.push(...booths);
      results.push({
        source: config.source_name,
        count: booths.length,
        success: true
      });

      // Small delay between sources to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`\n❌ Failed to process ${config.source_name}:`, error);
      results.push({
        source: config.source_name,
        count: 0,
        success: false
      });
    }
  }

  console.log('\n\n📊 Extraction Summary\n');
  console.log('Source                    | Booths | Status');
  console.log('--------------------------|--------|--------');
  results.forEach(r => {
    const name = r.source.padEnd(25);
    const count = r.count.toString().padStart(6);
    const status = r.success ? '✅' : '❌';
    console.log(`${name}| ${count} | ${status}`);
  });

  const totalExtracted = allBooths.length;
  const successfulSources = results.filter(r => r.success).length;

  console.log('\n' + '='.repeat(50));
  console.log(`Total booths extracted: ${totalExtracted}`);
  console.log(`Successful sources: ${successfulSources}/${SOURCES.length}`);
  console.log('='.repeat(50));

  if (totalExtracted > 0) {
    console.log('\n💾 Saving to database...\n');
    const { saved, errors } = await saveToDatabase(allBooths);

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Saved/Updated: ${saved}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(50));
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);
