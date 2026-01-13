import { Metadata } from 'next';
import { generateAIMetaTags, generateContentFreshnessSignals } from '@/lib/ai-meta-tags';

// Generate AI meta tags for the search page
const aiTags = generateAIMetaTags({
  summary: 'Search and filter the worlds largest directory of authentic analog photo booths. Find vintage photo machines by city, country, machine model like Photo-Me or Photomaton, payment methods, and booth status. Advanced filtering helps you discover the perfect photo booth for your next adventure.',
  keyConcepts: [
    'photo booth search',
    'find photo booth',
    'analog photo booth finder',
    'vintage photo booth search',
    'photo booth directory',
    'search photo booths by city',
    'Photo-Me locations',
    'Photomaton finder',
    'classic booth finder',
    'photo booth filter',
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
  title: 'Search Analog Photo Booths | Find Vintage Machines Worldwide | Booth Beacon',
  description: 'Search our comprehensive database of 1000+ analog photo booths. Filter by city, country, machine model, payment options, and more. Find authentic photochemical booths anywhere in the world.',
  keywords: [
    'photo booth search',
    'find photo booth',
    'analog photo booth finder',
    'vintage photo booth search',
    'photo booth directory',
    'search photo booths by city',
    'Photo-Me locations',
    'Photomaton finder',
    'classic booth finder',
  ],
  openGraph: {
    title: 'Search Photo Booths | Find Vintage Machines Worldwide',
    description: 'Search 1000+ analog photo booths worldwide. Filter by location, machine model, features, and more.',
    type: 'website',
    url: 'https://boothbeacon.com/search',
    siteName: 'Booth Beacon',
    images: [
      {
        url: '/og-search.png',
        width: 1200,
        height: 630,
        alt: 'Booth Beacon Photo Booth Search',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search Photo Booths | Find Vintage Machines Worldwide',
    description: 'Search 1000+ analog photo booths worldwide. Filter by location, machine model, features, and more.',
    images: ['/og-search.png'],
  },
  alternates: {
    canonical: 'https://boothbeacon.com/search',
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

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
