import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';
import { MapPin, Clock, Route, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BoothCard } from '@/components/booth/BoothCard';
import { BoothMap } from '@/components/booth/BoothMap';
import { createServerClient } from '@/lib/supabase';
import { CityGuide, Booth } from '@/types';

interface CityGuidePageProps {
  params: Promise<{
    city: string;
  }>;
}

// Fetch city guide data
async function getCityGuide(slug: string): Promise<CityGuide | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('city_guides')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as CityGuide;
}

// Fetch booths for the guide
async function getGuideBooths(boothIds: string[]): Promise<Booth[]> {
  if (!boothIds || boothIds.length === 0) return [];

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .in('id', boothIds)
    .eq('status', 'active');

  if (error) return [];
  return (data as Booth[]) || [];
}

// ISR: Revalidate city guide pages every 30 minutes
export const revalidate = 1800;

export async function generateMetadata({ params }: CityGuidePageProps): Promise<Metadata> {
  const { city } = await params;
  const guide = await getCityGuide(city);

  if (!guide) {
    return {
      title: 'City Guide Not Found | Booth Beacon',
    };
  }

  return {
    title: `\${guide.title} | Booth Beacon`,
    description: guide.description || `Photo booth guide for \${guide.city}, \${guide.country}`,
  };
}

export default async function CityGuidePage({ params }: CityGuidePageProps) {
  const { city } = await params;
  const guide = await getCityGuide(city);

  if (!guide) {
    notFound();
  }

  const booths = await getGuideBooths(guide.booth_ids);

  // Calculate center for map
  const center = booths.length > 0 && booths[0].latitude && booths[0].longitude
    ? { lat: booths[0].latitude, lng: booths[0].longitude }
    : undefined;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="bg-white/20 text-white mb-4">
              City Guide
            </Badge>
            <h1 className="font-display text-5xl font-semibold mb-4">
              {guide.title}
            </h1>
            <p className="text-xl text-white/90 mb-6">
              {guide.description}
            </p>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{guide.city}, {guide.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                <span>{booths.length} booths</span>
              </div>
              {guide.estimated_time && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{guide.estimated_time}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {center && booths.length > 0 && (
              <Card className="p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">Route Map</h2>
                <div className="h-96 rounded-lg overflow-hidden">
                  <BoothMap
                    booths={booths}
                    center={center}
                    zoom={13}
                    showUserLocation={true}
                  />
                </div>
              </Card>
            )}

            <div>
              <h2 className="font-display text-2xl font-semibold mb-6">
                Booths on This Route
              </h2>
              <div className="space-y-6">
                {booths.map((booth, index) => (
                  <div key={booth.id}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <BoothCard booth={booth} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {guide.tips && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Local Tips
                </h3>
                <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                  {guide.tips}
                </p>
              </Card>
            )}

            <Card className="p-6 bg-primary text-white">
              <h3 className="font-semibold text-lg mb-3">Ready to Explore?</h3>
              <p className="text-white/90 mb-4 text-sm">
                Save this guide and start your photo booth adventure!
              </p>
              <Button variant="secondary" className="w-full">
                Save Guide
              </Button>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">More City Guides</h3>
              <Link href="/guides">
                <Button variant="outline" className="w-full">
                  Browse All Guides
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
