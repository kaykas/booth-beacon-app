import { FAQItem } from './structuredData';
import { RenderableBooth } from '@/lib/boothViewModel';

export const homepageFAQs: FAQItem[] = [
  {
    question: 'What is an analog photo booth?',
    answer:
      'An analog photo booth is a vintage photochemical machine that uses real film and chemical processing to create instant photo strips. Unlike modern digital booths, analog booths produce authentic chemical photographs with unique characteristics like rich colors, natural grain, and that classic nostalgic feel.',
  },
  {
    question: 'Where can I find analog photo booths near me?',
    answer:
      'Use our interactive map to find analog photo booths in your area. We have a directory of classic photo booths worldwide, including locations in the USA, Europe, Asia, and beyond. You can search by city, save your favorites, and get directions to each booth.',
  },
  {
    question: 'How much does it cost to use an analog photo booth?',
    answer:
      'The cost varies by location and booth type, but most analog photo booths charge between $3-$10 per session. Each session typically produces a strip of 4 photos. Some booths accept cash only, while others accept credit cards. Check the specific booth page for payment details.',
  },
  {
    question: 'How long does it take to get photos from an analog booth?',
    answer:
      'Analog photo booths use real photochemical processing, so your photo strip typically takes 60-90 seconds to develop after you finish taking your pictures. You&apos;ll receive a physical strip of photos that are chemically processed and ready to keep immediately.',
  },
  {
    question: 'What&apos;s the difference between analog and digital photo booths?',
    answer:
      'Analog photo booths use traditional film and chemical processing to create authentic photographs, resulting in unique color characteristics, natural grain, and a nostalgic aesthetic. Digital booths use cameras and printers to produce photos instantly, but they lack the chemical authenticity and vintage character of analog booths.',
  },
  {
    question: 'Are analog photo booths still being made?',
    answer:
      'While most manufacturers have stopped producing new analog photo booths, many vintage machines from the 1960s-1990s are still operational and maintained by dedicated operators. Some companies like Photo-Me and smaller operators continue to service and restore classic analog booths.',
  },
  {
    question: 'Can I book an analog photo booth for my event?',
    answer:
      'Some booth operators offer rental services for weddings, parties, and corporate events. Check individual booth listings for operator contact information and inquire about availability and pricing for your event.',
  },
  {
    question: 'How do I report incorrect booth information?',
    answer:
      'Each booth page has a "Report Issue" button where you can submit corrections or updates. We rely on community input to keep our directory accurate and up-to-date, so we appreciate all reports of closed locations, changed hours, or other information updates.',
  },
];

export const boothDetailFAQs: FAQItem[] = [
  {
    question: 'How do I know if this photo booth is still operational?',
    answer:
      'Our database tracks booth operational status based on community reports and verification. Check the status badge at the top of the page. If you find a booth that&apos;s no longer working, please use the "Report Issue" button to let us know.',
  },
  {
    question: 'What payment methods does this booth accept?',
    answer:
      'Payment options vary by booth and are listed in the Visit Info section. Common options include cash, credit/debit cards, or coin-operated machines. If payment information isn&apos;t listed, it&apos;s best to bring cash as backup.',
  },
  {
    question: 'Do I need an appointment to use this photo booth?',
    answer:
      'Most analog photo booths are walk-up and don&apos;t require appointments. However, if the booth is located inside a venue like a restaurant or arcade, you&apos;ll need to have access to that venue during their operating hours.',
  },
  {
    question: 'Can I get digital copies of my analog booth photos?',
    answer:
      'Analog photo booths produce physical photo strips only. To digitize your photos, you can scan or photograph your strip after you receive it. Some modern scanning apps on smartphones work well for this purpose.',
  },
];

/**
 * Generate city-specific FAQ content for location landing pages.
 * These FAQs are designed to answer common location-based queries
 * that users might ask search engines or AI assistants.
 */
