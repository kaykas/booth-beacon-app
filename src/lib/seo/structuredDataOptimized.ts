import { RenderableBooth } from '@/lib/boothViewModel';

/**
 * Optimized structured data generation that combines all schemas into a single script tag
 * This reduces the number of script tags from 3 to 1, improving FCP
 */

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

export function generateCombinedStructuredData(
  booth: RenderableBooth,
  breadcrumbs: BreadcrumbItem[],
  faqs: FAQItem[]
): string {
  const schemas = [];

  // 1. LocalBusiness Schema
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://boothbeacon.org/booth/${booth.slug}#business`,
    name: booth.name,
    description: booth.description || `Analog photo booth in ${booth.locationLabel}`,
    url: `https://boothbeacon.org/booth/${booth.slug}`,
    ...(booth.latitude &&
      booth.longitude && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: booth.latitude,
          longitude: booth.longitude,
        },
      }),
    ...(booth.addressDisplay && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: booth.addressDisplay,
        addressLocality: booth.city,
        ...(booth.state && { addressRegion: booth.state }),
        ...(booth.postal_code && { postalCode: booth.postal_code }),
        addressCountry: booth.country,
      },
    }),
    ...(booth.phone && { telephone: booth.phone }),
    ...(booth.website && { url: booth.website }),
    ...(booth.google_rating &&
      booth.google_user_ratings_total && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: booth.google_rating,
          reviewCount: booth.google_user_ratings_total,
          bestRating: 5,
          worstRating: 1,
        },
      }),
    ...(booth.photo_exterior_url && {
      image: booth.photo_exterior_url,
    }),
  };

  schemas.push(localBusinessSchema);

  // 2. BreadcrumbList Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `https://boothbeacon.org/booth/${booth.slug}#breadcrumb`,
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };

  schemas.push(breadcrumbSchema);

  // 3. FAQPage Schema
  if (faqs && faqs.length > 0) {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `https://boothbeacon.org/booth/${booth.slug}#faq`,
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };

    schemas.push(faqSchema);
  }

  // Return combined schemas as a graph
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': schemas,
  });
}
