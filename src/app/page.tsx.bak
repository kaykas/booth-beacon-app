import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { MapPin, Bookmark, Camera, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BoothCard } from '@/components/booth/BoothCard';
import { BoothMap } from '@/components/booth/BoothMap';
import { SearchBar } from '@/components/SearchBar';
import { PhotoStrips } from '@/components/PhotoStrips';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FoundersStory } from '@/components/home/FoundersStory';
import { createPublicServerClient } from '@/lib/supabase';
import { Booth } from '@/types';

function getPublicSupabaseClient() {
  try {
    return createPublicServerClient();
  } catch (error) {
    console.error('Unable to create Supabase client in home page:', error);
    return null;
  }
}

// Fetch featured booths for the grid (server component)
async function getFeaturedBooths(): Promise<Booth[]> {
  const supabase = getPublicSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('booths')
    .select(
      `id, name, slug, city, country, latitude, longitude, photo_exterior_url, photo_interior_url, photo_sample_strips, ai_preview_url, ai_generated_image_url, status, is_operational, updated_at`
    )
    .eq('status', 'active')
    .eq('is_operational', true)
    .order('updated_at', { ascending: false })
    .limit(8);

  if (error) {
    console.error('Error fetching featured booths:', error);
    return [];
  }

  return (data as Booth[]) || [];
}

