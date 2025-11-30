import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface Booth {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  photo_exterior_url?: string;
  booth_type?: string;
}

interface CityGuideData {
  slug: string;
  city: string;
  country: string;
  title: string;
  description: string;
  booth_ids: string[];
  estimated_time: string;
  tips: string;
  published: boolean;
}

const CITIES = [
  { name: 'New York', country: 'USA', state: 'NY' },
  { name: 'Berlin', country: 'Germany', state: null },
  { name: 'London', country: 'United Kingdom', state: null },
  { name: 'Los Angeles', country: 'USA', state: 'CA' },
  { name: 'Chicago', country: 'USA', state: 'IL' }
];

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Order booths by geographic proximity for efficient route
function orderBoothsByProximity(booths: Booth[]): Booth[] {
  if (booths.length <= 1) return booths;

  const ordered: Booth[] = [booths[0]];
  const remaining = [...booths.slice(1)];

  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let closestIndex = 0;
    let closestDistance = Infinity;

    remaining.forEach((booth, index) => {
      const distance = calculateDistance(
        last.latitude,
        last.longitude,
        booth.latitude,
        booth.longitude
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    ordered.push(remaining[closestIndex]);
    remaining.splice(closestIndex, 1);
  }

  return ordered;
}

// Generate city-specific tips
function generateCityTips(city: string): string {
  const tipsMap: Record<string, string> = {
    'New York': `• Start in Manhattan (Lower East Side has a great cluster) and work your way to Brooklyn
• Many booths are inside bars and venues - check opening hours first
• Bring $5-10 in cash for photo sessions
• Weekend afternoons are best for exploring neighborhoods`,

    'Berlin': `• Most booths are concentrated in Mitte, Kreuzberg, and Friedrichshain
• Many are in bars/clubs that open late - afternoon visits work best
• Have 4-5 euros in coins ready
• Some locations require purchasing a drink for access`,

    'London': `• Focus on East London (Shoreditch, Dalston) and Soho areas
• Pub-based booths require entry, so plan around their hours
• Bring £5-10 in coins and small notes
• Transport between locations is easy via the Tube`,

    'Los Angeles': `• Locations are spread out - having a car is essential
• Start with clustered areas like Silver Lake or Echo Park
• Most booths are in bars/restaurants - check hours before visiting
• Bring $5-10 cash, some locations are cash-only`,

    'Chicago': `• Start in Logan Square and work through Wicker Park
• Winter visits: call ahead to confirm booth is working
• Most locations are in bars - afternoon/early evening is ideal
• Bring $5-10 in cash and dress for the weather`
  };

  return tipsMap[city] || `• Check booth locations and hours before visiting
• Bring $5-10 in cash for photos
• Many booths are in bars/venues - timing matters
• Allow 30-45 minutes per booth location`;
}

// Generate guide description
function generateDescription(city: string, country: string, count: number): string {
  return `Discover ${count} authentic analog photo booths across ${city}. From vintage chemical-process machines to modern analog strips, this curated route takes you through the city's best photo booth locations. Experience the magic of analog photography while exploring ${city}'s neighborhoods and local spots.`;
}

// Fetch booths for a city
async function fetchBoothsForCity(
  city: string,
  country: string,
  state: string | null
): Promise<Booth[]> {
  console.log(`\n🔍 Querying booths for ${city}, ${country}...`);

  let query = supabase
    .from('booths')
    .select('id, name, city, latitude, longitude, photo_exterior_url, booth_type')
    .eq('city', city)
    .eq('country', country)
    .eq('status', 'active')
    .eq('is_operational', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (state) {
    query = query.eq('state', state);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`❌ Error querying booths:`, error.message);
    return [];
  }

  if (!data || data.length === 0) {
    console.log(`⚠️  No active booths found for ${city}`);
    return [];
  }

  console.log(`📍 Found ${data.length} active booths with coordinates`);

  // Score booths and sort by quality
  const scoredBooths = data.map((booth) => ({
    booth: booth as Booth,
    score:
      (booth.photo_exterior_url ? 2 : 0) +
      (booth.booth_type === 'analog' || booth.booth_type === 'chemical' ? 3 : 0)
  }));

  // Sort by score descending, then by name
  scoredBooths.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.booth.name.localeCompare(b.booth.name);
  });

  // Take top 5-10 booths
  const selectedBooths = scoredBooths
    .slice(0, Math.min(10, scoredBooths.length))
    .map((sb) => sb.booth);

  console.log(`✨ Selected ${selectedBooths.length} high-quality booths`);
  console.log(
    `   - With photos: ${selectedBooths.filter((b) => b.photo_exterior_url).length}`
  );
  console.log(
    `   - Analog/Chemical: ${selectedBooths.filter((b) => b.booth_type === 'analog' || b.booth_type === 'chemical').length}`
  );

  return selectedBooths;
}

