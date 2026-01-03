/**
 * TrustSignals Component - Demo Page
 *
 * This demo page showcases all variants of the TrustSignals component.
 * Use this to visually test the component during development.
 *
 * To view: Create a page at /app/demo/trust-signals/page.tsx that imports this component.
 */

'use client';

import { TrustSignals, TrustBadge, VerifiedMetric } from './TrustSignals';

export function TrustSignalsDemo() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-display font-bold text-foreground">
            TrustSignals Component Demo
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Visual showcase of all TrustSignals variants and usage patterns
          </p>
        </div>

        {/* Demo 1: Full Variant */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              1. Full Variant (Default)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Complete trust signals with badges and legal links. Best for footer placement.
            </p>
            <div className="text-xs font-mono text-vintage-amber mb-4">
              {'<TrustSignals variant="full" />'}
            </div>
          </div>
          <div className="bg-card/50 border border-primary/10 rounded-lg p-8">
            <TrustSignals variant="full" />
          </div>
        </section>

        {/* Demo 2: Compact Variant */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              2. Compact Variant
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Minimal trust signals. Good for sidebar or bottom of content pages.
            </p>
            <div className="text-xs font-mono text-vintage-amber mb-4">
              {'<TrustSignals variant="compact" />'}
            </div>
          </div>
          <div className="bg-card/50 border border-primary/10 rounded-lg p-8">
            <TrustSignals variant="compact" />
          </div>
        </section>

        {/* Demo 3: Compact Inline */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              3. Compact Inline Variant
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Minimal trust signals displayed inline. Perfect for tight spaces.
            </p>
            <div className="text-xs font-mono text-vintage-amber mb-4">
              {'<TrustSignals variant="compact" inline />'}
            </div>
          </div>
          <div className="bg-card/50 border border-primary/10 rounded-lg p-8">
            <TrustSignals variant="compact" inline />
          </div>
        </section>

        {/* Demo 4: Custom Values */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              4. Custom Values
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Override booth count and source count with custom values.
            </p>
            <div className="text-xs font-mono text-vintage-amber mb-4">
              {'<TrustSignals variant="full" boothCount={1500} sourceCount={52} />'}
            </div>
          </div>
          <div className="bg-card/50 border border-primary/10 rounded-lg p-8">
            <TrustSignals variant="full" boothCount={1500} sourceCount={52} />
          </div>
        </section>

        {/* Demo 5: Trust Badges */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              5. Trust Badges (Individual)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Standalone trust badges for use in content areas.
            </p>
            <div className="text-xs font-mono text-vintage-amber mb-4">
              {'<TrustBadge label="1,200+ Verified Booths" />'}
            </div>
          </div>
          <div className="bg-card/50 border border-primary/10 rounded-lg p-8">
            <div className="flex flex-wrap gap-3">
              <TrustBadge label="1,200+ Verified Booths" />
              <TrustBadge label="Community-Driven" />
              <TrustBadge label="46 Data Sources" />
              <TrustBadge label="AI-Powered" />
              <TrustBadge label="Worldwide Coverage" />
            </div>
          </div>
        </section>

        {/* Demo 6: Verified Metrics */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              6. Verified Metrics
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Data verification indicators for specific metrics.
            </p>
            <div className="text-xs font-mono text-vintage-amber mb-4">
              {'<VerifiedMetric value="1,200+" label="verified photo booths" />'}
            </div>
          </div>
          <div className="bg-card/50 border border-primary/10 rounded-lg p-8">
            <div className="space-y-4">
              <VerifiedMetric value="1,200+" label="verified photo booths" />
              <VerifiedMetric value="46" label="trusted data sources" />
              <VerifiedMetric value="38" label="countries covered" />
              <VerifiedMetric value="95%" label="data accuracy" />
            </div>
          </div>
        </section>

        {/* Demo 7: In Context - Footer */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              7. In Context: Footer
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              How it looks in an actual footer layout.
            </p>
          </div>
          <div className="bg-card border border-primary/10 rounded-lg overflow-hidden">
            <footer className="bg-background/50 p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold text-foreground mb-4">About</h3>
                  <p className="text-sm text-muted-foreground">
                    The world's ultimate directory of classic analog photo booths.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Links</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Explore Map</li>
                    <li>About Us</li>
                    <li>Contact</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Legal</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Privacy Policy</li>
                    <li>Terms of Service</li>
                    <li>Data Sources</li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-primary/10 pt-8">
                <TrustSignals variant="full" />
              </div>
            </footer>
          </div>
        </section>

        {/* Demo 8: In Context - Content Page */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              8. In Context: Content Page
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              How it looks at the bottom of a content page.
            </p>
          </div>
          <div className="bg-card border border-primary/10 rounded-lg p-8">
            <div className="prose prose-invert max-w-none mb-8">
              <h3 className="text-xl font-display font-bold text-foreground mb-4">
                About Our Data
              </h3>
              <p className="text-muted-foreground">
                Booth Beacon aggregates data from multiple sources to provide the most
                comprehensive directory of analog photo booths worldwide. Our community
                of contributors helps verify and maintain booth information.
              </p>
            </div>
            <TrustSignals variant="compact" />
          </div>
        </section>

        {/* Demo 9: Dark vs Light Background */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              9. Background Variations
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Component appearance on different backgrounds.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-primary/10 rounded-lg p-6">
              <div className="text-xs text-muted-foreground mb-4 font-semibold">
                Card Background
              </div>
              <TrustSignals variant="compact" inline />
            </div>
            <div className="bg-background border border-primary/10 rounded-lg p-6">
              <div className="text-xs text-muted-foreground mb-4 font-semibold">
                Background Color
              </div>
              <TrustSignals variant="compact" inline />
            </div>
          </div>
        </section>

        {/* Demo 10: Responsive Behavior */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              10. Responsive Behavior
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Component automatically adapts to different screen sizes.
              Resize your browser to see the responsive behavior.
            </p>
          </div>
          <div className="space-y-4">
            <div className="bg-card/50 border border-primary/10 rounded-lg p-4 max-w-sm">
              <div className="text-xs text-muted-foreground mb-4 font-semibold">
                Mobile View (320px-640px)
              </div>
              <TrustSignals variant="full" />
            </div>
            <div className="bg-card/50 border border-primary/10 rounded-lg p-6 max-w-2xl">
              <div className="text-xs text-muted-foreground mb-4 font-semibold">
                Tablet View (640px-1024px)
              </div>
              <TrustSignals variant="full" />
            </div>
            <div className="bg-card/50 border border-primary/10 rounded-lg p-8">
              <div className="text-xs text-muted-foreground mb-4 font-semibold">
                Desktop View (1024px+)
              </div>
              <TrustSignals variant="full" />
            </div>
          </div>
        </section>

        {/* Color Reference */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              11. Color Reference
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Component uses the vintage amber/orange aesthetic from the design system.
            </p>
          </div>
          <div className="bg-card/50 border border-primary/10 rounded-lg p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="w-full h-20 rounded-lg bg-vintage-amber" />
                <div className="text-xs text-center text-muted-foreground">
                  vintage-amber
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-20 rounded-lg bg-vintage-orange" />
                <div className="text-xs text-center text-muted-foreground">
                  vintage-orange
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-20 rounded-lg bg-vintage-amber-dark" />
                <div className="text-xs text-center text-muted-foreground">
                  vintage-amber-dark
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-20 rounded-lg bg-vintage-orange-dark" />
                <div className="text-xs text-center text-muted-foreground">
                  vintage-orange-dark
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="text-center py-8 border-t border-primary/10">
          <p className="text-sm text-muted-foreground">
            End of TrustSignals Demo
          </p>
        </section>
      </div>
    </div>
  );
}
