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
  title: 'New York Photo Booth Tour | Booth Beacon',
  description: 'Discover New York City\'s iconic photo booth scene. From Brooklyn dive bars to Manhattan train stations, find the city\'s best analog photobooths.',
};

// Fetch booths for New York
async function getNewYorkBooths(): Promise<Booth[]> {
  const supabase = createPublicServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('city', 'New York')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching New York booths:', error);
    return [];
  }

  return (data as Booth[]) || [];
}

export default async function NewYorkTourPage() {
  const booths = await getNewYorkBooths();

  // Calculate center for map based on booths
  const validBooths = booths.filter(b => b.latitude && b.longitude);
  const center = validBooths.length > 0
    ? {
        lat: validBooths.reduce((sum, b) => sum + (b.latitude || 0), 0) / validBooths.length,
        lng: validBooths.reduce((sum, b) => sum + (b.longitude || 0), 0) / validBooths.length,
      }
    : { lat: 40.7128, lng: -74.0060 }; // Default NYC center

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
              New York Photo Booth
              <br />
              <span className="text-gradient-pink">Tour</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              New York City is the birthplace of the modern photo booth. From vintage machines in Brooklyn
              dive bars to iconic booths in Grand Central Terminal, discover where New Yorkers have been
              capturing memories for generations. Each booth is a piece of the city&apos;s endless story.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium">{booths.length} booths in NYC</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Camera className="w-5 h-5 text-primary" />
                <span className="font-medium">Vintage & Modern</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-medium">Multi-day adventure</span>
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
                      city="New York"
                      booths={booths}
                      variant="primary"
                      size="sm"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Explore all {booths.length} photo booths across New York.
                    Open in Google Maps to save your custom tour and navigate with turn-by-turn directions.
                  </p>
                  <div className="h-[500px] rounded-lg overflow-hidden shadow-photo vignette">
                    <BoothMap
                      booths={booths}
                      center={center}
                      zoom={11}
                      showUserLocation={true}
                      showClustering={true}
                    />
                  </div>
                </Card>
              )}

              {/* About NYC's Scene */}
              <Card className="p-6 card-vintage">
                <h2 className="font-display text-2xl font-semibold mb-4 text-foreground">
                  New York&apos;s Photo Booth Legacy
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    The photo booth was invented in New York City in 1925, and the city has maintained its
                    status as a photo booth mecca ever since. From classic Photomatic machines to modern
                    analog setups, NYC offers an incredible diversity of booth experiences.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Brooklyn&apos;s creative scene has embraced photo booths as an art form, with many bars and
                    venues featuring vintage machines as centerpieces. Manhattan still houses some historic
                    booths in unexpected locations - train stations, delis, and old-school arcades.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    The city&apos;s 24/7 energy means many booths are accessible at all hours. Whether you&apos;re
                    catching a late train at Grand Central or closing down a Brooklyn bar at 3am, there&apos;s
                    always a booth nearby ready to capture the moment.
                  </p>
                </div>
              </Card>

              {/* Booths Grid */}
              <div>
                <h2 className="font-display text-3xl font-semibold mb-6 text-foreground">
                  All Booths in New York
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
                      No booths found in New York yet.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/submit">
                        <Camera className="w-4 h-4 mr-2" />
                        Submit a NYC Booth
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
                    <span>Most booths cost $5-10 for a strip of 4 photos</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Grand Central Terminal has multiple booths - a must-visit for enthusiasts</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Brooklyn&apos;s best booths are in Williamsburg, Bushwick, and Park Slope</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Many bars with booths require a purchase to use them during busy hours</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Check if booths are B&W or color before you pay - NYC has amazing variety</span>
                  </li>
                </ul>
              </Card>

              {/* Neighborhoods */}
              <Card className="p-6 card-vintage">
                <h3 className="font-semibold text-lg mb-4 text-foreground">
                  Popular Neighborhoods
                </h3>
                <div className="space-y-2">
                  <Badge className="badge-retro mr-2 mb-2">Williamsburg</Badge>
                  <Badge className="badge-retro mr-2 mb-2">East Village</Badge>
                  <Badge className="badge-retro mr-2 mb-2">Lower East Side</Badge>
                  <Badge className="badge-retro mr-2 mb-2">Bushwick</Badge>
                  <Badge className="badge-retro mr-2 mb-2">Park Slope</Badge>
                  <Badge className="badge-retro mr-2 mb-2">Midtown</Badge>
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
