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

/**
 * Review statistics for AggregateRating schema
 */
export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Schema.org OpeningHoursSpecification type
 */
interface OpeningHoursSpecification {
  '@type': 'OpeningHoursSpecification';
  dayOfWeek: string | string[];
  opens: string;
  closes: string;
}

/**
 * Schema.org GeoCoordinates type
 */
interface GeoCoordinates {
  '@type': 'GeoCoordinates';
  latitude: number;
  longitude: number;
}

/**
 * Day name mapping for Schema.org
 */
const DAY_MAPPING: Record<string, string> = {
  'monday': 'Monday',
  'tuesday': 'Tuesday',
  'wednesday': 'Wednesday',
  'thursday': 'Thursday',
  'friday': 'Friday',
  'saturday': 'Saturday',
  'sunday': 'Sunday',
  'mon': 'Monday',
  'tue': 'Tuesday',
  'wed': 'Wednesday',
  'thu': 'Thursday',
  'fri': 'Friday',
  'sat': 'Saturday',
  'sun': 'Sunday',
};

/**
 * Parse a time string (e.g., "9:00 AM", "17:30", "5:00 PM") into 24-hour format (HH:MM)
 */
function parseTimeToISO(timeStr: string): string | null {
  if (!timeStr) return null;

  const normalized = timeStr.trim().toLowerCase();

  // Handle 24-hour format (e.g., "17:30")
  const match24 = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = match24[2];
    if (hours >= 0 && hours <= 23) {
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
  }

  // Handle 12-hour format (e.g., "9:00 AM", "5:00 PM")
  const match12 = normalized.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2];
    const period = match12[3];

    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  // Handle noon/midnight
  if (normalized === 'noon' || normalized === '12 noon') {
    return '12:00';
  }
  if (normalized === 'midnight' || normalized === '12 midnight') {
    return '00:00';
  }

  return null;
}

/**
 * Parse hours string into OpeningHoursSpecification array
 *
 * Supports formats like:
 * - "Monday: 9:00 AM - 5:00 PM\nTuesday: 9:00 AM - 5:00 PM..."
 * - "Mon-Fri: 9:00 AM - 5:00 PM, Sat: 10:00 AM - 4:00 PM"
 * - "24 hours" or "Open 24 hours"
 * - "Daily: 9:00 AM - 9:00 PM"
 * - "Closed" for specific days
 *
 * @param hoursString - The hours string from booth.hours
 * @returns Array of OpeningHoursSpecification objects
 */
export function parseHoursToOpeningHoursSpecification(hoursString: string | null | undefined): OpeningHoursSpecification[] {
  if (!hoursString || typeof hoursString !== 'string') {
    return [];
  }

  const result: OpeningHoursSpecification[] = [];
  const normalized = hoursString.trim();

  // Handle "24 hours" or "Open 24 hours" or "24/7"
  if (/^(open\s+)?24\s*(hours?|\/7)?$/i.test(normalized)) {
    return [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    }];
  }

  // Split by newlines, commas, or semicolons
  const lines = normalized.split(/[\n;]+/).map(line => line.trim()).filter(Boolean);

  for (const line of lines) {
    // Skip lines with "Closed"
    if (/closed/i.test(line) && !/:\s*closed/i.test(line)) {
      continue;
    }

    // Handle "Daily: TIME - TIME" format
    const dailyMatch = line.match(/^daily[:\s]+(.+)$/i);
    if (dailyMatch) {
      const timeRange = dailyMatch[1];
      const times = parseTimeRange(timeRange);
      if (times) {
        result.push({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: times.opens,
          closes: times.closes,
        });
      }
      continue;
    }

    // Handle day range format: "Mon-Fri: 9:00 AM - 5:00 PM"
    const dayRangeMatch = line.match(/^([a-z]+)\s*[-–—]\s*([a-z]+)[:\s]+(.+)$/i);
    if (dayRangeMatch) {
      const startDay = DAY_MAPPING[dayRangeMatch[1].toLowerCase()];
      const endDay = DAY_MAPPING[dayRangeMatch[2].toLowerCase()];
      const timeRange = dayRangeMatch[3];

      if (startDay && endDay) {
        const times = parseTimeRange(timeRange);
        if (times) {
          const daysInRange = getDaysInRange(startDay, endDay);
          result.push({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: daysInRange,
            opens: times.opens,
            closes: times.closes,
          });
        }
      }
      continue;
    }

    // Handle single day format: "Monday: 9:00 AM - 5:00 PM"
    const singleDayMatch = line.match(/^([a-z]+)[:\s]+(.+)$/i);
    if (singleDayMatch) {
      const day = DAY_MAPPING[singleDayMatch[1].toLowerCase()];
      const timeRange = singleDayMatch[2];

      if (day && !/closed/i.test(timeRange)) {
        const times = parseTimeRange(timeRange);
        if (times) {
          result.push({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: day,
            opens: times.opens,
            closes: times.closes,
          });
        }
      }
      continue;
    }
  }

  return result;
}

