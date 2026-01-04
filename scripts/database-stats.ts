#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getStats() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 BOOTH BEACON DATABASE STATISTICS');
  console.log('='.repeat(80));
  console.log('');

  // Get all booths
  const { data: booths, error } = await supabase
    .from('booths')
    .select('*');

  if (error || !booths) {
    console.error('Error fetching booths:', error);
    process.exit(1);
  }

  const total = booths.length;

  console.log('🎯 OVERVIEW');
  console.log('─'.repeat(80));
  console.log(`Total Booths: ${total}`);
  console.log('');

  // Geographic Distribution
  console.log('🌍 GEOGRAPHIC DISTRIBUTION');
  console.log('─'.repeat(80));

  const countries = new Map<string, number>();
  booths.forEach(b => {
    const country = b.country || 'Unknown';
    countries.set(country, (countries.get(country) || 0) + 1);
  });

  const topCountries = Array.from(countries.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  topCountries.forEach(([country, count]) => {
    const percentage = ((count / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(count / 10));
    console.log(`  ${country.padEnd(25)} ${count.toString().padStart(4)} (${percentage.padStart(5)}%) ${bar}`);
  });

  console.log('');

  // Top Cities
  console.log('🏙️  TOP CITIES');
  console.log('─'.repeat(80));

  const cities = new Map<string, { count: number; country: string }>();
  booths.forEach(b => {
    const city = b.city || 'Unknown';
    const country = b.country || 'Unknown';
    if (!cities.has(city)) {
      cities.set(city, { count: 0, country });
    }
    cities.get(city)!.count++;
  });

  const topCities = Array.from(cities.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15);

  topCities.forEach(([city, data]) => {
    const bar = '█'.repeat(Math.floor(data.count / 5));
    console.log(`  ${city.padEnd(25)} ${data.count.toString().padStart(4)} booths ${bar}`);
  });

  console.log('');

  // Booth Types
  console.log('📸 BOOTH TYPES');
  console.log('─'.repeat(80));

  const types = new Map<string, number>();
  booths.forEach(b => {
    const type = b.booth_type || 'Unknown';
    types.set(type, (types.get(type) || 0) + 1);
  });

  Array.from(types.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(count / 10));
      console.log(`  ${type.padEnd(20)} ${count.toString().padStart(4)} (${percentage.padStart(5)}%) ${bar}`);
    });

  console.log('');

  // Photo Types
  console.log('🎞️  PHOTO TYPES');
  console.log('─'.repeat(80));

  const photoTypes = new Map<string, number>();
  booths.forEach(b => {
    const type = b.photo_type || 'Unknown';
    photoTypes.set(type, (photoTypes.get(type) || 0) + 1);
  });

  Array.from(photoTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(count / 10));
      console.log(`  ${type.padEnd(20)} ${count.toString().padStart(4)} (${percentage.padStart(5)}%) ${bar}`);
    });

  console.log('');

  // Data Completeness
  console.log('📋 DATA COMPLETENESS');
  console.log('─'.repeat(80));

  const withCoords = booths.filter(b => b.latitude && b.longitude).length;
  const withPhotos = booths.filter(b => b.photo_exterior_url || b.photo_interior_url || b.photo_sample_strips).length;
  const withDescription = booths.filter(b => b.description).length;
  const withHours = booths.filter(b => b.hours).length;
  const withCost = booths.filter(b => b.cost).length;
  const withAiPreview = booths.filter(b => b.ai_preview_url || b.ai_generated_image_url).length;

  const stats = [
    { label: 'Geocoded (lat/lng)', count: withCoords },
    { label: 'Has Photos', count: withPhotos },
    { label: 'Has AI Preview', count: withAiPreview },
    { label: 'Has Description', count: withDescription },
    { label: 'Has Hours', count: withHours },
    { label: 'Has Cost Info', count: withCost },
  ];

  stats.forEach(({ label, count }) => {
    const percentage = ((count / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor((count / total) * 50));
    console.log(`  ${label.padEnd(25)} ${count.toString().padStart(4)} / ${total} (${percentage.padStart(5)}%) ${bar}`);
  });

  console.log('');

  // Status Distribution
  console.log('🚦 STATUS');
  console.log('─'.repeat(80));

  const statuses = new Map<string, number>();
  booths.forEach(b => {
    const status = b.status || 'unknown';
    statuses.set(status, (statuses.get(status) || 0) + 1);
  });

  Array.from(statuses.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      console.log(`  ${status.padEnd(20)} ${count.toString().padStart(4)} (${percentage.padStart(5)}%)`);
    });

  console.log('');

  // Operational Status
  const operational = booths.filter(b => b.is_operational).length;
  const notOperational = total - operational;

  console.log('⚙️  OPERATIONAL STATUS');
  console.log('─'.repeat(80));
  console.log(`  Operational:     ${operational} (${((operational / total) * 100).toFixed(1)}%)`);
  console.log(`  Not Operational: ${notOperational} (${((notOperational / total) * 100).toFixed(1)}%)`);

  console.log('');

  // Cost Distribution
  console.log('💰 COST INFORMATION');
  console.log('─'.repeat(80));

  const withCostInfo = booths.filter(b => b.cost);
  console.log(`  Booths with cost data: ${withCostInfo.length} / ${total} (${((withCostInfo.length / total) * 100).toFixed(1)}%)`);

  // Sample some costs
  const sampleCosts = withCostInfo
    .filter(b => b.cost)
    .slice(0, 5)
    .map(b => `${b.name}: ${b.cost}`);

  if (sampleCosts.length > 0) {
    console.log('  Sample costs:');
    sampleCosts.forEach(cost => console.log(`    • ${cost}`));
  }

  console.log('');

  // Source Distribution
  console.log('📡 SOURCE DISTRIBUTION');
  console.log('─'.repeat(80));

  const sources = new Map<string, number>();
  booths.forEach(b => {
    const source = b.source_primary || b.ingested_by || 'Unknown';
    sources.set(source, (sources.get(source) || 0) + 1);
  });

  const topSources = Array.from(sources.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  topSources.forEach(([source, count]) => {
    const percentage = ((count / total) * 100).toFixed(1);
    console.log(`  ${source.padEnd(35)} ${count.toString().padStart(4)} (${percentage.padStart(5)}%)`);
  });

  console.log('');

  // Payment Methods
  console.log('💳 PAYMENT METHODS');
  console.log('─'.repeat(80));
  const acceptsCash = booths.filter(b => b.accepts_cash).length;
  const acceptsCard = booths.filter(b => b.accepts_card).length;
  const both = booths.filter(b => b.accepts_cash && b.accepts_card).length;

  console.log(`  Accepts Cash:      ${acceptsCash} (${((acceptsCash / total) * 100).toFixed(1)}%)`);
  console.log(`  Accepts Card:      ${acceptsCard} (${((acceptsCard / total) * 100).toFixed(1)}%)`);
  console.log(`  Accepts Both:      ${both} (${((both / total) * 100).toFixed(1)}%)`);

  console.log('');
  console.log('='.repeat(80));
  console.log('');
}

getStats().catch(console.error);
