/**
 * Test script for Photomatica.com Enhanced Extractor
 *
 * This script tests the extractPhotomaticaEnhanced() function
 * against the actual Photomatica.com museum pages.
 */

import { extractPhotomaticaEnhanced } from './supabase/functions/unified-crawler/enhanced-extractors.ts';

// Mock HTML and Markdown for LA Museum
const laMuseumMarkdown = `
# Photo Booth Museum Los Angeles

Visit our Los Angeles location at 3827 Sunset Blvd Unit A, Los Angeles, CA 90026

## Hours
- Sunday: 11am - 9pm
- Monday - Wednesday: 1pm - 9pm
- Thursday: 1pm - 11pm
- Friday - Saturday: 11am - 11pm

## About
Experience restored vintage analog photo booths rebuilt by hand with stainless steel and marine-grade wood.
Both analog and digital photo booths available for guest use.

Contact: (415) 466-8700 or info@photomatica.com
`;

const laMuseumHtml = `
<html>
<head>
<script type="application/ld+json">
{
  "@type": "Place",
  "name": "Photo Booth Museum Los Angeles",
  "address": {
    "streetAddress": "3827 Sunset Blvd Unit A",
    "addressLocality": "Los Angeles",
    "addressRegion": "CA",
    "postalCode": "90026",
    "addressCountry": "United States"
  },
  "telephone": "(415) 466-8700",
  "description": "Free admission museum featuring restored vintage analog photo booths"
}
</script>
</head>
<body>
<h1>Photo Booth Museum Los Angeles</h1>
<p>3827 Sunset Blvd Unit A, Los Angeles, CA 90026</p>
</body>
</html>
`;

// Mock progress handler
function mockProgressHandler(event: any) {
  console.log(`[${event.type}] ${event.message || event.phase}`);
}

// Test function
async function testPhotomaticaExtractor() {
  console.log("=== Testing Photomatica.com Enhanced Extractor ===\n");

  // Get API key from environment
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.error("ERROR: ANTHROPIC_API_KEY environment variable not set");
    Deno.exit(1);
  }

  console.log("Test 1: LA Museum Page Extraction");
  console.log("=".repeat(50));

  try {
    const result = await extractPhotomaticaEnhanced(
      laMuseumHtml,
      laMuseumMarkdown,
      'https://www.photomatica.com/photo-booth-museum/los-angeles',
      apiKey,
      mockProgressHandler
    );

    console.log("\n--- Extraction Results ---");
    console.log(`Booths found: ${result.booths.length}`);
    console.log(`Errors: ${result.errors.length}`);
    console.log(`Pages processed: ${result.metadata.pages_processed}`);
    console.log(`Extraction time: ${result.metadata.extraction_time_ms}ms`);

    if (result.booths.length > 0) {
      console.log("\n--- First Booth Details ---");
      const booth = result.booths[0];
      console.log(`Name: ${booth.name}`);
      console.log(`Address: ${booth.address}`);
      console.log(`City: ${booth.city}`);
      console.log(`State: ${booth.state}`);
      console.log(`ZIP: ${booth.postal_code}`);
      console.log(`Country: ${booth.country}`);
      console.log(`Booth Type: ${booth.booth_type}`);
      console.log(`Manufacturer: ${booth.machine_manufacturer}`);
      console.log(`Status: ${booth.status}`);
      console.log(`Operational: ${booth.is_operational}`);
      console.log(`Description: ${booth.description}`);
      console.log(`Phone: ${booth.phone}`);
    }

    if (result.errors.length > 0) {
      console.log("\n--- Errors ---");
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log("\n=== Test Complete ===");
    console.log(`Status: ${result.booths.length > 0 ? '✅ SUCCESS' : '❌ FAILED'}`);

  } catch (error) {
    console.error("\n❌ Test failed with error:");
    console.error(error);
    Deno.exit(1);
  }
}

// Run test if this is the main module
if (import.meta.main) {
  testPhotomaticaExtractor();
}
