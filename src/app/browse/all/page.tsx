import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createPublicServerClient } from '@/lib/supabase';
import { generateAIMetaTags, generateContentFreshnessSignals } from '@/lib/ai-meta-tags';

const baseUrl = 'https://boothbeacon.org';
const PER_PAGE = 50;

// Generate AI meta tags
const aiTags = generateAIMetaTags({
  summary: 'Browse the complete directory of analog photo booths worldwide. Paginated index of all verified vintage photo machines with locations, details, and links to full booth information.',
  keyConcepts: [
    'photo booth directory',
    'browse all booths',
    'complete booth list',
    'photo booth index',
    'analog booth catalog',
    'vintage photo machines',
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
  title: 'Browse All Photo Booths | Complete Directory | Booth Beacon',
  description: 'Browse the complete index of analog photo booths worldwide. Explore our full directory of vintage photo machines organized alphabetically with detailed information and locations.',
  keywords: [
    'photo booth directory',
    'browse all booths',
    'complete booth list',
    'photo booth index',
    'full booth catalog',
  ],
  openGraph: {
    title: 'Browse All Photo Booths | Complete Directory',
    description: 'Browse the complete index of analog photo booths worldwide.',
    type: 'website',
    url: `${baseUrl}/browse/all`,
    siteName: 'Booth Beacon',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse All Photo Booths | Complete Directory',
    description: 'Browse the complete index of analog photo booths worldwide.',
  },
  alternates: {
    canonical: `${baseUrl}/browse/all`,
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

export default async function BrowseAllPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const supabase = createPublicServerClient();
  const page = parseInt(searchParams.page || '1', 10);
  const offset = (page - 1) * PER_PAGE;

  // Fetch total count
  const { count: totalCount } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('slug', 'is', null)
    .neq('name', 'N/A')
    .neq('name', '')
    .neq('data_source_type', 'invalid_extraction');

  // Fetch paginated booths
  const { data: booths, error } = await supabase
    .from('booths')
    .select('slug, name, city, state, country, machine_model, updated_at, latitude, longitude')
    .eq('status', 'active')
    .not('slug', 'is', null)
    .neq('name', 'N/A')
    .neq('name', '')
    .neq('data_source_type', 'invalid_extraction')
    .order('name', { ascending: true })
    .range(offset, offset + PER_PAGE - 1);

  if (error) {
    console.error('Error fetching booths:', error);
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Error loading booths</h1>
        <p>Please try again later.</p>
      </div>
    );
  }

  const allBooths = booths || [];
  const totalPages = Math.ceil((totalCount || 0) / PER_PAGE);

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <nav className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          {' / '}
          <Link href="/browse" className="hover:text-blue-600">Browse</Link>
          {' / '}
          <span className="text-gray-900 dark:text-gray-100">All Booths</span>
        </nav>
        <h1 className="text-4xl font-bold mb-4">Browse All Photo Booths</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Complete directory of {totalCount?.toLocaleString() || 'all'} analog photo booths worldwide,
          organized alphabetically. Page {page} of {totalPages}.
        </p>
      </header>

      {/* Structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Browse All Photo Booths',
            description: 'Complete directory of analog photo booths worldwide',
            url: `${baseUrl}/browse/all?page=${page}`,
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: totalCount || 0,
              itemListElement: allBooths.slice(0, 10).map((booth, index) => ({
                '@type': 'ListItem',
                position: offset + index + 1,
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

      {/* Pagination controls - top */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
          {page > 1 ? (
            <Link
              href={`/browse/all?page=${page - 1}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Link>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
              Previous
            </div>
          )}

          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={`/browse/all?page=${page + 1}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
              Next
              <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </div>
      )}

      {allBooths.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">No booths found.</p>
          <Link href="/search" className="text-blue-600 hover:underline mt-4 inline-block">
            Search for booths
          </Link>
        </div>
      ) : (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allBooths.map((booth) => {
              const location = [booth.city, booth.state, booth.country]
                .filter(Boolean)
                .join(', ');

              return (
                <article
                  key={booth.slug}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <Link href={`/booth/${booth.slug}`} className="block">
                    <h2 className="text-lg font-semibold mb-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      {booth.name}
                    </h2>
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

          {/* Pagination controls - bottom */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              {page > 1 ? (
                <Link
                  href={`/browse/all?page=${page - 1}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Link>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </div>
              )}

              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={`/browse/all?page=${page + 1}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </div>
          )}

          {/* Quick page links */}
          {totalPages > 3 && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {[1, 2, 3, Math.floor(totalPages / 2), totalPages - 2, totalPages - 1, totalPages]
                .filter((p, i, arr) => p > 0 && p <= totalPages && arr.indexOf(p) === i)
                .sort((a, b) => a - b)
                .map((p, i, arr) => (
                  <div key={p} className="flex items-center gap-2">
                    {i > 0 && arr[i - 1] !== p - 1 && (
                      <span className="text-gray-400">...</span>
                    )}
                    <Link
                      href={`/browse/all?page=${p}`}
                      className={`px-3 py-1 rounded ${
                        p === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {p}
                    </Link>
                  </div>
                ))}
            </div>
          )}
        </section>
      )}

      <div className="mt-12 text-center border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-2xl font-bold mb-4">More Ways to Explore</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/map"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            View Map
          </Link>
          <Link
            href="/search"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Advanced Search
          </Link>
          <Link
            href="/recent"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Recently Added
          </Link>
        </div>
      </div>
    </main>
  );
}
