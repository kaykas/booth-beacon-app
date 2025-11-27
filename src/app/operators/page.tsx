import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Building2, MapPin, Globe, Heart } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Operators | Booth Beacon',
  description: 'Meet the people and companies preserving analog photo booth culture.',
};

// Sample operators data - in production this would come from the database
const operators = [
  {
    slug: 'classic-photo-booth',
    name: 'Classic Photo Booth',
    city: 'Berlin',
    country: 'Germany',
    description: 'Pioneers in restoring and maintaining vintage Photo-Me machines across Germany. Family-run since 1987.',
    boothCount: 24,
    founded: 1987,
    logo: '/operators/classic.jpg',
    featured: true,
  },
  {
    slug: 'photoautomat',
    name: 'Photoautomat',
    city: 'Berlin',
    country: 'Germany',
    description: 'The iconic black and white photo booths scattered throughout Berlin. Each strip is a time capsule.',
    boothCount: 35,
    founded: 2004,
    logo: '/operators/photoautomat.jpg',
    featured: true,
  },
  {
    slug: 'booth-nyc',
    name: 'Booth NYC',
    city: 'New York',
    country: 'USA',
    description: 'Bringing authentic analog photo booth experiences to hotels, bars, and venues across New York City.',
    boothCount: 12,
    founded: 2015,
    logo: '/operators/boothnyc.jpg',
    featured: true,
  },
  {
    slug: 'vintage-booths-uk',
    name: 'Vintage Booths UK',
    city: 'London',
    country: 'UK',
    description: 'Rescuing and restoring classic British photo booths. Specialists in the Photo-Me Model 9.',
    boothCount: 8,
    founded: 2010,
    logo: '/operators/vintageuk.jpg',
    featured: false,
  },
  {
    slug: 'tokyo-photo-box',
    name: 'Tokyo Photo Box',
    city: 'Tokyo',
    country: 'Japan',
    description: 'Curating unique photo booth experiences in Tokyo\'s most interesting locations.',
    boothCount: 18,
    founded: 2012,
    logo: '/operators/tokyo.jpg',
    featured: false,
  },
  {
    slug: 'paris-photomaton',
    name: 'Paris Photomaton',
    city: 'Paris',
    country: 'France',
    description: 'Preserving the French tradition of photomaton booths in métro stations and public spaces.',
    boothCount: 45,
    founded: 1972,
    logo: '/operators/paris.jpg',
    featured: false,
  },
];

export default function OperatorsPage() {
  const featuredOperators = operators.filter((o) => o.featured);
  const moreOperators = operators.filter((o) => !o.featured);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-secondary via-white to-secondary film-grain">
        {/* Hero */}
        <section className="py-16 px-4 text-center warm-glow">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-5xl md:text-6xl font-semibold text-neutral-900 mb-6">
              Operators
            </h1>
            <p className="text-xl text-neutral-700 max-w-2xl mx-auto">
              Meet the passionate people and companies keeping analog photo booth culture alive.
              Each operator has their own story and commitment to preservation.
            </p>
          </div>
        </section>

        {/* Featured Operators */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-3xl font-semibold text-neutral-900 mb-8">
              Featured Operators
            </h2>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {featuredOperators.map((operator) => (
                <Link
                  key={operator.slug}
                  href={`/operators/${operator.slug}`}
                  className="group"
                >
                  <div className="card-vintage rounded-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                    {/* Logo/Header */}
                    <div className="relative h-40 bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-photo">
                        <span className="font-display text-2xl font-bold text-primary">
                          {operator.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="font-display text-xl font-semibold text-neutral-900 mb-1 group-hover:text-primary transition">
                        {operator.name}
                      </h3>
                      <p className="text-sm text-neutral-500 mb-3 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {operator.city}, {operator.country}
                      </p>
                      <p className="text-neutral-600 mb-4 line-clamp-2 text-sm">
                        {operator.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {operator.boothCount} booths
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          Since {operator.founded}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* More Operators */}
            <h2 className="font-display text-3xl font-semibold text-neutral-900 mb-8">
              All Operators
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {moreOperators.map((operator) => (
                <Link
                  key={operator.slug}
                  href={`/operators/${operator.slug}`}
                  className="group"
                >
                  <div className="card-vintage rounded-lg p-6 hover:shadow-lg transition-all hover:-translate-y-1 flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-photo">
                      <span className="text-white font-display text-lg font-semibold">
                        {operator.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition">
                        {operator.name}
                      </h3>
                      <p className="text-sm text-neutral-500 mb-2">
                        {operator.city}, {operator.country} • Since {operator.founded}
                      </p>
                      <p className="text-sm text-neutral-600 line-clamp-1">
                        {operator.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Are You an Operator? */}
            <div className="mt-16 text-center">
              <div className="card-vintage rounded-lg p-8 inline-block">
                <h3 className="font-display text-2xl font-semibold text-neutral-900 mb-3">
                  Are You an Operator?
                </h3>
                <p className="text-neutral-600 mb-4 max-w-md">
                  If you maintain photo booths and want to be listed on Booth Beacon, we'd love to
                  hear from you. Claim your booths and tell your story.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  <Globe className="w-4 h-4" />
                  Get in touch →
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
