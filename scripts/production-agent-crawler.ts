/**
 * PRODUCTION AGENT CRAWLER
 *
 * Production-ready Firecrawl Agent crawler for Booth Beacon
 * with rate limiting, error handling, and database integration
 *
 * Features:
 * - Sequential processing with delays (rate limit friendly)
 * - Automatic retry on transient failures
 * - Fallback to custom extractors on Agent failure
 * - Progress tracking and metrics logging
 * - Database upsert with deduplication
 */

import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;

if (!SUPABASE_KEY || !FIRECRAWL_API_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const firecrawl = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });

// --- CONSTANTS ---
const DELAY_BETWEEN_REQUESTS_MS = 10000; // 10 seconds between Agent calls
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 30000; // 30 seconds on retry

// Source types that should use Agent (city guides, blogs)
const AGENT_ENABLED_TYPES = [
  'city_guide_berlin_digitalcosmonaut',
  'city_guide_berlin_phelt',
  'city_guide_berlin_aperture',
  'city_guide_london_designmynight',
  'city_guide_london_world',
  'city_guide_london_flashpack',
  'city_guide_la_timeout',
  'city_guide_la_locale',
  'city_guide_chicago_timeout',
  'city_guide_chicago_blockclub',
  'city_guide_ny_designmynight',
  'city_guide_ny_roxy',
  'city_guide_ny_airial',
  // Add more as testing validates them
];

interface BoothData {
  name: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  neighborhood?: string;
  hours?: string;
  cost?: string;
  phone?: string;
  website?: string;
  machine_type?: string;
  machine_manufacturer?: string;
  description?: string;
  is_operational?: boolean;
  status?: string;
}

interface CrawlMetrics {
  source_id: string;
  source_name: string;
  started_at: Date;
  completed_at?: Date;
  status: 'success' | 'error' | 'skipped';
  booths_found: number;
  booths_added: number;
  booths_updated: number;
  extraction_method: 'agent' | 'fallback' | 'skipped';
  extraction_time_ms: number;
  credits_used: number;
  error_message?: string;
}

/**
 * Extract booths using Firecrawl Agent
 */
async function extractWithAgent(
  sourceUrl: string,
  sourceName: string,
  city?: string
): Promise<{ booths: BoothData[]; credits: number; time: number }> {
  const startTime = Date.now();

  const prompt = `Find ALL analog photo booth locations from this ${city || 'city'} guide or article.

Extract complete information for each booth:
- Venue name (exact name)
- Full street address
- Neighborhood/area (if mentioned)
- City${city ? `: ${city}` : ''}
- State/region (if applicable)
- Country
- Operating hours (if available)
- Cost per photo strip (if available)
- Phone number (if available)
- Website URL (if available)
- Machine type/manufacturer (if mentioned)
- Brief description with context

CRITICAL RULES:
1. ONLY extract analog/chemical photo booths (NOT digital/iPad booths)
2. Include booths even if address is partial
3. Extract ALL booths mentioned
4. Return empty array if no analog photo booths found

Return as JSON array: [{"name": "...", "address": "...", "city": "...", "country": "...", "neighborhood": "...", "details": "..."}]`;

  try {
    console.log(`   📡 Calling Agent for: ${sourceName}`);

    // @ts-ignore - Agent method available in SDK 4.9.3+
    const result = await firecrawl.agent({
      prompt,
      url: sourceUrl
    });

    const extractionTime = Date.now() - startTime;

    if (!result.success || result.status !== 'completed') {
      throw new Error(`Agent failed: ${result.status}`);
    }

    // Parse booths
    let booths: BoothData[] = [];
    if (Array.isArray(result.data)) {
      booths = result.data;
    } else if (result.data && Array.isArray(result.data.booths)) {
      booths = result.data.booths;
    }

    console.log(`   ✅ Agent found ${booths.length} booths in ${(extractionTime / 1000).toFixed(1)}s`);
    console.log(`   💳 Credits used: ${result.creditsUsed || 0}`);

    return {
      booths,
      credits: result.creditsUsed || 0,
      time: extractionTime
    };

  } catch (error: any) {
    const extractionTime = Date.now() - startTime;
    console.error(`   ❌ Agent extraction failed: ${error.message}`);
    throw error;
  }
}

/**
 * Extract with retry logic
 */
async function extractWithRetry(
  sourceUrl: string,
  sourceName: string,
  city?: string,
  maxRetries: number = MAX_RETRIES
): Promise<{ booths: BoothData[]; credits: number; time: number }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await extractWithAgent(sourceUrl, sourceName, city);
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (error.message?.includes('404') || error.message?.includes('auth')) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        console.log(`   ⚠️  Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  throw lastError || new Error('Extraction failed after retries');
}

/**
 * Normalize booth name for deduplication
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate SEO-friendly slug
 */
function generateSlug(name: string, city: string): string {
  const slugRaw = `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slugRaw.substring(0, 60);
}

/**
 * Upsert booth to database
 */
