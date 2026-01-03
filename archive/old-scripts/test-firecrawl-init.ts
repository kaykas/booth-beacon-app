import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js';

console.log('\n=== Testing Firecrawl V1 API (Fixed Import) ===\n');

// Test environment variables
console.log('1. Environment Variables:');
console.log('   FIRECRAWL_API_KEY:', process.env.FIRECRAWL_API_KEY ? `${process.env.FIRECRAWL_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('   ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? `${process.env.ANTHROPIC_API_KEY.substring(0, 10)}...` : 'NOT SET');

// Test Firecrawl import
console.log('\n2. FirecrawlApp Import:');
console.log('   Type:', typeof FirecrawlApp);
console.log('   Constructor:', FirecrawlApp.prototype?.constructor?.name || 'Unknown');

// Test Firecrawl initialization
console.log('\n3. Attempting to Initialize:');
try {
  const firecrawl = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY || 'dummy-key-for-testing'
  });
  console.log('   ✅ Initialization successful');
  console.log('   Instance type:', typeof firecrawl);
  console.log('   Has scrapeUrl:', typeof firecrawl.scrapeUrl);
  console.log('   scrapeUrl is:', firecrawl.scrapeUrl);

  // List all methods
  console.log('\n4. Available methods:');
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(firecrawl));
  methods.forEach(method => {
    if (typeof (firecrawl as any)[method] === 'function') {
      console.log(`   - ${method}()`);
    }
  });

  // Test actual scrape call (with error handling)
  console.log('\n5. Testing scrapeUrl method call:');
  if (process.env.FIRECRAWL_API_KEY && process.env.FIRECRAWL_API_KEY !== 'dummy-key-for-testing') {
    (async () => {
      try {
        const result = await firecrawl.scrapeUrl('https://httpbin.org/html', {
          formats: ['markdown'],
          timeout: 10000
        });
        console.log('   ✅ scrapeUrl call successful');
        console.log('   Result success:', result.success);
      } catch (err: any) {
        console.error('   ❌ scrapeUrl call failed:', err.message);
      }
    })();
  } else {
    console.log('   ⚠️ Skipping (no valid API key)');
  }
} catch (err: any) {
  console.error('   ❌ Initialization failed:', err.message);
  console.error('   Stack:', err.stack);
}
