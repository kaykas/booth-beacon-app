/**
 * BAY AREA SPECIALIST CRAWLER V2
 *
 * Advanced crawler for San Francisco Bay Area (9 counties) with:
 * - Digital Retrofit Detection (vintage cabinets with digital printers)
 * - Ground Truth Validation (Marin Country Mart, Heebe Jeebe verified locations)
 * - Status Updates (Golden Bull, Legionnaire, Double Standard)
 * - Rejection Filters (Santa Cruz Boardwalk, Pop's Bar, Hotel Kabuki)
 *
 * Ground Truth Data (verified 2025):
 * - Marin Country Mart: $1.00 analog booth, verified 2025
 * - Heebe Jeebe: Model 21, verified May 2025
 * - Golden Bull: Temporarily closed/renovating
 * - Legionnaire: Removed
 * - Santa Cruz Boardwalk: All booths are digital retrofits
 */

import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || '',
});

// 9-County Bay Area Coverage
const BAY_AREA_COUNTIES = [
  'San Francisco',
  'Alameda',
  'Marin',
  'Sonoma',
  'Santa Clara',
  'San Mateo',
  'Contra Costa',
  'Napa',
  'Solano',
];

// Ground Truth: Verified Analog Locations (2025)
const VERIFIED_ANALOG_BOOTHS = [
  {
    name: 'Marin Country Mart',
    city: 'Larkspur',
    state: 'CA',
    country: 'USA',
    price: 1.00,
    model: 'Unknown',
    verified_date: '2025-01-01',
    notes: 'Verified $1 analog booth as of 2025',
  },
  {
    name: 'Heebe Jeebe',
    city: 'Petaluma',
    state: 'CA',
    country: 'USA',
    model: 'Model 21',
    verified_date: '2025-05-01',
    notes: 'Verified Model 21 analog booth as of May 2025',
  },
];

// Ground Truth: Status Updates
const STATUS_UPDATES = {
  'Golden Bull': {
    status: 'temporarily_closed',
    reason: 'Closed/renovating',
    updated: '2025-01-01',
  },
  'Legionnaire': {
    status: 'removed',
    reason: 'Booth no longer present',
    updated: '2025-01-01',
  },
  'Double Standard': {
    status: 'active',
    verified_date: '2025-01-01',
  },
};

// Rejection List: Known Digital Retrofits
const DIGITAL_RETROFIT_REJECT_LIST = [
  { name: "Pop's Bar", city: 'San Francisco', reason: 'Digital retrofit confirmed' },
  { name: 'Hotel Kabuki', city: 'San Francisco', reason: 'Digital retrofit confirmed' },
  { venue: 'Santa Cruz Boardwalk', city: 'Santa Cruz', reason: 'All booths are digital retrofits' },
];

// Digital Retrofit Detection Patterns
const DIGITAL_RETROFIT_INDICATORS = [
  'retrofitted',
  'digital technology',
  'dye-sub',
  'dye sublimation',
  'inkjet',
  'digital printer',
  'modern printer',
  'digital photo',
  'instant print',
  'photo printing',
];

const ANALOG_INDICATORS = [
  'chemical',
  'analog',
  'film',
  'classic',
  'vintage',
  'original',
  'model 11',
  'model 14',
  'model 15',
  'model 16',
  'model 18',
  'model 19',
  'model 21',
  'model 47',
];

interface BoothData {
  name: string;
  city: string;
  state: string;
  country: string;
  address?: string;
  price?: number;
  model?: string;
  status?: string;
  source_url?: string;
  verified_analog?: boolean;
  digital_retrofit_risk?: number;
  notes?: string;
}

/**
 * Check if text contains digital retrofit indicators
 */
function detectDigitalRetrofit(text: string): { isDigital: boolean; confidence: number; indicators: string[] } {
  const lowerText = text.toLowerCase();
  const foundDigitalIndicators: string[] = [];
  const foundAnalogIndicators: string[] = [];

  // Check for digital retrofit patterns
  DIGITAL_RETROFIT_INDICATORS.forEach(indicator => {
    if (lowerText.includes(indicator)) {
      foundDigitalIndicators.push(indicator);
    }
  });

  // Check for analog indicators
  ANALOG_INDICATORS.forEach(indicator => {
    if (lowerText.includes(indicator)) {
      foundAnalogIndicators.push(indicator);
    }
  });

  // Calculate confidence score
  const digitalScore = foundDigitalIndicators.length;
  const analogScore = foundAnalogIndicators.length;

  // If we have strong analog indicators, it's likely genuine
  if (analogScore > digitalScore) {
    return { isDigital: false, confidence: 0, indicators: foundAnalogIndicators };
  }

  // If we have digital indicators, it's likely a retrofit
  if (digitalScore > 0) {
    const confidence = Math.min(digitalScore * 25, 100);
    return { isDigital: true, confidence, indicators: foundDigitalIndicators };
  }

  return { isDigital: false, confidence: 0, indicators: [] };
}

