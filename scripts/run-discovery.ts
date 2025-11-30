
import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';
import { DISCOVERY_QUERIES, EXCLUSION_DOMAINS } from '../src/lib/crawler/constants';
import { getAnalogVerificationPrompt } from '../src/lib/crawler/prompts';

// Config
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!FIRECRAWL_API_KEY || !ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const app = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function validateAndExtract(content: string, url: string) {
  const prompt = getAnalogVerificationPrompt(content, url);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) return [];
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.booths || [];
  } catch (e) {
    console.error(`Error validating ${url}:`, e);
    return [];
  }
}

async function runDiscovery() {
  console.log('🕵️‍♂️ Starting Discovery Engine...');

  for (const query of DISCOVERY_QUERIES) {
    console.log(`\n🔎 Searching: ${query}`);

    try {
      const searchResponse = await app.search(query, {
        limit: 10, // Start small to save credits
        scrapeOptions: {
          formats: ['markdown'],
        }
      });

      if (!searchResponse.success) {
        console.error(`Search failed: ${searchResponse.error}`);
        continue;
      }

      const results = searchResponse.data;
      console.log(`Found ${results.length} candidates.`);

      for (const result of results) {
        // 1. Check Exclusion List
        if (EXCLUSION_DOMAINS.some(d => result.url?.includes(d))) {
          console.log(`Skipping excluded domain: ${result.url}`);
          continue;
        }

        console.log(`Analyzing candidate: ${result.title} (${result.url})`);

        // 2. Validate & Extract
        const booths = await validateAndExtract(result.markdown || '', result.url || '');

        if (booths.length > 0) {
          console.log(`💎 FOUND ${booths.length} POTENTIAL BOOTHS!`);
          
          for (const booth of booths) {
            console.log(`   - ${booth.name} (${booth.city}) [${booth.confidence}]`);
            console.log(`     Evidence: ${booth.evidence}`);

            // 3. Save to "Discoveries" (or booths table with 'unverified' status)
            const { error } = await supabase.from('booths').insert({
              name: booth.name,
              address: booth.address,
              city: booth.city,
              country: booth.country,
              description: `Discovered via ${query}. Evidence: ${booth.evidence}`,
              source_urls: [result.url],
              source_primary: 'Discovery Engine',
              status: 'unverified'
            });

            if (error) console.error('Error saving:', error.message);
            else console.log('   ✅ Saved to database');
          }
        } else {
          console.log('   No valid analog booths found.');
        }
      }

    } catch (e) {
      console.error(`Error running query ${query}:`, e);
    }
  }
}

runDiscovery();