export function generateCityFAQs(
  city: string,
  state: string | null,
  country: string,
  boothCount: number,
  operationalCount: number = 0
): FAQItem[] {
  const locationString = state ? `${city}, ${state}` : city;
  const fullLocation = state ? `${city}, ${state}, ${country}` : `${city}, ${country}`;

  const faqs: FAQItem[] = [
    {
      question: `Where can I find a photo booth in ${city}?`,
      answer: `There are ${boothCount} analog photo booths in ${locationString}. You can find them throughout the city at various venues including bars, arcades, shopping centers, and cultural institutions. Use our interactive map to see exact locations, get directions, and check operating hours before your visit. Each booth listing includes the full address, photos, and user reviews to help you plan your trip.`,
    },
    {
      question: `What is the best photo booth in ${city}?`,
      answer: `The best photo booth in ${locationString} depends on what you're looking for. Our directory lists ${boothCount} authentic analog photo booths in the area, each with unique characteristics. Some are vintage machines from the 1960s-1980s with classic black-and-white processing, while others offer color photos. Check individual booth pages for ratings, reviews, and photo samples to find the one that matches your preferences.`,
    },
    {
      question: `How much does a photo booth cost in ${city}?`,
      answer: `Photo booth prices in ${locationString} typically range from $3 to $10 per session. Most analog booths produce a strip of 4 photos per session. Prices vary based on the venue type, booth operator, and whether the photos are color or black-and-white. Each booth listing on Booth Beacon includes specific pricing information when available.`,
    },
    {
      question: `Are there any 24-hour photo booths in ${city}?`,
      answer: `Availability of 24-hour photo booths in ${locationString} depends on the venues where they are located. Photo booths in train stations, airports, or 24-hour establishments may be accessible around the clock. Check individual booth listings for specific operating hours. We update this information based on community reports and venue schedules.`,
    },
    {
      question: `How many photo booths are there in ${city}?`,
      answer: `There are currently ${boothCount} analog photo booths cataloged in ${locationString}.${operationalCount > 0 ? ` Of these, ${operationalCount} are confirmed to be operational.` : ''} Our directory is continuously updated as we discover new locations and verify existing ones. If you know of a photo booth that's not listed, you can submit it through our website.`,
    },
    {
      question: `What types of photo booths can I find in ${city}?`,
      answer: `${locationString} features authentic analog photo booths that use traditional photochemical processes to create instant photo strips. You can find both black-and-white and color booths from various manufacturers like Photo-Me, Fotoautomat, and vintage Japanese models. These classic machines produce genuine film photographs with that distinctive nostalgic quality that digital booths can't replicate.`,
    },
    {
      question: `Do photo booths in ${city} take cash or card?`,
      answer: `Payment methods vary by booth in ${locationString}. Many traditional analog booths are coin-operated and accept cash only, while some newer installations may accept credit cards or contactless payments. We recommend bringing cash or coins as backup. Each booth listing specifies accepted payment methods when known.`,
    },
    {
      question: `Where are the vintage photo booths located in ${city}?`,
      answer: `Vintage analog photo booths in ${locationString} can be found in a variety of locations including bars and nightclubs, shopping malls and arcades, train stations and transit hubs, museums and cultural centers, hotels and entertainment venues, and photography studios. Browse our directory to see the exact location of each booth on an interactive map.`,
    },
  ];

  return faqs;
}

/**
 * Generate booth-specific FAQ content for individual booth detail pages.
 * These FAQs provide specific, actionable information about visiting
 * the particular booth, answering common visitor questions.
 */
