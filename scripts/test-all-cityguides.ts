/**
 * COMPREHENSIVE CITY GUIDE TEST
 * Tests Firecrawl Agent on all 13 city guide sources
 *
 * Cities covered:
 * - Berlin (3 sources)
 * - London (3 sources)
 * - Los Angeles (2 sources)
 * - Chicago (2 sources)
 * - New York (3 sources)
 */

import FirecrawlApp from '@mendable/firecrawl-js';
import { createClient } from '@supabase/supabase-js';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!FIRECRAWL_API_KEY || !SUPABASE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const firecrawl = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface CityGuideSource {
  name: string;
  city: string;
  url: string;
  extractor_type: string;
  expected_min_booths: number; // Minimum expected for validation
}

// All 13 city guide sources (based on unified-crawler code)
const CITY_GUIDES: CityGuideSource[] = [
  // Berlin (3)
  {
    name: 'Digital Cosmonaut Berlin',
    city: 'Berlin',
    url: 'https://digitalcosmonaut.com/berlin-photoautomat-locations/',
    extractor_type: 'city_guide_berlin_digitalcosmonaut',
    expected_min_booths: 5
  },
  {
    name: 'Phelt Magazine Berlin',
    city: 'Berlin',
    url: 'https://pheltmagazine.co/photo-booths-of-berlin/',
    extractor_type: 'city_guide_berlin_phelt',
    expected_min_booths: 5
  },
  {
    name: 'Aperture Tours Berlin',
    city: 'Berlin',
    url: 'https://www.aperturetours.com/blog/photoautomat-berlin',
    extractor_type: 'city_guide_berlin_aperture',
    expected_min_booths: 3
  },

  // London (3)
  {
    name: 'Design My Night London',
    city: 'London',
    url: 'https://www.designmynight.com/london/whats-on/unusual-things-to-do/best-photo-booths-in-london',
    extractor_type: 'city_guide_london_designmynight',
    expected_min_booths: 5
  },
  {
    name: 'London World',
    city: 'London',
    url: 'https://londonworld.com/lifestyle/things-to-do/where-to-find-photo-booths-in-london',
    extractor_type: 'city_guide_london_world',
    expected_min_booths: 3
  },
  {
    name: 'Flash Pack London',
    city: 'London',
    url: 'https://www.flashpack.com/blog/photo-booths-london/',
    extractor_type: 'city_guide_london_flashpack',
    expected_min_booths: 5
  },

  // Los Angeles (2)
  {
    name: 'Time Out LA',
    city: 'Los Angeles',
    url: 'https://www.timeout.com/los-angeles/things-to-do/photo-booths-in-los-angeles',
    extractor_type: 'city_guide_la_timeout',
    expected_min_booths: 5
  },
  {
    name: 'Locale Magazine LA',
    city: 'Los Angeles',
    url: 'https://localemagazine.com/photo-booth-los-angeles/',
    extractor_type: 'city_guide_la_locale',
    expected_min_booths: 3
  },

  // Chicago (2)
  {
    name: 'Time Out Chicago',
    city: 'Chicago',
    url: 'https://www.timeout.com/chicago/things-to-do/photo-booths-in-chicago',
    extractor_type: 'city_guide_chicago_timeout',
    expected_min_booths: 5
  },
  {
    name: 'Block Club Chicago',
    city: 'Chicago',
    url: 'https://blockclubchicago.org/2023/08/14/chicago-photo-booths/',
    extractor_type: 'city_guide_chicago_blockclub',
    expected_min_booths: 3
  },

  // New York (3)
  {
    name: 'Design My Night NYC',
    city: 'New York',
    url: 'https://www.designmynight.com/new-york/whats-on/unusual-things-to-do/best-photo-booths-in-new-york',
    extractor_type: 'city_guide_ny_designmynight',
    expected_min_booths: 5
  },
  {
    name: 'Roxy Hotel NYC',
    city: 'New York',
    url: 'https://www.roxyhotelnyc.com/blog/photo-booths-nyc',
    extractor_type: 'city_guide_ny_roxy',
    expected_min_booths: 3
  },
  {
    name: 'Airial Travel Brooklyn',
    city: 'New York',
    url: 'https://www.airialtravel.com/blog/brooklyn-photo-booths',
    extractor_type: 'city_guide_ny_airial',
    expected_min_booths: 3
  }
];

