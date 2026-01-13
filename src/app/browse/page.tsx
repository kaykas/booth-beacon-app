import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { getBrowseBooths, getCountries } from '@/lib/locationHierarchy';
import { BoothCard } from '@/components/booth/BoothCard';
import { Search, MapPin, List, Globe, BookOpen, Camera } from 'lucide-react';
import { generateFAQPageSchema, generateBreadcrumbSchema, FAQItem } from '@/lib/seo/structuredData';
import { generateAIMetaTags, generateContentFreshnessSignals } from '@/lib/ai-meta-tags';

const browseFAQs: FAQItem[] = [
  {
    question: 'How do I find photo booths near me?',
    answer: 'Use our interactive map or browse by location to find analog photo booths in your area. You can filter by country, search by name or address, and view booths with or without map coordinates.',
  },
  {
    question: 'How do I filter photo booths by location?',
    answer: 'Use the country dropdown to filter booths by country, or enter a search term to find booths by name, city, or address. You can also filter to show only booths with map coordinates for easier navigation.',
  },
  {
    question: 'What does it mean when a booth has no coordinates?',
    answer: 'Some booths in our database do not have GPS coordinates yet, meaning they cannot be shown on the map. These booths still have address information you can use to find them. We are continuously working to geocode all locations.',
  },
  {
    question: 'How many photo booths are in the Booth Beacon directory?',
    answer: 'Booth Beacon has hundreds of analog photo booths cataloged worldwide across dozens of countries. Our directory is continuously growing as we discover and verify new locations.',
  },
  {
    question: 'How can I report a closed or incorrect photo booth listing?',
    answer: 'Visit the individual booth page and use the "Report Issue" button to submit corrections. We rely on community input to keep our directory accurate and appreciate all reports of closed locations or changed information.',
  },
];

const aiTags = generateAIMetaTags({
  summary: 'Complete directory of analog photo booths worldwide with advanced filtering by location, coordinates, and status. Search and browse authentic photo booth machines across all countries and cities.',
  keyConcepts: ['photo booth', 'analog photography', 'photo booth directory', 'worldwide booths', 'photo booth search', 'booth locations'],
  contentStructure: 'directory',
  expertiseLevel: 'beginner',
  perspective: 'commercial',
  authority: 'industry-expert',
});

const freshnessTags = generateContentFreshnessSignals({
  publishedDate: '2025-01-01T00:00:00Z',
  modifiedDate: new Date().toISOString(),
  revisedDate: new Date().toISOString().split('T')[0],
});

export const metadata: Metadata = {
  title: 'Browse All Photo Booths | Booth Beacon',
  description:
    'Browse all analog photo booths worldwide. Find booths by location, status, and more.',
  openGraph: {
    title: 'Browse All Photo Booths | Booth Beacon',
    description:
      'Browse all analog photo booths worldwide. Find booths by location, status, and more.',
    type: 'website',
    url: 'https://boothbeacon.org/browse',
    siteName: 'Booth Beacon',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Browse all analog photo booths worldwide on Booth Beacon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse All Photo Booths | Booth Beacon',
    description:
      'Browse all analog photo booths worldwide. Find booths by location, status, and more.',
    images: ['/og-default.png'],
  },
  other: {
    ...aiTags,
    ...freshnessTags,
  },
};

// ISR with 1-hour revalidation
export const revalidate = 3600;

interface SearchParams {
  page?: string;
  query?: string;
  country?: string;
  hasCoordinates?: string;
}

// Helper to build URLSearchParams safely
function buildSearchParams(base: SearchParams, overrides: Record<string, string>) {
  const params: Record<string, string> = {};

  // Copy base params, filtering out undefined
  if (base.query) params.query = base.query;
  if (base.country) params.country = base.country;
  if (base.hasCoordinates) params.hasCoordinates = base.hasCoordinates;
  if (base.page) params.page = base.page;

  // Apply overrides
  Object.assign(params, overrides);

  return new URLSearchParams(params).toString();
}

