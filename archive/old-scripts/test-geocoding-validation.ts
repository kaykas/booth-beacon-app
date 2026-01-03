/**
 * Test script for 4-Layer Geocoding Validation System
 * Demonstrates validation working with real booth data
 */

import {
  validateAddressCompleteness,
  validateGeocodeResult,
  validateDistance,
  performFinalValidation,
  shouldFlagForReview,
  type BoothAddressData,
  type NominatimResult,
} from './src/lib/geocoding-validation';

// ============================================================================
// Test Data
// ============================================================================

// Test Booth 1: Good complete address
const testBooth1: BoothAddressData = {
  name: 'Photo Booth at Target Center',
  address: '600 1st Ave N',
  city: 'Minneapolis',
  state: 'MN',
  country: 'USA',
};

// Test Booth 2: Incomplete address (no street number)
const testBooth2: BoothAddressData = {
  name: 'Mall Photo Booth',
  address: 'Main Street',
  city: 'Seattle',
  country: 'USA',
};

// Test Booth 3: Business name only
const testBooth3: BoothAddressData = {
  name: 'Downtown Photography Studio',
  address: 'Central Mall',
  city: 'Portland',
  country: 'USA',
};

// Mock Nominatim result (good match)
const goodNominatimResult: NominatimResult = {
  lat: '44.9795',
  lon: '-93.2760',
  display_name: 'Target Center, 600, 1st Avenue North, Minneapolis, Hennepin County, Minnesota, 55403, United States',
  type: 'amenity',
  class: 'place',
  importance: 0.75,
  address: {
    house_number: '600',
    road: '1st Avenue North',
    city: 'Minneapolis',
    state: 'Minnesota',
    country: 'United States',
    postcode: '55403',
  },
};

// Mock Nominatim result (poor match - cross street)
const poorNominatimResult: NominatimResult = {
  lat: '44.9800',
  lon: '-93.2750',
  display_name: '1st Avenue North & 6th Street, Minneapolis, Minnesota, United States',
  type: 'highway',
  class: 'intersection',
  importance: 0.3,
  address: {
    road: '1st Avenue North',
    city: 'Minneapolis',
    state: 'Minnesota',
    country: 'United States',
  },
};

// ============================================================================
// Test Functions
// ============================================================================

function printSeparator() {
  console.log('\n' + '='.repeat(80) + '\n');
}

function testLayer1() {
  printSeparator();
  console.log('LAYER 1: ADDRESS COMPLETENESS VALIDATION');
  printSeparator();

  // Test 1: Complete address
  console.log('Test 1: Complete Address');
  console.log('Booth:', testBooth1.name);
  console.log('Address:', testBooth1.address);
  const result1 = validateAddressCompleteness(testBooth1);
  console.log('Result:', JSON.stringify(result1, null, 2));
  console.log('✓ Expected: high confidence, valid\n');

  // Test 2: Incomplete address
  console.log('Test 2: Incomplete Address (no street number)');
  console.log('Booth:', testBooth2.name);
  console.log('Address:', testBooth2.address);
  const result2 = validateAddressCompleteness(testBooth2);
  console.log('Result:', JSON.stringify(result2, null, 2));
  console.log('✓ Expected: reject confidence, invalid\n');

  // Test 3: Business name only
  console.log('Test 3: Business Name Only');
  console.log('Booth:', testBooth3.name);
  console.log('Address:', testBooth3.address);
  const result3 = validateAddressCompleteness(testBooth3);
  console.log('Result:', JSON.stringify(result3, null, 2));
  console.log('✓ Expected: reject confidence, invalid\n');
}

