import { Metadata } from 'next';
import Link from 'next/link';
import { createPublicServerClient } from '@/lib/supabase';
import { generateAIMetaTags, generateContentFreshnessSignals } from '@/lib/ai-meta-tags';

const baseUrl = 'https://boothbeacon.org';

// Classic vintage machine models to feature
const VINTAGE_MODELS = [
  'Photo-Me',
  'Photomaton',
  'Fotoautomat',
  'Photomatic',
  'Foto-Me',
  'Photo Booth',
  'Vintage',
];

const aiTags = generateAIMetaTags({
  summary: 'Discover authentic vintage analog photo booths featuring classic machines like Photo-Me, Photomaton, and Fotoautomat. Browse our curated collection of historic photochemical photo booths still operating worldwide with original film processing.',
  keyConcepts: [
    'vintage photo booths',
    'Photo-Me machines',
    'Photomaton booths',
    'Fotoautomat',
    'classic photo booth',
    'analog photo machines',
    'historic photo booths',
    'film photo booths',
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
  title: 'Vintage Photo Booth Machines | Photo-Me, Photomaton, Fotoautomat | Booth Beacon',
  description: 'Discover authentic vintage analog photo booths featuring classic machines like Photo-Me, Photomaton, and Fotoautomat. Browse historic photochemical booths still operating worldwide.',
  keywords: [
    'vintage photo booths',
    'Photo-Me machines',
    'Photomaton booths',
    'Fotoautomat',
    'classic photo booth',
    'analog photo machines',
    'historic photo booths',
  ],
  openGraph: {
    title: 'Vintage Photo Booth Machines Collection',
    description: 'Discover authentic vintage analog photo booths featuring classic machines worldwide.',
    type: 'website',
    url: `${baseUrl}/collections/vintage-machines`,
    siteName: 'Booth Beacon',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vintage Photo Booth Machines Collection',
    description: 'Discover authentic vintage analog photo booths featuring classic machines worldwide.',
  },
  alternates: {
    canonical: `${baseUrl}/collections/vintage-machines`,
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

export default async function VintageMachinesPage() {
  const supabase = createPublicServerClient();

  // Fetch booths with vintage machine models (50 booths per model)
  const { data: booths, error } = await supabase
    .from('booths')
    .select('slug, name, city, state, country, machine_model, updated_at, cost, latitude, longitude')
    .eq('status', 'active')
    .not('slug', 'is', null)
    .neq('name', 'N/A')
    .neq('name', '')
    .neq('data_source_type', 'invalid_extraction')
    .not('machine_model', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching vintage booths:', error);
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Error loading vintage booths</h1>
        <p>Please try again later.</p>
      </div>
    );
  }

  // Filter for vintage models
  const vintageBooths = (booths || []).filter((booth) => {
    if (!booth.machine_model) return false;
    const model = booth.machine_model.toLowerCase();
    return VINTAGE_MODELS.some((vintage) => model.includes(vintage.toLowerCase()));
  });

  // Group by machine model
  const boothsByModel = vintageBooths.reduce((acc, booth) => {
    const model = booth.machine_model || 'Unknown';
    if (!acc[model]) acc[model] = [];
    acc[model].push(booth);
    return acc;
  }, {} as Record<string, typeof vintageBooths>);

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <nav className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          {' / '}
          <Link href="/collections" className="hover:text-blue-600">Collections</Link>
          {' / '}
          <span className="text-gray-900 dark:text-gray-100">Vintage Machines</span>
        </nav>
        <h1 className="text-4xl font-bold mb-4">Vintage Photo Booth Machines</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Discover {vintageBooths.length} authentic analog photo booths featuring classic machines
          like Photo-Me, Photomaton, and Fotoautomat. These historic booths still use original
          photochemical film processing to create genuine instant photo strips.
        </p>
      </header>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Vintage Photo Booth Machines',
            description: 'Collection of authentic vintage analog photo booths worldwide',
            url: `${baseUrl}/collections/vintage-machines`,
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: vintageBooths.length,
              itemListElement: vintageBooths.slice(0, 20).map((booth, index) => ({
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

      {vintageBooths.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">No vintage booths found.</p>
          <Link href="/search" className="text-blue-600 hover:underline mt-4 inline-block">
            Search all booths
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Featured Machine Models */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Featured Classic Models</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {Object.keys(boothsByModel)
                .sort((a, b) => boothsByModel[b].length - boothsByModel[a].length)
                .slice(0, 6)
                .map((model) => (
                  <div
                    key={model}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900"
                  >
                    <h3 className="text-lg font-semibold mb-2">🎞️ {model}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {boothsByModel[model].length} booth{boothsByModel[model].length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                ))}
            </div>
          </section>

          {/* All Vintage Booths */}
          <section>
            <h2 className="text-2xl font-bold mb-6">All Vintage Booths</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vintageBooths.map((booth) => {
                const location = [booth.city, booth.state, booth.country]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <article
                    key={booth.slug}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
                  >
                    <Link href={`/booth/${booth.slug}`} className="block">
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
                          {booth.machine_model}
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
                      {booth.cost && (
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          💰 {booth.cost}
                        </p>
                      )}
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <div className="mt-12 text-center border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-2xl font-bold mb-4">Explore More Collections</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/collections/recently-verified"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Recently Verified
          </Link>
          <Link
            href="/collections/popular-cities"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Popular Cities
          </Link>
          <Link
            href="/browse/all"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Browse All
          </Link>
        </div>
      </div>
    </main>
  );
}
