import { Suspense } from 'react';
import { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import { MapClient } from '@/components/map/MapClient';
import { generateAIMetaTags, generateContentFreshnessSignals } from '@/lib/ai-meta-tags';

// Generate AI meta tags for the map page
const aiTags = generateAIMetaTags({
  summary: 'Interactive map to find authentic analog photo booths near you. Browse hundreds of classic photo booth locations worldwide with real-time location search, filtering by city, and detailed booth information including hours, prices, and user photos.',
  keyConcepts: [
    'photo booth near me',
    'photo booth locations',
    'analog photo booth map',
    'find photo booths',
    'photo booth directory',
    'vintage photo booth',
    'photo booth finder',
    'photo booth locator',
  ],
  contentStructure: 'directory',
  expertiseLevel: 'beginner',
  perspective: 'commercial',
  authority: 'community',
});

// Generate freshness signals
const freshnessSignals = generateContentFreshnessSignals({
  publishedDate: '2024-11-01T00:00:00Z',
  modifiedDate: new Date().toISOString(),
  revisedDate: new Date().toISOString().split('T')[0],
});

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: 'Interactive Photo Booth Map | Find Booths Near You | Booth Beacon',
  description: 'Find authentic analog photo booths near you with our interactive map. Search by location, view booth details, photos, and get directions. Discover vintage photo booths worldwide.',
  keywords: [
    'photo booth near me',
    'photo booth locations',
    'analog photo booth',
    'vintage photo booth',
    'photo booth map',
    'find photo booths',
    'photo booth directory',
    'classic photo booth',
  ],
  openGraph: {
    title: 'Interactive Photo Booth Map | Find Booths Near You',
    description: 'Find authentic analog photo booths near you with our interactive map. Search by location, view booth details, photos, and get directions.',
    url: 'https://boothbeacon.com/map',
    siteName: 'Booth Beacon',
    images: [
      {
        url: '/og-map.png',
        width: 1200,
        height: 630,
        alt: 'Booth Beacon Interactive Photo Booth Map',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interactive Photo Booth Map | Find Booths Near You',
    description: 'Find authentic analog photo booths near you with our interactive map. Search by location, view booth details, photos, and get directions.',
    images: ['/og-map.png'],
  },
  alternates: {
    canonical: 'https://boothbeacon.com/map',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    ...aiTags,
    ...freshnessSignals,
  },
};

interface MapPageProps {
  searchParams: {
    nearme?: string;
    city?: string;
  };
}

export default function MapPage({ searchParams }: MapPageProps) {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      }
    >
      <MapClient nearme={searchParams.nearme} city={searchParams.city} />
    </Suspense>
  );
}
