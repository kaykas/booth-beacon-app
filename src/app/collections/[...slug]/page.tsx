import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, MapPin, Filter, SortAsc } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BoothCard } from '@/components/booth/BoothCard';
import { BoothMap } from '@/components/booth/BoothMap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  parseCollectionSlug,
  getCollectionBooths,
  getCityCollections,
  generateCollectionSlug,
} from '@/lib/collections';

interface CollectionPageProps {
  params: Promise<{
    slug: string[];
  }>;
  searchParams?: Promise<{
    sort?: 'recent' | 'alphabetical';
  }>;
}

// Generate static params for top collections (for SSG)
export async function generateStaticParams() {
  // Generate for top countries/cities to optimize SEO
  // Can expand this list as needed
  const topCollections = [
    ['united-states'],
    ['united-states', 'new-york'],
    ['germany'],
    ['germany', 'berlin'],
    ['united-kingdom'],
    ['united-kingdom', 'london'],
    ['france'],
    ['france', 'paris'],
    ['japan'],
    ['japan', 'tokyo'],
  ];

  return topCollections.map((slug) => ({
    slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const { country, city } = parseCollectionSlug(resolvedParams.slug);

    const title = city
      ? `${city}, ${country} Photo Booths | Booth Beacon`
      : `${country} Photo Booths | Booth Beacon`;

    const description = city
      ? `Discover all analog photo booths in ${city}, ${country}. Find locations, hours, and machine details for classic photo booths.`
      : `Browse all analog photo booths in ${country}. Explore cities and find authentic vintage photo booth locations.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
    };
  } catch {
    return {
      title: 'Collection Not Found | Booth Beacon',
      description: 'The requested collection could not be found.',
    };
  }
}

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  let country: string;
  let city: string | undefined;

  // Await params first
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  // Parse the slug
  try {
    const parsed = parseCollectionSlug(resolvedParams.slug);
    country = parsed.country;
    city = parsed.city;
  } catch {
    notFound();
  }

  const sortBy = resolvedSearchParams?.sort || 'recent';

  // Fetch booths and cities in parallel
  const [collectionData, cities] = await Promise.all([
    getCollectionBooths(country, city, { sortBy, limit: 100 }),
    city ? null : getCityCollections(country),
  ]);

  const { booths, totalCount } = collectionData;

  // If no booths found, show 404
  if (totalCount === 0) {
    notFound();
  }

  // Show map if there are multiple booths with coordinates
  const boothsWithCoords = booths.filter(
    (b) => b.latitude && b.longitude
  );
  const showMap = boothsWithCoords.length > 1;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link
            href="/collections"
            className="hover:text-primary transition"
          >
            Collections
          </Link>
          <ChevronRight className="w-4 h-4" />
          {city ? (
            <>
              <Link
                href={`/collections/${generateCollectionSlug(country)}`}
                className="hover:text-primary transition"
              >
                {country}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">{city}</span>
            </>
          ) : (
            <span className="text-foreground font-medium">{country}</span>
          )}
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">
                {city ? `${city}, ${country}` : country}
              </h1>
              <p className="text-xl text-muted-foreground">
                {totalCount} photo booth{totalCount !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* City filter badges (for country pages) */}
          {!city && cities && cities.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Browse by City:
              </h2>
              <div className="flex flex-wrap gap-2">
                {cities.map((c) => (
                  <Link key={c.slug} href={`/collections/${c.slug}`}>
                    <Badge className="badge-retro cursor-pointer hover:shadow-glow transition">
                      {c.city} ({c.boothCount})
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Sort controls */}
          <div className="flex items-center gap-4 pt-4 border-t border-primary/10">
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sort:</span>
            </div>
            <div className="flex gap-2">
              <Link href={`?sort=recent`}>
                <Button
                  variant={sortBy === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  className={
                    sortBy === 'recent'
                      ? 'btn-analog text-white border-0'
                      : 'border-primary/20'
                  }
                >
                  Recently Added
                </Button>
              </Link>
              <Link href={`?sort=alphabetical`}>
                <Button
                  variant={sortBy === 'alphabetical' ? 'default' : 'outline'}
                  size="sm"
                  className={
                    sortBy === 'alphabetical'
                      ? 'btn-analog text-white border-0'
                      : 'border-primary/20'
                  }
                >
                  Alphabetical
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Map (if multiple booths) */}
        {showMap && (
          <section className="mb-8">
            <Card className="overflow-hidden border-primary/10">
              <div className="h-[400px]">
                <BoothMap
                  booths={boothsWithCoords}
                  zoom={city ? 12 : 6}
                  showUserLocation={false}
                  showClustering={!city}
                />
              </div>
            </Card>
          </section>
        )}

        {/* Booth Grid */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {booths.map((booth) => (
              <BoothCard key={booth.id} booth={booth} variant="default" />
            ))}
          </div>

          {booths.length === 0 && (
            <Card className="p-12 text-center bg-card border-primary/10">
              <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No booths found</h3>
              <p className="text-muted-foreground mb-4">
                We don&apos;t have any booths listed in this location yet.
              </p>
              <Button asChild className="btn-analog text-white border-0">
                <Link href="/submit">Submit a Booth</Link>
              </Button>
            </Card>
          )}

          {/* Pagination info */}
          {totalCount > 100 && (
            <div className="mt-8 text-center text-muted-foreground">
              <p>
                Showing {booths.length} of {totalCount} booths
              </p>
            </div>
          )}
        </section>

        {/* Back to collections link */}
        <div className="mt-12 text-center">
          <Button asChild variant="outline" className="border-primary/20">
            <Link href="/collections">Browse All Collections</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
