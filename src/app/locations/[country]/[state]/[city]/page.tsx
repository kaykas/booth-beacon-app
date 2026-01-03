import { Metadata } from 'next';
import {
  getLocationBooths,
  getLocationBreadcrumbs,
  parseLocationPath,
} from '@/lib/locationHierarchy';
import { BoothCard } from '@/components/booth/BoothCard';
import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

// ISR with 1-hour revalidation
export const revalidate = 3600;

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

  return {
    title: `Photo Booths in ${city}, ${state} | Booth Beacon`,
    description: `Discover analog photo booths in ${city}, ${state}, ${country}. Find locations, contact details, and more.`,
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

  const { booths, totalCount, hasMore } = await getLocationBooths(country, state, city, {
    limit,
    offset,
  });

  const breadcrumbs = getLocationBreadcrumbs(country, state, city);
  const totalPages = Math.ceil(totalCount / limit);

  // Calculate stats
  const operationalCount = booths.filter(
    (booth) => booth.status === 'active' && booth.is_operational
  ).length;
  const geocodedCount = booths.filter((booth) => booth.latitude && booth.longitude).length;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
          City
        </div>
        <h1 className="mb-4 font-display text-4xl font-semibold text-foreground md:text-5xl">
          {city}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {totalCount.toLocaleString()} photo booths found in {city}, {state}.
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
    </main>
    <Footer />
    </>
  );
}
