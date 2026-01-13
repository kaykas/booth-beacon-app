import { Metadata } from 'next';
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
import { generateFAQPageSchema, generateBreadcrumbSchema, FAQItem } from '@/lib/seo/structuredData';
import { generateAIMetaTags, generateContentFreshnessSignals } from '@/lib/ai-meta-tags';

const collectionsFAQs: FAQItem[] = [
  {
    question: 'How can I browse photo booths by location?',
    answer: 'Use our Collections page to browse photo booths organized by country and city. Click on any country to see all cities with photo booths, or select a top city to view all booths in that location.',
  },
  {
    question: 'Which cities have the most photo booths?',
    answer: 'Major metropolitan areas typically have the highest concentration of analog photo booths. Our Top Cities section shows the cities with the most booths worldwide, including popular destinations like Berlin, Paris, Tokyo, and New York.',
  },
  {
    question: 'How do I find photo booths in my country?',
    answer: 'Scroll down to the Browse by Country section and select your country. You will see all cities within that country that have photo booths, along with booth counts for each location.',
  },
  {
    question: 'What is the difference between Collections and City Guides?',
    answer: 'Collections show our complete directory of all photo booths organized by location, with no curation. City Guides are curated routes and recommendations for the best photo booth experiences in specific cities, with suggested itineraries and tips.',
  },
];

const aiTags = generateAIMetaTags({
  summary: 'Geographic collections of analog photo booths organized by country and city. Explore photo booth locations worldwide with booth counts and direct links to local directories.',
  keyConcepts: ['photo booth', 'analog photography', 'photo booth collections', 'country directory', 'city booths', 'geographic organization'],
  contentStructure: 'directory',
  expertiseLevel: 'beginner',
  perspective: 'commercial',
  authority: 'industry-expert',
});

const freshnessTags = generateContentFreshnessSignals({
  publishedDate: '2025-01-01T00:00:00Z',
  modifiedDate: new Date().toISOString(),
  revisedDate: new Date().toISOString().split('T')[0],
});

export const metadata: Metadata = {
  title: 'Collections - Browse Booths by Location | Booth Beacon',
  description:
    'Discover photo booths organized by country and city. Browse our global collection of analog photo booths.',
  openGraph: {
    title: 'Collections - Browse Booths by Location | Booth Beacon',
    description:
      'Discover photo booths organized by country and city. Browse our global collection of analog photo booths.',
    type: 'website',
    url: 'https://boothbeacon.org/collections',
    siteName: 'Booth Beacon',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Browse photo booth collections by country and city on Booth Beacon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Collections - Browse Booths by Location | Booth Beacon',
    description:
      'Discover photo booths organized by country and city. Browse our global collection of analog photo booths.',
    images: ['/og-default.png'],
  },
  other: {
    ...aiTags,
    ...freshnessTags,
  },
};

const collectionsBreadcrumbs = [
  { name: 'Home', url: 'https://boothbeacon.org' },
  { name: 'Collections', url: 'https://boothbeacon.org/collections' },
];

export default async function CollectionsPage() {
  const [countries, topCities, stats] = await Promise.all([
    getCountryCollections(),
    getTopCities(20),
    getCollectionStats(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbSchema(collectionsBreadcrumbs)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateFAQPageSchema(collectionsFAQs)),
        }}
      />
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
            Explore our complete directory of analog photo booths organized by
            country and city. Every booth, no curation.
          </p>

          <div className="text-sm text-muted-foreground mb-8">
            Looking for curated routes?{' '}
            <Link href="/guides" className="text-primary hover:underline font-medium">
              View City Guides
            </Link>
          </div>

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
