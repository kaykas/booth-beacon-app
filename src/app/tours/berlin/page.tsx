import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ArrowLeft, Camera, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BoothCard } from '@/components/booth/BoothCard';
import { BoothMap } from '@/components/booth/BoothMap';
import { GoogleMapsButton } from '@/components/GoogleMapsButton';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { createPublicServerClient } from '@/lib/supabase';
import { Booth } from '@/types';

// ISR: Revalidate every hour
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Berlin Photo Booth Tour | Booth Beacon',
  description: 'Explore Berlin\'s vibrant photo booth scene. From Kreuzberg clubs to Mitte cafes, discover the city\'s best analog photobooths.',
};

// Fetch booths for Berlin
async function getBerlinBooths(): Promise<Booth[]> {
  const supabase = createPublicServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('city', 'Berlin')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching Berlin booths:', error);
    return [];
  }

  return (data as Booth[]) || [];
}

export default async function BerlinTourPage() {
  const booths = await getBerlinBooths();

  // Calculate center for map based on booths
  const validBooths = booths.filter(b => b.latitude && b.longitude);
  const center = validBooths.length > 0
    ? {
        lat: validBooths.reduce((sum, b) => sum + (b.latitude || 0), 0) / validBooths.length,
        lng: validBooths.reduce((sum, b) => sum + (b.longitude || 0), 0) / validBooths.length,
      }
    : { lat: 52.5200, lng: 13.4050 }; // Default Berlin center

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden warm-glow bg-gradient-to-br from-primary/20 via-background to-background">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <Button asChild variant="ghost" className="mb-6">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>

            {/* Hero content */}
            <Badge className="badge-retro mb-4">Photo Tour</Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Berlin Photo Booth
              <br />
              <span className="text-gradient-pink">Tour</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Berlin&apos;s photo booth culture is legendary. From gritty Kreuzberg clubs to trendy Mitte cafes,
              discover the city&apos;s most authentic analog photo spots. Each booth tells a story of Berlin&apos;s
              vibrant nightlife, artistic spirit, and love for analog nostalgia.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium">{booths.length} booths in Berlin</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Camera className="w-5 h-5 text-primary" />
                <span className="font-medium">Analog & Chemical</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-medium">Full day tour</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Map */}
              {validBooths.length > 0 && (
                <Card className="p-6 card-vintage">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="font-display text-2xl font-semibold text-foreground">
                      Tour Map
                    </h2>
                    <GoogleMapsButton
                      city="Berlin"
                      booths={booths}
                      variant="primary"
                      size="sm"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Explore all {booths.length} photo booths across Berlin.
                    Open in Google Maps to save your custom tour and navigate with turn-by-turn directions.
                  </p>
                  <div className="h-[500px] rounded-lg overflow-hidden shadow-photo vignette">
                    <BoothMap
                      booths={booths}
                      center={center}
                      zoom={12}
                      showUserLocation={true}
                      showClustering={true}
                    />
                  </div>
                </Card>
              )}

              {/* About Berlin&apos;s Scene */}
              <Card className="p-6 card-vintage">
                <h2 className="font-display text-2xl font-semibold mb-4 text-foreground">
                  Berlin&apos;s Photo Booth Culture
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Berlin has one of Europe&apos;s most vibrant photo booth scenes. The city&apos;s DIY spirit and
                    love for analog technology means you&apos;ll find vintage photobooths in the most unexpected
                    places - from underground techno clubs to cozy neighborhood bars.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Many of Berlin&apos;s booths are lovingly maintained by passionate operators who source rare
                    machines from across Europe. Some use original photochemical processes, producing
                    authentic analog strips with that unmistakable vintage aesthetic.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    The best time to booth-hunt in Berlin? Late afternoon through evening, when cafes and
                    bars come alive. Don&apos;t be surprised to find booths tucked away in unexpected corners -
                    that&apos;s part of Berlin&apos;s charm.
                  </p>
                </div>
              </Card>

              {/* Booths Grid */}
              <div>
                <h2 className="font-display text-3xl font-semibold mb-6 text-foreground">
                  All Booths in Berlin
                </h2>
                {booths.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {booths.map((booth) => (
                      <BoothCard key={booth.id} booth={booth} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground mb-4">
                      No booths found in Berlin yet.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/submit">
                        <Camera className="w-4 h-4 mr-2" />
                        Submit a Berlin Booth
                      </Link>
                    </Button>
                  </Card>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Local Tips */}
              <Card className="p-6 card-vintage">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-foreground">
                  <Star className="w-5 h-5 text-primary" />
                  Local Tips
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Most booths accept both cash and card, but bring 5-10€ in coins just in case</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Check opening hours - many booths are inside bars that open late afternoon</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Berlin&apos;s public transport is excellent - use the U-Bahn to hop between neighborhoods</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Kreuzberg and Friedrichshain have the highest density of booths</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Some booths take 2-3 minutes to develop - be patient for authentic analog magic</span>
                  </li>
                </ul>
              </Card>

              {/* Neighborhoods */}
              <Card className="p-6 card-vintage">
                <h3 className="font-semibold text-lg mb-4 text-foreground">
                  Popular Neighborhoods
                </h3>
                <div className="space-y-2">
                  <Badge className="badge-retro mr-2 mb-2">Kreuzberg</Badge>
                  <Badge className="badge-retro mr-2 mb-2">Friedrichshain</Badge>
                  <Badge className="badge-retro mr-2 mb-2">Mitte</Badge>
                  <Badge className="badge-retro mr-2 mb-2">Neukölln</Badge>
                  <Badge className="badge-retro mr-2 mb-2">Prenzlauer Berg</Badge>
                </div>
              </Card>

              {/* CTA */}
              <Card className="p-6 bg-primary text-white warm-glow">
                <h3 className="font-semibold text-lg mb-3">Explore More Cities</h3>
                <p className="text-white/90 mb-4 text-sm">
                  Discover photo booth tours in other amazing cities around the world.
                </p>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/">
                    View All Tours
                  </Link>
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
