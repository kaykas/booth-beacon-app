#!/usr/bin/env node

/**
 * Comprehensive Geocoding Audit Script
 * Identifies all booths with geocoding problems
 *
 * Categories:
 * 1. Missing address (NULL or empty)
 * 2. No street number (no digits in address)
 * 3. Business name only (address same as name)
 * 4. Incomplete address (length < 10 chars)
 * 5. Missing coordinates (latitude OR longitude NULL)
 * 6. Multiple booths at same coordinates (duplicates)
 * 7. Low confidence geocoding
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Output files
const REPORT_FILE = '/Users/jkw/Projects/booth-beacon-app/geocoding-audit-report.json';
const CSV_FILE = '/Users/jkw/Projects/booth-beacon-app/affected-booths.csv';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  console.error('Load it from .env.local: export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)');
  process.exit(1);
}

/**
 * Make HTTP request to Supabase REST API
 */
function makeRequest(pathname, params = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathname, SUPABASE_URL);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Fetch all booths with relevant columns
 */
async function fetchAllBooths() {
  console.log('Fetching all booths from database...');

  const columns = 'id,name,address,city,country,latitude,longitude,geocode_confidence,geocode_provider,created_at';

  try {
    const data = await makeRequest('/rest/v1/booths', {
      select: columns,
      limit: 10000
    });

    console.log(`Retrieved ${data.length} booths`);
    return data;
  } catch (error) {
    console.error('Error fetching booths:', error.message);
    throw error;
  }
}

/**
 * Analyze booth for geocoding problems
 */
function analyzeBoothProblems(booth) {
  const problems = [];

  // 1. Missing address
  if (!booth.address || booth.address.trim() === '') {
    problems.push({
      category: 'MISSING_ADDRESS',
      severity: 'CRITICAL',
      description: 'Address is NULL or empty'
    });
  }

  // 2. No street number
  if (booth.address && !/\d/.test(booth.address)) {
    problems.push({
      category: 'NO_STREET_NUMBER',
      severity: 'HIGH',
      description: 'Address contains no digits (likely incomplete)'
    });
  }

  // 3. Business name only
  if (booth.address && booth.name && booth.address.trim().toLowerCase() === booth.name.trim().toLowerCase()) {
    problems.push({
      category: 'NAME_ONLY',
      severity: 'HIGH',
      description: 'Address is the same as business name'
    });
  }

  // 4. Incomplete address (too short)
  if (booth.address && booth.address.trim().length < 10) {
    problems.push({
      category: 'TOO_SHORT',
      severity: 'MEDIUM',
      description: `Address too short (${booth.address.trim().length} chars)`
    });
  }

  // 5. Missing coordinates
  if (!booth.latitude || !booth.longitude) {
    problems.push({
      category: 'MISSING_COORDINATES',
      severity: 'CRITICAL',
      description: `Latitude: ${booth.latitude ? 'OK' : 'NULL'}, Longitude: ${booth.longitude ? 'OK' : 'NULL'}`
    });
  }

  // 6. Low confidence geocoding
  if (booth.geocode_confidence === 'low') {
    problems.push({
      category: 'LOW_CONFIDENCE',
      severity: 'MEDIUM',
      description: 'Geocoding confidence is low'
    });
  }

  return problems;
}

/**
 * Find duplicate coordinates
 */
function findDuplicateCoordinates(booths) {
  const coordMap = {};
  const duplicates = {};

  booths.forEach(booth => {
    if (booth.latitude && booth.longitude) {
      const key = `${booth.latitude},${booth.longitude}`;

      if (!coordMap[key]) {
        coordMap[key] = [];
      }
      coordMap[key].push(booth);
    }
  });

  // Find entries with multiple booths at same location
  Object.entries(coordMap).forEach(([coords, boothList]) => {
    if (boothList.length > 1) {
      duplicates[coords] = boothList;
    }
  });

  return duplicates;
}

/**
 * Classify severity based on problems
 */
