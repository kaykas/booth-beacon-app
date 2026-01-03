/**
 * TrustSignals Component - Usage Examples
 *
 * This file demonstrates various ways to use the TrustSignals component
 * throughout the Booth Beacon application.
 */

import { TrustSignals, TrustBadge, VerifiedMetric } from './TrustSignals';

// ============================================================================
// Example 1: Full Trust Signals in Footer
// ============================================================================

export function FooterWithTrustSignals() {
  return (
    <footer className="bg-background border-t border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Other footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* ... footer columns ... */}
        </div>

        {/* Trust Signals Section */}
        <div className="border-t border-primary/10 pt-8 mb-8">
          <TrustSignals variant="full" />
        </div>

        {/* Copyright and links */}
        <div className="text-center text-sm text-muted-foreground">
          © 2024 Booth Beacon. Made with ♥ for analog photography.
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// Example 2: Compact Trust Signals in Page Content
// ============================================================================

export function AboutPageWithTrustSignals() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-display font-bold mb-6">About Booth Beacon</h1>

      <div className="prose prose-invert max-w-none mb-8">
        <p>
          We're building the world's most comprehensive directory of analog photo booths...
        </p>
      </div>

      {/* Compact inline trust signals */}
      <TrustSignals variant="compact" inline className="mb-8" />

      <div className="prose prose-invert max-w-none">
        <p>More content...</p>
      </div>
    </div>
  );
}

// ============================================================================
// Example 3: Trust Badges in Homepage Hero
// ============================================================================

export function HomepageHero() {
  return (
    <section className="relative py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 text-gradient-pink">
          Find Classic Photo Booths Worldwide
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          The ultimate directory for analog photography enthusiasts
        </p>

        {/* Inline trust badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <TrustBadge label="1,200+ Verified Booths" />
          <TrustBadge label="Community-Driven" />
          <TrustBadge label="46 Data Sources" />
          <TrustBadge label="Worldwide Coverage" />
        </div>

        <button className="btn-vintage-amber px-8 py-3 rounded-lg font-semibold">
          Explore Map
        </button>
      </div>
    </section>
  );
}

// ============================================================================
// Example 4: Verified Metrics in Statistics Section
// ============================================================================

export function StatisticsSection() {
  return (
    <section className="py-16 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-display font-bold text-center mb-12">
          By The Numbers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <VerifiedMetric
              value="1,200+"
              label="verified photo booths"
              className="justify-center mb-2"
            />
            <p className="text-sm text-muted-foreground">
              Continuously updated and community-verified
            </p>
          </div>

          <div className="text-center">
            <VerifiedMetric
              value="46"
              label="trusted data sources"
              className="justify-center mb-2"
            />
            <p className="text-sm text-muted-foreground">
              Multiple sources ensure comprehensive coverage
            </p>
          </div>

          <div className="text-center">
            <VerifiedMetric
              value="38"
              label="countries covered"
              className="justify-center mb-2"
            />
            <p className="text-sm text-muted-foreground">
              Worldwide directory of analog photo booths
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Example 5: Trust Signals on Booth Detail Page
// ============================================================================

export function BoothDetailPageFooter() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Booth details content above */}

      {/* Compact trust signals at bottom of page */}
      <div className="mt-16 pt-8 border-t border-primary/10">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">About This Data</h3>
          <TrustSignals variant="compact" className="max-w-2xl" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Custom Trust Badge in Form
// ============================================================================

export function UserContributionForm() {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-card rounded-lg border border-primary/10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold mb-2">
            Add a Photo Booth
          </h2>
          <p className="text-muted-foreground text-sm">
            Help us build the world's best photo booth directory
          </p>
        </div>
        <TrustBadge label="Community-Driven" className="flex-shrink-0" />
      </div>

      {/* Form fields */}
      <form className="space-y-4">
        {/* ... form inputs ... */}
      </form>

      {/* Trust disclaimer at bottom */}
      <div className="mt-6 pt-6 border-t border-primary/10">
        <TrustSignals variant="compact" />
      </div>
    </div>
  );
}

// ============================================================================
// Example 7: Map Page with Trust Signals
// ============================================================================

export function MapPageLayout() {
  return (
    <div className="h-screen flex flex-col">
      {/* Map container */}
      <div className="flex-1 relative">
        {/* Map component */}
      </div>

      {/* Bottom info bar with compact trust signals */}
      <div className="bg-card border-t border-primary/10 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <TrustSignals variant="compact" inline />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 8: Search Results with Trust Context
// ============================================================================

export function SearchResultsPage({ totalResults }: { totalResults: number }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">
          Search Results
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Found {totalResults} booths matching your search
          </p>
          <TrustBadge label="Verified Data" className="hidden sm:inline-flex" />
        </div>
      </div>

      {/* Search results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ... booth cards ... */}
      </div>

      {/* Full trust signals at bottom */}
      <div className="mt-16 pt-8 border-t border-primary/10">
        <TrustSignals variant="full" />
      </div>
    </div>
  );
}

// ============================================================================
// Example 9: API Documentation Page
// ============================================================================

export function APIDocumentationPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-display font-bold mb-6">API Documentation</h1>

      <div className="bg-vintage-amber/10 border border-vintage-amber/20 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <TrustBadge label="Verified Data" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">About Our Data</h3>
            <p className="text-sm text-muted-foreground">
              All API responses include data from our verified database of 1,200+ photo booths,
              aggregated from 46 trusted sources and enhanced with AI extraction.
            </p>
          </div>
        </div>
      </div>

      {/* API documentation content */}

      {/* Trust signals at bottom */}
      <div className="mt-12 pt-8 border-t border-primary/10">
        <TrustSignals variant="full" />
      </div>
    </div>
  );
}

// ============================================================================
// Example 10: Mobile-Optimized Trust Signals
// ============================================================================

export function MobileFooter() {
  return (
    <footer className="bg-background border-t border-primary/10 px-4 py-8 md:hidden">
      {/* Mobile-optimized compact trust signals */}
      <TrustSignals variant="compact" className="mb-6" />

      {/* Mobile footer links */}
      <div className="text-center text-xs text-muted-foreground">
        © 2024 Booth Beacon
      </div>
    </footer>
  );
}