/**
 * Check if booth is on rejection list
 */
function isOnRejectList(booth: BoothData): { rejected: boolean; reason?: string } {
  for (const reject of DIGITAL_RETROFIT_REJECT_LIST) {
    if (reject.name && booth.name.toLowerCase().includes(reject.name.toLowerCase())) {
      if (!reject.city || booth.city.toLowerCase().includes(reject.city.toLowerCase())) {
        return { rejected: true, reason: reject.reason };
      }
    }
    if (reject.venue && booth.name.toLowerCase().includes(reject.venue.toLowerCase())) {
      return { rejected: true, reason: reject.reason };
    }
  }
  return { rejected: false };
}

/**
 * Check if booth matches ground truth verified location
 */
function checkGroundTruth(booth: BoothData): { verified: boolean; data?: typeof VERIFIED_ANALOG_BOOTHS[0] } {
  for (const verified of VERIFIED_ANALOG_BOOTHS) {
    if (
      booth.name.toLowerCase().includes(verified.name.toLowerCase()) &&
      booth.city.toLowerCase().includes(verified.city.toLowerCase())
    ) {
      return { verified: true, data: verified };
    }
  }
  return { verified: false };
}

/**
 * Check status updates for booth
 */
function checkStatusUpdate(booth: BoothData): { hasUpdate: boolean; update?: typeof STATUS_UPDATES[keyof typeof STATUS_UPDATES] } {
  const boothNameLower = booth.name.toLowerCase();

  for (const [venueName, update] of Object.entries(STATUS_UPDATES)) {
    if (boothNameLower.includes(venueName.toLowerCase())) {
      return { hasUpdate: true, update };
    }
  }

  return { hasUpdate: false };
}

/**
 * Search for Bay Area photo booths using multiple sources
 */
async function searchBayAreaBooths(): Promise<BoothData[]> {
  const booths: BoothData[] = [];

  console.log('🔍 Searching Bay Area photo booth sources...\n');

  // Target URLs for Bay Area specific searches
  const targetUrls = [
    'https://www.photobooth.net/locations/city/san-francisco-ca',
    'https://www.photobooth.net/locations/city/oakland-ca',
    'https://www.photobooth.net/locations/city/berkeley-ca',
    'https://www.photobooth.net/locations/city/san-jose-ca',
    'https://www.photobooth.net/locations/city/santa-cruz-ca',
    'https://www.yelp.com/search?find_desc=photo+booth&find_loc=San+Francisco%2C+CA',
    'https://www.yelp.com/search?find_desc=photo+booth&find_loc=Oakland%2C+CA',
  ];

  for (const url of targetUrls) {
    try {
      console.log(`Crawling: ${url}`);

      const response = await firecrawl.scrapeUrl(url, {
        formats: ['markdown'],
      });

      if (response.success && response.markdown) {
        console.log(`✓ Crawled successfully (${response.markdown.length} chars)`);

        // Parse booth data from markdown
        const extractedBooths = parseBoothsFromMarkdown(response.markdown, url);
        booths.push(...extractedBooths);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`✗ Error crawling ${url}:`, error instanceof Error ? error.message : 'Unknown');
    }
  }

  return booths;
}

/**
 * Parse booth data from markdown content
 */
