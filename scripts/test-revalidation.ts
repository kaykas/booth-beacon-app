#!/usr/bin/env npx tsx

/**
 * Test On-Demand Revalidation
 *
 * Tests the revalidation API endpoint to ensure it's working correctly
 */

const REVALIDATE_TOKEN = 'xJixL2VA4xH5IgwEKngSOVJDM2ycCaqhrpVoJc7na_Y';
const APP_URL = process.env.APP_URL || 'https://boothbeacon.org';

async function testRevalidation() {
  console.log('🧪 Testing On-Demand Revalidation\n');
  console.log(`App URL: ${APP_URL}`);
  console.log(`Test path: /booth/the-parkside-lounge-new-york\n`);

  // Test 1: Valid token and path
  console.log('Test 1: Valid revalidation request');
  try {
    const url = `${APP_URL}/api/revalidate?token=${REVALIDATE_TOKEN}&path=/booth/the-parkside-lounge-new-york`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      console.log('   ✅ SUCCESS');
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('   ❌ FAILED');
      console.log('   Status:', response.status);
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.log('   ❌ ERROR:', error.message);
  }

  console.log('\n');

  // Test 2: Invalid token
  console.log('Test 2: Invalid token (should fail with 401)');
  try {
    const url = `${APP_URL}/api/revalidate?token=invalid-token&path=/booth/the-parkside-lounge-new-york`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.status === 401) {
      console.log('   ✅ Correctly rejected invalid token');
    } else {
      console.log('   ❌ Should have rejected invalid token');
      console.log('   Status:', response.status);
    }
  } catch (error: any) {
    console.log('   ❌ ERROR:', error.message);
  }

  console.log('\n');

  // Test 3: Missing path
  console.log('Test 3: Missing path (should fail with 400)');
  try {
    const url = `${APP_URL}/api/revalidate?token=${REVALIDATE_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.status === 400) {
      console.log('   ✅ Correctly rejected missing path');
    } else {
      console.log('   ❌ Should have rejected missing path');
      console.log('   Status:', response.status);
    }
  } catch (error: any) {
    console.log('   ❌ ERROR:', error.message);
  }

  console.log('\n✅ Revalidation tests complete\n');
}

testRevalidation().catch(console.error);