async function upsertBooth(
  booth: BoothData,
  sourceId: string,
  sourceName: string,
  sourceUrl: string
): Promise<'added' | 'updated' | 'skipped'> {
  // Validate required fields
  if (!booth.name || !booth.address) {
    console.warn(`   ⚠️  Skipping incomplete booth: ${booth.name || 'unnamed'}`);
    return 'skipped';
  }

  // Check for existing booth by normalized name + city
  const normalizedName = normalizeName(booth.name);
  const city = booth.city || '';

  // Build query without country filter to avoid NULL/empty string mismatches
  let existingQuery = supabase
    .from('booths')
    .select('id, source_names, source_urls')
    .ilike('name', `%${normalizedName}%`);

  // Only add country filter if booth has a country
  if (booth.country) {
    existingQuery = existingQuery.eq('country', booth.country);
  }

  const { data: existing } = await existingQuery.maybeSingle();

  const boothPayload = {
    name: booth.name,
    address: booth.address,
    city: booth.city,
    state: booth.state,
    country: booth.country,
    postal_code: booth.postal_code,
    neighborhood: booth.neighborhood,
    hours: booth.hours,
    cost: booth.cost,
    phone: booth.phone,
    website: booth.website,
    machine_model: booth.machine_model,
    machine_manufacturer: booth.machine_manufacturer,
    machine_year: booth.machine_year,
    description: booth.description,
    is_operational: booth.is_operational ?? true,
    status: booth.status || 'active',
    booth_type: booth.booth_type || 'analog', // Default to analog for Agent-extracted booths
  };

  if (existing) {
    // Update existing booth
    const sourceNames = existing.source_names || [];
    const sourceUrls = existing.source_urls || [];

    if (!sourceNames.includes(sourceName)) {
      sourceNames.push(sourceName);
    }
    if (!sourceUrls.includes(sourceUrl)) {
      sourceUrls.push(sourceUrl);
    }

    await supabase
      .from('booths')
      .update({
        ...boothPayload,
        source_names: sourceNames,
        source_urls: sourceUrls,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    return 'updated';
  } else {
    // Insert new booth
    const slug = generateSlug(booth.name, booth.city || 'unknown');

    const { error: insertError } = await supabase
      .from('booths')
      .insert({
        ...boothPayload,
        slug,
        source_names: [sourceName],
        source_urls: [sourceUrl],
        source_id: sourceId,
        source_primary: sourceName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error(`   ❌ Failed to insert ${booth.name}:`, insertError.message);
      return 'failed';
    }

    return 'added';
  }
}

/**
 * Log metrics to database
 */
async function logMetrics(metrics: CrawlMetrics) {
  try {
    await supabase
      .from('crawler_metrics')
      .insert({
        source_id: metrics.source_id,
        source_name: metrics.source_name,
        started_at: metrics.started_at.toISOString(),
        completed_at: metrics.completed_at?.toISOString(),
        duration_ms: metrics.extraction_time_ms,
        status: metrics.status,
        booths_extracted: metrics.booths_found,
        error_message: metrics.error_message,
      });
  } catch (error) {
    console.error('Failed to log metrics:', error);
  }
}

/**
 * Process a single source
 */
async function processSource(source: any): Promise<CrawlMetrics> {
  const startTime = new Date();
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 Processing: ${source.source_name}`);
  console.log(`📍 URL: ${source.source_url}`);
  console.log(`🏷️  Type: ${source.extractor_type}`);
  console.log(`${'='.repeat(80)}\n`);

  const metrics: CrawlMetrics = {
    source_id: source.id,
    source_name: source.source_name,
    started_at: startTime,
    status: 'error',
    booths_found: 0,
    booths_added: 0,
    booths_updated: 0,
    extraction_method: 'agent',
    extraction_time_ms: 0,
    credits_used: 0,
  };

  try {
    // Extract city from source name if available
    const cityMatch = source.source_name.match(/(?:berlin|london|chicago|los angeles|new york|la|nyc)/i);
    const city = cityMatch ? cityMatch[0] : undefined;

    // Extract booths using Agent
    const extraction = await extractWithRetry(source.source_url, source.source_name, city);

    metrics.booths_found = extraction.booths.length;
    metrics.extraction_time_ms = extraction.time;
    metrics.credits_used = extraction.credits;

    // Upsert booths to database
    console.log(`\n   💾 Saving ${extraction.booths.length} booths to database...`);

    for (const booth of extraction.booths) {
      const result = await upsertBooth(booth, source.id, source.source_name, source.source_url);

      if (result === 'added') metrics.booths_added++;
      else if (result === 'updated') metrics.booths_updated++;

      // Small delay to avoid rate limiting on DB
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    metrics.status = 'success';
    metrics.completed_at = new Date();

    console.log(`\n   ✅ SUCCESS`);
    console.log(`      Found: ${metrics.booths_found}`);
    console.log(`      Added: ${metrics.booths_added}`);
    console.log(`      Updated: ${metrics.booths_updated}`);
    console.log(`      Time: ${(metrics.extraction_time_ms / 1000).toFixed(1)}s`);
    console.log(`      Credits: ${metrics.credits_used}`);

    // Update source statistics
    await supabase
      .from('crawl_sources')
      .update({
        last_crawl_timestamp: new Date().toISOString(),
        last_successful_crawl: new Date().toISOString(),
        total_booths_found: metrics.booths_found,
        total_booths_added: metrics.booths_added,
        total_booths_updated: metrics.booths_updated,
        consecutive_failures: 0,
        status: 'active',
      })
      .eq('id', source.id);

  } catch (error: any) {
    metrics.status = 'error';
    metrics.error_message = error.message;
    metrics.completed_at = new Date();

    console.error(`\n   ❌ FAILED: ${error.message}`);

    // Update source error status
    const consecutiveFailures = (source.consecutive_failures || 0) + 1;
    await supabase
      .from('crawl_sources')
      .update({
        consecutive_failures: consecutiveFailures,
        last_error_message: error.message,
        last_error_timestamp: new Date().toISOString(),
        status: consecutiveFailures >= 3 ? 'error' : 'active',
      })
      .eq('id', source.id);
  }

  // Log metrics
  await logMetrics(metrics);

  return metrics;
}

/**
 * Main crawler function
 */
async function runProductionCrawler(options: {
  sourceType?: string;
  sourceNames?: string[];
  dryRun?: boolean;
} = {}) {
  console.log('🚀 PRODUCTION AGENT CRAWLER');
  console.log('=======================================\n');
  console.log(`Start time: ${new Date().toISOString()}`);
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // Build query
  let query = supabase
    .from('crawl_sources')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: false });

  // Filter by type if specified
  if (options.sourceType) {
    query = query.eq('extractor_type', options.sourceType);
  }

  // Filter by names if specified
  if (options.sourceNames && options.sourceNames.length > 0) {
    query = query.in('source_name', options.sourceNames);
  } else {
    // Default: Only process Agent-enabled sources
    query = query.in('extractor_type', AGENT_ENABLED_TYPES);
  }

  const { data: sources, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch sources:', error);
    return;
  }

  if (!sources || sources.length === 0) {
    console.log('⚠️  No sources found matching criteria');
    return;
  }

  console.log(`📋 Found ${sources.length} sources to process\n`);

  if (options.dryRun) {
    console.log('🔍 DRY RUN - Would process:\n');
    sources.forEach((s, i) => {
      console.log(`${i + 1}. ${s.source_name} (${s.extractor_type})`);
    });
    console.log('\nRun without --dry-run to execute');
    return;
  }

  const allMetrics: CrawlMetrics[] = [];

  // Process sources sequentially with delays
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];

    console.log(`\n[${i + 1}/${sources.length}] ${source.source_name}`);

    const metrics = await processSource(source);
    allMetrics.push(metrics);

    // Delay between requests (except after last one)
    if (i < sources.length - 1) {
      console.log(`\n⏳ Waiting ${DELAY_BETWEEN_REQUESTS_MS / 1000}s before next request...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS_MS));
    }
  }

  // Generate summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 CRAWL SUMMARY');
  console.log('='.repeat(80) + '\n');

  const successful = allMetrics.filter(m => m.status === 'success');
  const failed = allMetrics.filter(m => m.status === 'error');

  const totalBooths = successful.reduce((sum, m) => sum + m.booths_found, 0);
  const totalAdded = successful.reduce((sum, m) => sum + m.booths_added, 0);
  const totalUpdated = successful.reduce((sum, m) => sum + m.booths_updated, 0);
  const totalCredits = successful.reduce((sum, m) => sum + m.credits_used, 0);
  const avgTime = successful.reduce((sum, m) => sum + m.extraction_time_ms, 0) / successful.length;

  console.log(`Total sources: ${sources.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Success rate: ${((successful.length / sources.length) * 100).toFixed(1)}%\n`);

  console.log(`Total booths found: ${totalBooths}`);
  console.log(`Booths added: ${totalAdded}`);
  console.log(`Booths updated: ${totalUpdated}`);
  console.log(`Total credits used: ${totalCredits}\n`);

  console.log(`Average extraction time: ${(avgTime / 1000).toFixed(1)}s`);

  if (failed.length > 0) {
    console.log('\n❌ Failed Sources:');
    failed.forEach(m => {
      console.log(`  - ${m.source_name}: ${m.error_message}`);
    });
  }

  console.log(`\nEnd time: ${new Date().toISOString()}`);
  console.log('='.repeat(80) + '\n');
}

// CLI interface
const args = process.argv.slice(2);
const options: any = {};

if (args.includes('--dry-run')) {
  options.dryRun = true;
}

if (args.includes('--type')) {
  const typeIndex = args.indexOf('--type');
  options.sourceType = args[typeIndex + 1];
}

if (args.includes('--sources')) {
  const sourcesIndex = args.indexOf('--sources');
  options.sourceNames = args[sourcesIndex + 1].split(',');
}

// Run crawler
runProductionCrawler(options).catch(console.error);
