import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interactive Map - Find Analog Photo Booths Worldwide',
  description: 'Explore our interactive map of 1000+ authentic analog photo booths across the globe. Filter by location, machine type, and features. Find vintage photochemical booths near you.',
  keywords: [
    'photo booth map',
    'analog photo booth locations',
    'vintage photo booth finder',
    'photo booth near me',
    'interactive booth map',
    'classic photo booth directory',
    'film photo booth locations',
  ],
  openGraph: {
    title: 'Interactive Photo Booth Map - Booth Beacon',
    description: 'Explore 1000+ authentic analog photo booths worldwide on our interactive map.',
    type: 'website',
    url: 'https://boothbeacon.org/map',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Booth Beacon Interactive Map',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interactive Photo Booth Map - Booth Beacon',
    description: 'Explore 1000+ authentic analog photo booths worldwide on our interactive map.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://boothbeacon.org/map',
  },
};

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
