import { RenderableBooth } from '@/lib/boothViewModel';

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

export function generateOrganizationSchema(): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Booth Beacon',
    url: 'https://boothbeacon.org',
    logo: 'https://boothbeacon.org/logo.png',
    description:
      'The world\'s ultimate directory of classic analog photo booths. Discover authentic photochemical machines worldwide.',
    sameAs: [
      'https://twitter.com/boothbeacon',
      'https://instagram.com/boothbeacon',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'hello@boothbeacon.org',
    },
  };
}

export function generateWebsiteSchema(): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Booth Beacon',
    url: 'https://boothbeacon.org',
    description:
      'The world\'s ultimate directory of classic analog photo booths.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://boothbeacon.org/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateLocalBusinessSchema(
  booth: RenderableBooth | {
    name: string;
    slug: string;
    description?: string;
    street_address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    website?: string;
    photo_exterior_url?: string;
    ai_generated_image_url?: string;
    ai_preview_url?: string;
    google_rating?: number;
    google_user_ratings_total?: number;
  }
): StructuredData {
  const image =
    booth.photo_exterior_url ||
    booth.ai_generated_image_url ||
    booth.ai_preview_url;

  const schema: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: booth.name,
    description: booth.description || `Analog photo booth in ${booth.city || 'location'}`,
    url: `https://boothbeacon.org/booth/${booth.slug}`,
  };

  if (image) {
    schema.image = image;
  }

  if (booth.street_address || booth.city) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: booth.street_address,
      addressLocality: booth.city,
      addressRegion: booth.state,
      postalCode: booth.postal_code,
      addressCountry: booth.country,
    };
  }

  if (booth.latitude && booth.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: booth.latitude,
      longitude: booth.longitude,
    };
  }

  if (booth.phone) {
    schema.telephone = booth.phone;
  }

  if (booth.website) {
    schema.url = booth.website;
  }

  if (booth.google_rating && booth.google_user_ratings_total) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: booth.google_rating,
      reviewCount: booth.google_user_ratings_total,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateCollectionPageSchema(
  city: string,
  booths: Array<{ name: string; slug: string }>
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Photo Booths in ${city}`,
    description: `Directory of analog photo booths in ${city}`,
    url: `https://boothbeacon.org/locations/${city.toLowerCase()}`,
    numberOfItems: booths.length,
    itemListElement: booths.map((booth, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://boothbeacon.org/booth/${booth.slug}`,
      name: booth.name,
    })),
  };
}

export interface FAQItem {
  question: string;
  answer: string;
}

export function generateFAQPageSchema(faqs: FAQItem[]): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateItemListSchema(
  items: Array<{ name: string; url: string; description?: string; image?: string }>
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: item.url,
      name: item.name,
      ...(item.description && { description: item.description }),
      ...(item.image && { image: item.image }),
    })),
  };
}

export function generateHowToSchema(
  name: string,
  description: string,
  steps: Array<{ name: string; text: string; image?: string }>
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };
}

export function generateArticleSchema(
  title: string,
  description: string,
  url: string,
  datePublished: string,
  dateModified: string,
  author: string = 'Booth Beacon',
  image?: string
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    datePublished,
    dateModified,
    author: {
      '@type': 'Organization',
      name: author,
      url: 'https://boothbeacon.org',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Booth Beacon',
      url: 'https://boothbeacon.org',
      logo: {
        '@type': 'ImageObject',
        url: 'https://boothbeacon.org/logo.png',
      },
    },
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image,
      },
    }),
  };
}

export function generateTouristAttractionSchema(
  name: string,
  description: string,
  url: string,
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  },
  geo?: { latitude: number; longitude: number },
  image?: string
): StructuredData {
  const schema: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name,
    description,
    url,
  };

  if (image) {
    schema.image = image;
  }

  if (address.street || address.city) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: address.postalCode,
      addressCountry: address.country,
    };
  }

  if (geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: geo.latitude,
      longitude: geo.longitude,
    };
  }

  return schema;
}

export function generatePlaceSchema(
  name: string,
  description: string,
  url: string,
  address: {
    city: string;
    state?: string;
    country: string;
  },
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  }
): StructuredData {
  const schema: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name,
    description,
    url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: address.city,
      addressRegion: address.state,
      addressCountry: address.country,
    },
  };

  if (aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function generateTouristDestinationSchema(
  city: string,
  country: string,
  description: string,
  boothCount: number,
  url: string
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: `${city} Photo Booth Tour`,
    description,
    url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressCountry: country,
    },
    touristType: 'Photographer, Photography Enthusiast, Tourist',
    amenityFeature: [
      {
        '@type': 'LocationFeatureSpecification',
        name: 'Analog Photo Booths',
        value: boothCount,
      },
    ],
  };
}

export function injectStructuredData(data: StructuredData): string {
  return JSON.stringify(data);
}
