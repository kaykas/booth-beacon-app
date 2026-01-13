import { Metadata } from 'next';
import { generateAIMetaTags, generateContentFreshnessSignals } from '@/lib/ai-meta-tags';

// Generate AI meta tags for the submit page
const aiTags = generateAIMetaTags({
  summary: 'Submit a new analog photo booth to the Booth Beacon directory. Help grow the worlds largest community-driven database of vintage photo booths by sharing booth locations, details, photos, and operating information. Your contributions help photo enthusiasts discover authentic booths worldwide.',
  keyConcepts: [
    'submit photo booth',
    'add photo booth',
    'photo booth submission',
    'contribute photo booth',
    'photo booth community',
    'report photo booth',
    'share photo booth location',
    'photo booth crowdsourcing',
  ],
  contentStructure: 'how-to-guide',
  expertiseLevel: 'beginner',
  perspective: 'personal',
  authority: 'community',
});

// Generate freshness signals
const freshnessSignals = generateContentFreshnessSignals({
  publishedDate: '2024-11-01T00:00:00Z',
  modifiedDate: new Date().toISOString(),
  revisedDate: new Date().toISOString().split('T')[0],
});

export const revalidate = 86400; // Revalidate daily (static form page)

export const metadata: Metadata = {
  title: 'Submit a Photo Booth | Add New Locations | Booth Beacon',
  description: 'Submit a new analog photo booth to our community directory. Share booth locations, machine details, photos, and help other enthusiasts discover authentic vintage photo booths worldwide.',
  keywords: [
    'submit photo booth',
    'add photo booth location',
    'photo booth submission',
    'contribute photo booth',
    'report photo booth',
    'share photo booth',
    'photo booth community',
    'analog booth submission',
  ],
  openGraph: {
    title: 'Submit a Photo Booth | Add New Locations',
    description: 'Submit a new analog photo booth to our community directory. Help photo enthusiasts discover authentic vintage booths worldwide.',
    type: 'website',
    url: 'https://boothbeacon.com/submit',
    siteName: 'Booth Beacon',
    images: [
      {
        url: '/og-submit.png',
        width: 1200,
        height: 630,
        alt: 'Submit a Photo Booth to Booth Beacon',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Submit a Photo Booth | Add New Locations',
    description: 'Submit a new analog photo booth to our community directory. Help photo enthusiasts discover authentic vintage booths worldwide.',
    images: ['/og-submit.png'],
  },
  alternates: {
    canonical: 'https://boothbeacon.com/submit',
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

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
