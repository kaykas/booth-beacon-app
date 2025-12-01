import { Metadata } from 'next';
import { getCountries } from '@/lib/locationHierarchy';
import { MapPin, Globe } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Browse by Location | Booth Beacon',
  description:
    'Explore photo booths by country. Find analog photo booths worldwide organized by geographic location.',
};

// ISR with 1-hour revalidation
export const revalidate = 3600;

export default async function LocationsIndexPage() {
  const countries = await getCountries();
  const totalBooths = countries.reduce((sum, country) => sum + country.boothCount, 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
          <Globe className="h-4 w-4" />
          Browse by Location
        </div>
        <h1 className="mb-4 font-display text-4xl font-semibold text-foreground md:text-5xl">
          Explore Photo Booths Worldwide
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          {totalBooths.toLocaleString()} photo booths across {countries.length} countries. Find
          booths near you or explore booths around the world.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <div className="text-3xl font-bold text-foreground">{countries.length}</div>
          <div className="text-sm text-muted-foreground">Countries</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <div className="text-3xl font-bold text-foreground">
            {totalBooths.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Total Booths</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <div className="text-3xl font-bold text-foreground">
            {countries
              .reduce((sum, country) => sum + country.operationalCount, 0)
              .toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Operational</div>
        </div>
      </div>

      {/* Country Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map((country) => (
          <Link
            key={country.country}
            href={`/locations/${country.slug}`}
            className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary">
                {country.country}
              </h3>
              <MapPin className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Booths</span>
                <span className="font-semibold text-foreground">
                  {country.boothCount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Operational</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {country.operationalCount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">With Location</span>
                <span className="font-semibold text-primary">
                  {country.geocodedCount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm text-primary">
                <span>View Details</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {countries.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-semibold text-foreground">No countries found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Check back soon as we add more booths to our database
          </p>
        </div>
      )}
    </main>
  );
}