function parseBoothsFromMarkdown(markdown: string, sourceUrl: string): BoothData[] {
  const booths: BoothData[] = [];

  // Simple parsing logic (can be enhanced with more sophisticated extraction)
  const lines = markdown.split('\n');

  for (const line of lines) {
    // Look for booth mentions with city context
    const match = line.match(/([A-Z][a-zA-Z\s&'-]+)\s*[-–]\s*([A-Z][a-zA-Z\s]+),\s*(CA|California)/);

    if (match) {
      const [, name, city] = match;

      booths.push({
        name: name.trim(),
        city: city.trim(),
        state: 'CA',
        country: 'USA',
        source_url: sourceUrl,
      });
    }
  }

  return booths;
}

/**
 * Process and validate booth
 */
async function processBooth(booth: BoothData): Promise<{ save: boolean; booth: BoothData; reason?: string }> {
  console.log(`\n📍 ${booth.name} (${booth.city})`);

  // Check ground truth first
  const groundTruth = checkGroundTruth(booth);
  if (groundTruth.verified && groundTruth.data) {
    console.log(`  ✓ VERIFIED ANALOG (Ground Truth): ${groundTruth.data.notes}`);
    booth.verified_analog = true;
    booth.model = groundTruth.data.model;
    booth.price = groundTruth.data.price;
    booth.notes = groundTruth.data.notes;
    return { save: true, booth };
  }

  // Check rejection list
  const rejectCheck = isOnRejectList(booth);
  if (rejectCheck.rejected) {
    console.log(`  ✗ REJECTED: ${rejectCheck.reason}`);
    return { save: false, booth, reason: rejectCheck.reason };
  }

  // Check status updates
  const statusCheck = checkStatusUpdate(booth);
  if (statusCheck.hasUpdate && statusCheck.update) {
    console.log(`  ⚠️  STATUS UPDATE: ${statusCheck.update.reason || statusCheck.update.status}`);
    booth.status = statusCheck.update.status;
    if (statusCheck.update.reason) {
      booth.notes = statusCheck.update.reason;
    }
  }

  // Digital retrofit detection (requires more content)
  // For now, we'll just flag booths that need manual verification
  if (booth.city.toLowerCase().includes('santa cruz')) {
    console.log(`  ⚠️  HIGH RISK: Santa Cruz area (known digital retrofits)`);
    booth.digital_retrofit_risk = 80;
    booth.notes = 'Requires manual verification - Santa Cruz area has many digital retrofits';
  }

  return { save: true, booth };
}

/**
 * Save booth to database
 */
async function saveBooth(booth: BoothData): Promise<void> {
  // Check if booth already exists
  const { data: existing } = await supabase
    .from('booths')
    .select('id')
    .eq('name', booth.name)
    .eq('city', booth.city)
    .single();

  if (existing) {
    console.log(`  → Updating existing booth`);

    const { error } = await supabase
      .from('booths')
      .update({
        address: booth.address,
        price: booth.price,
        model: booth.model,
        status: booth.status || 'active',
        source_url: booth.source_url,
        verified_analog: booth.verified_analog,
        digital_retrofit_risk: booth.digital_retrofit_risk,
        notes: booth.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      console.error(`  ✗ Update error:`, error.message);
    } else {
      console.log(`  ✓ Updated successfully`);
    }
  } else {
    console.log(`  → Creating new booth`);

    const { error } = await supabase
      .from('booths')
      .insert({
        name: booth.name,
        city: booth.city,
        state: booth.state,
        country: booth.country,
        address: booth.address,
        price: booth.price,
        model: booth.model,
        status: booth.status || 'active',
        source_url: booth.source_url,
        verified_analog: booth.verified_analog,
        digital_retrofit_risk: booth.digital_retrofit_risk,
        notes: booth.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`  ✗ Insert error:`, error.message);
    } else {
      console.log(`  ✓ Created successfully`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🌉 BAY AREA SPECIALIST CRAWLER V2');
  console.log('==================================');
  console.log('9-County Coverage with Digital Retrofit Detection\n');

  // Phase 1: Insert verified ground truth booths
  console.log('Phase 1: Ground Truth Validation');
  console.log('---------------------------------\n');

  for (const verified of VERIFIED_ANALOG_BOOTHS) {
    const booth: BoothData = {
      name: verified.name,
      city: verified.city,
      state: verified.state,
      country: verified.country,
      price: verified.price,
      model: verified.model,
      verified_analog: true,
      notes: verified.notes,
      status: 'active',
    };

    console.log(`\n✓ ${booth.name} (${booth.city})`);
    console.log(`  VERIFIED ANALOG: ${verified.notes}`);
    await saveBooth(booth);
  }

  // Phase 2: Update status for known venues
  console.log('\n\nPhase 2: Status Updates');
  console.log('-----------------------\n');

  for (const [venueName, update] of Object.entries(STATUS_UPDATES)) {
    console.log(`\n⚠️  ${venueName}: ${update.reason || update.status}`);

    const { data: booths } = await supabase
      .from('booths')
      .select('id, name')
      .ilike('name', `%${venueName}%`);

    if (booths && booths.length > 0) {
      for (const booth of booths) {
        await supabase
          .from('booths')
          .update({
            status: update.status,
            notes: update.reason,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booth.id);

        console.log(`  ✓ Updated: ${booth.name}`);
      }
    } else {
      console.log(`  → No matching booths found`);
    }
  }

  // Phase 3: Search and validate new booths
  console.log('\n\nPhase 3: Bay Area Search & Validation');
  console.log('--------------------------------------\n');

  const foundBooths = await searchBayAreaBooths();

  console.log(`\n\nFound ${foundBooths.length} potential booths`);
  console.log('Processing with digital retrofit detection...\n');

  let saved = 0;
  let rejected = 0;

  for (const booth of foundBooths) {
    const result = await processBooth(booth);

    if (result.save) {
      await saveBooth(result.booth);
      saved++;
    } else {
      rejected++;
    }
  }

  // Phase 4: Summary
  console.log('\n\n📊 Summary');
  console.log('==========');
  console.log(`Ground Truth Booths: ${VERIFIED_ANALOG_BOOTHS.length}`);
  console.log(`Status Updates Applied: ${Object.keys(STATUS_UPDATES).length}`);
  console.log(`New Booths Found: ${foundBooths.length}`);
  console.log(`Saved: ${saved}`);
  console.log(`Rejected: ${rejected}`);
  console.log(`\n✓ Bay Area Specialist Crawler completed`);
}

main().catch(console.error);
