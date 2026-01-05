import { Metadata } from 'next';
import {
  getLocationBooths,
  getLocationBreadcrumbs,
  parseLocationPath,
} from '@/lib/locationHierarchy';
import { BoothCard } from '@/components/booth/BoothCard';
import { MapPin, Info } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
  injectStructuredData,
} from '@/lib/seo/structuredData';

// ISR with 5-minute revalidation for faster updates
export const revalidate = 300;

interface PageProps {
  params: Promise<{ country: string; state: string; city: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { country, state, city } = parseLocationPath([
    resolvedParams.country,
    resolvedParams.state,
    resolvedParams.city,
  ]);

  if (!country || !state || !city) {
    return {
      title: 'City Not Found | Booth Beacon',
    };
  }

  const canonicalUrl = `https://boothbeacon.org/locations/${resolvedParams.country}/${resolvedParams.state}/${resolvedParams.city}`;

  return {
    title: `${city} Photo Booth Locations - Find Analog Booths in ${city}, ${state}`,
    description: `Find authentic analog photo booths in ${city}, ${state}. Complete directory with addresses, hours, photos, and reviews. ${city}'s best vintage photo booth locations mapped.`,
    keywords: [
      `photo booths in ${city}`,
      `${city} photo booth`,
      `${city} ${state} photo booth`,
      `analog photo booth ${city}`,
      `vintage photo booth ${city}`,
      `where to find photo booths in ${city}`,
      `${city} photo booth locations`,
      `photo booth near me ${city}`,
      city,
      state,
      country,
    ],
    openGraph: {
      title: `Find Photo Booths in ${city}, ${state} | Booth Beacon`,
      description: `Discover authentic analog photo booths in ${city}. Complete directory with locations, photos, and visitor information.`,
      url: canonicalUrl,
      siteName: 'Booth Beacon',
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Photo Booths in ${city}, ${state}`,
      description: `Find authentic analog photo booths in ${city}. Complete directory with locations and details.`,
      creator: '@boothbeacon',
    },
    alternates: {
      canonical: canonicalUrl,
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
  };
}

export default async function CityPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { country, state, city } = parseLocationPath([
    resolvedParams.country,
    resolvedParams.state,
    resolvedParams.city,
  ]);

  if (!country || !state || !city) {
    notFound();
  }

  // Get booths with pagination
  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const limit = 100;
  const offset = (page - 1) * limit;

  const { booths, totalCount, hasMore, operationalCount = 0, geocodedCount = 0 } = await getLocationBooths(country, state, city, {
    limit,
    offset,
  });

  const breadcrumbs = getLocationBreadcrumbs(country, state, city);
  const totalPages = Math.ceil(totalCount / limit);

  // Generate structured data
  const breadcrumbSchema = generateBreadcrumbSchema(
    breadcrumbs.map((crumb) => ({
      name: crumb.label,
      url: `https://boothbeacon.org${crumb.href}`,
    }))
  );

  const collectionPageSchema = generateCollectionPageSchema(
    city,
    booths.map((booth) => ({
      name: booth.name,
      slug: booth.slug,
    }))
  );

  return (
    <>
      <Header />
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: injectStructuredData(breadcrumbSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: injectStructuredData(collectionPageSchema) }}
        />
      </head>
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            {index > 0 && <span>/</span>}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-semibold text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-primary">
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Hero Section */}
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
          <MapPin className="h-4 w-4" />
          {state}
        </div>
        <h1 className="mb-4 font-display text-4xl font-semibold text-foreground md:text-5xl">
          Photo Booths in {city}, {state}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Discover {totalCount.toLocaleString()} authentic analog photo booths in {city}.
          Find vintage photochemical machines, view locations on our interactive map, and plan your visit to {city}&apos;s best photo booth spots.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <div className="text-3xl font-bold text-foreground">{totalCount.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Booths</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {operationalCount.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Operational</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <div className="text-3xl font-bold text-primary">{geocodedCount.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">With Location</div>
        </div>
      </div>

      {/* Booths Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">All Booths</h2>
            <p className="text-sm text-muted-foreground">
              Showing {offset + 1}-{Math.min(offset + limit, totalCount)} of{' '}
              {totalCount.toLocaleString()} booths
            </p>
          </div>
          {totalPages > 1 && (
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
          )}
        </div>

        {/* Booth Grid */}
        {booths.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {booths.map((booth) => (
              <BoothCard key={booth.id} booth={booth} variant="compact" />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold text-foreground">No booths found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon as we add more booths
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/locations/${resolvedParams.country}/${resolvedParams.state}/${resolvedParams.city}?page=${page - 1}`}
                className="rounded-md border border-border bg-background px-4 py-2 font-semibold text-foreground hover:bg-accent"
              >
                Previous
              </Link>
            )}

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <Link
                    key={pageNum}
                    href={`/locations/${resolvedParams.country}/${resolvedParams.state}/${resolvedParams.city}?page=${pageNum}`}
                    className={`rounded-md px-4 py-2 font-semibold ${
                      pageNum === page
                        ? 'bg-primary text-white'
                        : 'border border-border bg-background text-foreground hover:bg-accent'
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
            </div>

            {hasMore && (
              <Link
                href={`/locations/${resolvedParams.country}/${resolvedParams.state}/${resolvedParams.city}?page=${page + 1}`}
                className="rounded-md border border-border bg-background px-4 py-2 font-semibold text-foreground hover:bg-accent"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Info Card */}
      {geocodedCount < totalCount && (
        <div className="mt-12 rounded-lg border border-primary/20 bg-primary/5 p-6">
          <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
            Missing Coordinates?
          </h3>
          <p className="text-sm text-muted-foreground">
            Some booths in {city} don&apos;t have map coordinates yet. We&apos;re working on geocoding all
            locations. You can help by submitting location data if you visit these booths.
          </p>
        </div>
      )}

      {/* About Section - SEO Content */}
      <div className="mt-16 border-t border-border pt-12">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h2 className="font-display text-3xl font-semibold text-foreground mb-6">
            About Photo Booths in {city}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {city} is home to {totalCount} authentic analog photo booths, making it a great destination
            for photography enthusiasts and vintage lovers. These classic photochemical machines
            produce genuine instant photo strips using traditional chemical development processes.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            {operationalCount > 0 && (
              <>Currently, {operationalCount} of these photo booths are operational and ready for visitors. </>
            )}
            Whether you&apos;re looking for a nostalgic photo experience or documenting your travels through
            {city}, our directory helps you find the perfect analog photo booth location.
          </p>
        </article>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="font-display text-3xl font-semibold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                How many photo booths are there in {city}?
              </h3>
              <p className="text-muted-foreground">
                There are {totalCount} analog photo booths cataloged in {city}, {state}.
                {operationalCount > 0 && (
                  <> Currently, {operationalCount} are confirmed to be operational.</>
                )}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                What types of photo booths can I find in {city}?
              </h3>
              <p className="text-muted-foreground">
                {city} features authentic analog photo booths that use traditional photochemical processes.
                These vintage machines produce classic black-and-white or color photo strips, offering a
                nostalgic and genuine instant photography experience.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                How do I find photo booths near me in {city}?
              </h3>
              <p className="text-muted-foreground">
                Use our interactive map to explore all photo booth locations in {city}. Each listing includes
                the complete address, operating hours, and directions. You can also filter by operational
                status to ensure the booth is currently active before your visit.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Are all {city} photo booths operational?
              </h3>
              <p className="text-muted-foreground">
                {operationalCount > 0 ? (
                  <>
                    {operationalCount} out of {totalCount} photo booths in {city} are currently operational
                    ({Math.round((operationalCount / totalCount) * 100)}%). We regularly update our database
                    to reflect the current status of each location.
                  </>
                ) : (
                  <>
                    We&apos;re currently working to verify the operational status of photo booths in {city}.
                    Check individual booth pages for the most up-to-date information.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Related Cities */}
        <div className="mt-12">
          <h2 className="font-display text-3xl font-semibold text-foreground mb-6">
            Explore Photo Booths in Other {state} Cities
          </h2>
          <p className="text-muted-foreground mb-4">
            Looking for photo booths in other cities? Browse our complete directory of analog photo
            booth locations across {state}.
          </p>
          <Link
            href={`/locations/${resolvedParams.country}/${resolvedParams.state}`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90 transition"
          >
            View All {state} Cities
          </Link>
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
}
