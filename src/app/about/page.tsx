import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Camera, Heart, MapPin, Users } from 'lucide-react';
import Image from 'next/image';
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
              A Love Letter to{' '}
              <span className="text-primary">Four Frames</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Booth Beacon started with a simple question: Where can we find a real photo booth?
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Photo Strip Style Container */}
            <div className="card-vintage rounded-lg p-8 md:p-12 mb-12">
              <div className="prose prose-lg max-w-none">
                <h2 className="font-display text-3xl font-semibold text-foreground mb-6 flex items-center gap-3">
                  <Heart className="w-8 h-8 text-primary" />
                  Our Story
                </h2>

                <p className="text-muted-foreground leading-relaxed mb-6">
                  In 2019, <strong className="text-foreground">Alexandra Roberts</strong> and <strong className="text-foreground">Jascha Kaykas-Wolff</strong>
                  were wandering through Berlin when they stumbled upon a vintage photo booth tucked
                  in the corner of a dimly lit bar. The flash. The mechanical whir. The anticipation
                  of waiting for the strip to develop. That moment rekindled something they'd both
                  forgotten—the pure, unfiltered joy of analog photography.
                </p>

                <p className="text-muted-foreground leading-relaxed mb-6">
                  Unlike the carefully curated, endlessly retakable selfies on our phones, photo
                  booth strips capture <em>the moment</em>. Four frames. No filters. No do-overs.
                  Just genuine expressions, often silly, always honest. These imperfect strips
                  became their most treasured souvenirs.
                </p>

                <p className="text-muted-foreground leading-relaxed mb-6">
                  But as they traveled—from Brooklyn dive bars to London train stations, from
                  Tokyo arcades to Paris cafés—they kept asking the same question:
                  <strong className="text-foreground"> "Where's the nearest photo booth?"</strong>
                </p>

                <p className="text-muted-foreground leading-relaxed mb-6">
                  There was no comprehensive guide. No way to know which booths were still operational,
                  which used authentic chemical processes, or which accepted only coins. Photo booths
                  were disappearing, being replaced by digital imposters or torn out entirely. The
                  magic was fading.
                </p>

                <p className="text-muted-foreground leading-relaxed mb-8">
                  So they decided to build <strong className="text-primary">Booth Beacon</strong>—not
                  just a directory, but a <em>love letter</em> to the vanishing art of analog photo
                  booth culture. A place where enthusiasts could find booths, share tips, preserve
                  history, and keep these magical machines alive for future generations.
                </p>

                <div className="bg-card p-6 rounded-lg border-l-4 border-primary">
                  <p className="text-foreground italic text-lg leading-relaxed">
                    "Every photo booth has a story. Every strip is a time capsule.
                    We built Booth Beacon to make sure these stories never fade."
                  </p>
                  <p className="text-muted-foreground mt-3">
                    — Alexandra & Jascha
                  </p>
                </div>
              </div>
            </div>

            {/* Founders Section */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {/* Alexandra */}
              <div className="card-vintage rounded-lg p-8 text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-accent to-primary rounded-full mx-auto mb-6 flex items-center justify-center shadow-glow">
                  <span className="text-white text-4xl font-display font-semibold">AR</span>
                </div>
                <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
                  Alexandra Roberts
                </h3>
                <p className="text-primary font-medium mb-4">Co-Founder</p>
                <p className="text-muted-foreground leading-relaxed">
                  Analog photography enthusiast, collector of vintage cameras, and believer
                  that the best moments happen when you can't retake the shot.
                </p>
              </div>

              {/* Jascha */}
              <div className="card-vintage rounded-lg p-8 text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-6 flex items-center justify-center shadow-glow">
                  <span className="text-white text-4xl font-display font-semibold">JK</span>
                </div>
                <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
                  Jascha Kaykas-Wolff
                </h3>
                <p className="text-primary font-medium mb-4">Co-Founder</p>
                <p className="text-muted-foreground leading-relaxed">
                  Tech builder, world traveler, and photo booth detective who's convinced
                  every city has hidden booth gems waiting to be discovered.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-4 bg-card">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-4xl font-semibold text-foreground text-center mb-12">
              Our Mission
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Preserve */}
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Preserve
                </h3>
                <p className="text-muted-foreground">
                  Document and protect analog photo booth culture before it disappears
                </p>
              </div>

              {/* Connect */}
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Connect
                </h3>
                <p className="text-muted-foreground">
                  Build a global community of enthusiasts who share the magic
                </p>
              </div>

              {/* Discover */}
              <div className="text-center">
                <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Discover
                </h3>
                <p className="text-muted-foreground">
                  Make every authentic booth easy to find, visit, and experience
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display text-4xl font-semibold text-foreground mb-6">
              Join Our Community
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Whether you're a collector, traveler, or just someone who loves the magic
              of four frames, you belong here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base px-8 h-12 btn-analog text-white border-0">
                <Link href="/map">
                  <MapPin className="w-5 h-5 mr-2" />
                  Explore Booths
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 h-12 bg-card/90 backdrop-blur border-2 border-primary/20 hover:bg-card hover:border-primary transition-all">
                <Link href="/submit">
                  <Camera className="w-5 h-5 mr-2" />
                  Add a Booth
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 px-4 bg-primary text-white shadow-photo">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">2019</div>
                <div className="text-sm opacity-90">Founded</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-sm opacity-90">Booths Documented</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">45</div>
                <div className="text-sm opacity-90">Countries</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">10K+</div>
                <div className="text-sm opacity-90">Community Members</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
