import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

export function generateMetadata(config: SEOConfig): Metadata {
  const baseUrl = 'https://boothbeacon.org';
  const {
    title,
    description,
    keywords = [],
    image = '/og-image.png',
    url = baseUrl,
    type = 'website',
    noindex = false,
  } = config;

  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Booth Beacon',
      type,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullImageUrl],
      creator: '@boothbeacon',
    },
    alternates: {
      canonical: url,
    },
    robots: noindex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

export function generateBoothMetadata(booth: {
  name: string;
  city?: string;
  country?: string;
  state?: string;
  slug: string;
  description?: string;
  photo_exterior_url?: string;
  ai_generated_image_url?: string;
  ai_preview_url?: string;
}): Metadata {
  const location = [booth.city, booth.state, booth.country]
    .filter(Boolean)
    .join(', ');

  const title = `${booth.name} - ${location} | Booth Beacon`;
  const description =
    booth.description ||
    `Discover ${booth.name}, an authentic analog photo booth in ${location}. View location details, photos, and visitor information.`;

  const image =
    booth.photo_exterior_url ||
    booth.ai_generated_image_url ||
    booth.ai_preview_url;

  return generateMetadata({
    title,
    description,
    image,
    url: `https://boothbeacon.org/booth/${booth.slug}`,
    keywords: [
      'photo booth',
      booth.name,
      booth.city || '',
      booth.country || '',
      'analog photo booth',
      'vintage photo booth',
      'photochemical booth',
    ].filter(Boolean),
  });
}

export function generateCityMetadata(city: string, country?: string): Metadata {
  const location = country ? `${city}, ${country}` : city;
  const title = `Photo Booths in ${location} | Booth Beacon`;
  const description = `Discover authentic analog photo booths in ${location}. Explore our directory of vintage photochemical machines, view locations on a map, and plan your visit.`;

  return generateMetadata({
    title,
    description,
    keywords: [
      `photo booths in ${city}`,
      `${city} photo booth`,
      `analog photo booth ${city}`,
      `vintage photo booth ${city}`,
      city,
      country || '',
    ].filter(Boolean),
  });
}

export function generateTourMetadata(
  city: string,
  description: string,
  boothCount?: number
): Metadata {
  const title = `${city} Photo Booth Tour | Booth Beacon`;
  const desc = `${description} ${boothCount ? `Discover ${boothCount} authentic analog photo booths across ${city}.` : ''}`;

  return generateMetadata({
    title,
    description: desc,
    keywords: [
      `${city} photo booth tour`,
      `${city} photo booths`,
      `photo booth guide ${city}`,
      city,
      'photo booth tour',
      'analog photo booth',
    ],
  });
}
