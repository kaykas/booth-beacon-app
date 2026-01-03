/**
 * TEST: Demonstrate improved booth name matching logic
 *
 * This shows how the improved algorithm handles tricky booth names
 * even without making actual API calls.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

/**
 * Normalize booth name by removing common suffixes and cleaning up
 */
function normalizeBoothName(name: string): string[] {
  const variations: string[] = [];

  // Original name
  variations.push(name);

  // Strip common suffixes: " I", " II", " III", " 2", " #2", " (2)", etc.
  const suffixPatterns = [
    / (I{1,3})$/i,           // Roman numerals at end
    / #?\d+$/,               // Numbers with optional #
    / \(\d+\)$/,             // Numbers in parentheses
    / \d+$/,                 // Just numbers at end
  ];

  let cleanedName = name;
  for (const pattern of suffixPatterns) {
    const match = cleanedName.match(pattern);
    if (match) {
      cleanedName = cleanedName.replace(pattern, '').trim();
      variations.push(cleanedName);
      break; // Only remove one suffix
    }
  }

  // Strip location indicators from name
  const locationPatterns = [
    / Hotel (Lobby|Entrance)?$/i,
    / Station$/i,
    / Gallery(\s+\+?\s*Museum)?$/i,
    / Club$/i,
    / House$/i,
  ];

  let withoutLocation = cleanedName;
  for (const pattern of locationPatterns) {
    if (pattern.test(withoutLocation)) {
      withoutLocation = withoutLocation.replace(pattern, '').trim();
      variations.push(withoutLocation);
    }
  }

  // Fix common name issues
  const fixedName = name
    .replace(/&eacute;/g, 'é')  // HTML entities
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')        // Multiple spaces
    .trim();

  if (fixedName !== name) {
    variations.push(fixedName);
  }

  // Return unique variations, ordered from most specific to least
  return [...new Set(variations)];
}

/**
 * Generate venue type hint from booth name
 */
function inferVenueType(name: string): string[] {
  const nameLower = name.toLowerCase();
  const types: string[] = [];

  if (nameLower.includes('hotel')) types.push('hotel');
  if (nameLower.includes('bar') || nameLower.includes('pub')) types.push('bar');
  if (nameLower.includes('club')) types.push('night club');
  if (nameLower.includes('cafe') || nameLower.includes('coffee')) types.push('cafe');
  if (nameLower.includes('restaurant')) types.push('restaurant');
  if (nameLower.includes('museum') || nameLower.includes('gallery')) types.push('museum');
  if (nameLower.includes('station')) types.push('transit station');
  if (nameLower.includes('mall') || nameLower.includes('shopping')) types.push('shopping mall');
  if (nameLower.includes('park')) types.push('park');

  return types;
}

/**
 * Generate search strategies for a booth
 */
function generateSearchStrategies(
  boothName: string,
  city: string,
  country: string,
  latitude?: number,
  longitude?: number
): Array<{ query: string; strategy: string }> {
  const locationString = [city, country].filter(Boolean).join(', ');
  const nameVariations = normalizeBoothName(boothName);
  const venueTypes = inferVenueType(boothName);

  const strategies: Array<{ query: string; strategy: string }> = [];

  // Strategy 1: Exact booth name + location
  strategies.push({
    query: `${boothName} ${locationString}`,
    strategy: 'exact'
  });

  // Strategy 2: Try each name variation
  for (let i = 1; i < nameVariations.length; i++) {
    strategies.push({
      query: `${nameVariations[i]} ${locationString}`,
      strategy: `variation-${i} ("${nameVariations[i]}")`
    });
  }

  // Strategy 3: Add venue type hints for ambiguous names
  if (venueTypes.length > 0) {
    for (const type of venueTypes.slice(0, 2)) { // Limit to first 2 types
      strategies.push({
        query: `${nameVariations[0]} ${type} ${locationString}`,
        strategy: `typed-${type}`
      });
    }
  }

  // Strategy 4: For location-based names
  const isLocationName = boothName.toLowerCase().includes('straße') ||
                        boothName.toLowerCase().includes('strasse') ||
                        boothName.toLowerCase().includes('allee') ||
                        boothName.toLowerCase().includes('brücke') ||
                        boothName.toLowerCase().includes('platz') ||
                        boothName.toLowerCase().includes('park') && !boothName.toLowerCase().includes('parking');

  if (isLocationName) {
    strategies.push({
      query: `photo booth ${boothName} ${locationString}`,
      strategy: 'location-based-photobooth'
    });
    strategies.push({
      query: `bar ${boothName} ${locationString}`,
      strategy: 'location-based-bar'
    });
  }

  // Strategy 5: Nearby search if we have coordinates
  if (latitude && longitude) {
    strategies.push({
      query: `photo booth near ${latitude},${longitude}`,
      strategy: 'nearby-coords'
    });
  }

  return strategies;
}

