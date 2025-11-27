import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MapPin, Clock, Camera } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'City Guides | Booth Beacon',
  description: 'Curated photo booth walking tours in cities around the world.',
};

// Sample city guides data - in production this would come from the database
const cityGuides = [
  {
    slug: 'berlin',
    city: 'Berlin',
    country: 'Germany',
    title: 'Berlin Photo Booth Tour',
    description: 'Explore the vibrant photo booth culture of Berlin, from Kreuzberg dive bars to Mitte galleries.',
    boothCount: 12,
    neighborhoods: 4,
    duration: '5 hours',
    heroImage: '/guides/berlin.jpg',
    featured: true,
  },
  {
    slug: 'new-york',
    city: 'New York',
    country: 'USA',
    title: 'NYC Photo Booth Walk',
    description: 'A curated tour of the best analog photo booths in Manhattan and Brooklyn.',
    boothCount: 8,
    neighborhoods: 3,
    duration: '4 hours',
    heroImage: '/guides/nyc.jpg',
    featured: true,
  },
  {
    slug: 'london',
    city: 'London',
    country: 'UK',
    title: 'London Booth Discovery',
    description: 'Find hidden photo booth gems across the British capital.',
    boothCount: 6,
    neighborhoods: 5,
    duration: '6 hours',
    heroImage: '/guides/london.jpg',
    featured: true,
  },
  {
    slug: 'tokyo',
    city: 'Tokyo',
    country: 'Japan',
    title: 'Tokyo Analog Adventures',
    description: 'Experience the unique photo booth culture of Japan\'s capital.',
    boothCount: 15,
    neighborhoods: 6,
    duration: '7 hours',
    heroImage: '/guides/tokyo.jpg',
    featured: false,
  },
  {
    slug: 'paris',
    city: 'Paris',
    country: 'France',
    title: 'Paris Photo Booth Promenade',
    description: 'A romantic tour of vintage photo booths in the City of Lights.',
    boothCount: 9,
    neighborhoods: 4,
    duration: '5 hours',
    heroImage: '/guides/paris.jpg',
    featured: false,
  },
  {
    slug: 'amsterdam',
    city: 'Amsterdam',
    country: 'Netherlands',
    title: 'Amsterdam Booth Crawl',
    description: 'Discover photo booths along the canals and in cozy brown cafés.',
    boothCount: 5,
    neighborhoods: 3,
    duration: '3 hours',
    heroImage: '/guides/amsterdam.jpg',
    featured: false,
  },
];

export default function GuidesPage() {
  const featuredGuides = cityGuides.filter((g) => g.featured);
  const moreGuides = cityGuides.filter((g) => !g.featured);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-secondary via-white to-secondary film-grain">
        {/* Hero */}
        <section className="py-16 px-4 text-center warm-glow">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-5xl md:text-6xl font-semibold text-neutral-900 mb-6">
              City Guides
            </h1>
            <p className="text-xl text-neutral-700 max-w-2xl mx-auto">
              Curated photo booth walking tours in cities around the world. Each guide includes
              the best booths, walking routes, and insider tips.
            </p>
          </div>
        </section>

        {/* Featured Guides */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-3xl font-semibold text-neutral-900 mb-8">
              Popular Guides
            </h2>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {featuredGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="group"
                >
                  <div className="card-vintage rounded-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                    {/* Image Placeholder */}
                    <div className="relative h-48 bg-gradient-to-br from-primary to-accent vignette">
                      <div className="absolute inset-0 bg-black/20"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <span className="text-sm opacity-80">{guide.country}</span>
                        <h3 className="font-display text-2xl font-semibold">
                          {guide.city}
                        </h3>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <p className="text-neutral-600 mb-4 line-clamp-2">
                        {guide.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Camera className="w-4 h-4" />
                          {guide.boothCount} booths
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {guide.neighborhoods} areas
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {guide.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* More Guides */}
            <h2 className="font-display text-3xl font-semibold text-neutral-900 mb-8">
              More Cities
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {moreGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="group"
                >
                  <div className="card-vintage rounded-lg p-6 hover:shadow-lg transition-all hover:-translate-y-1 flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center flex-shrink-0 shadow-photo">
                      <span className="text-white font-display text-xl font-semibold">
                        {guide.city.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition">
                        {guide.city}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {guide.boothCount} booths • {guide.duration}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Coming Soon */}
            <div className="mt-16 text-center">
              <div className="card-vintage rounded-lg p-8 inline-block">
                <h3 className="font-display text-2xl font-semibold text-neutral-900 mb-3">
                  More Guides Coming Soon
                </h3>
                <p className="text-neutral-600 mb-4">
                  We're working on guides for Barcelona, Vienna, Melbourne, and more.
                </p>
                <Link
                  href="/contact"
                  className="text-primary hover:underline font-medium"
                >
                  Suggest a city →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
