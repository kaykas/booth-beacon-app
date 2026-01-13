import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, Route, ChevronRight, BookOpen, Camera, Globe } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createServerClient } from '@/lib/supabase';
import { CityGuide } from '@/types';
import { generateAIMetaTags, generateContentFreshnessSignals } from '@/lib/ai-meta-tags';

const aiTags = generateAIMetaTags({
  summary: 'Expert-curated city guides featuring optimized walking routes to the best analog photo booths. Includes estimated walking times, local tips, and hand-picked booth recommendations for tourists and enthusiasts.',
  keyConcepts: ['photo booth', 'analog photography', 'city guides', 'photo booth tours', 'walking routes', 'curated recommendations', 'travel guide'],
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
  title: 'City Guides - Curated Photo Booth Tours | Booth Beacon',
  description:
    'Explore expert-curated city guides featuring the best photo booth routes worldwide. Hand-picked locations with walking directions, timing, tips, and local insights.',
  keywords: [
    'photo booth tours',
    'city guides',
    'photo booth walking tours',
    'analog photo booth guide',
    'photo booth routes',
  ],
  openGraph: {
    title: 'City Guides - Curated Photo Booth Tours | Booth Beacon',
    description:
      'Explore curated walking tours of the best analog photo booths in cities worldwide.',
    type: 'website',
    url: 'https://boothbeacon.org/guides',
  },
  other: {
    ...aiTags,
    ...freshnessTags,
  },
};

// Fetch all published city guides
async function getCityGuides(): Promise<CityGuide[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('city_guides')
    .select('*')
    .eq('published', true)
    .order('city', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as CityGuide[];
}

// ISR: Revalidate every 30 minutes
export const revalidate = 1800;

export default async function GuidesPage() {
  const guides = await getCityGuides();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary to-accent text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                <BookOpen className="w-4 h-4" />
                Curated City Guides
              </div>

              <h1 className="font-display text-5xl font-semibold mb-4">
                Photo Booth City Guides
              </h1>

              <p className="text-xl text-white/90 mb-6">
                Hand-curated routes through the best photo booths in major cities.
                Discover optimized walking paths, local tips, and hidden gems.
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  <span>Optimized Routes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>Estimated Times</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>Local Insights</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* What's a Guide vs Collection Explainer */}
          <div className="mb-12 grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">City Guides</h3>
                  <Badge variant="outline" className="text-xs">Curated Routes</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Hand-picked photo booth routes optimized for walking or transit.
                Includes local tips, estimated times, and the best booths to visit
                in each city. Perfect for tourists and booth enthusiasts.
              </p>
            </Card>

            <Card className="p-6 bg-card border-primary/10">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Collections</h3>
                  <Badge variant="outline" className="text-xs">Browse by Location</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Complete directory of all photo booths organized by country and city.
                No curation—just comprehensive listings. Great for finding every
                booth in a specific location.
              </p>
              <Link href="/collections">
                <Button variant="outline" size="sm" className="mt-4 w-full">
                  Browse Collections
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>
          </div>

          {/* City Guides Grid */}
          <div className="mb-8">
            <h2 className="font-display text-3xl font-semibold mb-2">
              Available City Guides
            </h2>
            {guides.length > 0 && (
              <p className="text-muted-foreground mb-6">
                Explore {guides.length} curated photo booth tour{guides.length !== 1 ? 's' : ''} around the world
              </p>
            )}

            {guides.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guides.map((guide) => {
                  const boothCount = guide.booth_ids?.length || 0;

                  return (
                    <Link key={guide.id} href={`/guides/${guide.slug}`} className="group">
                      <Card className="overflow-hidden bg-card border-primary/10 hover:border-primary/30 hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                        {/* Hero Image */}
                        <div className="relative aspect-[16/9] bg-neutral-100 overflow-hidden">
                          {guide.hero_image_url ? (
                            <Image
                              src={guide.hero_image_url}
                              alt={`${guide.city} photo booth guide`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                              <Camera className="w-16 h-16 text-muted-foreground opacity-30" />
                            </div>
                          )}
                          {/* Country badge overlay */}
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-white/90 text-foreground border-primary/20 backdrop-blur-sm">
                              <Globe className="w-3 h-3 mr-1" />
                              {guide.country}
                            </Badge>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-6">
                          <div className="mb-3">
                            <h3 className="font-display text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                              {guide.city}
                            </h3>
                            {guide.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {guide.description}
                              </p>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                            {boothCount > 0 && (
                              <div className="flex items-center gap-1">
                                <Route className="w-4 h-4 text-primary" />
                                <span>{boothCount} booth{boothCount !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                            {guide.estimated_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-primary" />
                                <span>{guide.estimated_time}</span>
                              </div>
                            )}
                          </div>

                          {/* CTA */}
                          <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                            View Guide
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center bg-card border-primary/10">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Route className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">
                  City Guides Coming Soon
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We're crafting expert city guides with optimized routes, timing recommendations, and local tips. Check back soon to explore curated photo booth tours.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg">
                    <Link href="/map">
                      <MapPin className="w-5 h-5 mr-2" />
                      Explore the Map
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/collections">
                      <Camera className="w-5 h-5 mr-2" />
                      Browse Collections
                    </Link>
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Additional Info Section */}
          <div className="mt-12 pt-8 border-t border-primary/10">
            <h2 className="font-display text-2xl font-semibold mb-4">
              Want a Guide for Your City?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl">
              We're constantly adding new city guides. If you'd like to see a guide
              for your city or want to contribute local knowledge, let us know!
            </p>
            <div className="flex gap-4">
              <Button asChild className="btn-analog text-white border-0">
                <Link href="/submit">Submit a Booth</Link>
              </Button>
              <Button asChild variant="outline" className="border-primary/20">
                <Link href="/about">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
