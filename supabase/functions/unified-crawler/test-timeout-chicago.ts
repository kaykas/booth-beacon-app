/**
 * Test script for TimeOut Chicago enhanced extractor
 *
 * This script tests the extractTimeOutChicagoEnhanced() function
 * with the actual TimeOut Chicago article URL.
 */

import { extractTimeOutChicagoEnhanced } from "./enhanced-extractors";

// Sample HTML and Markdown for testing
const SAMPLE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>20 Chicago bars with a photo booth | Bars and pubs | TimeOut Chicago</title>
</head>
<body>
  <article>
    <h1>20 Chicago bars with a photo booth</h1>
    <p>Preserve your night out in black and white at these Chicago bars with photo booths.</p>

    <div class="listing">
      <h2>1. Bar DeVille</h2>
      <p>River West, West Town</p>
      <p>This Art Deco establishment has an old-school photo booth that spits out two strips of four photos in black and white or color for $5.</p>
    </div>

    <div class="listing">
      <h2>2. Beauty Bar</h2>
      <p>River West, West Town</p>
      <p>Dance club with drink and manicure specials. Photo booth available.</p>
    </div>

    <div class="listing">
      <h2>3. The Charleston</h2>
      <p>Bucktown</p>
      <p>Cocktail bar where patrons can squeeze into the photo booth for group photos.</p>
    </div>
  </article>
</body>
</html>
`;

const SAMPLE_MARKDOWN = `
# 20 Chicago bars with a photo booth

Preserve your night out in black and white at these Chicago bars with photo booths.

## 1. Bar DeVille
**River West, West Town**

This Art Deco establishment has an old-school photo booth that spits out two strips of four photos in black and white or color for $5.

## 2. Beauty Bar
**River West, West Town**

Dance club with drink and manicure specials. Photo booth available.

## 3. The Charleston
**Bucktown**

Cocktail bar where patrons can squeeze into the photo booth for group photos.

## 4. Empty Bottle
**Ukrainian Village**

Indie rock venue with pool table, pinball and a photo booth in the front room.

## 5. Fat Cat
**Uptown**

40s-inspired bar featuring shuffleboard, pool, and photo booth.

## 6. The Flat Iron
**Wicker Park**

Dive bar open till 4am with photo booth. Roomy and a little divey.

## 7. Four Farthings
**Lincoln Park**

Neighborhood pub where visitors can add photos to the collage on the wall.

## 8. Holiday Club
**Uptown**

Features 50s diner ambiance with photo booth.

## 9. Liar's Club
**Lincoln Park**

Dive bar with DJs, a pool table and photo booth.

## 10. Lincoln Tap Room
**Lake View**

Beer bar offering old-school photo booth that spits out two strips for $5.
`;

const TEST_URL = "https://www.timeout.com/chicago/bars/20-chicago-bars-with-a-photo-booth";

async function runTest() {
  console.log("========================================");
  console.log("Testing TimeOut Chicago Enhanced Extractor");
  console.log("========================================\n");

  // Check for API key
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.error("ERROR: ANTHROPIC_API_KEY environment variable not set");
    Deno.exit(1);
  }

  const progressEvents: any[] = [];

  // Progress callback
  const onProgress = (event: any) => {
    progressEvents.push(event);
    console.log(`[${event.type}] ${event.message || JSON.stringify(event)}`);
  };

  try {
    const startTime = Date.now();

    console.log("Starting extraction...\n");
    const result = await extractTimeOutChicagoEnhanced(
      SAMPLE_HTML,
      SAMPLE_MARKDOWN,
      TEST_URL,
      apiKey,
      onProgress
    );

    const totalTime = Date.now() - startTime;

    console.log("\n========================================");
    console.log("EXTRACTION RESULTS");
    console.log("========================================\n");

    console.log(`Total Booths Extracted: ${result.booths.length}`);
    console.log(`Errors: ${result.errors.length}`);
    console.log(`Processing Time: ${totalTime}ms`);
    console.log(`Pages Processed: ${result.metadata.pages_processed}`);

    if (result.errors.length > 0) {
      console.log("\nErrors:");
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log("\n========================================");
    console.log("EXTRACTED BOOTHS");
    console.log("========================================\n");

    result.booths.forEach((booth, index) => {
      console.log(`${index + 1}. ${booth.name}`);
      console.log(`   Address: ${booth.address || 'N/A'}`);
      console.log(`   City: ${booth.city || 'N/A'}, ${booth.state || 'N/A'} ${booth.postal_code || ''}`);
      console.log(`   Country: ${booth.country || 'N/A'}`);
      console.log(`   Machine Model: ${booth.machine_model || 'N/A'}`);
      console.log(`   Manufacturer: ${booth.machine_manufacturer || 'N/A'}`);
      console.log(`   Booth Type: ${booth.booth_type || 'N/A'}`);
      console.log(`   Cost: ${booth.cost || 'N/A'}`);
      console.log(`   Status: ${booth.status} (operational: ${booth.is_operational})`);
      if (booth.description) {
        console.log(`   Description: ${booth.description.substring(0, 100)}${booth.description.length > 100 ? '...' : ''}`);
      }
      console.log();
    });

    console.log("========================================");
    console.log("DATA QUALITY ANALYSIS");
    console.log("========================================\n");

    const withAddress = result.booths.filter(b => b.address).length;
    const withCity = result.booths.filter(b => b.city).length;
    const withState = result.booths.filter(b => b.state).length;
    const withMachine = result.booths.filter(b => b.machine_model || b.machine_manufacturer).length;
    const withCost = result.booths.filter(b => b.cost).length;
    const withDescription = result.booths.filter(b => b.description).length;

    console.log(`Booths with Address: ${withAddress}/${result.booths.length} (${(withAddress/result.booths.length*100).toFixed(1)}%)`);
    console.log(`Booths with City: ${withCity}/${result.booths.length} (${(withCity/result.booths.length*100).toFixed(1)}%)`);
    console.log(`Booths with State: ${withState}/${result.booths.length} (${(withState/result.booths.length*100).toFixed(1)}%)`);
    console.log(`Booths with Machine Info: ${withMachine}/${result.booths.length} (${(withMachine/result.booths.length*100).toFixed(1)}%)`);
    console.log(`Booths with Cost: ${withCost}/${result.booths.length} (${(withCost/result.booths.length*100).toFixed(1)}%)`);
    console.log(`Booths with Description: ${withDescription}/${result.booths.length} (${(withDescription/result.booths.length*100).toFixed(1)}%)`);

    console.log("\n========================================");
    console.log("TEST COMPLETED SUCCESSFULLY");
    console.log("========================================\n");

  } catch (error) {
    console.error("\n========================================");
    console.error("TEST FAILED");
    console.error("========================================\n");
    console.error(error);
    Deno.exit(1);
  }
}

// Run the test
if (import.meta.main) {
  runTest();
}