/**
 * Parse a time range string (e.g., "9:00 AM - 5:00 PM")
 */
function parseTimeRange(rangeStr: string): { opens: string; closes: string } | null {
  // Match time range with various separators
  const match = rangeStr.match(/^(.+?)\s*[-–—to]+\s*(.+)$/i);
  if (!match) return null;

  const opens = parseTimeToISO(match[1].trim());
  const closes = parseTimeToISO(match[2].trim());

  if (opens && closes) {
    return { opens, closes };
  }

  return null;
}

/**
 * Get all days in a range (e.g., Monday to Friday)
 */
function getDaysInRange(startDay: string, endDay: string): string[] {
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const startIdx = allDays.indexOf(startDay);
  const endIdx = allDays.indexOf(endDay);

  if (startIdx === -1 || endIdx === -1) return [];

  if (startIdx <= endIdx) {
    return allDays.slice(startIdx, endIdx + 1);
  } else {
    // Handle wrap-around (e.g., Saturday to Monday)
    return [...allDays.slice(startIdx), ...allDays.slice(0, endIdx + 1)];
  }
}

/**
 * Generate GeoCoordinates schema from booth location
 */
export function generateGeoCoordinates(booth: RenderableBooth): GeoCoordinates | null {
  if (typeof booth.latitude !== 'number' || typeof booth.longitude !== 'number') {
    return null;
  }

  // Validate coordinate ranges
  if (booth.latitude < -90 || booth.latitude > 90) return null;
  if (booth.longitude < -180 || booth.longitude > 180) return null;

  return {
    '@type': 'GeoCoordinates',
    latitude: booth.latitude,
    longitude: booth.longitude,
  };
}

/**
 * Parse booth.cost into Schema.org priceRange format
 *
 * Examples:
 * - "$5" -> "$"
 * - "$5-$10" -> "$$"
 * - "Free" -> "Free"
 * - "$20+" -> "$$$"
 */
export function parsePriceRange(cost: string | null | undefined): string | null {
  if (!cost || typeof cost !== 'string') return null;

  const normalized = cost.trim().toLowerCase();

  // Handle free
  if (normalized === 'free' || normalized === '$0' || normalized === '0') {
    return 'Free';
  }

  // Extract numeric value(s)
  const numbers = cost.match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) return null;

  // Use the maximum value found
  const maxValue = Math.max(...numbers.map(n => parseFloat(n)));

  // Convert to price range indicator
  if (maxValue <= 5) return '$';
  if (maxValue <= 10) return '$$';
  if (maxValue <= 20) return '$$$';
  return '$$$$';
}

/**
 * Generate payment accepted array based on booth payment options
 */
export function generatePaymentAccepted(booth: RenderableBooth): string[] {
  const payments: string[] = [];

  if (booth.accepts_cash) {
    payments.push('Cash');
  }

  if (booth.accepts_card) {
    payments.push('Credit Card', 'Debit Card');
  }

  return payments;
}

/**
 * Generate currencies accepted based on booth country
 * Returns ISO 4217 currency codes
 */
export function generateCurrenciesAccepted(booth: RenderableBooth): string[] {
  const countryCurrencyMap: Record<string, string> = {
    'United States': 'USD',
    'USA': 'USD',
    'US': 'USD',
    'Canada': 'CAD',
    'United Kingdom': 'GBP',
    'UK': 'GBP',
    'Germany': 'EUR',
    'France': 'EUR',
    'Italy': 'EUR',
    'Spain': 'EUR',
    'Netherlands': 'EUR',
    'Belgium': 'EUR',
    'Austria': 'EUR',
    'Ireland': 'EUR',
    'Portugal': 'EUR',
    'Finland': 'EUR',
    'Greece': 'EUR',
    'Japan': 'JPY',
    'Australia': 'AUD',
    'New Zealand': 'NZD',
    'Switzerland': 'CHF',
    'Sweden': 'SEK',
    'Norway': 'NOK',
    'Denmark': 'DKK',
    'Mexico': 'MXN',
    'Brazil': 'BRL',
    'South Korea': 'KRW',
    'China': 'CNY',
    'India': 'INR',
    'Singapore': 'SGD',
    'Hong Kong': 'HKD',
    'Thailand': 'THB',
    'Taiwan': 'TWD',
    'Poland': 'PLN',
    'Czech Republic': 'CZK',
    'Hungary': 'HUF',
    'South Africa': 'ZAR',
    'Israel': 'ILS',
    'Turkey': 'TRY',
    'Russia': 'RUB',
    'Argentina': 'ARS',
    'Chile': 'CLP',
    'Colombia': 'COP',
    'Philippines': 'PHP',
    'Malaysia': 'MYR',
    'Indonesia': 'IDR',
    'Vietnam': 'VND',
    'Egypt': 'EGP',
    'Morocco': 'MAD',
    'Nigeria': 'NGN',
    'Kenya': 'KES',
  };

  const country = booth.country?.trim();
  if (!country) return [];

  const currency = countryCurrencyMap[country];
  return currency ? [currency] : [];
}

