import { Metadata } from 'next';
import {
  getCities,
  getLocationBooths,
  getLocationBreadcrumbs,
  parseLocationPath,
} from '@/lib/locationHierarchy';
import { BoothCard } from '@/components/booth/BoothCard';
import { MapPin, Building2, Info } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
  injectStructuredData,
} from '@/lib/seo/structuredData';

// ISR with 1-hour revalidation
export const revalidate = 300;

interface PageProps {
  params: Promise<{ country: string; state: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { country, state } = parseLocationPath([
    resolvedParams.country,
    resolvedParams.state,
  ]);

  if (!country || !state) {
    return {
      title: 'State Not Found | Booth Beacon',
    };
  }

  const canonicalUrl = `https://boothbeacon.org/locations/${resolvedParams.country}/${resolvedParams.state}`;

  return {
    title: `${state} Photo Booth Directory - Analog Booths Across ${state}`,
    description: `Complete directory of analog photo booths in ${state}. Browse by city, view maps, addresses, and hours. Find authentic vintage photo booth locations throughout ${state}.`,
    keywords: [
      `photo booths in ${state}`,
      `${state} photo booth`,
      `${state} photo booth locations`,
      `analog photo booth ${state}`,
      `vintage photo booth ${state}`,
      `photo booth directory ${state}`,
      `${state} photo booth map`,
      state,
      country,
    ],
    openGraph: {
      title: `Photo Booths in ${state} | Complete Directory`,
      description: `Find authentic analog photo booths across ${state}. Browse by city with complete location details.`,
      url: canonicalUrl,
      siteName: 'Booth Beacon',
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${state} Photo Booth Directory`,
      description: `Complete directory of analog photo booths in ${state}`,
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

export default async function StatePage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { country, state } = parseLocationPath([
    resolvedParams.country,
    resolvedParams.state,
  ]);

  if (!country || !state) {
    notFound();
  }

  // Get cities in this state
  const cities = await getCities(country, state);

  // Get booths with pagination
  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const limit = 100;
  const offset = (page - 1) * limit;

  const { booths, totalCount, hasMore, operationalCount = 0, geocodedCount = 0 } = await getLocationBooths(country, state, undefined, {
    limit,
    offset,
  });

  const breadcrumbs = getLocationBreadcrumbs(country, state);
  const totalPages = Math.ceil(totalCount / limit);

  // Generate structured data
  const breadcrumbSchema = generateBreadcrumbSchema(
    breadcrumbs.map((crumb) => ({
      name: crumb.label,
      url: `https://boothbeacon.org${crumb.href}`,
    }))
  );

  const collectionPageSchema = generateCollectionPageSchema(
    state,
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
          {country}
        </div>
        <h1 className="mb-4 font-display text-4xl font-semibold text-foreground md:text-5xl">
          Photo Booths in {state}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Explore {totalCount.toLocaleString()} authentic analog photo booths across {state}.
          {cities.length > 0 && (
            <> Browse {cities.length} cities or view all locations below.</>
          )} Find vintage photochemical machines throughout {state}.
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
            {cities.reduce((sum, city) => sum + city.operationalCount, 0).toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Operational</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <div className="text-3xl font-bold text-foreground">{cities.length.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Cities</div>
        </div>
      </div>

      {/* Cities Grid */}
      {cities.length > 0 && (
        <div className="mb-12">
          <h2 className="mb-6 font-display text-2xl font-semibold text-foreground">
            Browse by City
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => (
              <Link
                key={city.slug}
                href={`/locations/${city.slug}`}
                className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary">
                    {city.city}
                  </h3>
                  <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Booths</span>
                    <span className="font-semibold text-foreground">{city.boothCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Operational</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {city.operationalCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
                href={`/locations/${resolvedParams.country}/${resolvedParams.state}?page=${page - 1}`}
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
                    href={`/locations/${resolvedParams.country}/${resolvedParams.state}?page=${pageNum}`}
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
                href={`/locations/${resolvedParams.country}/${resolvedParams.state}?page=${page + 1}`}
                className="rounded-md border border-border bg-background px-4 py-2 font-semibold text-foreground hover:bg-accent"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>

      {/* About Section - SEO Content */}
      <div className="mt-16 border-t border-border pt-12">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h2 className="font-display text-3xl font-semibold text-foreground mb-6">
            About Photo Booths in {state}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {state} hosts {totalCount} authentic analog photo booths across {cities.length > 0 ? `${cities.length} cities` : 'multiple locations'},
            making it a fantastic destination for analog photography enthusiasts. These vintage photochemical
            machines offer a nostalgic way to capture memories using traditional chemical development processes.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            From bustling urban centers to charming small towns, {state}&apos;s photo booth scene
            represents the enduring appeal of instant analog photography. Each booth in our directory
            has been verified and cataloged with complete location details to help you plan your visit.
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
                How many photo booths are in {state}?
              </h3>
              <p className="text-muted-foreground">
                Our directory includes {totalCount} analog photo booths throughout {state}
                {cities.length > 0 && <>, spanning {cities.length} different cities</>}.
                We continuously update our database as new locations are discovered.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Which cities in {state} have the most photo booths?
              </h3>
              <p className="text-muted-foreground">
                {cities.length > 0 ? (
                  <>
                    {cities.slice(0, 3).map((city, idx) => (
                      <span key={city.slug}>
                        {idx > 0 && (idx === cities.slice(0, 3).length - 1 ? ', and ' : ', ')}
                        <Link href={`/locations/${city.slug}`} className="text-primary hover:underline">
                          {city.city}
                        </Link>
                        {` (${city.boothCount} booths)`}
                      </span>
                    ))}
                    {' '}are among the top cities for photo booth enthusiasts in {state}.
                  </>
                ) : (
                  <>View our complete directory above to explore all photo booth locations in {state}.</>
                )}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Are these vintage or modern photo booths?
              </h3>
              <p className="text-muted-foreground">
                Our directory focuses exclusively on authentic analog photo booths that use traditional
                photochemical processes. These are vintage machines that produce genuine instant photo
                strips, not digital replicas. They offer a true analog photography experience.
              </p>
            </div>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-12">
          <h2 className="font-display text-3xl font-semibold text-foreground mb-6">
            Explore More Locations
          </h2>
          <p className="text-muted-foreground mb-4">
            Browse photo booths in other states and countries, or explore our interactive map
            to find locations near you.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/locations/${resolvedParams.country}`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90 transition"
            >
              View All {country} States
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 font-semibold text-foreground hover:bg-accent transition"
            >
              <MapPin className="h-5 w-5" />
              View Map
            </Link>
          </div>
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
}
