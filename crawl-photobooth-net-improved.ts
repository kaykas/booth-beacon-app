/**
 * IMPROVED PHOTOBOOTH.NET CRAWLER
 *
 * Based on Firecrawl expert recommendations:
 * - Uses crawlUrl() to discover all booth detail pages
 * - Applies structured schema for LLM extraction
 * - Filters to only extract from locationID pages
 * - Gets rich data: machine type, cost, status, full address, etc.
 */

import { createClient } from '@supabase/supabase-js';
import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js';

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY!
});

// Define the extraction schema (TypeScript types that will become JSON schema)
interface PhotoboothLocation {
  address?: string;
  city?: string;
  state_or_province?: string;
  country?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

interface BoothDetails {
  machine_type?: string; // "B&W Model 14", "Digital", "Dip & Dunk", etc.
  cost?: string; // "$5.00", "£3", etc.
  photo_count?: number; // 3 or 4
  is_active: boolean; // True if active, false if "removed", "gone", "inactive"
  payment_type?: string; // "Cash", "Card", "Both"
}

interface Photobooth {
  name: string; // Venue name (e.g., "Ace Hotel", "Bimbo's 365 Club")
  location: PhotoboothLocation;
  details: BoothDetails;
  last_visit?: string; // Date of last visit/update
  description?: string; // Location notes and vibe
  operator?: string; // Booth operator name if mentioned
}

interface ExtractionSchema {
  listings: Photobooth[];
}

// Convert TypeScript types to JSON Schema for Firecrawl
const extractionSchema = {
  type: "object",
  properties: {
    listings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the venue or location (e.g., 'Ace Hotel', 'Bimbo's 365 Club')"
          },
          location: {
            type: "object",
            properties: {
              address: { type: "string", description: "Full street address of the booth" },
              city: { type: "string", description: "City where the booth is located" },
              state_or_province: { type: "string", description: "State, Province, or Region" },
              country: { type: "string", description: "Country" },
              coordinates: {
                type: "object",
                properties: {
                  latitude: { type: "number" },
                  longitude: { type: "number" }
                }
              }
            }
          },
          details: {
            type: "object",
            properties: {
              machine_type: {
                type: "string",
                description: "Type of machine (e.g., Analog B&W, Digital, Color, Dip & Dunk)"
              },
              cost: { type: "string", description: "Cost per strip (e.g., $5, £3)" },
              photo_count: {
                type: "number",
                description: "Number of photos per strip (usually 3 or 4)"
              },
              is_active: {
                type: "boolean",
                description: "True if the booth is currently active, False if listed as inactive, removed, or gone"
              },
              payment_type: { type: "string", description: "Payment methods accepted (Cash, Card, Both)" }
            },
            required: ["is_active"]
          },
          last_visit: { type: "string", description: "Date of the last recorded visit or update" },
          description: {
            type: "string",
            description: "Summary of the booth's location within the venue and any notes"
          },
          operator: { type: "string", description: "Name of booth operator if mentioned" }
        },
        required: ["name", "location", "details"]
      }
    }
  },
  required: ["listings"]
};

