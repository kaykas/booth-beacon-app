import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Analog Photo Booths - Find Vintage Machines Worldwide',
  description: 'Search our comprehensive database of 1000+ analog photo booths. Filter by city, country, machine model, payment options, and more. Find authentic photochemical booths anywhere in the world.',
  keywords: [
    'photo booth search',
    'find photo booth',
    'analog photo booth finder',
    'vintage photo booth search',
    'photo booth directory',
    'search photo booths by city',
    'classic booth finder',
  ],
  openGraph: {
    title: 'Search Photo Booths - Booth Beacon',
    description: 'Search 1000+ analog photo booths worldwide. Filter by location, features, and more.',
    type: 'website',
    url: 'https://boothbeacon.org/search',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Booth Beacon Search',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search Photo Booths - Booth Beacon',
    description: 'Search 1000+ analog photo booths worldwide. Filter by location, features, and more.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://boothbeacon.org/search',
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
