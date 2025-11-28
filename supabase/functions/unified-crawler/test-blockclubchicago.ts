/**
 * Test Script for Block Club Chicago Enhanced Extractor
 *
 * This script demonstrates the extractBlockClubChicagoEnhanced() function
 * by processing the March 2025 article about Chicago's vintage photo booths.
 */

import { extractBlockClubChicagoEnhanced } from "./enhanced-extractors";

// Mock HTML content based on the article structure
const mockHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Chicago's vintage photo booths are a dying breed — meet the women trying to keep them alive</title>
  <meta property="og:site_name" content="Block Club Chicago" />
</head>
<body>
  <article>
    <h1>Chicago's vintage photo booths are a dying breed — meet the women trying to keep them alive</h1>
    <div class="article-content">
      <p>Auto Photo maintains 20 booths across 7 states, including several in Chicago.</p>

      <h2>Operating Booths</h2>
      <p><strong>Rainbo Club</strong> (1150 N. Damen Ave., Wicker Park) - Most popular on Chicago route;
      operating since 1985; features annual calendar of booth images. The booth has been a fixture
      since Dee Taira became owner in October 1985. Used for Liz Phair's 1993 album "Exile in Guyville" cover.</p>

      <p><strong>Skylark</strong> (Pilsen) - Planning analog photo booth celebration for May.</p>

      <p><strong>Weegee's Lounge</strong> (Logan Square) - Features vintage analog photo booth.</p>

      <p><strong>Cole's Bar</strong> (2338 N. Milwaukee Ave., Logan Square) - Popular neighborhood spot
      with working analog booth.</p>

      <p><strong>Village Tap</strong> (Roscoe Village) - Long-standing booth location.</p>

      <p><strong>Holiday Club</strong> (Uptown) - Active analog photo booth location.</p>

      <p><strong>Vintage House Chicago</strong> (1433 N. Milwaukee Ave., Wicker Park) - New all-ages
      booth opened March 2025. Owned by photographer Maddie Rogers.</p>

      <h2>Former Booths</h2>
      <p><strong>Smartbar</strong> (3730 N. Clark St., basement of Metro) - Converted to digital
      after maintenance challenges.</p>

      <h2>Key People</h2>
      <p>Bre Conley-Saxon - Owner of Auto Photo; Connecticut-based photographer specializing in
      restoration/maintenance. "Chemical booths are like living, breathing creatures."</p>

      <p>Emily Botelho - Auto Photo operations manager (London, Ontario)</p>

      <p>Maddie Rogers - Owner, Vintage House Chicago; photographer</p>

      <h2>Pricing and Operations</h2>
      <p>Booths cost $5 cash/$7 credit per session. Requires ~$1,000 monthly revenue to sustain location.</p>

      <p>Direct positive paper sourced from Ilford Photo (U.K.). Vintage booths cost $40,000-$60,000 currently.</p>

      <h2>100th Anniversary</h2>
      <p>International Photobooth Convention planned August 28-31, New York City. Plans underway
      for analog photo booth museum in NYC.</p>
    </div>
  </article>
</body>
</html>
`;

// Mock markdown (simplified version of article content)
const mockMarkdown = `
# Chicago's vintage photo booths are a dying breed — meet the women trying to keep them alive

## Operating Booths

**Rainbo Club** (1150 N. Damen Ave., Wicker Park)
- Most popular on Chicago route
- Operating since 1985
- Features annual calendar of booth images
- Used for Liz Phair's 1993 album "Exile in Guyville" cover

**Skylark** (Pilsen)
- Planning analog photo booth celebration for May

**Weegee's Lounge** (Logan Square)
- Features vintage analog photo booth

**Cole's Bar** (2338 N. Milwaukee Ave., Logan Square)
- Popular neighborhood spot with working analog booth

**Village Tap** (Roscoe Village)
- Long-standing booth location

**Holiday Club** (Uptown)
- Active analog photo booth location

**Vintage House Chicago** (1433 N. Milwaukee Ave., Wicker Park)
- New all-ages booth opened March 2025
- Owned by photographer Maddie Rogers

## Former/Transitioned Booths

**Smartbar** (3730 N. Clark St., basement of Metro)
- Converted to digital after maintenance challenges

## Key People & Organizations

**Bre Conley-Saxon** - Owner of Auto Photo; Connecticut-based photographer
**Emily Botelho** - Auto Photo operations manager (London, Ontario)
**Maddie Rogers** - Owner, Vintage House Chicago

