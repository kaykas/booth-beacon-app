import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Camera, Calendar, MapPin, Info } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Machine Models | Booth Beacon',
  description: 'Explore different photo booth machine models and their unique characteristics.',
};

// Sample machine models data - in production this would come from the database
const machineModels = [
  {
    slug: 'photo-me-model-9',
    name: 'Photo-Me Model 9',
    manufacturer: 'Photo-Me International',
    yearsProduced: '1980-1995',
    photoType: 'Black & White (chemical)',
    description: 'The iconic chemical booth known for its warm, nostalgic black and white photos. A favorite among collectors.',
    boothCount: 45,
    rarity: 'Rare',
    image: '/machines/model9.jpg',
    featured: true,
  },
  {
    slug: 'photo-me-model-11',
    name: 'Photo-Me Model 11',
    manufacturer: 'Photo-Me International',
    yearsProduced: '1990-2005',
    photoType: 'Color / B&W',
    description: 'A versatile booth offering both color and black & white options. Common in European train stations.',
    boothCount: 120,
    rarity: 'Common',
    image: '/machines/model11.jpg',
    featured: true,
  },
  {
    slug: 'photomatic-deluxe',
    name: 'Photomatic Deluxe',
    manufacturer: 'Photomatic Inc.',
    yearsProduced: '1985-2000',
    photoType: 'Color',
    description: 'Known for its vibrant color prints and compact design. Popular in American malls and arcades.',
    boothCount: 28,
    rarity: 'Uncommon',
    image: '/machines/photomatic.jpg',
    featured: true,
  },
  {
    slug: 'auto-photo-classic',
    name: 'Auto-Photo Classic',
    manufacturer: 'Auto-Photo Company',
    yearsProduced: '1970-1988',
    photoType: 'Black & White',
    description: 'A vintage classic with distinctive rounded corners on the strips. Highly sought after by collectors.',
    boothCount: 12,
    rarity: 'Very Rare',
    image: '/machines/autophoto.jpg',
    featured: false,
  },
  {
    slug: 'fotofix-europa',
    name: 'Fotofix Europa',
    manufacturer: 'Fotofix GmbH',
    yearsProduced: '1992-2010',
    photoType: 'Color',
    description: 'German engineering meets photo booth design. Known for reliable operation and quality prints.',
    boothCount: 35,
    rarity: 'Uncommon',
    image: '/machines/fotofix.jpg',
    featured: false,
  },
  {
    slug: 'cherry-ch-400',
    name: 'Cherry CH-400',
    manufacturer: 'Cherry Industries',
    yearsProduced: '1995-2015',
    photoType: 'Digital/Color',
    description: 'One of the first digital-analog hybrid booths. Prints look traditional but uses digital capture.',
    boothCount: 65,
    rarity: 'Common',
    image: '/machines/cherry.jpg',
    featured: false,
  },
];

const rarityColors: Record<string, string> = {
  'Common': 'bg-success',
  'Uncommon': 'bg-warning',
  'Rare': 'bg-primary',
  'Very Rare': 'bg-accent',
};

export default function MachinesPage() {
  const featuredModels = machineModels.filter((m) => m.featured);
  const moreModels = machineModels.filter((m) => !m.featured);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-secondary via-white to-secondary film-grain">
        {/* Hero */}
        <section className="py-16 px-4 text-center warm-glow">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-5xl md:text-6xl font-semibold text-neutral-900 mb-6">
              Machine Models
            </h1>
            <p className="text-xl text-neutral-700 max-w-2xl mx-auto">
              From vintage chemical processors to modern classics, explore the different
              photo booth machines you&apos;ll encounter in the wild.
            </p>
          </div>
        </section>

        {/* Info Banner */}
        <section className="px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-secondary rounded-lg p-6 flex items-start gap-4 mb-12">
              <Info className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">
                  Why Machine Type Matters
                </h3>
                <p className="text-neutral-700 text-sm">
                  Different machines produce different results. Chemical booths create unique, unrepeatable
                  prints with beautiful grain. Digital booths offer consistency and often color options.
                  Knowing the machine helps you know what to expect.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Models */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-3xl font-semibold text-neutral-900 mb-8">
              Popular Models
            </h2>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {featuredModels.map((model) => (
                <Link
                  key={model.slug}
                  href={`/machines/${model.slug}`}
                  className="group"
                >
                  <div className="card-vintage rounded-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                    {/* Image Placeholder */}
                    <div className="relative h-48 bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center">
                      <Camera className="w-16 h-16 text-neutral-500" />
                      <div className={`absolute top-4 right-4 ${rarityColors[model.rarity]} text-white text-xs font-medium px-2 py-1 rounded`}>
                        {model.rarity}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="font-display text-xl font-semibold text-neutral-900 mb-1 group-hover:text-primary transition">
                        {model.name}
                      </h3>
                      <p className="text-sm text-neutral-500 mb-3">
                        {model.manufacturer}
                      </p>
                      <p className="text-neutral-600 mb-4 line-clamp-2 text-sm">
                        {model.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {model.yearsProduced}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {model.boothCount} booths
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* More Models */}
            <h2 className="font-display text-3xl font-semibold text-neutral-900 mb-8">
              All Models
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {moreModels.map((model) => (
                <Link
                  key={model.slug}
                  href={`/machines/${model.slug}`}
                  className="group"
                >
                  <div className="card-vintage rounded-lg p-6 hover:shadow-lg transition-all hover:-translate-y-1 flex items-start gap-4">
                    <div className="w-16 h-16 bg-neutral-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Camera className="w-8 h-8 text-neutral-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition">
                          {model.name}
                        </h3>
                        <span className={`${rarityColors[model.rarity]} text-white text-xs px-2 py-0.5 rounded`}>
                          {model.rarity}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 mb-2">
                        {model.manufacturer} • {model.yearsProduced}
                      </p>
                      <p className="text-sm text-neutral-600 line-clamp-1">
                        {model.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Know a Model? */}
            <div className="mt-16 text-center">
              <div className="card-vintage rounded-lg p-8 inline-block">
                <h3 className="font-display text-2xl font-semibold text-neutral-900 mb-3">
                  Know a Model We&apos;re Missing?
                </h3>
                <p className="text-neutral-600 mb-4">
                  Help us document photo booth history by telling us about machines we haven&apos;t listed.
                </p>
                <Link
                  href="/contact"
                  className="text-primary hover:underline font-medium"
                >
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