/**
 * String similarity
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const longerLower = longer.toLowerCase();
  const shorterLower = shorter.toLowerCase();

  if (longerLower.includes(shorterLower)) {
    return 0.8 + (shorterLower.length / longerLower.length) * 0.2;
  }

  let matches = 0;
  let lastIndex = 0;

  for (const char of shorterLower) {
    const index = longerLower.indexOf(char, lastIndex);
    if (index !== -1) {
      matches++;
      lastIndex = index + 1;
    }
  }

  return matches / longer.length;
}

/**
 * Test the improvements
 */
async function testImprovements() {
  console.log('==================================================');
  console.log('BOOTH NAME MATCHING IMPROVEMENTS TEST');
  console.log('==================================================\n');

  const testBooths = [
    { name: 'Mauerpark 2', city: 'Berlin', country: 'Germany' },
    { name: 'Barnone', city: 'Gilbert', country: 'Arizona, USA' },
    { name: 'Max Brown Hotel 5th District Lobby', city: 'Vienna', country: 'Austria' },
    { name: 'Warschauer Brücke 2', city: 'Berlin', country: 'Germany' },
    { name: 'Musée Mécanique II', city: 'San Francisco', country: 'United States' },
    { name: 'Flinders Street Station II', city: 'Melbourne', country: 'Australia' },
    { name: 'Lou\'s Athletic Club', city: 'Brooklyn', country: 'USA' },
    { name: 'Bar DeVille', city: 'Chicago', country: 'USA' },
  ];

  for (const booth of testBooths) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Booth: "${booth.name}"`);
    console.log(`Location: ${booth.city}, ${booth.country}`);
    console.log(`${'-'.repeat(70)}`);

    const variations = normalizeBoothName(booth.name);
    console.log(`\nName variations (${variations.length}):`);
    variations.forEach((v, i) => {
      if (i === 0) {
        console.log(`  ${i + 1}. "${v}" (original)`);
      } else {
        console.log(`  ${i + 1}. "${v}"`);
      }
    });

    const venueTypes = inferVenueType(booth.name);
    if (venueTypes.length > 0) {
      console.log(`\nInferred venue types: ${venueTypes.join(', ')}`);
    }

    const strategies = generateSearchStrategies(booth.name, booth.city, booth.country);
    console.log(`\nSearch strategies (${strategies.length}):`);
    strategies.slice(0, 5).forEach((s, i) => {
      console.log(`  ${i + 1}. [${s.strategy}] "${s.query}"`);
    });

    // Test matching examples
    console.log('\nConfidence scoring examples:');

    // Simulate different Google Places results
    const testMatches = [
      { name: booth.name, city: booth.city, similarity: 1.0 },
      { name: variations[1] || booth.name, city: booth.city, similarity: 0.9 },
    ];

    for (const match of testMatches) {
      const sim = stringSimilarity(booth.name.toLowerCase(), match.name.toLowerCase());
      const confidence = Math.min(100, Math.round(sim * 60 + 30)); // Simplified scoring
      console.log(`  - "${match.name}" → ${Math.round(sim * 100)}% similarity, ~${confidence}% confidence`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('IMPROVEMENTS SUMMARY');
  console.log('='.repeat(70));
  console.log('\n✅ Smart name normalization:');
  console.log('   - Removes suffixes (I, II, 2, #2, etc.)');
  console.log('   - Strips location indicators (Hotel, Station, Gallery, etc.)');
  console.log('   - Fixes HTML entities (&eacute; → é)');

  console.log('\n✅ Multiple search strategies:');
  console.log('   - Exact name match');
  console.log('   - Name variations without suffixes');
  console.log('   - Type-hinted searches (add "hotel", "bar", etc.)');
  console.log('   - Location-based searches (for street names)');
  console.log('   - Coordinate-based nearby search');

  console.log('\n✅ Improved confidence scoring:');
  console.log('   - String similarity algorithm');
  console.log('   - Word-by-word matching');
  console.log('   - Venue type matching bonus');
  console.log('   - Strategy-based adjustments');
  console.log('   - Lower threshold (60% vs 70%) for more matches');

  console.log('\n📝 Next step:');
  console.log('   The Google Maps API key needs to be configured without');
  console.log('   referrer restrictions to work from the backend.');
  console.log('   Current key only works from web browsers.');
  console.log('\n');
}

testImprovements();
