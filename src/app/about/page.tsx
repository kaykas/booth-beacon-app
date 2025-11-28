import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Camera, Heart, MapPin, Users, Globe, Sparkles, Search, RefreshCw, Bot } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background via-card to-background film-grain">
        {/* Hero Section */}
        <section className="relative py-24 px-4 warm-glow">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display text-5xl md:text-6xl font-semibold text-foreground mb-6">
              About{' '}
              <span className="text-primary">Classic Photo Booth Beacon</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              The ultimate directory for discovering authentic analog photo booths around the world.
            </p>
          </div>
        </section>

        {/* Feature Cards Section */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Authentic Analog */}
              <div className="card-vintage rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Authentic Analog
                </h3>
                <p className="text-muted-foreground">
                  Only genuine photochemical booths, no digital imitations
                </p>
              </div>

              {/* Global Coverage */}
              <div className="card-vintage rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Global Coverage
                </h3>
                <p className="text-muted-foreground">
                  Tracking booths across 50+ countries worldwide
                </p>
              </div>

              {/* Community Driven */}
              <div className="card-vintage rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Community Driven
                </h3>
                <p className="text-muted-foreground">
                  Built by enthusiasts for enthusiasts
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-4 bg-card">
          <div className="max-w-4xl mx-auto">
            <div className="card-vintage rounded-lg p-8 md:p-12">
              <h2 className="font-display text-3xl font-semibold text-foreground mb-6 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary" />
                Our Mission
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                We&apos;re on a mission to document and preserve every working analog photo booth in the world.
                These machines are more than just novelties—they&apos;re pieces of photographic history that
                continue to create authentic, chemical-processed memories.
              </p>
            </div>
          </div>
        </section>

        {/* Why Analog Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="card-vintage rounded-lg p-8 md:p-12">
              <h2 className="font-display text-3xl font-semibold text-foreground mb-6 flex items-center gap-3">
                <Camera className="w-8 h-8 text-primary" />
                Why Analog?
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                True analog photo booths use photochemical processes to develop images on actual photo paper.
                Unlike modern digital booths that simply print on regular paper, analog booths create real
                photographs with unique characteristics—grain, contrast, and that unmistakable vintage quality
                that can&apos;t be replicated.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 px-4 bg-card">
          <div className="max-w-4xl mx-auto">
            <div className="card-vintage rounded-lg p-8 md:p-12">
              <h2 className="font-display text-3xl font-semibold text-foreground mb-6">
                How It Works
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg mb-8">
                Our system aggregates data from multiple trusted sources, verifies booth locations,
                and updates daily to ensure accuracy. We use:
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Automated Web Scraping</h4>
                    <p className="text-muted-foreground text-sm">From verified sources</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Community Submissions</h4>
                    <p className="text-muted-foreground text-sm">With human verification</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">AI-Powered Search</h4>
                    <p className="text-muted-foreground text-sm">To help you find the perfect booth</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <RefreshCw className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Regular Updates</h4>
                    <p className="text-muted-foreground text-sm">To track working status</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Love Story Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="card-vintage rounded-lg p-8 md:p-12">
              <h2 className="font-display text-3xl font-semibold text-foreground mb-6 flex items-center gap-3">
                <Heart className="w-8 h-8 text-primary" />
                A Love Story in Analog
              </h2>

              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Classic Photo Booth Beacon was born from one of the most romantic gestures{' '}
                  <strong className="text-foreground">Jascha Kaykas-Wolff</strong> has ever witnessed.
                  From the very beginning of their relationship,{' '}
                  <strong className="text-foreground">Alexandra Roberts</strong> made it her mission
                  to find every single analog photo booth in any city they traveled to together.
                </p>

                <p className="text-muted-foreground leading-relaxed mb-6">
                  She would meticulously research, identify, and map each authentic photochemical booth,
                  adding them to a shared Google Map. Then she&apos;d plan their adventures around these magical
                  machines, ensuring they could capture genuine analog memories together wherever they went.
                  Each photo strip became a tangible piece of their journey—real chemical photographs,
                  not digital prints.
                </p>

                <p className="text-muted-foreground leading-relaxed mb-6">
                  Moved by Alexandra&apos;s dedication to preserving these moments the old-fashioned way,
                  Jascha built this website in her honor. Classic Photo Booth Beacon is a celebration
                  of her romantic ritual and a gift to all analog photography enthusiasts who understand
                  that some moments deserve to be captured on real film, developed in real chemicals,
                  and held in your hands as authentic photographs.
                </p>

                <div className="bg-card p-6 rounded-lg border-l-4 border-primary">
                  <p className="text-foreground italic text-lg leading-relaxed">
                    The name &quot;Beacon&quot; reflects the mission to be your guiding light in discovering
                    these rare and precious machines worldwide—just as Alexandra has been a beacon
                    for preserving authentic photographic memories in an increasingly digital world.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Get Involved CTA Section */}
        <section className="py-16 px-4 bg-card">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display text-4xl font-semibold text-foreground mb-6">
              Get Involved
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Know of a working analog booth we haven&apos;t listed? Help us complete the directory
              by submitting booth locations. Together, we can create the most comprehensive
              resource for analog photo booth enthusiasts worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base px-8 h-12 btn-analog text-white border-0">
                <Link href="/submit">
                  <Camera className="w-5 h-5 mr-2" />
                  Submit a Booth
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 h-12 bg-card/90 backdrop-blur border-2 border-primary/20 hover:bg-card hover:border-primary transition-all">
                <Link href="/map">
                  <MapPin className="w-5 h-5 mr-2" />
                  Explore the Map
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