export function generateBoothFAQs(booth: RenderableBooth): FAQItem[] {
  const faqs: FAQItem[] = [];
  const city = booth.city || 'this area';
  const locationString = booth.state ? `${booth.city}, ${booth.state}` : booth.city || 'this location';

  // Hours FAQ - always include with contextual answer
  if (booth.hours) {
    faqs.push({
      question: `What are the hours for ${booth.name}?`,
      answer: `${booth.name} is open during the following hours: ${booth.hours}. We recommend checking before your visit as hours may change due to holidays or venue events. If the booth is located inside another establishment, you'll need access to that venue during their operating hours.`,
    });
  } else {
    faqs.push({
      question: `What are the hours for ${booth.name}?`,
      answer: `Operating hours for ${booth.name} in ${locationString} are not currently confirmed. Many photo booths are available during the operating hours of their host venue. We recommend visiting during standard business hours or contacting the venue directly. If you visit, please let us know the hours so we can update our listing.`,
    });
  }

  // Cost FAQ - always include with contextual answer
  if (booth.cost) {
    const paymentInfo = booth.accepts_cash && booth.accepts_card
      ? 'Both cash and card payments are accepted.'
      : booth.accepts_cash
        ? 'This booth accepts cash only.'
        : booth.accepts_card
          ? 'This booth accepts card payments.'
          : 'Payment information is not confirmed.';

    faqs.push({
      question: `How much does ${booth.name} cost?`,
      answer: `${booth.name} costs ${booth.cost} per session. Each session typically produces a strip of 4 photos using authentic photochemical processing. ${paymentInfo}`,
    });
  } else {
    faqs.push({
      question: `How much does ${booth.name} cost?`,
      answer: `The exact price for ${booth.name} is not currently confirmed, but most analog photo booths charge between $3-$10 per session. We recommend bringing cash or coins as many traditional booths are coin-operated. If you visit, please share the price so we can update our listing.`,
    });
  }

  // Photo type FAQ
  const photoTypeDescription = booth.photo_type === 'black-and-white'
    ? 'classic black-and-white photos with authentic silver halide processing'
    : booth.photo_type === 'color'
      ? 'color photo strips using photochemical color processing'
      : booth.photo_type === 'both'
        ? 'both black-and-white and color options'
        : 'traditional photo strips using genuine photochemical processes';

  const machineInfo = booth.machine_model
    ? `This is a ${booth.machine_model} machine${booth.machine_year ? ` from ${booth.machine_year}` : ''}.`
    : '';

  faqs.push({
    question: `What type of photos does ${booth.name} produce?`,
    answer: `${booth.name} produces ${photoTypeDescription}. ${machineInfo} Unlike digital booths, analog photo booths use real film and chemical development, creating photos with unique characteristics including natural grain, authentic colors, and that distinctive vintage quality that digital can't replicate. Each session produces a strip of usually 4 photos.`,
  });

  // Operational status FAQ
  const statusDescription = booth.status === 'active' && booth.is_operational
    ? `${booth.name} is currently operational and ready for visitors.`
    : booth.status === 'unverified'
      ? `The status of ${booth.name} has not been recently verified.`
      : booth.status === 'inactive'
        ? `${booth.name} is currently listed as inactive but may still be operational.`
        : `${booth.name} is currently listed as closed.`;

  const verificationInfo = booth.last_verified
    ? ` Our last verification was on ${new Date(booth.last_verified).toLocaleDateString()}.`
    : '';

  faqs.push({
    question: `Is ${booth.name} currently working?`,
    answer: `${statusDescription}${verificationInfo} Booth availability can change, so we recommend confirming before making a special trip. If you visit and find the booth's status has changed, please use the "Report Issue" button to let us know so we can update our records for other visitors.`,
  });

  // Location/Access FAQ
  if (booth.access_instructions) {
    faqs.push({
      question: `How do I access ${booth.name}?`,
      answer: `${booth.access_instructions} The booth is located at ${booth.addressDisplay || booth.locationLabel}. ${booth.hasValidLocation ? 'Use the map on this page for directions and Street View to preview the location before your visit.' : 'Check the address details above for directions.'}`,
    });
  } else {
    faqs.push({
      question: `Where exactly is ${booth.name} located?`,
      answer: `${booth.name} is located at ${booth.addressDisplay || booth.locationLabel}. ${booth.hasValidLocation ? 'Use the interactive map on this page for exact directions. We also provide Street View where available to help you find the booth.' : 'The location is listed above. If inside a venue, check with staff for the exact location of the photo booth.'}`,
    });
  }

  // Nearby alternatives FAQ
  faqs.push({
    question: `Are there other photo booths near ${booth.name}?`,
    answer: `Yes, our directory includes multiple photo booths in ${city}. Scroll down on this page to see nearby booths listed by distance, or use our map view to explore all photo booth locations in the area. Each booth has its own unique character, so exploring multiple locations can give you different photo experiences.`,
  });

  return faqs;
}

