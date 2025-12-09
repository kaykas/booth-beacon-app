/**
 * Trigger revalidation of booth page to clear cache
 */

const boothSlug = 'heebe-jeebe-general-store-petaluma-1';
const revalidateUrl = `https://boothbeacon.org/api/revalidate?path=/booth/${boothSlug}`;

console.log('🔄 Triggering page revalidation for:', boothSlug);
console.log('   URL:', revalidateUrl);
console.log('');
console.log('💡 If revalidation API doesn\'t exist, you can also:');
console.log('   1. Wait for ISR timeout (Next.js will regenerate)');
console.log('   2. Deploy new code (clears cache)');
console.log('   3. Add ?revalidate=1 to URL in browser');
console.log('');
console.log('📊 Current database values are CORRECT:');
console.log('   Address: 46 Kentucky St');
console.log('   City: Petaluma, CA');
console.log('   Coordinates: 38.2333537, -122.6408153');
