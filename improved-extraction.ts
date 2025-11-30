/**
 * IMPROVED EXTRACTION - Better AI prompts for different source types
 */

import { createClient } from '@supabase/supabase-js';
import { FirecrawlAppV1 } from '@mendable/firecrawl-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const firecrawl = new FirecrawlAppV1({ apiKey: FIRECRAWL_API_KEY });

// IMPROVED: Source-type-specific prompts
const PROMPTS = {
  cityGuide: `You are extracting photo booth locations from a city guide article or blog post.

CRITICAL INSTRUCTIONS:
1. Look for venue names, bar names, restaurant names where photo booths are mentioned
2. Extract addresses when provided - they might be in different formats
3. If only a neighborhood is mentioned (e.g., "Silver Lake", "Wicker Park"), that's okay - include it
4. Extract ANY pricing information mentioned (e.g., "$5", "free", "$1.50")
5. Look for phrases like "located at", "find it at", "address:", venue descriptions
6. Include ALL venues mentioned, even if details are sparse
7. The content will be in markdown format with headings, numbered lists, or narrative text

IMPORTANT PATTERNS TO LOOK FOR:
- Numbered lists: "1. Venue Name" or "## Venue Name"
- Inline mentions: "You can find a booth at [Venue Name] in [Location]"
- Address patterns: "123 Main St", "at 456 Oak Ave", "located at 789 Park"
- Neighborhood mentions: "in Silver Lake", "Wicker Park location", "on the Lower East Side"

Return ONLY a JSON array. For each booth:
{
  "name": "Venue name (REQUIRED - extract from heading, number, or inline)",
  "address": "Full street address if available, or just neighborhood/area",
  "city": "City name",
  "country": "Country (infer from article if not stated - if it's about LA, country is USA)",
  "cost": "Price if mentioned (e.g. '$5', 'free', '$1.50')",
  "description": "Brief description or venue type if mentioned",
  "status": "active"
}

If a venue is mentioned but some fields are missing, STILL INCLUDE IT. It's better to have partial data than no data.`,

  directory: `You are extracting photo booth locations from a directory or listing page.

CRITICAL INSTRUCTIONS:
1. Extract ALL booth entries - this is a comprehensive directory
2. Look for structured data: names, addresses, cities, countries
3. Extract coordinates if provided (lat/lng or coordinates)
4. Extract machine types/models if mentioned
5. Look for status indicators (active, closed, removed)
6. Extract any pricing, hours, or contact information

Return ONLY a JSON array with complete booth data:
{
  "name": "Location or venue name",
  "address": "Full street address",
  "city": "City",
  "country": "Country",
  "lat": number or null,
  "lng": number or null,
  "machine_type": "Type of machine if mentioned",
  "cost": "Price if mentioned",
  "status": "active" or "closed"
}`,

  museum: `You are extracting photo booth museum and permanent installation locations.

CRITICAL INSTRUCTIONS:
1. Look for museum addresses, hours, admission prices
2. Extract permanent installation locations at venues
3. Look for structured data like JSON-LD or schema.org markup
4. Extract complete address information including ZIP codes
5. Extract hours of operation and admission prices

Return ONLY a JSON array with museum/installation data:
{
  "name": "Museum or venue name",
  "address": "Complete street address with ZIP",
  "city": "City",
  "country": "Country",
  "lat": number or null,
  "lng": number or null,
  "cost": "Admission or per-strip price",
  "hours": "Hours of operation if mentioned",
  "machine_type": "analog",
  "status": "active"
}`
};

interface BoothData {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  machine_type?: string;
  cost?: string;
  description?: string;
  hours?: string;
  status?: string;
}

function detectSourceType(url: string, sourceName: string): keyof typeof PROMPTS {
  const urlLower = url.toLowerCase();
  const nameLower = sourceName.toLowerCase();

  if (urlLower.includes('timeout.com') ||
      urlLower.includes('blockclub') ||
      nameLower.includes('guide') ||
      nameLower.includes('blog')) {
    return 'cityGuide';
  }

  if (urlLower.includes('photomatica') ||
      nameLower.includes('museum') ||
      nameLower.includes('installation')) {
    return 'museum';
  }

  return 'directory';
}