interface TestResult {
  name: string;
  city: string;
  url: string;
  success: boolean;
  booths_found: number;
  field_completion_rate: number;
  extraction_time_ms: number;
  credits_used: number;
  error?: string;
  sample_booths?: any[];
}

async function testCityGuide(source: CityGuideSource): Promise<TestResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 Testing: ${source.name}`);
  console.log(`📍 City: ${source.city}`);
  console.log(`🔗 URL: ${source.url}`);
  console.log(`${'='.repeat(80)}\n`);

  const startTime = Date.now();

  const prompt = `Find ALL analog photo booth locations from this ${source.city} city guide article.

Extract information for each booth including:
- Venue name (exact name of location)
- Full street address
- Neighborhood/area (if mentioned)
- City: ${source.city}
- Any other details mentioned (hours, cost, booth type, etc.)

IMPORTANT:
- ONLY extract analog/chemical photo booths (NOT digital/iPad booths)
- Include booths even if address is partial
- Extract all booths mentioned in the article

Return as JSON array: [{"name": "...", "address": "...", "neighborhood": "...", "city": "${source.city}", "details": "..."}]`;

  try {
    console.log('📡 Calling Agent...');

    // @ts-ignore
    const result = await firecrawl.agent({
      prompt,
      url: source.url
    });

    const extractionTime = Date.now() - startTime;

    if (!result.success || result.status !== 'completed') {
      throw new Error(`Agent failed: ${result.status}`);
    }

    console.log(`✅ Agent completed in ${extractionTime}ms`);
    console.log(`💳 Credits used: ${result.creditsUsed}`);

    // Parse booths from result
    let booths = [];
    if (Array.isArray(result.data)) {
      booths = result.data;
    } else if (result.data && Array.isArray(result.data.booths)) {
      booths = result.data.booths;
    } else if (typeof result.data === 'object') {
      booths = [result.data];
    }

    console.log(`\n🎯 Extraction Results:`);
    console.log(`   Booths found: ${booths.length}`);

    // Calculate field completion
    const fields = ['name', 'address', 'city'];
    const totalFields = booths.length * fields.length;
    const completedFields = booths.reduce((sum, booth) => {
      return sum + fields.filter(f => booth[f] && booth[f].toString().trim().length > 0).length;
    }, 0);
    const completionRate = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

    console.log(`   Field completion: ${completionRate.toFixed(1)}%`);

    // Show sample booths
    if (booths.length > 0) {
      console.log(`\n   Sample booths:`);
      booths.slice(0, 3).forEach((booth, i) => {
        console.log(`   ${i + 1}. ${booth.name || 'Unnamed'}`);
        console.log(`      📍 ${booth.address || 'No address'}`);
        if (booth.neighborhood) console.log(`      🏘️  ${booth.neighborhood}`);
        if (booth.details) console.log(`      ℹ️  ${booth.details.substring(0, 60)}...`);
      });
    }

    // Validation
    const meetsExpectation = booths.length >= source.expected_min_booths;
    if (meetsExpectation) {
      console.log(`\n   ✅ SUCCESS: Met expected minimum (${source.expected_min_booths} booths)`);
    } else {
      console.log(`\n   ⚠️  WARNING: Below expected minimum (found ${booths.length}, expected ${source.expected_min_booths})`);
    }

    return {
      name: source.name,
      city: source.city,
      url: source.url,
      success: true,
      booths_found: booths.length,
      field_completion_rate: completionRate,
      extraction_time_ms: extractionTime,
      credits_used: result.creditsUsed || 0,
      sample_booths: booths.slice(0, 2)
    };

  } catch (error: any) {
    const extractionTime = Date.now() - startTime;
    console.error(`\n❌ FAILED: ${error.message}`);

    return {
      name: source.name,
      city: source.city,
      url: source.url,
      success: false,
      booths_found: 0,
      field_completion_rate: 0,
      extraction_time_ms: extractionTime,
      credits_used: 0,
      error: error.message
    };
  }
}

async function runAllTests() {
  console.log('🚀 COMPREHENSIVE CITY GUIDE TEST');
  console.log('Testing Firecrawl Agent on 13 city guide sources\n');
  console.log(`Start time: ${new Date().toISOString()}\n`);

  const results: TestResult[] = [];
  let successCount = 0;
  let totalBooths = 0;
  let totalCredits = 0;

  for (let i = 0; i < CITY_GUIDES.length; i++) {
    const source = CITY_GUIDES[i];

    console.log(`\n[${i + 1}/${CITY_GUIDES.length}] Processing ${source.name}...`);

    const result = await testCityGuide(source);
    results.push(result);

    if (result.success) {
      successCount++;
      totalBooths += result.booths_found;
      totalCredits += result.credits_used;
    }

    // 10-second delay between requests to avoid rate limiting
    if (i < CITY_GUIDES.length - 1) {
      console.log(`\n⏳ Waiting 10 seconds before next request...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  // Generate summary report
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80) + '\n');

  console.log(`Total sources tested: ${CITY_GUIDES.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${CITY_GUIDES.length - successCount}`);
  console.log(`Success rate: ${((successCount / CITY_GUIDES.length) * 100).toFixed(1)}%\n`);

  console.log(`Total booths found: ${totalBooths}`);
  console.log(`Average booths per source: ${(totalBooths / successCount).toFixed(1)}`);
  console.log(`Total credits used: ${totalCredits}\n`);

  // Average metrics
  const successfulResults = results.filter(r => r.success);
  const avgTime = successfulResults.reduce((sum, r) => sum + r.extraction_time_ms, 0) / successfulResults.length;
  const avgCompletion = successfulResults.reduce((sum, r) => sum + r.field_completion_rate, 0) / successfulResults.length;

  console.log(`Average extraction time: ${(avgTime / 1000).toFixed(1)}s`);
  console.log(`Average field completion: ${avgCompletion.toFixed(1)}%\n`);

  // Results by city
  console.log('Results by City:');
  console.log('-'.repeat(80));

  const cities = ['Berlin', 'London', 'Los Angeles', 'Chicago', 'New York'];
  cities.forEach(city => {
    const cityResults = results.filter(r => r.city === city);
    const citySuccess = cityResults.filter(r => r.success).length;
    const cityBooths = cityResults.reduce((sum, r) => sum + r.booths_found, 0);

    console.log(`\n${city}:`);
    console.log(`  Sources: ${cityResults.length}`);
    console.log(`  Success: ${citySuccess}/${cityResults.length}`);
    console.log(`  Total booths: ${cityBooths}`);

    cityResults.forEach(r => {
      const status = r.success ? '✅' : '❌';
      console.log(`    ${status} ${r.name}: ${r.booths_found} booths${r.error ? ` (${r.error})` : ''}`);
    });
  });

  // Failed sources
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('\n\n❌ Failed Sources:');
    console.log('-'.repeat(80));
    failed.forEach(r => {
      console.log(`\n${r.name} (${r.city})`);
      console.log(`  URL: ${r.url}`);
      console.log(`  Error: ${r.error}`);
    });
  }

  // Recommendation
  console.log('\n\n💡 RECOMMENDATION:');
  console.log('-'.repeat(80));

  const successRate = (successCount / CITY_GUIDES.length) * 100;
  const avgBoothsPerSource = totalBooths / successCount;

  if (successRate >= 80 && avgCompletion >= 80) {
    console.log('✅ PROCEED TO PRODUCTION');
    console.log('   Agent performs excellently on city guides');
    console.log('   Ready to replace custom extractors');
  } else if (successRate >= 60 && avgCompletion >= 60) {
    console.log('⚠️  PROCEED WITH HYBRID APPROACH');
    console.log('   Agent works well but some sources need refinement');
    console.log('   Use Agent with fallback to custom extractors');
  } else {
    console.log('❌ MORE TESTING NEEDED');
    console.log('   Agent needs optimization for city guides');
    console.log('   Review failed sources and refine prompts');
  }

  // Save results
  const fs = await import('fs');
  const outputPath = '/Users/jkw/Projects/booth-beacon-app/docs/cityguide-test-results.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    test_date: new Date().toISOString(),
    total_sources: CITY_GUIDES.length,
    successful: successCount,
    failed: CITY_GUIDES.length - successCount,
    success_rate: successRate,
    total_booths: totalBooths,
    total_credits: totalCredits,
    avg_extraction_time_ms: avgTime,
    avg_field_completion: avgCompletion,
    results: results
  }, null, 2));

  console.log(`\n📁 Full results saved to: ${outputPath}`);
  console.log(`\nEnd time: ${new Date().toISOString()}`);
}

runAllTests().catch(console.error);
