#!/usr/bin/env npx tsx

/**
 * Geocoding Audit Script
 *
 * Identifies booths with potentially incorrect coordinates by checking:
 * 1. Coordinates in wrong country
 * 2. Coordinates far from city center
 * 3. Multiple booths at exact same coordinates
 * 4. Missing coordinates
 * 5. Suspicious coordinate patterns
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

interface Booth {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  geocoded_at?: string;
}

interface AuditIssue {
  booth_id: string;
  booth_name: string;
  slug: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  issue_type: string;
  severity: 'high' | 'medium' | 'low';
  details: string;
  google_maps_url: string;
}

// Country bounding boxes (rough approximations)
const COUNTRY_BOUNDS: Record<string, { minLat: number; maxLat: number; minLon: number; maxLon: number }> = {
  'USA': { minLat: 24, maxLat: 50, minLon: -125, maxLon: -66 },
  'United States': { minLat: 24, maxLat: 50, minLon: -125, maxLon: -66 },
  'Canada': { minLat: 42, maxLat: 72, minLon: -141, maxLon: -52 },
  'UK': { minLat: 49, maxLat: 61, minLon: -8, maxLon: 2 },
  'United Kingdom': { minLat: 49, maxLat: 61, minLon: -8, maxLon: 2 },
  'Germany': { minLat: 47, maxLat: 55, minLon: 6, maxLon: 15 },
  'France': { minLat: 42, maxLat: 51, minLon: -5, maxLon: 10 },
  'Australia': { minLat: -44, maxLat: -10, minLon: 113, maxLon: 154 },
};

// City center coordinates for distance checks
const CITY_CENTERS: Record<string, { lat: number; lon: number }> = {
  'San Francisco': { lat: 37.7749, lon: -122.4194 },
  'Los Angeles': { lat: 34.0522, lon: -118.2437 },
  'New York': { lat: 40.7128, lon: -74.0060 },
  'London': { lat: 51.5074, lon: -0.1278 },
  'Berlin': { lat: 52.5200, lon: 13.4050 },
  'Paris': { lat: 48.8566, lon: 2.3522 },
  'Petaluma': { lat: 38.2324, lon: -122.6367 },
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isInCountry(lat: number, lon: number, country: string): boolean {
  const bounds = COUNTRY_BOUNDS[country];
  if (!bounds) return true; // Unknown country, assume OK

  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lon >= bounds.minLon &&
    lon <= bounds.maxLon
  );
}

async function run() {
  console.log('='.repeat(100));
  console.log('GEOCODING AUDIT');
  console.log('='.repeat(100));
  console.log('');

  // Fetch all booths
  console.log('📚 Fetching all booths from database...');
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, slug, address, city, state, country, postal_code, latitude, longitude, geocoded_at')
    .order('name');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`   Found ${booths.length} total booths\n`);

  const issues: AuditIssue[] = [];

  // Check 1: Missing coordinates
  console.log('🔍 Checking for missing coordinates...');
  const missingCoords = booths.filter(b => !b.latitude || !b.longitude);
  console.log(`   Found ${missingCoords.length} booths without coordinates\n`);

  for (const booth of missingCoords) {
    issues.push({
      booth_id: booth.id,
      booth_name: booth.name,
      slug: booth.slug,
      address: booth.address,
      city: booth.city,
      country: booth.country,
      issue_type: 'missing_coordinates',
      severity: 'high',
      details: 'No coordinates available',
      google_maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booth.address + ', ' + booth.city)}`,
    });
  }

  // Check 2: Coordinates in wrong country
  console.log('🌍 Checking for coordinates in wrong country...');
  let wrongCountry = 0;

  for (const booth of booths.filter(b => b.latitude && b.longitude)) {
    if (!isInCountry(booth.latitude!, booth.longitude!, booth.country)) {
      wrongCountry++;
      issues.push({
        booth_id: booth.id,
        booth_name: booth.name,
        slug: booth.slug,
        address: booth.address,
        city: booth.city,
        country: booth.country,
        latitude: booth.latitude,
        longitude: booth.longitude,
        issue_type: 'wrong_country',
        severity: 'high',
        details: `Coordinates (${booth.latitude}, ${booth.longitude}) are not in ${booth.country}`,
        google_maps_url: `https://www.google.com/maps?q=${booth.latitude},${booth.longitude}`,
      });
    }
  }
  console.log(`   Found ${wrongCountry} booths with coordinates in wrong country\n`);

  // Check 3: Coordinates far from city center
  console.log('📍 Checking for coordinates far from city center...');
  let farFromCity = 0;

  for (const booth of booths.filter(b => b.latitude && b.longitude)) {
    const cityCenter = CITY_CENTERS[booth.city];
    if (cityCenter) {
      const distance = calculateDistance(
        booth.latitude!,
        booth.longitude!,
        cityCenter.lat,
        cityCenter.lon
      );

      if (distance > 50) {
        farFromCity++;
        issues.push({
          booth_id: booth.id,
          booth_name: booth.name,
          slug: booth.slug,
          address: booth.address,
          city: booth.city,
          country: booth.country,
          latitude: booth.latitude,
          longitude: booth.longitude,
          issue_type: 'far_from_city',
          severity: 'medium',
          details: `Coordinates are ${distance.toFixed(1)}km from ${booth.city} center`,
          google_maps_url: `https://www.google.com/maps?q=${booth.latitude},${booth.longitude}`,
        });
      }
    }
  }
  console.log(`   Found ${farFromCity} booths >50km from city center\n`);

  // Check 4: Duplicate coordinates
  console.log('🔄 Checking for duplicate coordinates...');
  const coordMap = new Map<string, Booth[]>();

  for (const booth of booths.filter(b => b.latitude && b.longitude)) {
    const key = `${booth.latitude},${booth.longitude}`;
    if (!coordMap.has(key)) {
      coordMap.set(key, []);
    }
    coordMap.get(key)!.push(booth);
  }

  const duplicates = Array.from(coordMap.entries()).filter(([_, booths]) => booths.length > 1);
  console.log(`   Found ${duplicates.length} sets of duplicate coordinates\n`);

  for (const [coords, boothList] of duplicates) {
    for (const booth of boothList) {
      issues.push({
        booth_id: booth.id,
        booth_name: booth.name,
        slug: booth.slug,
        address: booth.address,
        city: booth.city,
        country: booth.country,
        latitude: booth.latitude,
        longitude: booth.longitude,
        issue_type: 'duplicate_coordinates',
        severity: 'medium',
        details: `Shares coordinates with ${boothList.length - 1} other booth(s)`,
        google_maps_url: `https://www.google.com/maps?q=${booth.latitude},${booth.longitude}`,
      });
    }
  }

  // Sort by severity and generate report
  console.log('='.repeat(100));
  console.log('AUDIT SUMMARY');
  console.log('='.repeat(100));
  console.log('');
  console.log(`Total issues found: ${issues.length}`);
  console.log(`  - High severity: ${issues.filter(i => i.severity === 'high').length}`);
  console.log(`  - Medium severity: ${issues.filter(i => i.severity === 'medium').length}`);
  console.log(`  - Low severity: ${issues.filter(i => i.severity === 'low').length}`);
  console.log('');

  // Generate CSV
  const csvPath = '/Users/jkw/Projects/booth-beacon-app/geocoding-audit-results.csv';
  const csvHeader = 'Severity,Issue Type,Booth Name,Slug,City,Country,Address,Latitude,Longitude,Details,Google Maps URL\n';
  const csvRows = issues
    .sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .map(i => `${i.severity},${i.issue_type},"${i.booth_name}",${i.slug},"${i.city}","${i.country}","${i.address}",${i.latitude || ''},${i.longitude || ''},"${i.details}",${i.google_maps_url}`)
    .join('\n');

  await fs.writeFile(csvPath, csvHeader + csvRows);

  console.log(`📄 Full audit results saved: ${csvPath}`);
  console.log('');
  console.log('='.repeat(100));
  console.log('TOP 20 HIGHEST PRIORITY ISSUES');
  console.log('='.repeat(100));
  console.log('');

  const top20 = issues
    .sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, 20);

  for (const issue of top20) {
    console.log(`[${issue.severity.toUpperCase()}] ${issue.booth_name} (${issue.city})`);
    console.log(`  Type: ${issue.issue_type}`);
    console.log(`  Details: ${issue.details}`);
    console.log(`  URL: https://boothbeacon.org/booth/${issue.slug}`);
    console.log(`  Maps: ${issue.google_maps_url}`);
    console.log('');
  }

  console.log('='.repeat(100));
}

run().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
