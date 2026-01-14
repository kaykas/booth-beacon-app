import { Metadata } from 'next';
import Link from 'next/link';
import { createPublicServerClient } from '@/lib/supabase';
import { generateAIMetaTags, generateContentFreshnessSignals } from '@/lib/ai-meta-tags';

const baseUrl = 'https://boothbeacon.org';

const aiTags = generateAIMetaTags({
  summary: 'Explore recently verified analog photo booths added to our directory within the last 60 days. Discover newly confirmed vintage photo machines, freshly validated locations, and the latest additions to our community-driven photo booth database worldwide.',
  keyConcepts: [
    'recently verified photo booths',
    'newly confirmed booths',
    'latest photo booth additions',
    'fresh booth listings',
    'verified analog booths',
    'new photo booth locations',
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
  title: 'Recently Verified Photo Booths | Latest Additions | Booth Beacon',
  description: 'Explore recently verified analog photo booths added within the last 60 days. Discover newly confirmed vintage machines and freshly validated locations worldwide.',
  keywords: [
    'recently verified photo booths',
    'newly confirmed booths',
    'latest additions',
    'fresh booth listings',
    'verified analog booths',
    'new locations',
  ],
  openGraph: {
    title: 'Recently Verified Photo Booths | Latest Additions',
    description: 'Explore recently verified analog photo booths added within the last 60 days.',
    type: 'website',
    url: `${baseUrl}/collections/recently-verified`,
    siteName: 'Booth Beacon',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recently Verified Photo Booths | Latest Additions',
    description: 'Explore recently verified analog photo booths added within the last 60 days.',
  },
  alternates: {
    canonical: `${baseUrl}/collections/recently-verified`,
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

export default async function RecentlyVerifiedPage() {
  const supabase = createPublicServerClient();

  // Calculate date 60 days ago
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const sixtyDaysAgoISO = sixtyDaysAgo.toISOString();

  // Fetch recently verified booths (created or updated in last 60 days)
  const { data: booths, error } = await supabase
    .from('booths')
    .select('slug, name, city, state, country, machine_model, created_at, updated_at, cost, latitude, longitude')
    .eq('status', 'active')
    .not('slug', 'is', null)
    .neq('name', 'N/A')
    .neq('name', '')
    .neq('data_source_type', 'invalid_extraction')
    .gte('created_at', sixtyDaysAgoISO)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching recently verified booths:', error);
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Error loading recently verified booths</h1>
        <p>Please try again later.</p>
      </div>
    );
  }

  const recentBooths = booths || [];

  // Group by weeks
  const now = new Date();
  const thisWeek: typeof recentBooths = [];
  const lastWeek: typeof recentBooths = [];
  const last30Days: typeof recentBooths = [];
  const last60Days: typeof recentBooths = [];

  recentBooths.forEach((booth) => {
    const createdDate = new Date(booth.created_at);
    const daysAgo = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysAgo <= 7) {
      thisWeek.push(booth);
    } else if (daysAgo <= 14) {
      lastWeek.push(booth);
    } else if (daysAgo <= 30) {
      last30Days.push(booth);
    } else {
      last60Days.push(booth);
    }
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <nav className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          {' / '}
          <Link href="/collections" className="hover:text-blue-600">Collections</Link>
          {' / '}
          <span className="text-gray-900 dark:text-gray-100">Recently Verified</span>
        </nav>
        <h1 className="text-4xl font-bold mb-4">Recently Verified Photo Booths</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Discover {recentBooths.length} analog photo booths verified in the last 60 days.
          Fresh additions to our community-driven directory, updated hourly.
        </p>
      </header>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Recently Verified Photo Booths',
            description: 'Recently verified analog photo booths added in the last 60 days',
            url: `${baseUrl}/collections/recently-verified`,
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
          <p className="text-xl text-gray-600">No recently verified booths found.</p>
          <Link href="/search" className="text-blue-600 hover:underline mt-4 inline-block">
            Search all booths
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* This Week */}
          {thisWeek.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded">
                  This Week
                </span>
                <span className="text-gray-500 text-lg">({thisWeek.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {thisWeek.map((booth) => {
                  const location = [booth.city, booth.state, booth.country]
                    .filter(Boolean)
                    .join(', ');
                  const daysAgo = Math.floor(
                    (Date.now() - new Date(booth.created_at).getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <article
                      key={booth.slug}
                      className="border-2 border-green-200 dark:border-green-700 rounded-lg p-4 hover:shadow-lg transition-shadow bg-green-50 dark:bg-gray-800"
                    >
                      <Link href={`/booth/${booth.slug}`} className="block">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="inline-block px-2 py-1 text-xs font-bold bg-green-600 text-white rounded">
                            NEW
                          </span>
                          <span className="text-xs text-gray-500">
                            {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          {booth.name}
                        </h3>
                        {location && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            📍 {location}
                          </p>
                        )}
                        {booth.machine_model && (
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            🎞️ {booth.machine_model}
                          </p>
                        )}
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Last Week */}
          {lastWeek.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-gray-700 dark:text-gray-300">Last Week</span>
                <span className="text-gray-500 text-lg">({lastWeek.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lastWeek.map((booth) => {
                  const location = [booth.city, booth.state, booth.country]
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <article
                      key={booth.slug}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
                    >
                      <Link href={`/booth/${booth.slug}`} className="block">
                        <h3 className="text-lg font-semibold mb-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          {booth.name}
                        </h3>
                        {location && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            📍 {location}
                          </p>
                        )}
                        {booth.machine_model && (
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            🎞️ {booth.machine_model}
                          </p>
                        )}
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Last 30 Days */}
          {last30Days.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-gray-700 dark:text-gray-300">Last 30 Days</span>
                <span className="text-gray-500 text-lg">({last30Days.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {last30Days.map((booth) => {
                  const location = [booth.city, booth.state, booth.country]
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <article
                      key={booth.slug}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-lg transition-shadow"
                    >
                      <Link href={`/booth/${booth.slug}`} className="block">
                        <h3 className="text-base font-semibold mb-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          {booth.name}
                        </h3>
                        {location && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            📍 {location}
                          </p>
                        )}
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Last 60 Days */}
          {last60Days.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-gray-700 dark:text-gray-300">31-60 Days Ago</span>
                <span className="text-gray-500 text-lg">({last60Days.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {last60Days.map((booth) => {
                  const location = [booth.city, booth.state, booth.country]
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <article
                      key={booth.slug}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-lg transition-shadow"
                    >
                      <Link href={`/booth/${booth.slug}`} className="block">
                        <h3 className="text-sm font-semibold mb-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 line-clamp-2">
                          {booth.name}
                        </h3>
                        {location && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            📍 {location}
                          </p>
                        )}
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
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
            href="/collections/popular-cities"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Popular Cities
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
