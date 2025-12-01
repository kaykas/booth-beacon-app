import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CrawlSource {
  id: string;
  source_name: string | null;
  source_url: string;
  extractor_type: string | null;
  enabled: boolean;
  status: string | null;
  total_booths_found: number | null;
  last_crawl_timestamp: string | null;
  priority: number | null;
}

interface ValidationResult {
  source: CrawlSource;
  urlAccessible: boolean;
  httpStatus: number | null;
  responseTime: number | null;
  hasName: boolean;
  hasExtractor: boolean;
  hasBooths: boolean;
  recommendation: string;
  errors: string[];
}

async function testUrl(url: string): Promise<{ accessible: boolean; status: number | null; time: number | null }> {
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'BoothBeacon-Validator/1.0'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    const time = Date.now() - startTime;

    return {
      accessible: response.status < 400,
      status: response.status,
      time
    };
  } catch {
    return {
      accessible: false,
      status: null,
      time: null
    };
  }
}

async function validateSource(source: CrawlSource): Promise<ValidationResult> {
  const errors: string[] = [];
  const result: ValidationResult = {
    source,
    urlAccessible: false,
    httpStatus: null,
    responseTime: null,
    hasName: !!source.source_name,
    hasExtractor: !!source.extractor_type,
    hasBooths: (source.total_booths_found || 0) > 0,
    recommendation: '',
    errors
  };

  // Check if source has a name
  if (!source.source_name) {
    errors.push('Missing source_name');
  }

  // Check if source has an extractor configured
  if (!source.extractor_type) {
    errors.push('Missing extractor_type');
  }

  // Test URL accessibility
  const urlTest = await testUrl(source.source_url);
  result.urlAccessible = urlTest.accessible;
  result.httpStatus = urlTest.status;
  result.responseTime = urlTest.time;

  if (!urlTest.accessible) {
    errors.push(`URL not accessible (HTTP ${urlTest.status || 'timeout'})`);
  }

  // Check if source has ever found booths
  if ((source.total_booths_found || 0) === 0) {
    errors.push('Never found any booths');
  }

  // Generate recommendation
  if (errors.length === 0) {
    result.recommendation = '✅ WORKING - Keep enabled';
  } else if (errors.length === 1 && errors[0].includes('Never found any booths')) {
    result.recommendation = '⚠️ NEEDS TESTING - URL works but no booths yet';
  } else if (!result.urlAccessible) {
    result.recommendation = '❌ BROKEN - URL inaccessible, disable or fix';
  } else if (!result.hasName || !result.hasExtractor) {
    result.recommendation = '🔧 NEEDS CONFIG - Fix configuration';
  } else {
    result.recommendation = '❌ BROKEN - Multiple issues, review';
  }

  return result;
}