/**
 * Generate combined FAQs for booth detail pages that include
 * both booth-specific FAQs and relevant general FAQs.
 */
export function generateComprehensiveBoothFAQs(booth: RenderableBooth): FAQItem[] {
  const boothSpecificFAQs = generateBoothFAQs(booth);

  // Add relevant general FAQs that apply to all booths
  const generalFAQs: FAQItem[] = [
    {
      question: 'How long does it take to get my photos?',
      answer: 'Analog photo booths use real photochemical processing. After you take your photos, the strip will develop and emerge from the booth in approximately 3-5 minutes. The chemical development creates authentic photos that are ready to keep immediately.',
    },
    {
      question: 'Can I take multiple photo sessions?',
      answer: 'Yes, you can take as many photo sessions as you like, with each session requiring a separate payment. Each session typically produces one strip of 4 photos. Many visitors enjoy taking multiple strips to get different poses or to share with friends.',
    },
  ];

  return [...boothSpecificFAQs, ...generalFAQs];
}

/**
 * Generate state-level FAQs for state/region landing pages.
 */
export function generateStateFAQs(
  state: string,
  country: string,
  boothCount: number,
  cityCount: number
): FAQItem[] {
  return [
    {
      question: `How many photo booths are in ${state}?`,
      answer: `There are currently ${boothCount} analog photo booths cataloged across ${state}. These are located in ${cityCount} cities and towns throughout the state. Our directory is continuously updated as we discover new locations.`,
    },
    {
      question: `Where can I find photo booths in ${state}?`,
      answer: `Photo booths in ${state} can be found in major cities and towns across the state. Use our interactive map to explore all locations, filter by city, and get directions. Each booth listing includes the full address, operating hours, and visitor reviews.`,
    },
    {
      question: `What cities in ${state} have photo booths?`,
      answer: `Photo booths in ${state} are distributed across ${cityCount} cities. Browse our state directory to see all cities with photo booths, sorted by the number of booths available. Major metropolitan areas typically have the highest concentration of analog photo booths.`,
    },
    {
      question: `Are there vintage photo booths in ${state}?`,
      answer: `Yes, ${state} has many authentic vintage analog photo booths. These classic machines use traditional photochemical processes to create genuine film photographs. You can find booths from various eras and manufacturers throughout the state, each with its own unique character.`,
    },
  ];
}

/**
 * Generate country-level FAQs for country landing pages.
 */
export function generateCountryFAQs(
  country: string,
  boothCount: number,
  stateCount: number,
  cityCount: number
): FAQItem[] {
  return [
    {
      question: `How many photo booths are in ${country}?`,
      answer: `There are currently ${boothCount} analog photo booths cataloged across ${country}, located in ${cityCount} cities across ${stateCount} regions. Our directory covers authentic vintage photo booths throughout the country.`,
    },
    {
      question: `Where are photo booths located in ${country}?`,
      answer: `Analog photo booths in ${country} can be found in major cities and towns throughout the country. Common locations include bars, arcades, shopping centers, train stations, and cultural venues. Use our interactive map to explore all locations by region or city.`,
    },
    {
      question: `What types of photo booths are common in ${country}?`,
      answer: `${country} features a variety of analog photo booth types, including classic black-and-white machines, color photo booths, and vintage models from various manufacturers. The specific types available depend on the region and local operators.`,
    },
  ];
}