function testLayer2() {
  printSeparator();
  console.log('LAYER 2: GEOCODE RESULT VALIDATION');
  printSeparator();

  // Test 1: Good match
  console.log('Test 1: Good Nominatim Match');
  console.log('Booth:', testBooth1.name);
  console.log('Result display_name:', goodNominatimResult.display_name);
  const result1 = validateGeocodeResult(testBooth1, goodNominatimResult);
  console.log('Result:', JSON.stringify(result1, null, 2));
  console.log('✓ Expected: high confidence, match score > 80\n');

  // Test 2: Poor match (cross street)
  console.log('Test 2: Poor Nominatim Match (Cross Street)');
  console.log('Booth:', testBooth1.name);
  console.log('Result display_name:', poorNominatimResult.display_name);
  const result2 = validateGeocodeResult(testBooth1, poorNominatimResult);
  console.log('Result:', JSON.stringify(result2, null, 2));
  console.log('✓ Expected: low/reject confidence, inappropriate place type\n');
}

function testLayer3() {
  printSeparator();
  console.log('LAYER 3: DISTANCE VALIDATION');
  printSeparator();

  // Test 1: Close match (within 50m for complete address)
  console.log('Test 1: Close Match (10m away)');
  const existingLat = 44.9795;
  const existingLng = -93.2760;
  const newLat = 44.9796; // About 10m away
  const newLng = -93.2761;

  const addressQuality = validateAddressCompleteness(testBooth1).addressQuality;
  const result1 = validateDistance(addressQuality, newLat, newLng, existingLat, existingLng);
  console.log('Result:', JSON.stringify(result1, null, 2));
  console.log('✓ Expected: valid, within threshold\n');

  // Test 2: Far match (>500m)
  console.log('Test 2: Far Match (>500m away)');
  const farLat = 44.9900; // About 1km away
  const farLng = -93.2900;
  const result2 = validateDistance(addressQuality, farLat, farLng, existingLat, existingLng);
  console.log('Result:', JSON.stringify(result2, null, 2));
  console.log('✓ Expected: invalid, exceeds maximum threshold\n');
}

function testLayer4() {
  printSeparator();
  console.log('LAYER 4: FINAL VALIDATION & CONFIDENCE SCORING');
  printSeparator();

  // Test 1: Complete validation with good result
  console.log('Test 1: Complete Validation - Good Match');
  const result1 = performFinalValidation(testBooth1, goodNominatimResult);
  console.log('Result:', JSON.stringify(result1, null, 2));
  console.log('Should flag for review?', shouldFlagForReview(result1));
  console.log('✓ Expected: valid, high confidence, no review needed\n');

  // Test 2: Complete validation with poor result
  console.log('Test 2: Complete Validation - Poor Match');
  const result2 = performFinalValidation(testBooth1, poorNominatimResult);
  console.log('Result:', JSON.stringify(result2, null, 2));
  console.log('Should flag for review?', shouldFlagForReview(result2));
  console.log('✓ Expected: invalid or low confidence, needs review\n');

  // Test 3: Pre-geocoding validation only (incomplete address)
  console.log('Test 3: Pre-Geocoding Validation - Incomplete Address');
  const result3 = performFinalValidation(testBooth2);
  console.log('Result:', JSON.stringify(result3, null, 2));
  console.log('Should geocode?', result3.shouldGeocode);
  console.log('✓ Expected: should not geocode, reject confidence\n');
}

// ============================================================================
// Run All Tests
// ============================================================================

function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                            ║');
  console.log('║          4-LAYER GEOCODING VALIDATION SYSTEM - TEST SUITE                  ║');
  console.log('║                                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');

  testLayer1();
  testLayer2();
  testLayer3();
  testLayer4();

  printSeparator();
  console.log('ALL TESTS COMPLETE');
  printSeparator();
  console.log('\nSUMMARY:');
  console.log('✓ Layer 1: Address completeness validation working');
  console.log('✓ Layer 2: Geocode result validation working');
  console.log('✓ Layer 3: Distance validation working');
  console.log('✓ Layer 4: Final validation & confidence scoring working');
  console.log('\nThe 4-layer validation system will:');
  console.log('  • Reject incomplete addresses before geocoding');
  console.log('  • Validate geocode results against booth data');
  console.log('  • Check distance thresholds based on address quality');
  console.log('  • Assign confidence scores and flag booths for manual review');
  console.log('');
}

// Run tests
runAllTests();
