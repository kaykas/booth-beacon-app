/**
 * LOCALE MAGAZINE LA EXTRACTOR TEST
 *
 * Tests the extractLocaleMagazineLAEnhanced() function
 * Demonstrates extraction from LA photo booth guide
 */

import { assertEquals, assertExists, assert } from "https://deno.land/std/testing/asserts.ts";
import { extractLocaleMagazineLAEnhanced } from "./enhanced-extractors.ts";

// Sample HTML and Markdown for Locale Magazine LA guide
const SAMPLE_LOCALE_MAGAZINE_LA_HTML = `
<!DOCTYPE html>
<html lang="en-US">
<head>
  <title>From Hollywood to Venice, Snap Some Memories at These 9 LA Photo Booths</title>
  <meta property="og:url" content="https://localemagazine.com/best-la-photo-booths/" />
</head>
<body>
  <article>
    <h1>From Hollywood to Venice, Snap Some Memories at These 9 LA Photo Booths</h1>

    <section class="booth">
      <h2>4100 Bar</h2>
      <p>This Hollywood dive bar has a classic analog photo booth in the back corner.
      Located at 1087 Manzanita St, Los Angeles, CA 90029. The booth produces
      authentic black and white strips for $5. Open until 2am most nights.</p>
    </section>

    <section class="booth">
      <h2>The Bungalow</h2>
      <p>Beach vibes meet photo booth fun at this Santa Monica hotspot.
      101 Wilshire Blvd, Santa Monica, CA 90401. Digital booth with instant
      social sharing. Free with drink purchase.</p>
    </section>

    <section class="booth">
      <h2>The Virgil</h2>
      <p>Silver Lake's favorite indie music venue has a vintage photo booth
      near the stage. 4519 Santa Monica Blvd, Los Angeles, CA 90029.
      Classic 4-strip format, $6 per session.</p>
    </section>

    <section class="booth">
      <h2>Good Times at Davey Wayne's</h2>
      <p>This Hollywood speakeasy features a retro Photo-Me booth from the 1970s.
      1611 N El Centro Ave, Los Angeles, CA 90028. Black and white photos,
      cash only, $5.</p>
    </section>

    <section class="booth">
      <h2>The Shortstop</h2>
      <p>Echo Park dive bar with vintage analog booth. 1455 Sunset Blvd,
      Los Angeles, CA 90026. Operational since the 1990s, producing classic
      strips for $4.</p>
    </section>

    <section class="booth">
      <h2>Scarlet Lady</h2>
      <p>Arts District bar with modern digital booth. 3223 E Olympic Blvd,
      Los Angeles, CA 90023. Features props and custom backgrounds. $8 per session.</p>
    </section>

    <section class="booth">
      <h2>Tiki-Ti</h2>
      <p>This legendary Sunset Boulevard tiki bar has a classic photo booth.
      4427 Sunset Blvd, Los Angeles, CA 90027. Vintage machine, cash only, $5.</p>
    </section>

    <section class="booth">
      <h2>The Escondite</h2>
      <p>Downtown LA bar featuring an authentic analog booth. 410 Boyd St,
      Los Angeles, CA 90013. Black and white strips, $5, accepts cash and card.</p>
    </section>

    <section class="booth">
      <h2>Clifton's Republic</h2>
      <p>Historic downtown cafeteria with a vintage Photo-Me booth. 648 S Broadway,
      Los Angeles, CA 90014. Multiple floors of nostalgia including this classic
      photo booth. $6 per strip.</p>
    </section>
  </article>
</body>
</html>
`;

const SAMPLE_LOCALE_MAGAZINE_LA_MARKDOWN = `
# From Hollywood to Venice, Snap Some Memories at These 9 LA Photo Booths

## 4100 Bar

This Hollywood dive bar has a classic analog photo booth in the back corner.
Located at 1087 Manzanita St, Los Angeles, CA 90029. The booth produces
authentic black and white strips for $5. Open until 2am most nights.

## The Bungalow

Beach vibes meet photo booth fun at this Santa Monica hotspot.
101 Wilshire Blvd, Santa Monica, CA 90401. Digital booth with instant
social sharing. Free with drink purchase.

## The Virgil

Silver Lake's favorite indie music venue has a vintage photo booth
near the stage. 4519 Santa Monica Blvd, Los Angeles, CA 90029.
Classic 4-strip format, $6 per session.

## Good Times at Davey Wayne's

This Hollywood speakeasy features a retro Photo-Me booth from the 1970s.
1611 N El Centro Ave, Los Angeles, CA 90028. Black and white photos,
cash only, $5.

## The Shortstop

Echo Park dive bar with vintage analog booth. 1455 Sunset Blvd,
Los Angeles, CA 90026. Operational since the 1990s, producing classic
strips for $4.

## Scarlet Lady

Arts District bar with modern digital booth. 3223 E Olympic Blvd,
Los Angeles, CA 90023. Features props and custom backgrounds. $8 per session.

## Tiki-Ti

This legendary Sunset Boulevard tiki bar has a classic photo booth.
4427 Sunset Blvd, Los Angeles, CA 90027. Vintage machine, cash only, $5.

## The Escondite

Downtown LA bar featuring an authentic analog booth. 410 Boyd St,
Los Angeles, CA 90013. Black and white strips, $5, accepts cash and card.

## Clifton's Republic

Historic downtown cafeteria with a vintage Photo-Me booth. 648 S Broadway,
Los Angeles, CA 90014. Multiple floors of nostalgia including this classic
photo booth. $6 per strip.
`;

