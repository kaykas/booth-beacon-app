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

  // 4. HowTo Schema for visiting the booth
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `https://boothbeacon.org/booth/${booth.slug}#howto`,
    name: `How to Use the Photo Booth at ${booth.name}`,
    description: `Step-by-step guide to taking photos at the analog photo booth ${booth.name} in ${booth.locationLabel || booth.city || 'this location'}.`,
    totalTime: 'PT10M',
    estimatedCost: booth.cost ? {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: booth.cost.replace(/[^0-9.]/g, '') || '5',
    } : undefined,
    ...(booth.photo_exterior_url && {
      image: booth.photo_exterior_url,
    }),
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Locate the photo booth',
        text: `Navigate to ${booth.addressDisplay || booth.name}${booth.access_instructions ? `. ${booth.access_instructions}` : ''}. The booth is ${booth.latitude && booth.longitude ? 'marked on the map above' : 'at this location'}.`,
        ...(booth.photo_exterior_url && { image: booth.photo_exterior_url }),
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Prepare payment',
        text: `This photo booth ${booth.cost ? `costs ${booth.cost}` : 'requires payment'}. ${booth.accepts_cash && booth.accepts_card ? 'Both cash and card are accepted.' : booth.accepts_cash ? 'Cash only.' : booth.accepts_card ? 'Card payments accepted.' : 'Have coins or bills ready for the machine.'}`,
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Enter the booth',
        text: 'Pull back the curtain and take a seat on the bench inside. Adjust your position so you can see yourself in the mirror or screen.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Insert payment and pose',
        text: 'Insert your payment into the coin or bill slot. When the light flashes, strike your pose! Most booths take 4 photos with a few seconds between each flash.',
      },
      {
        '@type': 'HowToStep',
        position: 5,
        name: 'Collect your photo strip',
        text: 'Wait approximately 3-5 minutes for your photo strip to develop and emerge from the slot outside the booth. The photochemical process creates authentic analog photos.',
      },
    ],
    tool: [
      {
        '@type': 'HowToTool',
        name: booth.cost ? `${booth.cost} in cash or card` : 'Coins or bills for the machine',
      },
    ],
  };

  schemas.push(howToSchema);

  // Return combined schemas as a graph
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': schemas,
  });
}