/**
 * Generate ItemList schema for city/location pages
 *
 * @param booths - Array of booths to include in the list
 * @param listName - Name of the list (e.g., "Photo Booths in New York")
 * @param listDescription - Description of the list
 * @param baseUrl - Base URL for booth pages
 * @returns Schema.org ItemList object
 */
export function generateItemListSchema(
  booths: RenderableBooth[],
  listName: string,
  listDescription: string,
  baseUrl: string = 'https://boothbeacon.org'
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    description: listDescription,
    numberOfItems: booths.length,
    itemListElement: booths.map((booth, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: booth.name,
      url: `${baseUrl}/booth/${booth.slug}`,
      item: {
        '@type': 'LocalBusiness',
        '@id': `${baseUrl}/booth/${booth.slug}#business`,
        name: booth.name,
        description: booth.description || `Analog photo booth in ${booth.locationLabel}`,
        url: `${baseUrl}/booth/${booth.slug}`,
        ...(booth.latitude && booth.longitude && {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: booth.latitude,
            longitude: booth.longitude,
          },
        }),
        ...(booth.addressDisplay && {
          address: {
            '@type': 'PostalAddress',
            streetAddress: booth.address,
            addressLocality: booth.city,
            ...(booth.state && { addressRegion: booth.state }),
            ...(booth.postal_code && { postalCode: booth.postal_code }),
            addressCountry: booth.country,
          },
        }),
        ...(booth.google_rating && booth.google_user_ratings_total && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: booth.google_rating,
            reviewCount: booth.google_user_ratings_total,
            bestRating: 5,
            worstRating: 1,
          },
        }),
        ...(booth.photo_exterior_url && { image: booth.photo_exterior_url }),
        ...(booth.cost && { priceRange: parsePriceRange(booth.cost) }),
      },
    })),
  };
}

/**
 * Generate ItemList schema JSON string for embedding in page
 */
export function generateItemListStructuredData(
  booths: RenderableBooth[],
  listName: string,
  listDescription: string,
  baseUrl: string = 'https://boothbeacon.org'
): string {
  return JSON.stringify(generateItemListSchema(booths, listName, listDescription, baseUrl));
}

/**
 * Generate Speakable schema for voice search optimization on booth detail pages
 * Targets key content sections that are suitable for text-to-speech
 */
export function generateBoothSpeakableSchema(booth: RenderableBooth): object {
  // Build speakable CSS selectors for key content areas
  const speakableSelectors = [
    '#speakable-booth-summary',      // Booth name and location summary
    '#speakable-booth-hours',        // Opening hours
    '#speakable-booth-cost',         // Cost information
    '#speakable-booth-directions',   // How to get there
  ];

  // Build speakable XPath selectors as fallback
  const speakableXPaths = [
    "//*[@id='speakable-booth-summary']",
    "//*[@id='speakable-booth-hours']",
    "//*[@id='speakable-booth-cost']",
    "//*[@id='speakable-booth-directions']",
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `https://boothbeacon.org/booth/${booth.slug}#webpage`,
    name: `${booth.name} - Analog Photo Booth in ${booth.city || 'Unknown Location'}`,
    description: booth.description || `Find ${booth.name}, an analog photo booth in ${booth.locationLabel || booth.city || 'this location'}.`,
    url: `https://boothbeacon.org/booth/${booth.slug}`,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: speakableSelectors,
      xpath: speakableXPaths,
    },
    mainEntity: {
      '@type': 'LocalBusiness',
      '@id': `https://boothbeacon.org/booth/${booth.slug}#business`,
    },
  };
}

/**
 * Generate Speakable schema for homepage voice search optimization
 * Targets site description and how-to-use sections
 */