function classifySeverity(problems) {
  if (problems.some(p => p.severity === 'CRITICAL')) return 'CRITICAL';
  if (problems.some(p => p.severity === 'HIGH')) return 'HIGH';
  if (problems.some(p => p.severity === 'MEDIUM')) return 'MEDIUM';
  return 'LOW';
}

/**
 * Generate audit report
 */
async function generateAuditReport() {
  console.log('\n' + '='.repeat(80));
  console.log('BOOTH BEACON GEOCODING AUDIT');
  console.log('='.repeat(80) + '\n');

  try {
    // Fetch all booths
    const allBooths = await fetchAllBooths();
    const totalBooths = allBooths.length;

    // Analyze each booth
    const boothsWithProblems = [];
    const problemsByCategory = {};
    const affectedBoothIds = new Set();

    allBooths.forEach(booth => {
      const problems = analyzeBoothProblems(booth);

      if (problems.length > 0) {
        boothsWithProblems.push({
          id: booth.id,
          name: booth.name,
          address: booth.address || '[NO ADDRESS]',
          city: booth.city,
          country: booth.country,
          latitude: booth.latitude,
          longitude: booth.longitude,
          geocode_confidence: booth.geocode_confidence,
          geocode_provider: booth.geocode_provider,
          problems: problems,
          severity: classifySeverity(problems),
          created_at: booth.created_at
        });

        affectedBoothIds.add(booth.id);
      }

      // Count by category
      problems.forEach(problem => {
        if (!problemsByCategory[problem.category]) {
          problemsByCategory[problem.category] = 0;
        }
        problemsByCategory[problem.category]++;
      });
    });

    // Find duplicate coordinates
    const duplicateCoordinates = findDuplicateCoordinates(allBooths);
    let duplicateBoothCount = 0;
    const duplicateIssues = [];

    Object.entries(duplicateCoordinates).forEach(([coords, boothList]) => {
      duplicateBoothCount += boothList.length;

      boothList.forEach(booth => {
        if (!affectedBoothIds.has(booth.id)) {
          affectedBoothIds.add(booth.id);
          boothsWithProblems.push({
            id: booth.id,
            name: booth.name,
            address: booth.address || '[NO ADDRESS]',
            city: booth.city,
            country: booth.country,
            latitude: booth.latitude,
            longitude: booth.longitude,
            geocode_confidence: booth.geocode_confidence,
            geocode_provider: booth.geocode_provider,
            problems: [{
              category: 'DUPLICATE_COORDINATES',
              severity: 'MEDIUM',
              description: `Shares coordinates with ${boothList.length - 1} other booth(s): ${coords}`
            }],
            severity: 'MEDIUM',
            created_at: booth.created_at
          });
        }
      });

      duplicateIssues.push({
        coordinates: coords,
        boothCount: boothList.length,
        booths: boothList.map(b => ({
          id: b.id,
          name: b.name,
          address: b.address
        }))
      });
    });

    // Sort by severity
    const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    boothsWithProblems.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.created_at.localeCompare(b.created_at);
    });

    // Get top 20 critical cases
    const criticalCases = boothsWithProblems
      .filter(b => b.severity === 'CRITICAL')
      .slice(0, 20);

    const highCases = boothsWithProblems
      .filter(b => b.severity === 'HIGH')
      .slice(0, 20);

    // Build summary stats
    const stats = {
      total_booths: totalBooths,
      booths_with_problems: boothsWithProblems.length,
      percentage_affected: ((boothsWithProblems.length / totalBooths) * 100).toFixed(2),
      critical_count: boothsWithProblems.filter(b => b.severity === 'CRITICAL').length,
      high_count: boothsWithProblems.filter(b => b.severity === 'HIGH').length,
      medium_count: boothsWithProblems.filter(b => b.severity === 'MEDIUM').length,
      low_count: boothsWithProblems.filter(b => b.severity === 'LOW').length,
      by_category: problemsByCategory,
      duplicate_coordinate_sets: Object.keys(duplicateCoordinates).length,
      booths_at_duplicate_coordinates: duplicateBoothCount
    };

    // Print summary to console
    console.log('SUMMARY STATISTICS');
    console.log('-'.repeat(80));
    console.log(`Total Booths: ${stats.total_booths}`);
    console.log(`Booths with Problems: ${stats.booths_with_problems} (${stats.percentage_affected}%)`);
    console.log('');
    console.log('By Severity:');
    console.log(`  CRITICAL: ${stats.critical_count}`);
    console.log(`  HIGH:     ${stats.high_count}`);
    console.log(`  MEDIUM:   ${stats.medium_count}`);
    console.log(`  LOW:      ${stats.low_count}`);
    console.log('');
    console.log('By Category:');
    Object.entries(problemsByCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });
    console.log('');
    console.log(`Duplicate Coordinate Sets: ${stats.duplicate_coordinate_sets}`);
    console.log(`Booths at Duplicate Coordinates: ${stats.booths_at_duplicate_coordinates}`);
    console.log('');

    // Print top critical cases
    console.log('TOP 20 CRITICAL CASES');
    console.log('-'.repeat(80));
    if (criticalCases.length === 0) {
      console.log('No critical cases found!');
    } else {
      criticalCases.slice(0, 20).forEach((booth, idx) => {
        console.log(`\n${idx + 1}. ${booth.name}`);
        console.log(`   ID: ${booth.id}`);
        console.log(`   Address: ${booth.address}`);
        console.log(`   Location: ${booth.city}, ${booth.country}`);
        console.log(`   Coords: ${booth.latitude}, ${booth.longitude}`);
        console.log(`   Issues: ${booth.problems.map(p => p.category).join(', ')}`);
      });
    }

    console.log('');
    console.log('TOP HIGH PRIORITY CASES (sample)');
    console.log('-'.repeat(80));
    if (highCases.length === 0) {
      console.log('No high priority cases found!');
    } else {
      highCases.slice(0, 10).forEach((booth, idx) => {
        console.log(`\n${idx + 1}. ${booth.name}`);
        console.log(`   Address: ${booth.address}`);
        console.log(`   Issues: ${booth.problems.map(p => p.category).join(', ')}`);
      });
    }

    // Write JSON report
    const reportData = {
      generated_at: new Date().toISOString(),
      stats: stats,
      critical_cases: criticalCases,
      high_cases: highCases,
      duplicate_coordinates: duplicateIssues,
      all_affected_booths: boothsWithProblems,
      affected_booth_ids: Array.from(affectedBoothIds)
    };

    fs.writeFileSync(REPORT_FILE, JSON.stringify(reportData, null, 2));
    console.log(`\n\nJSON Report saved to: ${REPORT_FILE}`);

    // Write CSV export
    const csvHeader = 'booth_id,booth_name,address,city,country,latitude,longitude,geocode_confidence,geocode_provider,severity,problem_categories\n';
    const csvRows = boothsWithProblems.map(booth => {
      const problemCats = booth.problems.map(p => p.category).join('; ');
      return [
        `"${booth.id}"`,
        `"${booth.name.replace(/"/g, '""')}"`,
        `"${booth.address.replace(/"/g, '""')}"`,
        `"${booth.city}"`,
        `"${booth.country}"`,
        booth.latitude || '',
        booth.longitude || '',
        `"${booth.geocode_confidence || 'unknown'}"`,
        `"${booth.geocode_provider || 'unknown'}"`,
        `"${booth.severity}"`,
        `"${problemCats}"`
      ].join(',');
    }).join('\n');

    fs.writeFileSync(CSV_FILE, csvHeader + csvRows);
    console.log(`CSV Export saved to: ${CSV_FILE}`);

    console.log('\n' + '='.repeat(80));
    console.log('AUDIT COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nNext steps:`);
    console.log(`1. Review the JSON report for detailed analysis`);
    console.log(`2. Use the CSV file to re-geocode affected booths`);
    console.log(`3. Focus on CRITICAL severity cases first`);
    console.log(`4. Consider bulk re-geocoding for incomplete addresses`);

  } catch (error) {
    console.error('\nAudit failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the audit
generateAuditReport();
