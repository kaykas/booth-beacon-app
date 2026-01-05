/**
 * Revalidate Location Pages
 *
 * Forces Next.js ISR cache to regenerate for specific location pages
 * Use this after database changes that affect location page counts
 */

async function revalidateLocationPages() {
  const baseUrl = 'https://boothbeacon.org';

  // Key pages to revalidate
  const paths = [
    '/locations/united-states/ny/new-york',
    '/locations/united-states/ca/san-francisco',
    '/locations/united-states',
    '/locations',
  ];

  console.log('🔄 Revalidating location pages...\n');

  for (const path of paths) {
    try {
      const url = `${baseUrl}${path}`;
      console.log(`Fetching ${url} ...`);

      // Fetch with cache-busting header
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (response.ok) {
        console.log(`  ✅ Revalidated successfully\n`);
      } else {
        console.log(`  ❌ Failed with status ${response.status}\n`);
      }

      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ❌ Error:`, error);
    }
  }

  console.log('✅ Revalidation requests sent!');
  console.log('\n💡 Note: ISR pages may take a few seconds to regenerate.');
  console.log('   Try hard refresh (Cmd+Shift+R) if you still see old data.');
}

revalidateLocationPages();