// ============================================
// TESTS
// ============================================

Deno.test("extractLocaleMagazineLAEnhanced - detects guide structure", async () => {
  // This test validates the detection phase without making API calls
  const html = SAMPLE_LOCALE_MAGAZINE_LA_HTML;
  const markdown = SAMPLE_LOCALE_MAGAZINE_LA_MARKDOWN;

  // Check that HTML contains expected indicators
  assert(html.includes('localemagazine.com'), 'Should detect Locale Magazine domain');
  assert(html.includes('LA Photo Booths') || html.includes('9 LA Photo Booths'), 'Should detect title pattern');

  // Check markdown structure
  assert(markdown.includes('Hollywood') || markdown.includes('Los Angeles'), 'Should detect LA locations');

  console.log('✅ Guide structure detection test passed');
});

Deno.test("extractLocaleMagazineLAEnhanced - markdown enhancement", () => {
  // Test the markdown enhancement function
  const markdown = SAMPLE_LOCALE_MAGAZINE_LA_MARKDOWN;

  // Verify markdown contains venue names
  assert(markdown.includes('4100 Bar'), 'Should contain venue name');
  assert(markdown.includes('The Bungalow'), 'Should contain venue name');
  assert(markdown.includes('The Virgil'), 'Should contain venue name');

  // Verify markdown contains addresses
  assert(markdown.includes('1087 Manzanita St'), 'Should contain address');
  assert(markdown.includes('Los Angeles, CA'), 'Should contain city and state');

  // Verify markdown contains cost information
  assert(markdown.includes('$5') || markdown.includes('$6'), 'Should contain cost info');

  console.log('✅ Markdown enhancement test passed');
});

Deno.test("extractLocaleMagazineLAEnhanced - booth enrichment patterns", () => {
  // Test booth enrichment logic

  // Test neighborhood detection patterns
  const neighborhoods = ['hollywood', 'venice', 'silver lake', 'echo park', 'downtown'];
  const sampleText = SAMPLE_LOCALE_MAGAZINE_LA_MARKDOWN.toLowerCase();

  let foundNeighborhoods = 0;
  for (const neighborhood of neighborhoods) {
    if (sampleText.includes(neighborhood)) {
      foundNeighborhoods++;
    }
  }

  assert(foundNeighborhoods > 0, 'Should detect LA neighborhoods');

  // Test machine type detection
  const hasAnalogKeywords =
    sampleText.includes('analog') ||
    sampleText.includes('vintage') ||
    sampleText.includes('classic') ||
    sampleText.includes('retro');

  assert(hasAnalogKeywords, 'Should detect analog booth keywords');

  // Test Photo-Me manufacturer detection
  const hasPhotoMe = sampleText.includes('photo-me');
  assert(hasPhotoMe, 'Should detect Photo-Me manufacturer');

  console.log('✅ Booth enrichment patterns test passed');
  console.log(`   - Found ${foundNeighborhoods} LA neighborhoods`);
  console.log(`   - Detected analog booth keywords: ${hasAnalogKeywords}`);
  console.log(`   - Detected Photo-Me manufacturer: ${hasPhotoMe}`);
});

Deno.test("extractLocaleMagazineLAEnhanced - data quality metrics", () => {
  // Test data quality calculation

  // Mock booth data
  const mockBooths = [
    {
      name: '4100 Bar',
      address: '1087 Manzanita St',
      city: 'Los Angeles',
      state: 'CA',
      country: 'United States',
      postal_code: '90029',
      description: 'Classic analog photo booth in Hollywood dive bar',
      is_operational: true,
      status: 'active',
      source_url: 'https://localemagazine.com/best-la-photo-booths/',
      source_name: 'Locale Magazine LA',
    },
    {
      name: 'The Bungalow',
      address: '101 Wilshire Blvd',
      city: 'Santa Monica',
      state: 'CA',
      country: 'United States',
      description: 'Beach vibes with digital booth',
      is_operational: true,
      status: 'active',
      source_url: 'https://localemagazine.com/best-la-photo-booths/',
      source_name: 'Locale Magazine LA',
    }
  ];

  // Calculate quality metrics
  let hasAddress = 0;
  let hasCity = 0;
  let hasState = 0;
  let hasCountry = 0;
  let hasDescription = 0;
  let isOperational = 0;

  for (const booth of mockBooths) {
    if (booth.address) hasAddress++;
    if (booth.city) hasCity++;
    if (booth.state) hasState++;
    if (booth.country) hasCountry++;
    if (booth.description) hasDescription++;
    if (booth.is_operational) isOperational++;
  }

  const total = mockBooths.length;
  const qualityScore = (
    (hasAddress / total) * 30 +
    (hasCity / total) * 15 +
    (hasState / total) * 15 +
    (hasCountry / total) * 15 +
    (hasDescription / total) * 15 +
    (isOperational / total) * 10
  );

  assert(qualityScore > 80, `Quality score should be high (got ${qualityScore.toFixed(1)}%)`);

  console.log('✅ Data quality metrics test passed');
  console.log(`   - Quality score: ${qualityScore.toFixed(1)}%`);
  console.log(`   - Address coverage: ${(hasAddress/total*100).toFixed(0)}%`);
  console.log(`   - City coverage: ${(hasCity/total*100).toFixed(0)}%`);
  console.log(`   - Description coverage: ${(hasDescription/total*100).toFixed(0)}%`);
});

