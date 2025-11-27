import Link from 'next/link';
import { MapPin, Globe, Camera } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getCountryCollections,
  getTopCities,
  getCollectionStats,
} from '@/lib/collections';
import { Header } from '@/components/layout/Header';

export const metadata = {
  title: 'Collections - Browse Booths by Location | Booth Beacon',
  description:
    'Discover photo booths organized by country and city. Browse our global collection of analog photo booths.',
};

export default async function CollectionsPage() {
  const [countries, topCities, stats] = await Promise.all([
    getCountryCollections(),
    getTopCities(20),
    getCollectionStats(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Globe className="w-4 h-4" />
            Geographic Collections
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
            Browse by Location
          </h1>

          <p className="text-xl text-muted-foreground mb-6">
            Explore our global directory of analog photo booths organized by
            country and city.
          </p>

          <div className="flex items-center justify-center gap-8 text-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {stats.totalBooths.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Booths</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {stats.totalCountries}
              </div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {topCities.length}+
              </div>
              <div className="text-sm text-muted-foreground">Cities</div>
            </div>
          </div>
        </div>

        {/* Top Cities Section */}
        <section className="mb-16">
          <div className="mb-6">
            <h2 className="font-display text-3xl font-semibold mb-2">
              Top Cities
            </h2>
            <p className="text-muted-foreground">
              Cities with the most photo booths worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/collections/${city.slug}`}
                className="group"
              >
                <Card className="p-6 bg-card border-primary/10 hover:border-primary/30 hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {city.boothCount} booth{city.boothCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {city.city}
                  </h3>
                  <p className="text-sm text-muted-foreground">{city.country}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* All Countries Section */}
        <section>
          <div className="mb-6">
            <h2 className="font-display text-3xl font-semibold mb-2">
              Browse by Country
            </h2>
            <p className="text-muted-foreground">
              Explore all {stats.totalCountries} countries in our collection
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.map((country) => (
              <Link
                key={country.slug}
                href={`/collections/${country.slug}`}
                className="group"
              >
                <Card className="p-6 bg-card border-primary/10 hover:border-primary/30 hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {country.country}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {country.boothCount} booth
                          {country.boothCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Camera className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {countries.length === 0 && (
            <Card className="p-12 text-center bg-card border-primary/10">
              <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No collections found
              </h3>
              <p className="text-muted-foreground">
                Check back soon as we add more booths to our directory.
              </p>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