// Create guide for a city
async function createCityGuide(
  city: string,
  country: string,
  state: string | null
): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📖 Creating guide for ${city}, ${country}`);
  console.log('='.repeat(60));

  // Fetch booths
  const booths = await fetchBoothsForCity(city, country, state);

  if (booths.length < 5) {
    console.log(`⏭️  Skipping ${city} - needs at least 5 booths (found ${booths.length})`);
    return false;
  }

  // Order by proximity for efficient route
  console.log(`🗺️  Ordering booths by geographic proximity...`);
  const orderedBooths = orderBoothsByProximity(booths);

  // Calculate estimated time (30-45 min per booth + travel)
  const baseTime = orderedBooths.length * 35; // 35 minutes average per booth
  const hours = Math.floor(baseTime / 60);
  const estimatedTime =
    hours >= 3
      ? `${hours}-${hours + 1} hours`
      : `${Math.floor(baseTime / 60)}-${Math.ceil((baseTime + 30) / 60)} hours`;

  // Build guide data
  const slug = city.toLowerCase().replace(/\s+/g, '-');
  const guideData: CityGuideData = {
    slug,
    city,
    country,
    title: `The Ultimate ${city} Photo Booth Tour`,
    description: generateDescription(city, country, orderedBooths.length),
    booth_ids: orderedBooths.map((b) => b.id),
    estimated_time: estimatedTime,
    tips: generateCityTips(city),
    published: true
  };

  console.log(`\n📝 Guide details:`);
  console.log(`   Title: ${guideData.title}`);
  console.log(`   Booths: ${guideData.booth_ids.length}`);
  console.log(`   Estimated time: ${guideData.estimated_time}`);
  console.log(`   Slug: ${guideData.slug}`);

  // Insert guide
  const { error } = await supabase
    .from('city_guides')
    .upsert(guideData, { onConflict: 'slug' });

  if (error) {
    console.error(`❌ Failed to create guide for ${city}:`, error.message);
    return false;
  }

  console.log(`✅ Successfully created guide for ${city}!`);
  console.log(`   Route order:`);
  orderedBooths.forEach((booth, idx) => {
    console.log(`   ${idx + 1}. ${booth.name}`);
  });

  return true;
}

// Main execution
async function seed() {
  console.log('🌱 Booth Beacon City Guides Seeder');
  console.log('===================================\n');
  console.log(`Creating guides for ${CITIES.length} cities...`);

  let successCount = 0;
  let skipCount = 0;

  for (const { name, country, state } of CITIES) {
    const success = await createCityGuide(name, country, state);
    if (success) {
      successCount++;
    } else {
      skipCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log(`✅ Guides created: ${successCount}`);
  console.log(`⏭️  Cities skipped: ${skipCount}`);
  console.log(`📖 Total guides: ${successCount}\n`);

  if (successCount > 0) {
    console.log('🎉 City guides seeded successfully!');
    console.log('   View them at: /guides/[city-slug]');
  }
}

// Run the seeder
seed().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