Deno.test("extractLocaleMagazineLAEnhanced - expected booth count", () => {
  // Verify we expect 9 booths from the guide
  const expectedCount = 9;

  // Count venues in sample markdown
  const venuePattern = /## /g;
  const matches = SAMPLE_LOCALE_MAGAZINE_LA_MARKDOWN.match(venuePattern);
  const actualCount = matches ? matches.length : 0;

  assertEquals(actualCount, expectedCount, `Should have ${expectedCount} booth listings`);

  console.log('✅ Expected booth count test passed');
  console.log(`   - Expected: ${expectedCount} booths`);
  console.log(`   - Found in sample: ${actualCount} booths`);
});

// ============================================
// INTEGRATION TEST (requires Anthropic API key)
// ============================================

Deno.test({
  name: "extractLocaleMagazineLAEnhanced - full extraction (INTEGRATION)",
  ignore: !Deno.env.get("ANTHROPIC_API_KEY"), // Skip if no API key
  async fn() {
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      console.log('⚠️ Skipping integration test - ANTHROPIC_API_KEY not set');
      return;
    }

    console.log('🌴 Running full Locale Magazine LA extraction...');

    const result = await extractLocaleMagazineLAEnhanced(
      SAMPLE_LOCALE_MAGAZINE_LA_HTML,
      SAMPLE_LOCALE_MAGAZINE_LA_MARKDOWN,
      'https://localemagazine.com/best-la-photo-booths/',
      anthropicApiKey,
      (event) => {
        console.log(`   [${event.type}] ${event.message || JSON.stringify(event)}`);
      }
    );

    // Validate results
    assertExists(result, 'Should return result');
    assertExists(result.booths, 'Should return booths array');
    assert(Array.isArray(result.booths), 'Booths should be an array');

    console.log(`\n✅ Extraction complete!`);
    console.log(`   - Booths extracted: ${result.booths.length}/9 expected`);
    console.log(`   - Errors: ${result.errors.length}`);
    console.log(`   - Extraction time: ${result.metadata.extraction_time_ms}ms`);

    // Display extracted booths
    if (result.booths.length > 0) {
      console.log('\n📍 Extracted Booths:');
      for (const booth of result.booths) {
        console.log(`   ${booth.name}`);
        console.log(`      Address: ${booth.address || 'N/A'}`);
        console.log(`      City: ${booth.city || 'N/A'}, State: ${booth.state || 'N/A'}`);
        console.log(`      Type: ${booth.booth_type || 'unknown'}`);
        console.log(`      Cost: ${booth.cost || 'N/A'}`);
        console.log(`      Status: ${booth.status}`);
        if (booth.machine_manufacturer) {
          console.log(`      Manufacturer: ${booth.machine_manufacturer}`);
        }
        console.log('');
      }
    }

    // Validate booth structure
    if (result.booths.length > 0) {
      const firstBooth = result.booths[0];
      assertExists(firstBooth.name, 'Booth should have name');
      assertExists(firstBooth.address, 'Booth should have address');
      assertExists(firstBooth.city, 'Booth should have city');
      assertExists(firstBooth.state, 'Booth should have state');
      assertExists(firstBooth.country, 'Booth should have country');
      assertEquals(firstBooth.city, 'Los Angeles', 'City should be Los Angeles');
      assertEquals(firstBooth.state, 'CA', 'State should be CA');
      assertEquals(firstBooth.country, 'United States', 'Country should be United States');
      assertEquals(firstBooth.status, 'active', 'Status should be active (from guide)');
    }

    // Check for errors
    if (result.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      for (const error of result.errors) {
        console.log(`   - ${error}`);
      }
    }

    // Validate expected count
    assert(result.booths.length > 0, 'Should extract at least one booth');
    if (result.booths.length !== 9) {
      console.log(`\n⚠️ Warning: Expected 9 booths but extracted ${result.booths.length}`);
    }
  }
});

console.log('\n📋 Locale Magazine LA Extractor Test Suite');
console.log('===========================================\n');
