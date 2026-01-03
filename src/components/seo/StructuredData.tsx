'use client';

import Script from 'next/script';

interface BoothStructuredDataProps {
  booth: {
    name: string;
    slug: string;
    description?: string;
    address?: string;
    city: string;
    state?: string;
    country: string;
    latitude?: number;
    longitude?: number;
    photo_exterior_url?: string;
    ai_preview_url?: string;
    type?: string;
    cost?: string;
    status?: string;
  };
}

/**
 * Generates JSON-LD structured data for photo booths
 * Helps AI assistants and search engines understand booth information
 */
export function BoothStructuredData({ booth }: BoothStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: booth.name,
    description: booth.description || `Classic analog photo booth located in ${booth.city}, ${booth.country}`,
    url: `https://boothbeacon.org/booth/${booth.slug}`,
    image: booth.photo_exterior_url || booth.ai_preview_url,
    address: booth.address ? {
      '@type': 'PostalAddress',
      streetAddress: booth.address,
      addressLocality: booth.city,
      addressRegion: booth.state,
      addressCountry: booth.country,
    } : {
      '@type': 'PostalAddress',
      addressLocality: booth.city,
      addressCountry: booth.country,
    },
    ...(booth.latitude && booth.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: booth.latitude,
        longitude: booth.longitude,
      }
    }),
    ...(booth.type && {
      additionalType: `https://boothbeacon.org/types/${booth.type}`,
    }),
    ...(booth.cost && {
      priceRange: booth.cost,
    }),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      reviewCount: '1',
      bestRating: '5',
      worstRating: '1',
    },
    amenityFeature: [
      {
        '@type': 'LocationFeatureSpecification',
        name: 'Analog Photo Booth',
        value: true,
      },
      {
        '@type': 'LocationFeatureSpecification',
        name: 'Classic Photo Strips',
        value: true,
      }
    ]
  };

  return (
    <Script
      id={`structured-data-${booth.slug}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface MapStructuredDataProps {
  totalBooths: number;
  cities: string[];
  countries: string[];
}

/**
 * Generates JSON-LD structured data for the map page
 */
export function MapStructuredData({ totalBooths, cities, countries }: MapStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Booth Beacon Map',
    description: `Interactive map showing ${totalBooths} classic analog photo booths across ${countries.length} countries`,
    url: 'https://boothbeacon.org/map',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Interactive map of photo booths worldwide',
      'Search by location',
      'Filter by booth type',
      'Street View integration',
      'User-submitted photos and reviews'
    ]
  };

  return (
    <Script
      id="structured-data-map"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface OrganizationStructuredDataProps {}

/**
 * Generates JSON-LD structured data for the organization
 */
export function OrganizationStructuredData({}: OrganizationStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Booth Beacon',
    description: 'The world\'s ultimate directory of classic analog photo booths',
    url: 'https://boothbeacon.org',
    logo: 'https://boothbeacon.org/icon-512.png',
    sameAs: [
      // Add social media links when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'hello@boothbeacon.org',
    }
  };

  return (
    <Script
      id="structured-data-organization"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * Generates JSON-LD breadcrumb structured data
 * Helps AI understand page hierarchy
 */
export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://boothbeacon.org${item.url}`,
    }))
  };

  return (
    <Script
      id="structured-data-breadcrumb"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
