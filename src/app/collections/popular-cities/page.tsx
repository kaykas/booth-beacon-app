import { Metadata } from 'next';
import Link from 'next/link';
import { createPublicServerClient } from '@/lib/supabase';
import { generateAIMetaTags, generateContentFreshnessSignals } from '@/lib/ai-meta-tags';

const baseUrl = 'https://boothbeacon.org';

const aiTags = generateAIMetaTags({
  summary: 'Explore photo booths in the world\'s most popular cities including Berlin, New York, London, Paris, and Tokyo. Discover top destinations for analog photo booth enthusiasts with the highest concentration of vintage photochemical machines worldwide.',
  keyConcepts: [
    'photo booths by city',
    'popular photo booth cities',
    'Berlin photo booths',
    'NYC photo booths',
    'London photo booths',
    'Paris photo booths',
    'top photo booth destinations',
  ],
  contentStructure: 'directory',
  expertiseLevel: 'beginner',
  perspective: 'commercial',
  authority: 'community',
});

const freshnessSignals = generateContentFreshnessSignals({
  publishedDate: '2024-11-01T00:00:00Z',
  modifiedDate: new Date().toISOString(),
  revisedDate: new Date().toISOString().split('T')[0],
});

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: 'Popular Photo Booth Cities | Top Destinations | Booth Beacon',
  description: 'Explore photo booths in popular cities worldwide including Berlin, New York, London, Paris, and Tokyo. Discover top destinations with the highest concentration of vintage analog machines.',
  keywords: [
    'photo booths by city',
    'popular photo booth cities',
    'Berlin photo booths',
    'NYC photo booths',
    'London photo booths',
    'top destinations',
  ],
  openGraph: {
    title: 'Popular Photo Booth Cities | Top Destinations',
    description: 'Explore photo booths in popular cities worldwide.',
    type: 'website',
    url: `${baseUrl}/collections/popular-cities`,
    siteName: 'Booth Beacon',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Popular Photo Booth Cities | Top Destinations',
    description: 'Explore photo booths in popular cities worldwide.',
  },
  alternates: {
    canonical: `${baseUrl}/collections/popular-cities`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    ...aiTags,
    ...freshnessSignals,
  },
};

export default async function PopularCitiesPage() {
  const supabase = createPublicServerClient();

  // Fetch all booths with city information
  const { data: booths, error } = await supabase
    .from('booths')
    .select('slug, name, city, state, country, machine_model, latitude, longitude')
    .eq('status', 'active')
    .not('slug', 'is', null)
    .not('city', 'is', null)
    .neq('name', 'N/A')
    .neq('name', '')
    .neq('data_source_type', 'invalid_extraction');

  if (error) {
    console.error('Error fetching popular cities:', error);
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Error loading popular cities</h1>
        <p>Please try again later.</p>
      </div>
    );
  }

  const allBooths = booths || [];

  // Count booths by city
  const cityCounts: Record<string, { count: number; country: string; booths: typeof allBooths }> = {};

  allBooths.forEach((booth) => {
    if (!booth.city) return;

    const cityKey = `${booth.city}, ${booth.country}`;
    if (!cityCounts[cityKey]) {
      cityCounts[cityKey] = {
        count: 0,
        country: booth.country || '',
        booths: [],
      };
    }
    cityCounts[cityKey].count++;
    cityCounts[cityKey].booths.push(booth);
  });

  // Sort cities by booth count
  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 30); // Top 30 cities

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <nav className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          {' / '}
          <Link href="/collections" className="hover:text-blue-600">Collections</Link>
          {' / '}
          <span className="text-gray-900 dark:text-gray-100">Popular Cities</span>
        </nav>
        <h1 className="text-4xl font-bold mb-4">Popular Photo Booth Cities</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Explore photo booths in the world's top {topCities.length} cities for analog photography enthusiasts.
          Discover destinations with the highest concentration of vintage photo machines.
        </p>
      </header>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Popular Photo Booth Cities',
            description: 'Cities with the highest concentration of analog photo booths worldwide',
            url: `${baseUrl}/collections/popular-cities`,
          }),
        }}
      />

      {topCities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">No cities found.</p>
          <Link href="/search" className="text-blue-600 hover:underline mt-4 inline-block">
            Search all booths
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Top 10 Cities - Featured */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Top 10 Cities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {topCities.slice(0, 10).map(([cityName, data], index) => {
                const [city, country] = cityName.split(', ');
                const citySlug = city.toLowerCase().replace(/\s+/g, '-');
                const countrySlug = country.toLowerCase().replace(/\s+/g, '-');

                return (
                  <article
                    key={cityName}
                    className="border-2 border-blue-200 dark:border-blue-700 rounded-lg p-6 hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            #{index + 1}
                          </span>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {city}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {country}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {data.count}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          booth{data.count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Sample booths */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        Featured Booths:
                      </h4>
                      <ul className="space-y-1">
                        {data.booths.slice(0, 3).map((booth) => (
                          <li key={booth.slug}>
                            <Link
                              href={`/booth/${booth.slug}`}
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                            >
                              • {booth.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      href={`/locations/${countrySlug}/${citySlug}`}
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                    >
                      View All {data.count} Booths →
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Other Popular Cities */}
          {topCities.length > 10 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Other Popular Cities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {topCities.slice(10).map(([cityName, data]) => {
                  const [city, country] = cityName.split(', ');
                  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
                  const countrySlug = country.toLowerCase().replace(/\s+/g, '-');

                  return (
                    <article
                      key={cityName}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
                    >
                      <Link href={`/locations/${countrySlug}/${citySlug}`} className="block">
                        <h3 className="font-semibold text-lg mb-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          {city}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {country}
                        </p>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {data.count}
                        </div>
                        <div className="text-xs text-gray-500">
                          booth{data.count !== 1 ? 's' : ''}
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* All Cities Summary */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Browse by Region</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/locations"
                className="p-4 bg-white dark:bg-gray-700 rounded-lg hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold mb-2">All Locations</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Browse booths by country and city
                </p>
              </Link>
              <Link
                href="/map"
                className="p-4 bg-white dark:bg-gray-700 rounded-lg hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold mb-2">Map View</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Explore booths on an interactive map
                </p>
              </Link>
              <Link
                href="/search"
                className="p-4 bg-white dark:bg-gray-700 rounded-lg hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold mb-2">Advanced Search</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Filter by city, machine type, and more
                </p>
              </Link>
            </div>
          </section>
        </div>
      )}

      <div className="mt-12 text-center border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-2xl font-bold mb-4">Explore More Collections</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/collections/vintage-machines"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Vintage Machines
          </Link>
          <Link
            href="/collections/recently-verified"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Recently Verified
          </Link>
          <Link
            href="/browse/all"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Browse All
          </Link>
        </div>
      </div>
    </main>
  );
}