async function validateAllSources() {
  console.log('\n=== CRAWLER SOURCE VALIDATION ===\n');
  console.log('Testing all enabled sources...\n');

  // Get all enabled sources
  const { data: sources, error } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('enabled', true)
    .order('priority');

  if (error) {
    console.error('❌ Error fetching sources:', error);
    return;
  }

  if (!sources || sources.length === 0) {
    console.log('No enabled sources found.');
    return;
  }

  console.log(`Found ${sources.length} enabled sources to validate.\n`);

  // Validate each source
  const results: ValidationResult[] = [];

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i] as CrawlSource;
    process.stdout.write(`\rValidating ${i + 1}/${sources.length}: ${source.source_name || source.source_url.substring(0, 50)}...`);

    const result = await validateSource(source);
    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n=== VALIDATION RESULTS ===\n');

  // Group results by recommendation type
  const working = results.filter(r => r.recommendation.includes('WORKING'));
  const needsTesting = results.filter(r => r.recommendation.includes('NEEDS TESTING'));
  const needsConfig = results.filter(r => r.recommendation.includes('NEEDS CONFIG'));
  const broken = results.filter(r => r.recommendation.includes('BROKEN'));

  // Display summary
  console.log('📊 Summary:');
  console.log(`  ✅ Working: ${working.length}`);
  console.log(`  ⚠️  Needs Testing: ${needsTesting.length}`);
  console.log(`  🔧 Needs Config: ${needsConfig.length}`);
  console.log(`  ❌ Broken: ${broken.length}`);
  console.log('');

  // Display working sources
  if (working.length > 0) {
    console.log('\n✅ WORKING SOURCES (' + working.length + '):\n');
    working.forEach((r, i) => {
      console.log(`${i + 1}. ${r.source.source_name}`);
      console.log(`   URL: ${r.source.source_url}`);
      console.log(`   Extractor: ${r.source.extractor_type}`);
      console.log(`   Booths found: ${r.source.total_booths_found || 0}`);
      console.log(`   HTTP Status: ${r.httpStatus} (${r.responseTime}ms)`);
      console.log('');
    });
  }

  // Display sources needing testing
  if (needsTesting.length > 0) {
    console.log('\n⚠️  NEEDS TESTING (' + needsTesting.length + '):\n');
    needsTesting.forEach((r, i) => {
      console.log(`${i + 1}. ${r.source.source_name || '(unnamed)'}`);
      console.log(`   URL: ${r.source.source_url}`);
      console.log(`   Extractor: ${r.source.extractor_type || 'NONE'}`);
      console.log(`   HTTP Status: ${r.httpStatus} (${r.responseTime}ms)`);
      console.log(`   Issues: ${r.errors.join(', ')}`);
      console.log('');
    });
  }

  // Display sources needing configuration
  if (needsConfig.length > 0) {
    console.log('\n🔧 NEEDS CONFIGURATION (' + needsConfig.length + '):\n');
    needsConfig.forEach((r, i) => {
      console.log(`${i + 1}. ${r.source.source_name || '(unnamed)'}`);
      console.log(`   ID: ${r.source.id}`);
      console.log(`   URL: ${r.source.source_url}`);
      console.log(`   Extractor: ${r.source.extractor_type || 'MISSING'}`);
      console.log(`   HTTP Status: ${r.httpStatus || 'N/A'}`);
      console.log(`   Issues: ${r.errors.join(', ')}`);
      console.log('');
    });
  }

  // Display broken sources
  if (broken.length > 0) {
    console.log('\n❌ BROKEN SOURCES (' + broken.length + '):\n');
    broken.forEach((r, i) => {
      console.log(`${i + 1}. ${r.source.source_name || '(unnamed)'}`);
      console.log(`   ID: ${r.source.id}`);
      console.log(`   URL: ${r.source.source_url}`);
      console.log(`   Extractor: ${r.source.extractor_type || 'NONE'}`);
      console.log(`   HTTP Status: ${r.httpStatus || 'FAILED'}`);
      console.log(`   Issues: ${r.errors.join(', ')}`);
      console.log(`   Action: ${r.urlAccessible ? 'Needs custom extractor' : 'Disable or fix URL'}`);
      console.log('');
    });
  }

  // Export results to JSON
  console.log('\n📄 Exporting detailed results to validation-results.json...\n');

  const detailedReport = {
    timestamp: new Date().toISOString(),
    summary: {
      total: sources.length,
      working: working.length,
      needsTesting: needsTesting.length,
      needsConfig: needsConfig.length,
      broken: broken.length
    },
    results: results.map(r => ({
      source_id: r.source.id,
      source_name: r.source.source_name,
      source_url: r.source.source_url,
      extractor_type: r.source.extractor_type,
      url_accessible: r.urlAccessible,
      http_status: r.httpStatus,
      response_time_ms: r.responseTime,
      total_booths_found: r.source.total_booths_found,
      last_crawled: r.source.last_crawl_timestamp,
      recommendation: r.recommendation,
      errors: r.errors
    }))
  };

  writeFileSync(
    'validation-results.json',
    JSON.stringify(detailedReport, null, 2)
  );

  console.log('✅ Complete! Results saved to validation-results.json\n');
}

validateAllSources().catch(console.error);
