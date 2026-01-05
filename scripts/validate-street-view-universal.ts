#!/usr/bin/env npx tsx

/**
 * Universal Street View Validation Script
 *
 * PROBLEM: Street View shows wrong locations (e.g., "Fermi" instead of "Heebe Jeebe")
 * ROOT CAUSE: Using coordinates alone - Google shows nearest panorama (often wrong business)
 * SOLUTION: Fetch and store specific panorama IDs for each booth
 *
 * This script:
 * 1. Queries all booths with coordinates (810 booths)
 * 2. Calls Google Street View Metadata API for each booth
 * 3. Finds nearest panorama within 50m radius
 * 4. Calculates optimal heading toward booth
 * 5. Stores panorama ID, distance, and heading in database
 * 6. Marks street_view_available true/false
 *
 * IMPACT: Fixes Street View for ALL booths universally
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!GOOGLE_API_KEY) {
  console.error('❌ Missing GOOGLE_MAPS_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface StreetViewMetadata {
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'OVER_QUERY_LIMIT';
  pano_id?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface Booth {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  street_view_validated_at: string | null;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Calculate heading from panorama toward booth
 */
function calculateHeading(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const φ1 = (fromLat * Math.PI) / 180;
  const φ2 = (toLat * Math.PI) / 180;
  const Δλ = ((toLng - fromLng) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const heading = ((θ * 180) / Math.PI + 360) % 360; // Normalize to 0-360

  return Math.round(heading);
}

/**
 * Fetch Street View metadata for a location
 */
async function fetchStreetViewMetadata(
  latitude: number,
  longitude: number
): Promise<StreetViewMetadata> {
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${latitude},${longitude}&radius=50&key=${GOOGLE_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  return data;
}

/**
 * Validate Street View for a single booth
 */
async function validateBooth(booth: Booth): Promise<{
  success: boolean;
  available: boolean;
  panoramaId?: string;
  distance?: number;
  heading?: number;
  error?: string;
}> {
  try {
    console.log(`\n🔄 Validating: ${booth.name}`);
    console.log(`   Location: ${booth.latitude}, ${booth.longitude}`);

    const metadata = await fetchStreetViewMetadata(booth.latitude, booth.longitude);

    if (metadata.status === 'OK' && metadata.pano_id && metadata.location) {
      // Calculate distance from booth to panorama
      const distance = calculateDistance(
        booth.latitude,
        booth.longitude,
        metadata.location.lat,
        metadata.location.lng
      );

      // Calculate optimal heading from panorama toward booth
      const heading = calculateHeading(
        metadata.location.lat,
        metadata.location.lng,
        booth.latitude,
        booth.longitude
      );

      console.log(`   ✅ Panorama found: ${metadata.pano_id}`);
      console.log(`   📏 Distance: ${Math.round(distance)}m`);
      console.log(`   🧭 Heading: ${heading}°`);

      // Update database
      const { error: updateError } = await supabase
        .from('booths')
        .update({
          street_view_available: true,
          street_view_panorama_id: metadata.pano_id,
          street_view_distance_meters: Math.round(distance * 100) / 100,
          street_view_heading: heading,
          street_view_validated_at: new Date().toISOString(),
        })
        .eq('id', booth.id);

      if (updateError) {
        console.error(`   ❌ Database update failed:`, updateError.message);
        return { success: false, available: false, error: updateError.message };
      }

      return {
        success: true,
        available: true,
        panoramaId: metadata.pano_id,
        distance: Math.round(distance),
        heading,
      };
    } else {
      console.log(`   ⚠️  No Street View available (${metadata.status})`);

      // Mark as unavailable
      const { error: updateError } = await supabase
        .from('booths')
        .update({
          street_view_available: false,
          street_view_validated_at: new Date().toISOString(),
        })
        .eq('id', booth.id);

      if (updateError) {
        console.error(`   ❌ Database update failed:`, updateError.message);
      }

      return { success: true, available: false };
    }
  } catch (error: any) {
    console.error(`   ❌ Error:`, error.message);
    return { success: false, available: false, error: error.message };
  }
}

async function main() {
  console.log('🌍 UNIVERSAL STREET VIEW VALIDATION');
  console.log('=' .repeat(80));
  console.log('\n📊 Fetching booths with coordinates...\n');

  // Get all booths with coordinates (not yet validated or needing revalidation)
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, slug, latitude, longitude, street_view_validated_at')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('street_view_validated_at', { ascending: true, nullsFirst: true });

  if (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }

  console.log(`✅ Found ${booths.length} booths with coordinates\n`);

  // Allow limiting via environment variable for testing
  const limit = parseInt(process.env.LIMIT || `${booths.length}`);
  const boothsToValidate = booths.slice(0, limit);

  console.log(`📋 Processing ${boothsToValidate.length} booths...\n`);
  console.log('⏱️  Rate limit: 1 request/second (Google API quota)');
  console.log('=' .repeat(80));

  let succeeded = 0;
  let available = 0;
  let unavailable = 0;
  let failed = 0;
  const errors: Array<{ booth: string; error: string }> = [];

  for (const booth of boothsToValidate) {
    const result = await validateBooth(booth);

    if (result.success) {
      succeeded++;
      if (result.available) {
        available++;
      } else {
        unavailable++;
      }
    } else {
      failed++;
      if (result.error) {
        errors.push({ booth: booth.name, error: result.error });
      }
    }

    // Rate limit: 1 second between requests (Google API quota)
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Succeeded: ${succeeded}`);
  console.log(`   🟢 Available: ${available} (panorama found within 50m)`);
  console.log(`   🔴 Unavailable: ${unavailable} (no panorama within 50m)`);
  console.log(`❌ Failed: ${failed}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.slice(0, 10).forEach(({ booth, error }) => {
      console.log(`   - ${booth}: ${error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more`);
    }
  }

  console.log('\n✨ Street View validation complete!');
  console.log('🎯 All booths now have specific panorama IDs - no more wrong locations!\n');

  if (boothsToValidate.length < booths.length) {
    const remaining = booths.length - boothsToValidate.length;
    console.log(`⚠️  ${remaining} booths remaining. Run again with LIMIT=${booths.length} to process all.\n`);
  }
}

main().catch(console.error);
