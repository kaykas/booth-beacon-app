import Link from 'next/link';
import { Suspense } from 'react';
import { MapPin, Bookmark, Camera, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BoothCard } from '@/components/booth/BoothCard';
import { BoothMap } from '@/components/booth/BoothMap';
import { SearchBar } from '@/components/SearchBar';
import { PhotoStrips } from '@/components/PhotoStrips';
import { supabase } from '@/lib/supabase';
import { Booth } from '@/types';

// Fetch featured booths (server component)
async function getFeaturedBooths(): Promise<Booth[]> {
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('status', 'active')
    .eq('is_operational', true)
    .limit(4)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching featured booths:', error);
    return [];
  }

  return (data as Booth[]) || [];
}

// Fetch booth stats
async function getBoothStats() {
  const { data: booths, error, count } = await supabase
    .from('booths')
    .select('country', { count: 'exact' });

  if (error) {
    console.error('Error fetching stats:', error);
    return { totalBooths: 0, countries: 0 };
  }

  const uniqueCountries = new Set(
    (booths as Array<{ country: string }>)?.map((b) => b.country).filter(Boolean) || []
  );

  return {
    totalBooths: count || 0,
    countries: uniqueCountries.size,
  };
}

export default async function Home() {
  const featuredBooths = await getFeaturedBooths();
  const stats = await getBoothStats();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-secondary-dark to-neutral-100 film-grain warm-glow">
        {/* Optional: Background image with overlay */}
        <div className="absolute inset-0 bg-[url('/hero-booth.jpg')] bg-cover bg-center opacity-20"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-display text-6xl md:text-7xl font-semibold text-neutral-900 mb-6 leading-tight">
            Find your next four frames.
          </h1>

          <p className="text-xl md:text-2xl text-neutral-700 mb-8 max-w-2xl mx-auto">
            The world&apos;s most comprehensive analog photo booth directory.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-8">
            <SearchBar
              placeholder="Search by city, country, or booth name..."
              className="w-full"
            />
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base px-8 h-12 btn-analog text-white border-0">
              <Link href="/map">
                <MapPin className="w-5 h-5 mr-2" />
                Explore the Map
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 h-12 bg-white/90 backdrop-blur border-2 border-neutral-300 hover:bg-white hover:border-primary transition-all">
              <Link href="#how-it-works">
                How It Works
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary text-white py-6 shadow-photo">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-around items-center gap-4 text-center">
            <div>
              <div className="text-3xl font-bold">{stats.totalBooths}+</div>
              <div className="text-sm opacity-90">Booths</div>
            </div>
            <div className="hidden sm:block h-12 w-px bg-white/30"></div>
            <div>
              <div className="text-3xl font-bold">{stats.countries}+</div>
              <div className="text-sm opacity-90">Countries</div>
            </div>
            <div className="hidden sm:block h-12 w-px bg-white/30"></div>
            <div>
              <div className="text-3xl font-bold">2024</div>
              <div className="text-sm opacity-90">Preserved since</div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Preview Section */}
      <section className="py-16 px-4 bg-paper">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display text-4xl font-semibold text-neutral-900 mb-4">
              Discover Booths Worldwide
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              From Berlin dive bars to Brooklyn train stations, find authentic analog photo booths near you.
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <Link href="/map?nearme=true">
              <Badge variant="outline" className="cursor-pointer bg-white border-2 border-neutral-300 hover:bg-primary hover:text-white hover:border-primary transition shadow-sm">
                <MapPin className="w-3 h-3 mr-1" />
                Near Me
              </Badge>
            </Link>
            <Link href="/map?city=Berlin">
              <Badge variant="outline" className="cursor-pointer bg-white border-2 border-neutral-300 hover:bg-primary hover:text-white hover:border-primary transition shadow-sm">
                Berlin
              </Badge>
            </Link>
            <Link href="/map?city=New York">
              <Badge variant="outline" className="cursor-pointer bg-white border-2 border-neutral-300 hover:bg-primary hover:text-white hover:border-primary transition shadow-sm">
                NYC
              </Badge>
            </Link>
            <Link href="/map?city=London">
              <Badge variant="outline" className="cursor-pointer bg-white border-2 border-neutral-300 hover:bg-primary hover:text-white hover:border-primary transition shadow-sm">
                London
              </Badge>
            </Link>
          </div>

          {/* Map */}
          <div className="mb-6 rounded-lg overflow-hidden shadow-photo vignette">
            <Suspense fallback={<div className="h-[500px] bg-neutral-200 animate-pulse"></div>}>
              <BoothMap
                booths={featuredBooths}
                zoom={3}
                showUserLocation={false}
                showClustering={false}
              />
            </Suspense>
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="btn-analog text-white border-0">
              <Link href="/map">View Full Map</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Booths */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-4xl font-semibold text-neutral-900 mb-2">
                Featured Booths
              </h2>
              <p className="text-lg text-neutral-600">
                Handpicked favorites from around the world
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/map">View All</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBooths.length > 0 ? (
              featuredBooths.map((booth) => (
                <BoothCard key={booth.id} booth={booth} variant="featured" />
              ))
            ) : (
              <p className="col-span-4 text-center text-neutral-500">
                No featured booths available yet.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 bg-secondary film-grain">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-semibold text-neutral-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-neutral-600">
              Three simple steps to analog memories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-photo">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-neutral-900 mb-3">
                1. Discover
              </h3>
              <p className="text-neutral-600">
                Browse our map or search for photo booths near you. Filter by type, location, or machine model.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-photo">
                <Bookmark className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-neutral-900 mb-3">
                2. Save
              </h3>
              <p className="text-neutral-600">
                Bookmark your favorites and export them to Google Maps for easy navigation on your next trip.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-photo">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-neutral-900 mb-3">
                3. Visit
              </h3>
              <p className="text-neutral-600">
                Take your four frames. Share your strips with the community. Help others discover the magic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* City Guides Preview */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-4xl font-semibold text-neutral-900 mb-2">
                City Guides
              </h2>
              <p className="text-lg text-neutral-600">
                Curated photo booth tours in your favorite cities
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/guides">View All Guides</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* City guide cards */}
            {[
              { name: 'Berlin', slug: 'berlin', booths: 12, neighborhoods: 4, hours: 5 },
              { name: 'New York', slug: 'new-york', booths: 8, neighborhoods: 3, hours: 4 },
              { name: 'London', slug: 'london', booths: 6, neighborhoods: 5, hours: 6 },
            ].map((city) => (
              <Link
                key={city.slug}
                href={`/guides/${city.slug}`}
                className="group relative h-64 rounded-lg overflow-hidden cursor-pointer shadow-photo hover:shadow-xl transition-all hover:-translate-y-1 vignette"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-accent/60 group-hover:from-primary group-hover:to-accent transition-all"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white">
                  <h3 className="text-2xl font-semibold mb-2">
                    {city.name} Photo Booth Tour
                  </h3>
                  <p className="text-sm opacity-90">
                    {city.booths} booths • {city.neighborhoods} neighborhoods • {city.hours} hours
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Strips Gallery */}
      <PhotoStrips />

      {/* Community Section */}
      <section className="py-16 px-4 bg-paper warm-glow">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-display text-4xl font-semibold text-neutral-900 mb-4">
            Join the Community
          </h2>
          <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
            Share your photo strips, leave tips for other enthusiasts, and help us build the definitive photo booth directory.
          </p>
          <Button asChild size="lg" className="btn-analog text-white border-0">
            <Link href="/submit">
              <Camera className="w-5 h-5 mr-2" />
              Add a Booth
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="font-display text-2xl font-semibold mb-4">
                Booth Beacon
              </h3>
              <p className="text-neutral-400 text-sm">
                Find your next four frames. The world&apos;s most comprehensive analog photo booth directory.
              </p>
            </div>

            {/* Explore */}
            <div>
              <h4 className="font-semibold mb-4">Explore</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/map" className="text-neutral-400 hover:text-white transition">
                    Map
                  </Link>
                </li>
                <li>
                  <Link href="/guides" className="text-neutral-400 hover:text-white transition">
                    City Guides
                  </Link>
                </li>
                <li>
                  <Link href="/machines" className="text-neutral-400 hover:text-white transition">
                    Machine Models
                  </Link>
                </li>
                <li>
                  <Link href="/operators" className="text-neutral-400 hover:text-white transition">
                    Operators
                  </Link>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/submit" className="text-neutral-400 hover:text-white transition">
                    Submit a Booth
                  </Link>
                </li>
                <li>
                  <Link href="/bookmarks" className="text-neutral-400 hover:text-white transition">
                    My Bookmarks
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="text-neutral-400 hover:text-white transition">
                    Profile
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-semibold mb-4">Newsletter</h4>
              <p className="text-neutral-400 text-sm mb-4">
                Get updates on new booths and city guides.
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
                <Button variant="outline" className="shrink-0">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-neutral-400">
            <p>© 2025 Booth Beacon. Made with ♥ for analog photography.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition">
                Instagram
              </Link>
              <Link href="#" className="hover:text-white transition">
                Twitter
              </Link>
              <Link href="/admin" className="hover:text-white transition">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