## Pricing and Operations

- Pricing: $5 cash/$7 credit per session
- Requires ~$1,000 monthly revenue to sustain location
- Direct positive paper sourced from Ilford Photo (U.K.)
- Vintage booths cost $40,000-$60,000 currently
- Auto Photo maintains 20 booths across 7 states

## Historical Context

- Anatol Josepho invented first automated photo booth in 1925 (Times Square)
- Booths from 1960s-era still operational
- 100th Anniversary: International Photobooth Convention (August 28-31, NYC)
- Plans for analog photo booth museum in NYC
`;

// Test the extractor
async function testBlockClubChicagoExtractor() {
  console.log("🚀 Testing Block Club Chicago Enhanced Extractor\n");
  console.log("=" .repeat(70));

  const sourceUrl = "https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed-meet-the-women-trying-to-keep-them-alive/";

  // Mock Anthropic API key (would need real key for actual extraction)
  const mockApiKey = Deno.env.get("ANTHROPIC_API_KEY") || "test-key";

  if (mockApiKey === "test-key") {
    console.log("⚠️  WARNING: Using mock API key. Set ANTHROPIC_API_KEY for real extraction.\n");
  }

  try {
    // Progress callback to track extraction phases
    const progressEvents: any[] = [];
    const onProgress = (event: any) => {
      progressEvents.push(event);
      console.log(`📊 Progress: ${event.phase || event.type} - ${event.message || 'Processing...'}`);
    };

    console.log("📰 Starting extraction from Block Club Chicago article...\n");

    const result = await extractBlockClubChicagoEnhanced(
      mockHtml,
      mockMarkdown,
      sourceUrl,
      mockApiKey,
      onProgress
    );

    console.log("\n" + "=".repeat(70));
    console.log("✅ EXTRACTION COMPLETE\n");

    console.log("📊 Results Summary:");
    console.log(`   - Booths extracted: ${result.booths.length}`);
    console.log(`   - Errors: ${result.errors.length}`);
    console.log(`   - Extraction time: ${result.metadata.extraction_time_ms}ms`);
    console.log(`   - Pages processed: ${result.metadata.pages_processed}`);

    if (result.metadata.completenessScore !== undefined) {
      console.log(`   - Data completeness: ${result.metadata.completenessScore}%`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("📍 Extracted Booths:\n");

    result.booths.forEach((booth, index) => {
      console.log(`${index + 1}. ${booth.name}`);
      console.log(`   Address: ${booth.address || 'N/A'}`);
      console.log(`   City: ${booth.city || 'N/A'}, State: ${booth.state || 'N/A'}`);
      console.log(`   Country: ${booth.country}`);
      console.log(`   Status: ${booth.status} (Operational: ${booth.is_operational})`);
      console.log(`   Type: ${booth.booth_type || 'N/A'}`);
      console.log(`   Manufacturer: ${booth.machine_manufacturer || 'N/A'}`);
      console.log(`   Cost: ${booth.cost || 'N/A'}`);

      if (booth.description) {
        const shortDesc = booth.description.substring(0, 150);
        console.log(`   Description: ${shortDesc}${booth.description.length > 150 ? '...' : ''}`);
      }
      console.log("");
    });

    if (result.metadata.activeBooths !== undefined) {
      console.log("=".repeat(70));
      console.log("📈 Data Quality Metrics:\n");
      console.log(`   Total booths: ${result.metadata.totalBooths}`);
      console.log(`   Active booths: ${result.metadata.activeBooths}`);
      console.log(`   Inactive booths: ${result.metadata.inactiveBooths}`);
      console.log(`   With addresses: ${result.metadata.withAddresses}`);
      console.log(`   With neighborhoods: ${result.metadata.withNeighborhoods}`);
      console.log(`   With machine info: ${result.metadata.withMachineInfo}`);
      console.log(`   With historical info: ${result.metadata.withHistoricalInfo}`);
      console.log(`   With operator info: ${result.metadata.withOperatorInfo}`);
    }

    if (result.errors.length > 0) {
      console.log("\n" + "=".repeat(70));
      console.log("⚠️  Errors:");
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎉 Test completed successfully!");

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error);
    Deno.exit(1);
  }
}

// Run the test
if (import.meta.main) {
  testBlockClubChicagoExtractor();
}
