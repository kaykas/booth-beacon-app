#!/usr/bin/env npx tsx

/**
 * Geocoding Verification Script
 *
 * Audits the batch geocoding results to verify that:
 * 1. Changes were actually improvements (closer to correct location)
 * 2. No systematic errors (multiple booths to same wrong location)
 * 3. Specifically checks critical booths like Heebe Jeebe
 * 4. Identifies data quality issues
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface GeocodeUpdate {
  boothId: string;
  boothName: string;
  oldLatitude?: number;
  oldLongitude?: number;
  newLatitude: number;
  newLongitude: number;
  confidence: 'high' | 'medium' | 'low';
  provider: string;
  addressWasIncomplete: boolean;
  status: 'success' | 'failed' | 'low_confidence';
  error?: string;
}

interface GeocodeReport {
  timestamp: string;
  summary: {
    total: number;
    successful: number;
    lowConfidence: number;
    failed: number;
    successRate: string;
  };
  updates: GeocodeUpdate[];
}

interface VerificationIssue {
  type: 'duplicate_coordinates' | 'suspicious_location' | 'data_quality' | 'no_improvement';
  boothId: string;
  boothName: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: Record<string, unknown>;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function run() {
  console.log('='.repeat(100));
  console.log('GEOCODING VERIFICATION AUDIT');
  console.log('Analyzing batch geocoding results for data quality and accuracy');
  console.log('='.repeat(100));
  console.log('');

  // Read the geocoding report
  const reportPath = '/Users/jkw/Projects/booth-beacon-app/scripts/geocoding-report-2025-12-09.json';
  const reportContent = await fs.readFile(reportPath, 'utf-8');
  const report: GeocodeReport = JSON.parse(reportContent);

  console.log('📊 Report Summary:');
  console.log(`   Total Processed: ${report.summary.total}`);
  console.log(`   Successful: ${report.summary.successful}`);
  console.log(`   Low Confidence: ${report.summary.lowConfidence}`);
  console.log(`   Failed: ${report.summary.failed}`);
  console.log('');

  const issues: VerificationIssue[] = [];
  const coordinateClusters = new Map<string, string[]>();

  // Analyze updates
  const successfulUpdates = report.updates.filter(u => u.status === 'success' || u.status === 'low_confidence');

  console.log(`🔍 Analyzing ${successfulUpdates.length} updated booths...\n`);

  // 1. Check for duplicate coordinates (multiple booths at exact same location)
  for (const update of successfulUpdates) {
    const coordKey = `${update.newLatitude.toFixed(6)},${update.newLongitude.toFixed(6)}`;
    if (!coordinateClusters.has(coordKey)) {
      coordinateClusters.set(coordKey, []);
    }
    coordinateClusters.get(coordKey)!.push(update.boothName);
  }

  // Find suspicious coordinate clusters
  const suspiciousClusters = Array.from(coordinateClusters.entries())
    .filter(([_, booths]) => booths.length >= 3)
    .sort((a, b) => b[1].length - a[1].length);

  if (suspiciousClusters.length > 0) {
    console.log('🚨 CRITICAL: Found coordinate clusters (multiple booths at exact same location):');
    console.log('');
    for (const [coords, booths] of suspiciousClusters) {
      const [_lat, _lng] = coords.split(',').map(Number);
      console.log(`   📍 ${coords} (${booths.length} booths):`);
      for (const booth of booths) {
        console.log(`      • ${booth}`);
        issues.push({
          type: 'duplicate_coordinates',
          boothId: 'unknown', // We'll look this up later
          boothName: booth,
          description: `Multiple booths geocoded to exact same location: ${coords}`,
          severity: 'critical',
          details: { coordinates: coords, clusterSize: booths.length }
        });
      }
      console.log('');
    }
  }

  // 2. Check if updates were improvements
  console.log('📐 Analyzing coordinate changes...\n');

  let improved = 0;
  let unchanged = 0;
  const _degraded = 0;
  let newCoordinates = 0;

  for (const update of successfulUpdates) {
    if (!update.oldLatitude || !update.oldLongitude) {
      newCoordinates++;
      continue;
    }

    // If coordinates changed by more than 10 km, flag as suspicious
    const distance = calculateDistance(
      update.oldLatitude,
      update.oldLongitude,
      update.newLatitude,
      update.newLongitude
    );

    if (distance > 10) {
      console.log(`   ⚠️  Large change for "${update.boothName}": ${distance.toFixed(1)} km`);
      console.log(`      Old: ${update.oldLatitude.toFixed(6)}, ${update.oldLongitude.toFixed(6)}`);
      console.log(`      New: ${update.newLatitude.toFixed(6)}, ${update.newLongitude.toFixed(6)}`);
      console.log('');

      issues.push({
        type: 'suspicious_location',
        boothId: update.boothId,
        boothName: update.boothName,
        description: `Coordinates moved ${distance.toFixed(1)} km`,
        severity: distance > 100 ? 'critical' : 'high',
        details: {
          oldCoords: [update.oldLatitude, update.oldLongitude],
          newCoords: [update.newLatitude, update.newLongitude],
          distanceKm: distance
        }
      });
    } else if (distance > 0.1) {
      improved++;
    } else {
      unchanged++;
    }
  }

  console.log('📊 Coordinate Change Analysis:');
  console.log(`   ✅ New coordinates added: ${newCoordinates}`);
  console.log(`   🔄 Improved (moved): ${improved}`);
  console.log(`   ⊘ Unchanged: ${unchanged}`);
  console.log(`   ⚠️  Large changes (>10km): ${issues.filter(i => i.type === 'suspicious_location').length}`);
  console.log('');

  // 3. Check for data quality issues in the database
  console.log('🔍 Checking database for data quality issues...\n');

  // Fetch all booths that were updated
  const updateIds = successfulUpdates.map(u => u.boothId);
  const { data: currentBooths, error } = await supabase
    .from('booths')
    .select('id, name, address, city, state, country, latitude, longitude')
    .in('id', updateIds);

  if (error) {
    console.error('Error fetching current booth data:', error);
    process.exit(1);
  }

  // Check for country data quality issues
  const countryIssues = currentBooths?.filter(booth => {
    // Check for international cities that have country="United States"
    const city = booth.city?.toLowerCase() || '';
    const country = booth.country?.toLowerCase() || '';

    // Known international cities
    const internationalCities = [
      'toronto', 'montreal', 'vancouver', 'calgary', // Canada
      'berlin', 'munich', 'hamburg', 'cologne', // Germany
      'vienna', 'salzburg', // Austria
      'london', 'manchester', 'glasgow', // UK
      'paris', 'lyon', 'marseille', // France
      'rome', 'milan', 'florence', // Italy
      'riga', 'madrid', 'barcelona', // Latvia, Spain
    ];

    return internationalCities.some(ic => city.includes(ic)) && country.includes('united states');
  });

  if (countryIssues && countryIssues.length > 0) {
    console.log('🚨 CRITICAL: Found data quality issues (wrong country data):');
    console.log('');
    for (const booth of countryIssues) {
      console.log(`   • ${booth.name}`);
      console.log(`     City: ${booth.city}`);
      console.log(`     Country in DB: ${booth.country} ❌`);
      console.log('');

      issues.push({
        type: 'data_quality',
        boothId: booth.id,
        boothName: booth.name,
        description: `International city "${booth.city}" has country="${booth.country}"`,
        severity: 'critical',
        details: { city: booth.city, country: booth.country }
      });
    }
  }

  // 4. Specifically check Heebe Jeebe booth
  console.log('🎯 Checking critical booth: Heebe Jeebe General Store...\n');

  const { data: heebeJeebe, error: hjError } = await supabase
    .from('booths')
    .select('id, name, slug, address, city, state, latitude, longitude')
    .ilike('name', '%heebe%jeebe%')
    .single();

  if (hjError) {
    console.log('   ⚠️  Could not find Heebe Jeebe booth in database');
  } else if (heebeJeebe) {
    console.log(`   Found: ${heebeJeebe.name}`);
    console.log(`   Slug: ${heebeJeebe.slug}`);
    console.log(`   Address: ${heebeJeebe.address}, ${heebeJeebe.city}, ${heebeJeebe.state}`);
    console.log(`   Current Coordinates: ${heebeJeebe.latitude}, ${heebeJeebe.longitude}`);

    // Check if this booth was updated in the report
    const hjUpdate = report.updates.find(u => u.boothId === heebeJeebe.id);
    if (hjUpdate) {
      console.log(`   ✅ Was updated in batch geocoding`);
      console.log(`   Old Coordinates: ${hjUpdate.oldLatitude}, ${hjUpdate.oldLongitude}`);
      console.log(`   New Coordinates: ${hjUpdate.newLatitude}, ${hjUpdate.newLongitude}`);
      console.log(`   Provider: ${hjUpdate.provider}`);
      console.log(`   Confidence: ${hjUpdate.confidence}`);

      // Expected location: 46 Kentucky St, Petaluma, CA
      // Approximate coordinates: 38.2333537, -122.6408153
      const expectedLat = 38.2333537;
      const expectedLng = -122.6408153;

      const distanceFromExpected = calculateDistance(
        heebeJeebe.latitude,
        heebeJeebe.longitude,
        expectedLat,
        expectedLng
      );

      console.log(`   Distance from expected location: ${(distanceFromExpected * 1000).toFixed(0)} meters`);

      if (distanceFromExpected > 1) {
        console.log('   🚨 CRITICAL: Still not at correct location!');
        issues.push({
          type: 'no_improvement',
          boothId: heebeJeebe.id,
          boothName: heebeJeebe.name,
          description: `Still ${(distanceFromExpected * 1000).toFixed(0)}m away from correct location`,
          severity: 'critical',
          details: {
            currentCoords: [heebeJeebe.latitude, heebeJeebe.longitude],
            expectedCoords: [expectedLat, expectedLng],
            distanceMeters: distanceFromExpected * 1000
          }
        });
      } else {
        console.log('   ✅ Coordinates appear correct!');
      }
    } else {
      console.log('   ⚠️  Was NOT updated in batch geocoding (may have been skipped)');
    }
  }
  console.log('');

  // Generate summary report
  console.log('='.repeat(100));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(100));
  console.log('');

  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const highIssues = issues.filter(i => i.severity === 'high');

  console.log(`🚨 Critical Issues: ${criticalIssues.length}`);
  console.log(`⚠️  High Priority Issues: ${highIssues.length}`);
  console.log(`📊 Total Issues Found: ${issues.length}`);
  console.log('');

  if (criticalIssues.length > 0) {
    console.log('⚠️  CRITICAL ISSUES REQUIRE IMMEDIATE ATTENTION:');
    console.log('');
    console.log('   1. Coordinate Clusters: Multiple booths geocoded to same location');
    console.log('   2. Data Quality: Wrong country fields causing geocoding to wrong continents');
    console.log('   3. Verification Needed: Cannot confirm improvements without manual review');
    console.log('');
  }

  console.log('💡 RECOMMENDATIONS:');
  console.log('');
  console.log('   1. DO NOT TRUST BATCH RESULTS WITHOUT MANUAL VERIFICATION');
  console.log('   2. Fix country data for international booths before re-geocoding');
  console.log('   3. Manually review all coordinate clusters');
  console.log('   4. Consider reverting coordinates that moved >100km');
  console.log('   5. Implement better validation before updating database');
  console.log('');

  // Save detailed verification report
  const verificationReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues: issues.length,
      criticalIssues: criticalIssues.length,
      highIssues: highIssues.length,
      coordinateClusters: suspiciousClusters.length,
      dataQualityIssues: issues.filter(i => i.type === 'data_quality').length,
    },
    issues,
    suspiciousClusters: suspiciousClusters.map(([coords, booths]) => ({
      coordinates: coords,
      boothCount: booths.length,
      booths,
    })),
  };

  const verificationPath = '/Users/jkw/Projects/booth-beacon-app/scripts/geocoding-verification-report.json';
  await fs.writeFile(verificationPath, JSON.stringify(verificationReport, null, 2));

  console.log(`📄 Detailed verification report saved: ${verificationPath}`);
  console.log('');
  console.log('='.repeat(100));
}

run().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
