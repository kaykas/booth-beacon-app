import Link from 'next/link';
import { Heart, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FoundersStory() {
  return (
    <section className="py-16 px-4 bg-card/60 warm-glow">
      <div className="max-w-5xl mx-auto grid gap-10 md:grid-cols-[1.2fr_1fr] items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-glow">
            <Sparkles className="h-4 w-4" />
            Built for Alexandra and every analog romantic
          </div>
          <h2 className="font-display text-4xl font-semibold text-foreground">
            A beacon born from a love story
          </h2>
          <div className="space-y-3 text-lg leading-relaxed text-muted-foreground">
            <p>
              Classic Photo Booth Beacon started as a gift from{' '}
              <span className="font-semibold text-foreground">Jascha</span> to{' '}
              <span className="font-semibold text-foreground">Alexandra</span>, who mapped every
              authentic photochemical booth on their travels so they could chase real chemical photographs together.
            </p>
            <p>
              Every stop on Alexandra&apos;s shared map was another set of tangible photo strips—proof that some moments
              deserve to be developed in chemicals, not pixels. Booth Beacon exists to guide the rest of us to those
              rare machines and keep Alexandra&apos;s analog ritual alive.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="btn-analog text-white border-0">
              <Link href="/map">
                <MapPin className="mr-2 h-4 w-4" />
                Find a booth near you
              </Link>
            </Button>
            <Button asChild variant="ghost" className="gap-2 text-base font-semibold">
              <Link href="/about">
                <Heart className="h-4 w-4 text-primary" />
                Read the full story
              </Link>
            </Button>
          </div>
        </div>

        <div className="card-vintage rounded-xl border border-primary/20 bg-background/80 p-6 shadow-photo">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm uppercase tracking-wider text-muted-foreground">Alexandra&apos;s ritual</div>
              <div className="text-lg font-semibold text-foreground">Real chemical photo strips only</div>
            </div>
          </div>
          <ul className="space-y-3 pt-4 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
              Hunt down authentic photochemical booths in every city we visit together.
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
              Plot them on a shared map so every trip has built-in analog adventures.
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
              Capture memories on real film, developed in chemicals you can smell and hold.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