// Fetch booths for the map display (more booths for better USA coverage)
async function getMapBooths(): Promise<Booth[]> {
  const supabase = getPublicSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('booths')
    .select(
      `id, name, slug, city, country, latitude, longitude, photo_exterior_url, ai_preview_url, ai_generated_image_url, status, is_operational`
    )
    .eq('status', 'active')
    .eq('is_operational', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .limit(5000);

  if (error) {
    console.error('Error fetching map booths:', error);
    return [];
  }

  return (data as Booth[]) || [];
}

// Fetch booth stats
async function getBoothStats(): Promise<{ totalBooths: number; countries: number; operational: number }> {
  const supabase = getPublicSupabaseClient();

  if (!supabase) {
    return { totalBooths: 0, countries: 0, operational: 0 };
  }

  const { data: booths, error, count } = await supabase
    .from('booths')
    .select('country, is_operational', { count: 'exact' });

  if (error) {
    console.error('Error fetching stats:', error);
    return { totalBooths: 0, countries: 0, operational: 0 };
  }

  const boothSummaries = (booths as Array<{ country: string; is_operational: boolean }>) || [];

  const uniqueCountries = new Set(boothSummaries.map((b) => b.country).filter(Boolean));

  const operationalCount = boothSummaries.filter((booth) => booth.is_operational).length;

  return {
    totalBooths: count || 0,
    countries: uniqueCountries.size,
    operational: operationalCount,
  };
}

// ISR: Revalidate home page every hour
export const revalidate = 3600;

export default async function Home() {
  const [featuredBooths, mapBooths, stats] = await Promise.all([
    getFeaturedBooths(),
    getMapBooths(),
    getBoothStats(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Section - Dark Nightclub Aesthetic */}
      <section className="relative py-20 overflow-hidden warm-glow">
        {/* Pink gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Photo Strip Section - Hidden */}
            {/* <div className="flex flex-col items-center gap-3 mb-8">
              <div className="photo-strip-frame p-3 rotate-0 hover:rotate-1 transition-transform duration-300 backdrop-blur-sm" style={{ width: 'fit-content' }}>
                <div className="flex gap-1">
                  <img src="/alexandra-strip-1.webp" alt="Alexandra photo strip 1" className="w-20 h-28 object-cover" />
                  <img src="/alexandra-strip-2.webp" alt="Alexandra photo strip 2" className="w-20 h-28 object-cover" />
                  <img src="/alexandra-strip-3.webp" alt="Alexandra photo strip 3" className="w-20 h-28 object-cover" />
                  <img src="/alexandra-strip-4.webp" alt="Alexandra photo strip 4" className="w-20 h-28 object-cover" />
                </div>
              </div>
              <div className="text-lg font-semibold text-primary">
                {stats.totalBooths ? `${stats.totalBooths.toLocaleString()} Photo Booths in Database` : 'Loading booth count...'}
              </div>
            </div> */}

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight mt-8">
              The World&apos;s Ultimate
              <br />
              <span className="text-gradient-pink">Classic Photo Booth</span>
              <br />
              Directory
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              <strong className="text-primary">Booth Beacon</strong> helps you discover authentic analog photo booths worldwide.
              Find vintage photochemical machines that still capture moments the old-fashioned way.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-8">
              <SearchBar
                placeholder="Search by city, country, or booth name..."
                className="w-full"
              />
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="text-base px-8 h-12 btn-analog text-white border-0">
                <Link href="/map">
                  <MapPin className="w-5 h-5 mr-2" />
                  Explore Map
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 h-12 bg-secondary/50 backdrop-blur border-2 border-primary/20 hover:bg-secondary hover:border-primary transition-all">
                <Link href="/submit">
                  <Camera className="w-5 h-5 mr-2" />
                  Submit a Booth
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {stats.totalBooths ? stats.totalBooths.toLocaleString() : "..."}
                </div>
                <div className="text-sm text-muted-foreground">Photo Booths</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {stats.countries ? `${stats.countries}+` : "..."}
                </div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {stats.operational ? stats.operational.toLocaleString() : "..."}
                </div>
                <div className="text-sm text-muted-foreground">Operational</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative pink gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      </section>

      <FoundersStory />

      {/* Divider */}
      <div className="divider-analog my-0"></div>

      {/* Map Preview Section */}
      <section className="py-16 px-4 bg-paper" id="map-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display text-4xl font-semibold text-foreground mb-4">
              Discover Booths Worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From Berlin dive bars to Brooklyn train stations, find authentic analog photo booths near you.
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <Link href="/map?nearme=true">
              <Badge className="badge-retro cursor-pointer hover:shadow-glow transition">
                <MapPin className="w-3 h-3 mr-1" />
                Near Me
              </Badge>
            </Link>
            <Link href="/map?city=Berlin">
              <Badge className="badge-retro cursor-pointer hover:shadow-glow transition">
                Berlin
              </Badge>
            </Link>
            <Link href="/map?city=New York">
              <Badge className="badge-retro cursor-pointer hover:shadow-glow transition">
                NYC
              </Badge>
            </Link>
            <Link href="/map?city=London">
              <Badge className="badge-retro cursor-pointer hover:shadow-glow transition">
                London
              </Badge>
            </Link>
          </div>

          {/* Map */}
          <div className="mb-6 rounded-lg overflow-hidden shadow-photo vignette">
            <Suspense fallback={<div className="h-[500px] bg-neutral-200 animate-pulse"></div>}>
              <BoothMap
                booths={mapBooths}
                center={{ lat: 39.8283, lng: -98.5795 }}
                zoom={4}
                showUserLocation={false}
                showClustering={true}
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
      <section className="py-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-4xl font-semibold text-foreground mb-2">
                Featured Booths
              </h2>
              <p className="text-lg text-muted-foreground">
                Handpicked favorites from around the world
              </p>
            </div>
            <Button asChild variant="outline" className="border-primary/20 hover:border-primary">
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
      <section id="how-it-works" className="py-16 px-4 bg-card film-grain">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-semibold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to analog memories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                1. Discover
              </h3>
              <p className="text-muted-foreground">
                Browse our map or search for photo booths near you. Filter by type, location, or machine model.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                <Bookmark className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                2. Save
              </h3>
              <p className="text-muted-foreground">
                Bookmark your favorites and export them to Google Maps for easy navigation on your next trip.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                3. Visit
              </h3>
              <p className="text-muted-foreground">
                Take your four frames. Share your strips with the community. Help others discover the magic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Tours Section */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-4xl font-semibold text-foreground mb-2">
                Photo Tours
              </h2>
              <p className="text-lg text-muted-foreground">
                Curated photo booth tours in the world&apos;s most iconic cities
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* City tour cards with images */}
            {[
              {
                city: 'Berlin',
                slug: 'berlin',
                image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&h=400&fit=crop',
                description: 'Kreuzberg clubs to Mitte cafes'
              },
              {
                city: 'New York',
                slug: 'new-york',
                image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop',
                description: 'Brooklyn bars to Grand Central'
              },
              {
                city: 'London',
                slug: 'london',
                image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop',
                description: 'Soho pubs to Shoreditch cool'
              },
              {
                city: 'San Francisco',
                slug: 'san-francisco',
                image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=400&fit=crop',
                description: 'Mission murals to North Beach'
              },
            ].map((tour) => (
              <Link
                key={tour.city}
                href={`/tours/${tour.slug}`}
                className="group relative h-80 rounded-lg overflow-hidden cursor-pointer shadow-photo hover:shadow-xl transition-all hover:-translate-y-1 vignette"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
                <Image
                  src={tour.image}
                  alt={`${tour.city} cityscape for photo booth tour`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white">
                  <Badge className="bg-primary/80 text-white mb-3 backdrop-blur-sm">
                    Photo Tour
                  </Badge>
                  <h3 className="text-2xl font-semibold mb-2">
                    {tour.city}
                  </h3>
                  <p className="text-sm opacity-90">
                    {tour.description}
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
      <section className="py-16 px-4 bg-card warm-glow">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-display text-4xl font-semibold text-foreground mb-4">
            Join the Community
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
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

      <Footer />
    </div>
  );
}
