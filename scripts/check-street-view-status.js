#!/usr/bin/env node

/**
 * Check Street View Validation Status
 *
 * Displays current validation coverage and statistics.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/check-street-view-status.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
  console.log('='.repeat(70));
  console.log('Street View Validation Status');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Get overall statistics
    const { data: stats, error: statsError } = await supabase
      .from('booths')
      .select('latitude, longitude, street_view_available, street_view_validated_at, street_view_distance_meters');

    if (statsError) {
      throw new Error(`Failed to fetch stats: ${statsError.message}`);
    }

    const withCoordinates = stats.filter(b => b.latitude && b.longitude);
    const validated = stats.filter(b => b.street_view_validated_at);
    const available = stats.filter(b => b.street_view_available === true);
    const unavailable = stats.filter(b => b.street_view_available === false);
    const notValidated = withCoordinates.filter(b => !b.street_view_validated_at);

    // Calculate average distance
    const distances = available
      .filter(b => b.street_view_distance_meters)
      .map(b => b.street_view_distance_meters);
    const avgDistance = distances.length > 0
      ? distances.reduce((a, b) => a + b, 0) / distances.length
      : 0;

    // Display statistics
    console.log('Overall Statistics:');
    console.log('-'.repeat(70));
    console.log(`Total Booths:                    ${stats.length}`);
    console.log(`Booths with Coordinates:         ${withCoordinates.length} (${Math.round(withCoordinates.length / stats.length * 100)}%)`);
    console.log('');

    console.log('Validation Coverage:');
    console.log('-'.repeat(70));
    console.log(`Validated:                       ${validated.length} / ${withCoordinates.length} (${Math.round(validated.length / withCoordinates.length * 100)}%)`);
    console.log(`Not Yet Validated:               ${notValidated.length}`);
    console.log('');

    console.log('Validation Results:');
    console.log('-'.repeat(70));
    console.log(`Street View Available:           ${available.length} (${Math.round(available.length / validated.length * 100)}%)`);
    console.log(`Street View Unavailable:         ${unavailable.length} (${Math.round(unavailable.length / validated.length * 100)}%)`);
    console.log('');

    console.log('Quality Metrics:');
    console.log('-'.repeat(70));
    console.log(`Average Distance (available):    ${avgDistance.toFixed(2)}m`);

    // Distance distribution
    const nearbyCount = distances.filter(d => d <= 25).length;
    const mediumCount = distances.filter(d => d > 25 && d <= 50).length;
    const farCount = distances.filter(d => d > 50).length;

    console.log(`  Within 25m (good):             ${nearbyCount} (${Math.round(nearbyCount / distances.length * 100)}%)`);
    console.log(`  26-50m (acceptable):           ${mediumCount} (${Math.round(mediumCount / distances.length * 100)}%)`);
    console.log(`  Over 50m (poor):               ${farCount} (${Math.round(farCount / distances.length * 100)}%)`);
    console.log('');

    // Show recent validations
    const recentValidations = validated
      .sort((a, b) => new Date(b.street_view_validated_at) - new Date(a.street_view_validated_at))
      .slice(0, 5);

    if (recentValidations.length > 0) {
      console.log('Recent Validations:');
      console.log('-'.repeat(70));
      recentValidations.forEach(b => {
        const date = new Date(b.street_view_validated_at).toLocaleString();
        const status = b.street_view_available ? '✓ Available' : '✗ Unavailable';
        const distance = b.street_view_distance_meters ? `(${b.street_view_distance_meters.toFixed(1)}m)` : '';
        console.log(`  ${date} - ${status} ${distance}`);
      });
      console.log('');
    }

    // Show recommendations
    console.log('Recommendations:');
    console.log('-'.repeat(70));

    if (notValidated.length > 0) {
      console.log(`⚠ ${notValidated.length} booths need validation`);
      console.log('  Run: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/validate-street-views.js');
      console.log('');
    }

    if (validated.length > 0) {
      const oldestValidation = validated
        .map(b => new Date(b.street_view_validated_at))
        .sort((a, b) => a - b)[0];
      const daysSince = Math.floor((Date.now() - oldestValidation) / (1000 * 60 * 60 * 24));

      if (daysSince > 90) {
        console.log(`⚠ Oldest validation is ${daysSince} days old (over 90 days)`);
        console.log('  Consider re-validating: RESUME=false node scripts/validate-street-views.js');
        console.log('');
      }
    }

    if (farCount > 0) {
      console.log(`⚠ ${farCount} booths have Street View over 50m away`);
      console.log('  These may need manual review for accuracy');
      console.log('');
    }

    console.log('='.repeat(70));
    console.log('Status check complete!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('Error checking status:', error.message);
    process.exit(1);
  }
}

checkStatus();