async function BrowseContent({ searchParams }: { searchParams: SearchParams }) {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 100;
  const offset = (page - 1) * limit;

  // Parse filters
  const filters = {
    query: searchParams.query,
    country: searchParams.country,
    hasCoordinates:
      searchParams.hasCoordinates === 'true'
        ? true
        : searchParams.hasCoordinates === 'false'
          ? false
          : null,
    limit,
    offset,
  };

  // Fetch booths and countries for filter dropdown
  const [{ booths, totalCount, hasMore }, countries] = await Promise.all([
    getBrowseBooths(filters),
    getCountries(),
  ]);

  const currentPage = page;
  const totalPages = Math.ceil(totalCount / limit);
  const hasFilters = filters.query || filters.country || filters.hasCoordinates !== null;

  return (
    <main id="main-content" role="main" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
          <List className="h-4 w-4" />
          Browse All Booths
        </div>
        <h1 className="mb-4 font-display text-4xl font-semibold text-foreground md:text-5xl">
          Discover Every Photo Booth
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          {totalCount.toLocaleString()} authentic photo booths worldwide. Find booths with or
          without coordinates, filter by location, and explore the complete collection.
        </p>
      </div>

      {/* Filters Section */}
      <div className="mb-8 rounded-lg border border-border bg-card p-6">
        <form method="GET" action="/browse" className="space-y-4">
          {/* Search */}
          <div>
            <label htmlFor="query" className="mb-2 block text-sm font-medium text-foreground">
              Search Booths
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                id="query"
                name="query"
                defaultValue={filters.query}
                placeholder="Search by name, city, or address..."
                className="w-full rounded-md border border-border bg-background py-2 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Country Filter */}
            <div>
              <label htmlFor="country" className="mb-2 block text-sm font-medium text-foreground">
                Country
              </label>
              <select
                id="country"
                name="country"
                defaultValue={filters.country || ''}
                className="w-full rounded-md border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Countries</option>
                {countries.map((c) => (
                  <option key={c.country} value={c.country}>
                    {c.country} ({c.boothCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Coordinates Filter */}
            <div>
              <label
                htmlFor="hasCoordinates"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Coordinates
              </label>
              <select
                id="hasCoordinates"
                name="hasCoordinates"
                defaultValue={
                  filters.hasCoordinates === true
                    ? 'true'
                    : filters.hasCoordinates === false
                      ? 'false'
                      : ''
                }
                className="w-full rounded-md border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Booths</option>
                <option value="true">With Map Location</option>
                <option value="false">Without Map Location</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-primary px-6 py-2 font-semibold text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Apply Filters
            </button>
            {hasFilters && (
              <a
                href="/browse"
                className="rounded-md border border-border bg-background px-6 py-2 font-semibold text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Clear Filters
              </a>
            )}
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-foreground">
            {hasFilters ? 'Filtered Results' : 'All Booths'}
          </p>
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + limit, totalCount)} of{' '}
            {totalCount.toLocaleString()} booths
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Booth Grid */}
      {booths.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {booths.map((booth) => (
            <div key={booth.id} className="relative">
              <BoothCard booth={booth} variant="compact" />
              {!booth.latitude || !booth.longitude ? (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                  <MapPin className="h-3 w-3" />
                  Coordinates not available
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-lg font-semibold text-foreground">No booths found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your filters or search query
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <a
              href={`/browse?${buildSearchParams(searchParams, { page: String(currentPage - 1) })}`}
              className="rounded-md border border-border bg-background px-4 py-2 font-semibold text-foreground hover:bg-accent"
            >
              Previous
            </a>
          )}

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <a
                  key={pageNum}
                  href={`/browse?${buildSearchParams(searchParams, { page: String(pageNum) })}`}
                  className={`rounded-md px-4 py-2 font-semibold ${
                    pageNum === currentPage
                      ? 'bg-primary text-white'
                      : 'border border-border bg-background text-foreground hover:bg-accent'
                  }`}
                >
                  {pageNum}
                </a>
              );
            })}
          </div>

          {hasMore && (
            <a
              href={`/browse?${buildSearchParams(searchParams, { page: String(currentPage + 1) })}`}
              className="rounded-md border border-border bg-background px-4 py-2 font-semibold text-foreground hover:bg-accent"
            >
              Next
            </a>
          )}
        </div>
      )}

      {/* Info Card */}
      <div className="mt-12 rounded-lg border border-primary/20 bg-primary/5 p-6">
        <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
          Missing Coordinates?
        </h3>
        <p className="text-sm text-muted-foreground">
          Many booths in our database don&apos;t have map coordinates yet. We&apos;re working on geocoding all
          locations. In the meantime, you can filter to show only booths without coordinates to help
          us identify which ones need attention.
        </p>
      </div>

      {/* Internal Linking Section */}
      <div className="mt-12 rounded-lg border border-primary/20 bg-primary/5 p-6">
        <h3 className="mb-4 font-display text-lg font-semibold">Explore Other Ways to Find Booths</h3>
        <ul className="grid grid-cols-2 gap-4 text-sm">
          <li><Link href="/map" className="text-primary hover:underline flex items-center gap-2"><MapPin className="w-4 h-4" />Interactive Map</Link></li>
          <li><Link href="/collections" className="text-primary hover:underline flex items-center gap-2"><Globe className="w-4 h-4" />Browse by Location</Link></li>
          <li><Link href="/guides" className="text-primary hover:underline flex items-center gap-2"><BookOpen className="w-4 h-4" />City Guides</Link></li>
          <li><Link href="/machines" className="text-primary hover:underline flex items-center gap-2"><Camera className="w-4 h-4" />Machine Models</Link></li>
        </ul>
      </div>
    </main>
  );
}

const browseBreadcrumbs = [
  { name: 'Home', url: 'https://boothbeacon.org' },
  { name: 'Browse All Booths', url: 'https://boothbeacon.org/browse' },
];

export default function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbSchema(browseBreadcrumbs)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateFAQPageSchema(browseFAQs)),
        }}
      />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
              <p className="text-muted-foreground">Loading booths...</p>
            </div>
          </div>
        }
      >
        <BrowseContent searchParams={searchParams as unknown as SearchParams} />
      </Suspense>
    </>
  );
}