async function crawlPhotoboothNet(limit: number = 50) {
  console.log(`\n🎯 Starting improved photobooth.net crawler (limit: ${limit})`);
  console.log('Strategy: Crawl /locations/ directory to discover booth detail pages\n');

  try {
    // Use crawlUrl with structured extraction schema
    console.log('⏳ Crawling photobooth.net/locations/...');
    const crawlResult = await firecrawl.crawlUrl(
      'https://www.photobooth.net/locations/',
      {
        limit, // Number of pages to crawl
        scrapeOptions: {
          formats: ['extract'], // Use 'extract' format for schema-based extraction
          extract: {
            schema: extractionSchema,
            systemPrompt: `You are extracting photobooth listings from photobooth.net.
            Focus on pages with locationID parameter as these contain booth details.
            Parse the unstructured HTML to find:
            - Venue name and exact address
            - Machine type (look for phrases like "B&W Model 14", "Digital", "Dip & Dunk")
            - Cost per strip
            - Whether the booth is ACTIVE or INACTIVE (check for "removed", "gone", "no longer there")
            - Payment methods
            - Any operational hours
            Extract ONLY photobooths, not general text or navigation elements.`
          },
          onlyMainContent: false,
          waitFor: 8000,
          timeout: 120000,
        },
        // Pattern matching: Focus on booth detail pages
        includePaths: ['/locations/*'],
        excludePaths: ['/bboard/*', '/news/*', '/movies/*', '/community/*'],
      }
    );

    if (!crawlResult.success) {
      throw new Error(crawlResult.error || 'Crawl failed');
    }

    console.log(`✅ Crawl completed successfully`);
    console.log(`   Pages crawled: ${crawlResult.data?.length || 0}`);

    // Process extracted data
    let totalBooths = 0;
    const allBooths: any[] = [];

    for (const page of crawlResult.data || []) {
      console.log(`\n📄 Processing page: ${page.url || page.sourceURL}`);

      // Check if this page has extraction data
      if (page.extract && page.extract.listings) {
        const booths = page.extract.listings;
        console.log(`   Found ${booths.length} booths on this page`);

        for (const booth of booths) {
          totalBooths++;

          // Parse payment type into accepts_cash and accepts_card
          const paymentType = booth.details?.payment_type?.toLowerCase() || '';
          const acceptsCash = paymentType.includes('cash') || paymentType.includes('both') || !paymentType;
          const acceptsCard = paymentType.includes('card') || paymentType.includes('both');

          // Transform to our database schema
          const boothData = {
            name: booth.name || 'Unknown Booth',
            address: booth.location?.address || booth.location?.city || booth.name || 'Address Unknown',
            city: booth.location?.city || null,
            state: booth.location?.state_or_province || null,
            country: booth.location?.country || 'USA',
            latitude: booth.location?.coordinates?.latitude || null,
            longitude: booth.location?.coordinates?.longitude || null,
            source_urls: [page.url || page.sourceURL],
            source_primary: 'photobooth.net',
            status: booth.details?.is_active ? 'active' : 'inactive',
            booth_type: booth.details?.machine_type?.toLowerCase().includes('digital') ? 'digital' : 'analog',
            is_operational: booth.details?.is_active || false,
            description: booth.description || null,
            hours: null,
            cost: booth.details?.cost || null,
            machine_model: booth.details?.machine_type || null,
            accepts_cash: acceptsCash,
            accepts_card: acceptsCard,
            operator_name: booth.operator || null,
            last_verified: booth.last_visit && booth.last_visit !== 'N/A' ? booth.last_visit : null,
          };

          allBooths.push(boothData);

          console.log(`   ${totalBooths}. ${boothData.name} - ${boothData.city}, ${boothData.state} (${boothData.status})`);
        }
      } else {
        console.log(`   ⚠️ No extraction data found (may not be a booth detail page)`);
      }
    }

    console.log(`\n📊 Extraction Summary:`);
    console.log(`   Total booths found: ${totalBooths}`);
    console.log(`   Active booths: ${allBooths.filter(b => b.status === 'active').length}`);
    console.log(`   Inactive booths: ${allBooths.filter(b => b.status === 'inactive').length}`);

    // Save to database
    if (allBooths.length > 0) {
      console.log(`\n💾 Saving ${allBooths.length} booths to database...`);

      for (const booth of allBooths) {
        // Check if booth already exists by name + city
        const { data: existing } = await supabase
          .from('booths')
          .select('id, name, city')
          .eq('source_primary', 'photobooth.net')
          .ilike('name', booth.name)
          .ilike('city', booth.city || '')
          .maybeSingle(); // Use maybeSingle() to avoid error if not found

        if (existing) {
          // Update existing booth
          const { error } = await supabase
            .from('booths')
            .update({
              ...booth,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) {
            console.error(`   ❌ Failed to update booth ${booth.name}:`, error.message);
          } else {
            console.log(`   ✓ Updated: ${booth.name}`);
          }
        } else {
          // Insert new booth
          const { error } = await supabase
            .from('booths')
            .insert({
              ...booth,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (error) {
            console.error(`   ❌ Failed to insert booth ${booth.name}:`, error.message);
          } else {
            console.log(`   ✓ Inserted: ${booth.name}`);
          }
        }
      }

      console.log(`\n✅ Database update complete!`);
    }

    return {
      success: true,
      boothsFound: totalBooths,
      pagesCrawled: crawlResult.data?.length || 0,
    };

  } catch (error: any) {
    console.error('\n❌ Crawl failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run the crawler
const limit = parseInt(process.argv[2]) || 20; // Default to 20 pages for testing
crawlPhotoboothNet(limit)
  .then(result => {
    console.log('\n' + '='.repeat(60));
    console.log('FINAL RESULT:', JSON.stringify(result, null, 2));
    console.log('='.repeat(60));
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
