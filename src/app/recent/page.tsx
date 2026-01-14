import { Metadata } from 'next';
import Link from 'next/link';
import { createPublicServerClient } from '@/lib/supabase';
import { generateAIMetaTags, generateContentFreshnessSignals } from '@/lib/ai-meta-tags';

const baseUrl = 'https://boothbeacon.org';

// Generate AI meta tags
const aiTags = generateAIMetaTags({
  summary: 'Browse 100 recently updated analog photo booths from around the world. Discover newly verified vintage photo machines, updated booth information, and the latest additions to our community-driven directory. Fresh content updated daily.',
  keyConcepts: [
    'recently added photo booths',
    'new photo booth listings',
    'updated vintage booths',
    'fresh booth content',
    'latest analog photo machines',
    'newly verified photo booths',
    'recent booth updates',
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

export const revalidate = 3600; // Revalidate every hour for fresh content

export const metadata: Metadata = {
  title: 'Recently Updated Photo Booths | Latest Additions | Booth Beacon',
  description: 'Explore 100 recently updated analog photo booths worldwide. Discover newly verified vintage machines, updated booth information, and the latest additions to our growing community directory.',
  keywords: [
    'recently added photo booths',
    'new photo booth listings',
    'latest vintage booths',
    'updated photo machines',
    'fresh booth content',
    'newly verified booths',
  ],
  openGraph: {
    title: 'Recently Updated Photo Booths | Latest Additions',
    description: 'Explore 100 recently updated analog photo booths worldwide. Fresh content updated daily.',
    type: 'website',
    url: `${baseUrl}/recent`,
    siteName: 'Booth Beacon',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recently Updated Photo Booths | Latest Additions',
    description: 'Explore 100 recently updated analog photo booths worldwide. Fresh content updated daily.',
  },
  alternates: {
    canonical: `${baseUrl}/recent`,
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

export default async function RecentPage() {
  const supabase = createPublicServerClient();

  // Fetch 100 most recently updated booths
  const { data: booths, error } = await supabase
    .from('booths')
    .select('slug, name, city, state, country, updated_at, machine_model, latitude, longitude')
    .eq('status', 'active')
    .not('slug', 'is', null)
    .neq('name', 'N/A')
    .neq('name', '')
    .neq('data_source_type', 'invalid_extraction')
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching recent booths:', error);
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Error loading recent booths</h1>
        <p>Please try again later.</p>
      </div>
    );
  }

  const recentBooths = booths || [];

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Recently Updated Photo Booths</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Discover {recentBooths.length} recently updated analog photo booths from around the world.
          Fresh content updated hourly with newly verified machines and booth information.
        </p>
      </header>

      {/* Structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Recently Updated Photo Booths',
            description: 'Browse recently updated analog photo booths worldwide',
            url: `${baseUrl}/recent`,
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: recentBooths.length,
              itemListElement: recentBooths.slice(0, 20).map((booth, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'LocalBusiness',
                  '@id': `${baseUrl}/booth/${booth.slug}`,
                  name: booth.name,
                  url: `${baseUrl}/booth/${booth.slug}`,
                  address: booth.city
                    ? {
                        '@type': 'PostalAddress',
                        addressLocality: booth.city,
                        addressRegion: booth.state || undefined,
                        addressCountry: booth.country || undefined,
                      }
                    : undefined,
                },
              })),
            },
          }),
        }}
      />

      {recentBooths.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">No recent booths found.</p>
          <Link href="/search" className="text-blue-600 hover:underline mt-4 inline-block">
            Search all booths
          </Link>
        </div>
      ) : (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recentBooths.map((booth) => {
              const location = [booth.city, booth.state, booth.country]
                .filter(Boolean)
                .join(', ');

              const updateDate = booth.updated_at
                ? new Date(booth.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Unknown';

              return (
                <article
                  key={booth.slug}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <Link href={`/booth/${booth.slug}`} className="block">
                    <h2 className="text-xl font-semibold mb-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      {booth.name}
                    </h2>
                    {location && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        📍 {location}
                      </p>
                    )}
                    {booth.machine_model && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                        🎞️ {booth.machine_model}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Updated: {updateDate}
                    </p>
                  </Link>
                </article>
              );
            })}
          </div>

          <div className="mt-12 text-center border-t border-gray-200 dark:border-gray-700 pt-8">
            <h2 className="text-2xl font-bold mb-4">Explore More</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/search"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search All Booths
              </Link>
              <Link
                href="/map"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                View Map
              </Link>
              <Link
                href="/browse"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Browse by City
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