async function extractBoothsImproved(
  content: string,
  sourceUrl: string,
  sourceName: string
): Promise<BoothData[]> {
  const sourceType = detectSourceType(sourceUrl, sourceName);
  const systemPrompt = PROMPTS[sourceType];

  console.log(`  🎯 Using ${sourceType} extraction strategy`);

  const prompt = `${systemPrompt}

CONTENT TO EXTRACT FROM:
${content.substring(0, 50000)}

Return ONLY a valid JSON array of booth objects. No markdown, no explanations, just the JSON array.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8192, // Increased for longer responses
        temperature: 0.3, // Lower temp for more accurate extraction
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      console.error('  ❌ Claude API Error:', response.status);
      return [];
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Try to extract JSON - handle different response formats
    let jsonMatch = text.match(/\[[\s\S]*\]/);

    // If no array found, try to find JSON object and wrap it
    if (!jsonMatch) {
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonMatch = [`[${objMatch[0]}]`];
      }
    }

    if (!jsonMatch) {
      console.log('  ⚠️  No JSON found in response');
      console.log('  Response preview:', text.substring(0, 500));
      return [];
    }

    const booths = JSON.parse(jsonMatch[0]);

    // Validate and clean data
    const validBooths = booths.filter((booth: any) => {
      if (!booth.name || booth.name.trim() === '') return false;
      if (booth.name.toLowerCase() === 'unknown') return false;
      if (booth.name.length < 3) return false;
      return true;
    });

    console.log(`  ✓ Extracted ${validBooths.length} booths (filtered from ${booths.length})`);
    return validBooths;

  } catch (error: any) {
    console.error('  ❌ Extraction failed:', error.message);
    return [];
  }
}

async function testImprovedExtraction() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING IMPROVED EXTRACTION');
  console.log('='.repeat(80) + '\n');

  // Test on TimeOut LA (20,996 chars, currently 0 booths)
  const testURL = 'https://www.timeout.com/los-angeles/news/vintage-photo-booths-are-having-a-moment-we-found-some-of-l-a-s-remaining-ones-121324';
  const testName = 'Time Out LA';

  console.log(`Testing: ${testName}`);
  console.log(`URL: ${testURL}\n`);

  try {
    // Crawl
    console.log('📡 Step 1: Crawling with Firecrawl...');
    const scrapeResult = await firecrawl.scrapeUrl(testURL, {
      formats: ['markdown', 'html']
    });

    if (!scrapeResult.success) {
      console.error('❌ Firecrawl failed');
      return;
    }

    const content = scrapeResult.markdown || '';
    console.log(`✓ Crawled: ${content.length} chars\n`);

    // Show content preview
    console.log('📄 Content Preview:');
    console.log('-'.repeat(80));
    console.log(content.substring(0, 1000));
    console.log('-'.repeat(80) + '\n');

    // Extract with improved prompt
    console.log('🤖 Step 2: Extracting with IMPROVED prompt...');
    const booths = await extractBoothsImproved(content, testURL, testName);

    if (booths.length > 0) {
      console.log('\n🎉 SUCCESS! Booths extracted:');
      console.log('='.repeat(80));
      booths.forEach((booth, i) => {
        console.log(`${i + 1}. ${booth.name}`);
        if (booth.address) console.log(`   Address: ${booth.address}`);
        if (booth.city) console.log(`   Location: ${booth.city}, ${booth.country || 'USA'}`);
        if (booth.cost) console.log(`   Cost: ${booth.cost}`);
        if (booth.description) console.log(`   Note: ${booth.description}`);
        console.log('');
      });
      console.log('='.repeat(80));
      console.log(`\n✅ IMPROVED: ${booths.length} booths (was 0 with old prompt)`);
    } else {
      console.log('\n⚠️  Still 0 booths - content may not contain booth listings');
      console.log('This might be an article ABOUT booths, not a directory');
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
}

testImprovedExtraction().catch(console.error);
