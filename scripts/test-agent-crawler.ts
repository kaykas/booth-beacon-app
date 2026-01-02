/**
 * PROOF OF CONCEPT: Firecrawl Agent for Booth Beacon
 *
 * Tests the new Firecrawl Agent endpoint against 3 representative sources:
 * 1. photobooth.net - Large directory with pagination
 * 2. timeout.com/chicago - City guide article
 * 3. fotoautomat-berlin.de - European operator site
 *
 * Compares Agent results with current extractor approach
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

// --- TYPE DEFINITIONS ---
interface BoothData {
  name: string;
  address: string;
  city: string;
  country: string;
  state?: string;
  postal_code?: string;
  hours?: string;
  cost?: string;
  phone?: string;
  website?: string;
  machine_type?: string;
  machine_manufacturer?: string;
  description?: string;
  is_operational?: boolean;
}

interface TestResult {
  source_name: string;
  source_url: string;
  method: 'agent' | 'current';
  booths_found: number;
  extraction_time_ms: number;
  field_completion_rate: number;
  errors?: string[];
  sample_booths: BoothData[];
}

// --- TEST SOURCES ---
const TEST_SOURCES = [
  {
    name: 'photobooth_net',
    url: 'https://photobooth.net/locations',
    type: 'directory',
    description: 'Large paginated directory'
  },
  {
    name: 'timeout_chicago',
    url: 'https://www.timeout.com/chicago/things-to-do/photo-booths-in-chicago',
    type: 'city_guide',
    description: 'Single article with embedded list'
  },
  {
    name: 'fotoautomat_berlin',
    url: 'https://fotoautomat-berlin.de/standorte',
    type: 'operator',
    description: 'European operator location page'
  }
];

// --- AGENT CRAWLER ---
async function crawlWithAgent(sourceUrl: string, sourceName: string): Promise<TestResult> {
  console.log(`\n🤖 Testing AGENT approach for ${sourceName}...`);
  const startTime = Date.now();

  try {
    // Check if Agent endpoint is available
    // Note: This is the expected API structure based on Firecrawl docs
    // Actual implementation may differ slightly

    const agentPrompt = `Find ALL analog photo booth locations from this source.

Extract complete information for each booth including:
- Venue name (exact name of location)
- Full street address
- City and state/region
- Country
- Postal/ZIP code (if available)
- Operating hours (if available)
- Cost per photo strip (if available)
- Phone number (if available)
- Website URL (if available)
- Machine manufacturer or model (if mentioned)
- Brief description of location context

IMPORTANT RULES:
1. ONLY extract analog/chemical photo booths (NOT digital/iPad booths)
2. Include booths even if some information is missing
3. For directories: Extract ALL listed locations across all pages
4. For articles: Extract ALL booths mentioned in the text
5. For maps: Click through all markers to get complete details
6. Return empty array if no analog photo booths found

Format: Return as JSON array of objects with the above fields.`;

    // Use Agent via SDK (verified working in v4.9.3+)
    let result;

    try {
      // @ts-ignore - Agent method exists but may not be in TypeScript definitions
      result = await firecrawl.agent({
        prompt: agentPrompt,
        url: sourceUrl,
        // Optional: Add schema for structured output
        // schema: boothSchema (if using Zod)
      });

      console.log(`   Raw result keys: ${Object.keys(result).join(', ')}`);
    } catch (error: any) {
      throw new Error(`Agent SDK call failed: ${error.message}`);
    }

    const extractionTime = Date.now() - startTime;

    // Parse booths from result
    let booths: BoothData[] = [];

    // Result format may vary - handle different possible structures
    if (Array.isArray(result)) {
      booths = result;
    } else if (result.data && Array.isArray(result.data)) {
      booths = result.data;
    } else if (result.booths && Array.isArray(result.booths)) {
      booths = result.booths;
    }

    // Calculate field completion rate
    const totalFields = booths.length * 10; // 10 key fields we track
    const completedFields = booths.reduce((sum, booth) => {
      let completed = 0;
      if (booth.name) completed++;
      if (booth.address) completed++;
      if (booth.city) completed++;
      if (booth.country) completed++;
      if (booth.hours) completed++;
      if (booth.cost) completed++;
      if (booth.phone) completed++;
      if (booth.website) completed++;
      if (booth.machine_type) completed++;
      if (booth.description) completed++;
      return sum + completed;
    }, 0);

    const completionRate = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

    console.log(`✅ Agent found ${booths.length} booths in ${extractionTime}ms`);
    console.log(`📊 Field completion: ${completionRate.toFixed(1)}%`);

    return {
      source_name: sourceName,
      source_url: sourceUrl,
      method: 'agent',
      booths_found: booths.length,
      extraction_time_ms: extractionTime,
      field_completion_rate: completionRate,
      sample_booths: booths.slice(0, 3) // First 3 for comparison
    };

  } catch (error: any) {
    console.error(`❌ Agent extraction failed: ${error.message}`);
    return {
      source_name: sourceName,
      source_url: sourceUrl,
      method: 'agent',
      booths_found: 0,
      extraction_time_ms: Date.now() - startTime,
      field_completion_rate: 0,
      errors: [error.message],
      sample_booths: []
    };
  }
}

// --- CURRENT CRAWLER (for comparison) ---
async function crawlWithCurrentSystem(sourceUrl: string, sourceName: string): Promise<TestResult> {
  console.log(`\n🔧 Testing CURRENT approach for ${sourceName}...`);
  const startTime = Date.now();

  try {
    // Use current Firecrawl scrape + Claude extraction
    const scrapeResult = await firecrawl.scrapeUrl(sourceUrl, {
      formats: ['markdown', 'html'],
      onlyMainContent: false,
      waitFor: 6000,
      timeout: 30000,
    });

    if (!scrapeResult.success) {
      throw new Error('Firecrawl scrape failed');
    }

    // Simulate current extraction logic (simplified)
    // In reality, this would route to appropriate extractor function
    const markdown = scrapeResult.markdown || '';

    // Simple pattern matching (actual extractors are more complex)
    const booths: BoothData[] = [];

    // This is a placeholder - real extractors are source-specific
    // Just to demonstrate the current approach requires custom logic
    console.log(`📄 Scraped ${markdown.length} characters of content`);
    console.log(`⚠️  Would need custom extractor for ${sourceName}`);

    const extractionTime = Date.now() - startTime;

    return {
      source_name: sourceName,
      source_url: sourceUrl,
      method: 'current',
      booths_found: 0, // Placeholder - would call actual extractor
      extraction_time_ms: extractionTime,
      field_completion_rate: 0,
      sample_booths: []
    };

  } catch (error: any) {
    console.error(`❌ Current extraction failed: ${error.message}`);
    return {
      source_name: sourceName,
      source_url: sourceUrl,
      method: 'current',
      booths_found: 0,
      extraction_time_ms: Date.now() - startTime,
      field_completion_rate: 0,
      errors: [error.message],
      sample_booths: []
    };
  }
}

// --- COMPARISON REPORT ---
function generateComparisonReport(results: TestResult[]) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 AGENT vs. CURRENT SYSTEM COMPARISON');
  console.log('='.repeat(80) + '\n');

  const agentResults = results.filter(r => r.method === 'agent');
  const currentResults = results.filter(r => r.method === 'current');

  console.log('RESULTS BY SOURCE:');
  console.log('-'.repeat(80));

  for (const source of TEST_SOURCES) {
    const agentResult = agentResults.find(r => r.source_name === source.name);
    const currentResult = currentResults.find(r => r.source_name === source.name);

    console.log(`\n📍 ${source.name.toUpperCase()} (${source.type})`);
    console.log(`   URL: ${source.url}`);
    console.log(`   Description: ${source.description}\n`);

    if (agentResult) {
      console.log(`   🤖 AGENT:`);
      console.log(`      Booths found: ${agentResult.booths_found}`);
      console.log(`      Time: ${agentResult.extraction_time_ms}ms`);
      console.log(`      Field completion: ${agentResult.field_completion_rate.toFixed(1)}%`);
      if (agentResult.errors) {
        console.log(`      ❌ Errors: ${agentResult.errors.join(', ')}`);
      }
      if (agentResult.sample_booths.length > 0) {
        console.log(`      Sample booth: ${agentResult.sample_booths[0].name}`);
        console.log(`                    ${agentResult.sample_booths[0].address || 'No address'}`);
        console.log(`                    ${agentResult.sample_booths[0].city || 'No city'}`);
      }
    }

    if (currentResult) {
      console.log(`\n   🔧 CURRENT:`);
      console.log(`      Booths found: ${currentResult.booths_found}`);
      console.log(`      Time: ${currentResult.extraction_time_ms}ms`);
      console.log(`      Note: Requires custom extractor implementation`);
    }

    console.log('\n' + '-'.repeat(80));
  }

  // Summary statistics
  const totalAgentBooths = agentResults.reduce((sum, r) => sum + r.booths_found, 0);
  const avgAgentTime = agentResults.reduce((sum, r) => sum + r.extraction_time_ms, 0) / agentResults.length;
  const avgCompletionRate = agentResults.reduce((sum, r) => sum + r.field_completion_rate, 0) / agentResults.length;

  console.log('\n📈 SUMMARY STATISTICS:');
  console.log(`   Total booths found by Agent: ${totalAgentBooths}`);
  console.log(`   Average extraction time: ${avgAgentTime.toFixed(0)}ms`);
  console.log(`   Average field completion: ${avgCompletionRate.toFixed(1)}%`);

  // Recommendation
  console.log('\n💡 RECOMMENDATION:');
  if (totalAgentBooths > 0 && avgCompletionRate > 60) {
    console.log('   ✅ PROCEED with Agent implementation');
    console.log('   Agent successfully extracted data with good completion rate');
  } else if (totalAgentBooths > 0) {
    console.log('   ⚠️  PROCEED with CAUTION');
    console.log('   Agent found booths but field completion could be better');
  } else {
    console.log('   ❌ More testing needed');
    console.log('   Agent had difficulty extracting data from test sources');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// --- MAIN TEST RUNNER ---
async function runAgentPOC() {
  console.log('🚀 FIRECRAWL AGENT PROOF OF CONCEPT');
  console.log('Testing Agent capability for Booth Beacon\n');

  const results: TestResult[] = [];

  // Test each source with Agent
  for (const source of TEST_SOURCES) {
    const agentResult = await crawlWithAgent(source.url, source.name);
    results.push(agentResult);

    // Small delay between sources
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Optional: Compare with current system
  // Uncomment if you want to test current extractors
  // for (const source of TEST_SOURCES) {
  //   const currentResult = await crawlWithCurrentSystem(source.url, source.name);
  //   results.push(currentResult);
  //   await new Promise(resolve => setTimeout(resolve, 2000));
  // }

  // Generate comparison report
  generateComparisonReport(results);

  // Save results to file for analysis
  const fs = await import('fs');
  const outputPath = '/Users/jkw/Projects/booth-beacon-app/docs/agent-poc-results.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`📁 Full results saved to: ${outputPath}`);
}

// Run the test
runAgentPOC().catch(console.error);
