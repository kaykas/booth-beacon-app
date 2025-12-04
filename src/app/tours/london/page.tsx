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
  title: 'London Photo Booth Tour | Booth Beacon',
  description: 'Explore London\'s classic photo booth scene. From East End pubs to West End arcades, discover the UK capital\'s finest analog photobooths.',
};

// Fetch booths for London
async function getLondonBooths(): Promise<Booth[]> {
  const supabase = createPublicServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('city', 'London')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching London booths:', error);
    return [];
  }

  return (data as Booth[]) || [];
}

export default async function LondonTourPage() {
  const booths = await getLondonBooths();

  // Calculate center for map based on booths
  const validBooths = booths.filter(b => b.latitude && b.longitude);
  const center = validBooths.length > 0
    ? {
        lat: validBooths.reduce((sum, b) => sum + (b.latitude || 0), 0) / validBooths.length,
        lng: validBooths.reduce((sum, b) => sum + (b.longitude || 0), 0) / validBooths.length,
      }
    : { lat: 51.5074, lng: -0.1278 }; // Default London center

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
              London Photo Booth
              <br />
              <span className="text-gradient-pink">Tour</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              London&apos;s photo booth heritage runs deep. From vintage machines in Soho to modern setups in
              Shoreditch, the capital offers a perfect blend of British nostalgia and contemporary cool.
              These booths have witnessed decades of London life, from mod culture to modern hipsters.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium">{booths.length} booths in London</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Camera className="w-5 h-5 text-primary" />
                <span className="font-medium">Classic & Modern</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-medium">Weekend adventure</span>
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
                      city="London"
                      booths={booths}
                      variant="primary"
                      size="sm"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Explore all {booths.length} photo booths across London.
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

              {/* About London&apos;s Scene */}
              <Card className="p-6 card-vintage">
                <h2 className="font-display text-2xl font-semibold mb-4 text-foreground">
                  London&apos;s Photo Booth Heritage
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    London has been home to photo booths since the 1920s. The city&apos;s pub culture and love
                    for quirky traditions means many classic booths have been lovingly preserved in their
                    original locations, creating living museums of British social history.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    East London&apos;s creative renaissance has brought new life to the booth scene, with
                    Shoreditch and Hackney featuring some of Europe&apos;s coolest installations. Meanwhile,
                    West End arcades and tourist spots maintain the classic British booth experience.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    The Tube makes booth-hopping easy - many of London&apos;s best machines are within walking
                    distance of major stations. Pair your booth tour with proper pub visits for the full
                    British experience.
                  </p>
                </div>
              </Card>

              {/* Booths Grid */}
              <div>
                <h2 className="font-display text-3xl font-semibold mb-6 text-foreground">
                  All Booths in London
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
                      No booths found in London yet.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/submit">
                        <Camera className="w-4 h-4 mr-2" />
                        Submit a London Booth
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
                    <span>Most booths cost £3-5 and accept coins - have change ready</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Many pub booths are only accessible when the venue is open (11am onwards)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Transport Museum and some West End spots have classic vintage machines</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>East London has the highest concentration of working analog booths</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>British booths tend to use higher quality photo paper - strips last for years</span>
                  </li>
                </ul>
              </Card>

              {/* Neighborhoods */}
              <Card className="p-6 card-vintage">
                <h3 className="font-semibold text-lg mb-4 text-foreground">
                  Popular Neighborhoods
                </h3>
                <div className="space-y-2">
                  <Badge className="badge-retro mr-2 mb-2">Shoreditch</Badge>
                  <Badge className="badge-retro mr-2 mb-2">Soho</Badge>
                  <Badge className="badge-retro mr-2 mb-2">Camden</Badge>
                  <Badge className="badge-retro mr-2 mb-2">Hackney</Badge>
                  <Badge className="badge-retro mr-2 mb-2">Brixton</Badge>
                  <Badge className="badge-retro mr-2 mb-2">Notting Hill</Badge>
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
