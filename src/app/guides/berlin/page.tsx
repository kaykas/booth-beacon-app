import { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';
import { MapPin, Clock, Euro, Camera, ChevronRight } from 'lucide-react';
import { FeaturedAnswer, FeaturedAnswerList } from '@/components/seo/FeaturedAnswer';
import { ComparisonTable } from '@/components/seo/ComparisonTable';
import { DefinitionList } from '@/components/seo/DefinitionList';
import { AuthorBio } from '@/components/seo/AuthorBio';
import { TrustSignals } from '@/components/seo/TrustSignals';
import {
  generateHowToSchema,
  generateBreadcrumbSchema,
  generateArticleSchema,
} from '@/lib/schema-utils';

/**
 * Berlin Photo Booth Guide - Example Implementation
 * Phase 4: Featured Snippets with HowTo Schema
 *
 * This guide demonstrates all Phase 4 components:
 * - FeaturedAnswer for quick Q&A
 * - FeaturedAnswerList with FAQPage schema
 * - ComparisonTable for booth types
 * - DefinitionList for terminology
 * - HowTo schema for step-by-step instructions
 * - Article schema for the guide
 * - Breadcrumb schema for navigation
 */

export const metadata: Metadata = {
  title: 'How to Find Photo Booths in Berlin | Complete 2026 Guide',
  description:
    'Discover the best analog photo booths in Berlin. Step-by-step guide to finding authentic chemical photo booths in train stations, neighborhoods, and popular spots.',
  keywords: [
    'photo booths Berlin',
    'analog photo booth Berlin',
    'Fotoautomat Berlin',
    'Berlin photo strip',
    'where to find photo booths',
  ],
  openGraph: {
    title: 'How to Find Photo Booths in Berlin | Booth Beacon Guide',
    description:
      'Complete guide to discovering analog photo booths in Berlin with locations, tips, and prices.',
    type: 'article',
    url: 'https://boothbeacon.org/guides/berlin',
  },
};

export default function BerlinGuidePage() {
  // HowTo Schema for "How to find photo booths in Berlin"
  const howToSchema = generateHowToSchema({
    name: 'How to Find Photo Booths in Berlin',
    description:
      'A complete step-by-step guide to discovering analog photo booths throughout Berlin, from train stations to hidden neighborhood gems.',
    totalTime: 'PT2H', // 2 hours
    estimatedCost: {
      currency: 'EUR',
      value: '10-20',
    },
    steps: [
      {
        name: 'Start at Major Train Stations',
        text: 'Begin your search at Berlin Hauptbahnhof (Central Station), Ostbahnhof, and Alexanderplatz. These stations have multiple photo booths and are easily accessible. Look for the iconic yellow or blue booth designs near main entrances and on platforms.',
      },
      {
        name: 'Explore Popular Neighborhoods',
        text: 'Visit Kreuzberg, Friedrichshain, and Neukölln neighborhoods where photo booths are commonly found in shopping centers, U-Bahn stations, and near popular bars. Check stations like Kottbusser Tor, Warschauer Straße, and Hermannplatz.',
      },
      {
        name: 'Check Shopping Centers',
        text: 'Large shopping centers like Mall of Berlin, Alexa, and Europa-Center often have photo booths on ground floors or near entrances. These are well-maintained and produce high-quality photos.',
      },
      {
        name: 'Use the Booth Beacon Map',
        text: 'Visit boothbeacon.org/map and filter for Berlin to see all verified photo booth locations with directions, status updates, and user reviews. This saves time and ensures booths are operational.',
      },
      {
        name: 'Bring Exact Change',
        text: 'Most Berlin photo booths accept €2-4 in coins. Some newer models accept cards, but cash is most reliable. Have coins ready before visiting.',
      },
    ],
    supply: [
      { name: '€5-10 in coins', url: 'https://boothbeacon.org/guides/berlin#costs' },
      { name: 'Smartphone with Booth Beacon app', url: 'https://boothbeacon.org' },
    ],
  });

  // Article Schema
  const articleSchema = generateArticleSchema({
    headline: 'How to Find Photo Booths in Berlin: Complete 2026 Guide',
    description:
      'Step-by-step guide to discovering the best analog photo booths in Berlin, with locations, tips, and insider knowledge.',
    author: 'Jascha Kaykas-Wolff',
    datePublished: '2026-01-03',
    dateModified: '2026-01-03',
    url: 'https://boothbeacon.org/guides/berlin',
  });

  // Breadcrumb Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://boothbeacon.org' },
    { name: 'Guides', url: 'https://boothbeacon.org/guides' },
    { name: 'Berlin', url: 'https://boothbeacon.org/guides/berlin' },
  ]);

  // FAQ data
  const faqItems = [
    {
      id: 'berlin-faq-1',
      question: 'How many photo booths are there in Berlin?',
      answer:
        'Berlin has over 30 analog photo booths scattered throughout the city, primarily in train stations, shopping centers, and popular neighborhoods like Kreuzberg and Friedrichshain.',
    },
    {
      id: 'berlin-faq-2',
      question: 'How much do photo booths cost in Berlin?',
      answer:
        'Most Berlin photo booths cost between €2-4 per session, producing 4-6 photos in a classic strip format. Some newer models may charge up to €5.',
      details:
        'Prices vary by location and booth type. Train station booths tend to be slightly more expensive (€3-4) while neighborhood booths may be cheaper (€2-3).',
    },
    {
      id: 'berlin-faq-3',
      question: 'Where is the best photo booth in Berlin?',
      answer:
        'The photo booth at Warschauer Straße station is highly rated for consistent quality and authentic chemical processing. It produces vibrant, well-exposed photos with classic grain.',
      details:
        'Other excellent options include booths at Ostbahnhof, Alexanderplatz, and the Mall of Berlin.',
    },
  ];

  // Booth type comparison data
  const boothComparisonItems = [
    {
      name: 'Train Station Booths',
      description: 'Found in major stations',
      recommended: true,
      badge: 'Most Reliable',
      features: {
        availability: true,
        quality: 'Excellent',
        cost: '€3-4',
        accessibility: 'Very Easy',
        maintenance: 'Regular',
      },
    },
    {
      name: 'Shopping Center Booths',
      description: 'Indoor mall locations',
      features: {
        availability: true,
        quality: 'Very Good',
        cost: '€3-5',
        accessibility: 'Easy',
        maintenance: 'Regular',
      },
    },
    {
      name: 'Neighborhood Booths',
      description: 'Local U-Bahn stations',
      features: {
        availability: false,
        quality: 'Good',
        cost: '€2-3',
        accessibility: 'Moderate',
        maintenance: 'Variable',
      },
    },
  ];

  const boothFeatures = [
    { key: 'availability', label: '24/7 Available' },
    { key: 'quality', label: 'Photo Quality' },
    { key: 'cost', label: 'Typical Cost' },
    { key: 'accessibility', label: 'Accessibility' },
    { key: 'maintenance', label: 'Maintenance' },
  ];

  // Glossary terms
  const glossaryTerms = [
    {
      term: 'Fotoautomat',
      definition:
        'German word for photo booth. In Berlin, most booths are labeled "Fotoautomat" and use the traditional analog process.',
      category: 'Terminology',
    },
    {
      term: 'U-Bahn',
      definition:
        'Berlin underground metro system where many photo booths are located, particularly at major stations.',
      category: 'Locations',
    },
    {
      term: 'Warschauer Straße',
      definition:
        'Major train station in Friedrichshain known for its well-maintained photo booth and vibrant neighborhood.',
      category: 'Locations',
      relatedTerms: ['Friedrichshain', 'Train Stations'],
    },
  ];

  return (
    <>
      {/* Structured Data Schemas */}
      <Script
        id="howto-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-gradient-to-b from-card to-background border-b border-border">
          <div className="container mx-auto px-4 py-12">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-vintage-amber transition">
                Home
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/guides" className="hover:text-vintage-amber transition">
                Guides
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">Berlin</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              How to Find Photo Booths in Berlin
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Your complete guide to discovering authentic analog photo booths throughout
              Berlin. From train stations to hidden neighborhood gems.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-card border border-primary/10 rounded-lg p-4">
                <MapPin className="w-6 h-6 text-vintage-amber mb-2" />
                <div className="text-2xl font-bold text-foreground">30+</div>
                <div className="text-sm text-muted-foreground">Locations</div>
              </div>
              <div className="bg-card border border-primary/10 rounded-lg p-4">
                <Euro className="w-6 h-6 text-vintage-amber mb-2" />
                <div className="text-2xl font-bold text-foreground">€2-4</div>
                <div className="text-sm text-muted-foreground">Per Session</div>
              </div>
              <div className="bg-card border border-primary/10 rounded-lg p-4">
                <Clock className="w-6 h-6 text-vintage-amber mb-2" />
                <div className="text-2xl font-bold text-foreground">3-5 min</div>
                <div className="text-sm text-muted-foreground">Development</div>
              </div>
              <div className="bg-card border border-primary/10 rounded-lg p-4">
                <Camera className="w-6 h-6 text-vintage-amber mb-2" />
                <div className="text-2xl font-bold text-foreground">4-6</div>
                <div className="text-sm text-muted-foreground">Photos</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12 space-y-16">
          {/* Featured Quick Answer */}
          <section>
            <FeaturedAnswer
              variant="prominent"
              question="What's the fastest way to find a photo booth in Berlin?"
              answer="Start at Berlin Hauptbahnhof or Alexanderplatz station, where multiple photo booths are located near main entrances. These stations are centrally located and booths are well-maintained with consistent availability. Most accept €2-4 in coins."
              details="For the best experience, visit during off-peak hours (10am-4pm weekdays) to avoid queues, and check Booth Beacon's live map for current operational status."
            />
          </section>

          {/* Step-by-Step Guide */}
          <section>
            <h2 className="text-3xl font-display font-bold text-foreground mb-6">
              Step-by-Step Guide
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Follow these steps to successfully find and use photo booths in Berlin:
              </p>
            </div>

            <div className="space-y-4">
              {howToSchema.step.map((step: { name: string; text: string }, index: number) => (
                <div
                  key={index}
                  className="bg-card border border-primary/10 rounded-lg p-6 hover:border-vintage-amber/30 transition"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-vintage-amber/10 border-2 border-vintage-amber/30 flex items-center justify-center text-vintage-amber font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {step.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Booth Type Comparison */}
          <section>
            <ComparisonTable
              title="Berlin Photo Booth Types"
              subtitle="Compare different booth locations to find the best fit for your needs"
              items={boothComparisonItems}
              features={boothFeatures}
            />
          </section>

          {/* FAQ Section */}
          <section>
            <FeaturedAnswerList
              title="Frequently Asked Questions"
              items={faqItems}
              variant="default"
            />
          </section>

          {/* Glossary */}
          <section>
            <DefinitionList
              title="Berlin Photo Booth Glossary"
              subtitle="Essential terms and locations for navigating Berlin's photo booth scene"
              terms={glossaryTerms}
              variant="cards"
              searchable={false}
            />
          </section>

          {/* Author Bio */}
          <section>
            <AuthorBio variant="compact" />
          </section>

          {/* Trust Signals */}
          <section>
            <TrustSignals variant="full" boothCount={1200} sourceCount={46} />
          </section>
        </main>
      </div>
    </>
  );
}