export function generateHomepageSpeakableSchema(): object {
  const speakableSelectors = [
    '#speakable-site-description',   // What is Booth Beacon
    '#speakable-how-to-use',         // How to use the directory
    '#speakable-stats',              // Quick stats about the directory
  ];

  const speakableXPaths = [
    "//*[@id='speakable-site-description']",
    "//*[@id='speakable-how-to-use']",
    "//*[@id='speakable-stats']",
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://boothbeacon.org/#webpage',
    name: 'Booth Beacon - The World\'s Ultimate Classic Photo Booth Directory',
    description: 'Comprehensive directory of authentic analog photo booths worldwide. Find vintage photochemical machines that capture moments the old-fashioned way.',
    url: 'https://boothbeacon.org/',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: speakableSelectors,
      xpath: speakableXPaths,
    },
  };
}

/**
 * Generate AggregateRating schema object from review stats
 * Prefers community reviews over Google ratings when available
 */
export function generateAggregateRatingSchema(
  booth: RenderableBooth,
  reviewStats?: ReviewStats | null
): object | null {
  // Prefer community reviews if available
  if (reviewStats && reviewStats.total_reviews > 0) {
    return {
      '@type': 'AggregateRating',
      ratingValue: reviewStats.average_rating,
      reviewCount: reviewStats.total_reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Fall back to Google ratings
  if (booth.google_rating && booth.google_user_ratings_total) {
    return {
      '@type': 'AggregateRating',
      ratingValue: booth.google_rating,
      reviewCount: booth.google_user_ratings_total,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return null;
}

/**
 * Get the most relevant verification date for structured data
 * Prioritizes community verification over source verification
 */
function getVerificationDate(booth: RenderableBooth): string | null {
  // First check community verification
  if (booth.last_community_verified_at) {
    return booth.last_community_verified_at;
  }
  // Fall back to source verification
  if (booth.last_verified) {
    return booth.last_verified;
  }
  // Fall back to updated_at
  return booth.updated_at || null;
}

export function generateCombinedStructuredData(
  booth: RenderableBooth,
  breadcrumbs: BreadcrumbItem[],
  faqs: FAQItem[],
  reviewStats?: ReviewStats | null
): string {
  const schemas = [];

  // Generate enhanced schema components
  const geoCoordinates = generateGeoCoordinates(booth);
  const openingHours = parseHoursToOpeningHoursSpecification(booth.hours);
  const priceRange = parsePriceRange(booth.cost);
  const paymentAccepted = generatePaymentAccepted(booth);
  const currenciesAccepted = generateCurrenciesAccepted(booth);
  const aggregateRating = generateAggregateRatingSchema(booth, reviewStats);

  // Community verification data for freshness signals
  const verificationDate = getVerificationDate(booth);

  // 1. LocalBusiness Schema with enhanced properties
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://boothbeacon.org/booth/${booth.slug}#business`,
    name: booth.name,
    description: booth.description || `Analog photo booth in ${booth.locationLabel}`,
    url: `https://boothbeacon.org/booth/${booth.slug}`,
    // Date verification data for freshness signals
    ...(verificationDate && { dateModified: verificationDate }),
    ...(booth.created_at && { datePublished: booth.created_at }),
    // GeoCoordinates with precise latitude/longitude
    ...(geoCoordinates && {
      geo: geoCoordinates,
    }),
    // PostalAddress
    ...(booth.addressDisplay && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: booth.address,
        addressLocality: booth.city,
        ...(booth.state && { addressRegion: booth.state }),
        ...(booth.postal_code && { postalCode: booth.postal_code }),
        addressCountry: booth.country,
      },
    }),
    // Contact information
    ...(booth.phone && { telephone: booth.phone }),
    ...(booth.website && { sameAs: booth.website }),
    // OpeningHoursSpecification parsed from booth.hours
    ...(openingHours.length > 0 && {
      openingHoursSpecification: openingHours,
    }),
    // PriceRange based on booth.cost
    ...(priceRange && { priceRange }),
    // PaymentAccepted based on accepts_cash and accepts_card
    ...(paymentAccepted.length > 0 && {
      paymentAccepted: paymentAccepted.join(', '),
    }),
    // CurrenciesAccepted based on country
    ...(currenciesAccepted.length > 0 && {
      currenciesAccepted: currenciesAccepted.join(', '),
    }),
    // AggregateRating (prefers community reviews over Google ratings)
    ...(aggregateRating && { aggregateRating }),
    // Images
    ...(booth.photo_exterior_url && {
      image: booth.photo_exterior_url,
    }),
    // Additional images if available
    ...((booth.photo_interior_url || booth.ai_preview_url) && {
      photos: [
        booth.photo_exterior_url,
        booth.photo_interior_url,
        booth.ai_preview_url,
      ].filter(Boolean),
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

  // 5. Speakable WebPage Schema for voice search optimization
  const speakableSchema = generateBoothSpeakableSchema(booth);
  schemas.push(speakableSchema);

  // Return combined schemas as a graph
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': schemas,
  });
}
