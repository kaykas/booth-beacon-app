/**
 * Knowledge Graph Schemas for AI & SEO Optimization
 *
 * Following the AI SEO Playbook at ~/.claude/AI_SEO_PLAYBOOK.md
 *
 * This module provides Schema.org structured data generators for:
 * 1. DefinedTermSet - Photo booth terminology glossary
 * 2. Enhanced Organization - Organization with founder/expertise signals
 * 3. Place Schema - Individual booth locations with geo data
 *
 * @see https://schema.org for full Schema.org documentation
 */

import { RenderableBooth } from '@/lib/boothViewModel';

// ============================================================================
// TypeScript Types
// ============================================================================

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

export interface DefinedTerm {
  id: string;
  name: string;
  description: string;
  url: string;
  relatedTerms?: string[];
}

export interface FounderInfo {
  name: string;
  jobTitle: string;
  credentials?: string[];
  expertise: string[];
  bio?: string;
  sameAs?: string[];
}

export interface OrganizationConfig {
  name: string;
  description: string;
  url: string;
  logo?: string;
  founder?: FounderInfo;
  foundingDate?: string;
  expertise?: string[];
  knowledgeBase?: {
    name: string;
    description: string;
    url: string;
  };
  sameAs?: string[];
  contactPoint?: {
    contactType: string;
    email?: string;
    telephone?: string;
  };
}

export interface PlaceConfig {
  booth: RenderableBooth;
  openingHours?: string;
  priceRange?: string;
  amenityFeature?: Array<{
    name: string;
    value: string | number | boolean;
  }>;
}

// ============================================================================
// Photo Booth Terminology Glossary
// ============================================================================

/**
 * Comprehensive glossary of photo booth terms for AI and user understanding.
 * Implements Schema.org DefinedTermSet for knowledge graph integration.
 */
export function generatePhotoBoothGlossary(): StructuredData {
  const baseUrl = 'https://boothbeacon.org';
  const glossaryUrl = `${baseUrl}/glossary`;

  const terms: DefinedTerm[] = [
    {
      id: `${glossaryUrl}#analog-photo-booth`,
      name: 'Analog Photo Booth',
      description: 'A photo booth that uses traditional film-based photography and chemical processing to produce physical prints. Unlike digital booths, analog booths create authentic photochemical images with unique characteristics and permanence.',
      url: `${glossaryUrl}#analog-photo-booth`,
      relatedTerms: ['photochemical', 'film-based', 'chemical-processing'],
    },
    {
      id: `${glossaryUrl}#photochemical`,
      name: 'Photochemical Process',
      description: 'The chemical development process used in analog photography where light-sensitive materials are exposed and then processed with chemical solutions to create permanent images. This process produces the distinctive look and feel of analog photo strips.',
      url: `${glossaryUrl}#photochemical`,
      relatedTerms: ['analog-photo-booth', 'film-processing', 'developer'],
    },
    {
      id: `${glossaryUrl}#photo-strip`,
      name: 'Photo Strip',
      description: 'The traditional output format of photo booths, typically showing 3-4 sequential images arranged vertically on a single strip of photo paper. Photo strips are the iconic output of analog photo booths, often featuring candid moments and expressions.',
      url: `${glossaryUrl}#photo-strip`,
      relatedTerms: ['analog-photo-booth', 'photo-paper', 'sequential-images'],
    },
    {
      id: `${glossaryUrl}#vintage-booth`,
      name: 'Vintage Photo Booth',
      description: 'A classic or antique photo booth, often from the mid-20th century, that uses original mechanical and chemical processes. Vintage booths are prized for their authentic character, craftsmanship, and the unique quality of images they produce.',
      url: `${glossaryUrl}#vintage-booth`,
      relatedTerms: ['analog-photo-booth', 'classic-machine', 'restoration'],
    },
    {
      id: `${glossaryUrl}#film-processing`,
      name: 'Film Processing',
      description: 'The chemical development of photographic film or paper inside the photo booth. This process happens automatically within the booth, using developer, stop bath, and fixer solutions to reveal and preserve the image.',
      url: `${glossaryUrl}#film-processing`,
      relatedTerms: ['photochemical', 'developer', 'fixer', 'stop-bath'],
    },
    {
      id: `${glossaryUrl}#black-and-white`,
      name: 'Black and White Photography',
      description: 'Monochrome photographic images produced using silver halide chemistry. Many classic photo booths produce black and white images, which are valued for their timeless quality, contrast, and archival stability.',
      url: `${glossaryUrl}#black-and-white`,
      relatedTerms: ['photochemical', 'silver-halide', 'monochrome'],
    },
    {
      id: `${glossaryUrl}#photo-paper`,
      name: 'Photo Paper',
      description: 'Light-sensitive paper used in analog photo booths to capture and print images. Photo paper is coated with chemical emulsions that react to light and processing chemicals to create permanent photographs.',
      url: `${glossaryUrl}#photo-paper`,
      relatedTerms: ['photochemical', 'photo-strip', 'silver-halide'],
    },
    {
      id: `${glossaryUrl}#chemical-booth`,
      name: 'Chemical Photo Booth',
      description: 'Another term for analog photo booths that emphasizes the photochemical process used to develop images. Chemical booths use wet chemistry to process exposed photo paper, creating authentic analog prints.',
      url: `${glossaryUrl}#chemical-booth`,
      relatedTerms: ['analog-photo-booth', 'photochemical', 'film-processing'],
    },
    {
      id: `${glossaryUrl}#instant-photo-booth`,
      name: 'Instant Photo Booth',
      description: 'A photo booth that produces physical prints immediately after taking pictures. While some instant booths are digital, classic instant booths like those using Polaroid or similar technology are valued for their authentic character.',
      url: `${glossaryUrl}#instant-photo-booth`,
      relatedTerms: ['analog-photo-booth', 'polaroid', 'self-developing'],
    },
    {
      id: `${glossaryUrl}#machine-model`,
      name: 'Machine Model',
      description: 'The specific make and model of photo booth, such as Photo-Me, Photomaton, or vintage models from manufacturers like Auto-Photo, Photomatic, and others. Machine models vary in their mechanisms, output quality, and historical significance.',
      url: `${glossaryUrl}#machine-model`,
      relatedTerms: ['vintage-booth', 'photo-me', 'photomaton', 'manufacturer'],
    },
    {
      id: `${glossaryUrl}#booth-operator`,
      name: 'Booth Operator',
      description: 'A person or company that owns, maintains, and operates photo booths. Operators are responsible for keeping booths stocked with supplies, maintaining the chemical processing system, and ensuring the booth remains functional.',
      url: `${glossaryUrl}#booth-operator`,
      relatedTerms: ['maintenance', 'restoration', 'booth-network'],
    },
    {
      id: `${glossaryUrl}#curtain`,
      name: 'Photo Booth Curtain',
      description: 'The privacy curtain inside a photo booth that creates an enclosed, intimate space for taking photos. The curtain is iconic to the photo booth experience, providing privacy and creating the characteristic enclosed environment.',
      url: `${glossaryUrl}#curtain`,
      relatedTerms: ['booth-interior', 'privacy', 'classic-design'],
    },
    {
      id: `${glossaryUrl}#coin-operated`,
      name: 'Coin-Operated Booth',
      description: 'A photo booth that accepts coins or tokens as payment. Many classic vintage booths are coin-operated, though modern operators may also accept card payments or retrofit booths with modern payment systems.',
      url: `${glossaryUrl}#coin-operated`,
      relatedTerms: ['payment', 'vintage-booth', 'token', 'mechanical'],
    },
    {
      id: `${glossaryUrl}#restoration`,
      name: 'Booth Restoration',
      description: 'The process of repairing, refurbishing, and maintaining vintage photo booths to keep them operational. Restoration may involve mechanical repairs, electronic updates, chemical system maintenance, and cosmetic restoration of the booth exterior and interior.',
      url: `${glossaryUrl}#restoration`,
      relatedTerms: ['vintage-booth', 'maintenance', 'booth-operator', 'preservation'],
    },
    {
      id: `${glossaryUrl}#photomaton`,
      name: 'Photomaton',
      description: 'A widely-used brand of photo booth, especially common in Europe. Photomaton booths have been in production since the 1920s and are known for their reliability and consistent quality. The term is sometimes used generically for photo booths.',
      url: `${glossaryUrl}#photomaton`,
      relatedTerms: ['machine-model', 'vintage-booth', 'europe', 'brand'],
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': glossaryUrl,
    name: 'Photo Booth Terminology Glossary',
    description: 'Comprehensive glossary of analog photo booth terms, covering photochemical processes, machine models, historical context, and technical terminology for classic photo booths.',
    url: glossaryUrl,
    inLanguage: 'en',
    hasDefinedTerm: terms.map((term) => ({
      '@type': 'DefinedTerm',
      '@id': term.id,
      name: term.name,
      description: term.description,
      url: term.url,
      inDefinedTermSet: glossaryUrl,
      ...(term.relatedTerms && {
        relatedLink: term.relatedTerms.map(
          (relatedId) => `${glossaryUrl}#${relatedId}`
        ),
      }),
    })),
  };
}

// ============================================================================
// Enhanced Organization Schema
// ============================================================================

/**
 * Enhanced Organization schema with E-E-A-T signals for AI understanding.
 * Extends basic Organization schema with founder info, expertise, and knowledge base.
 *
 * @param config - Organization configuration with founder and expertise details
 * @returns Schema.org Organization structured data
 */
export function generateEnhancedOrganizationSchema(
  config: OrganizationConfig
): StructuredData {
  const schema: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${config.url}#organization`,
    name: config.name,
    description: config.description,
    url: config.url,
  };

  // Add logo if provided
  if (config.logo) {
    schema.logo = {
      '@type': 'ImageObject',
      url: config.logo,
    };
  }

  // Add founding date if provided
  if (config.foundingDate) {
    schema.foundingDate = config.foundingDate;
  }

  // Add founder information (E-E-A-T signal)
  if (config.founder) {
    const founder = config.founder;
    const founderId = `${config.url}#${founder.name.toLowerCase().replace(/\s+/g, '-')}`;

    schema.founder = {
      '@type': 'Person',
      '@id': founderId,
      name: founder.name,
      jobTitle: founder.jobTitle,
      ...(founder.bio && { description: founder.bio }),
      ...(founder.expertise && founder.expertise.length > 0 && {
        knowsAbout: founder.expertise,
      }),
      ...(founder.credentials && founder.credentials.length > 0 && {
        hasCredential: founder.credentials.map((credential) => ({
          '@type': 'EducationalOccupationalCredential',
          name: credential,
        })),
      }),
      ...(founder.sameAs && founder.sameAs.length > 0 && {
        sameAs: founder.sameAs,
      }),
    };
  }

  // Add expertise/specialization (E-E-A-T signal)
  if (config.expertise && config.expertise.length > 0) {
    schema.knowsAbout = config.expertise;
  }

  // Add knowledge base (E-E-A-T signal)
  if (config.knowledgeBase) {
    schema.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: config.knowledgeBase.name,
      description: config.knowledgeBase.description,
      url: config.knowledgeBase.url,
    };
  }

  // Add social media profiles
  if (config.sameAs && config.sameAs.length > 0) {
    schema.sameAs = config.sameAs;
  }

  // Add contact point
  if (config.contactPoint) {
    schema.contactPoint = {
      '@type': 'ContactPoint',
      contactType: config.contactPoint.contactType,
      ...(config.contactPoint.email && { email: config.contactPoint.email }),
      ...(config.contactPoint.telephone && {
        telephone: config.contactPoint.telephone,
      }),
    };
  }

  return schema;
}

/**
 * Generate enhanced Organization schema specifically for Booth Beacon.
 * Pre-configured with founder and expertise information.
 */
export function generateBoothBeaconOrganizationSchema(): StructuredData {
  return generateEnhancedOrganizationSchema({
    name: 'Booth Beacon',
    description:
      "The world's ultimate directory of classic analog photo booths. Discover authentic photochemical machines worldwide, explore vintage booth locations, and connect with the analog photography community.",
    url: 'https://boothbeacon.org',
    logo: 'https://boothbeacon.org/logo.png',
    foundingDate: '2025',
    founder: {
      name: 'Jascha Kaykas-Wolff',
      jobTitle: 'Founder',
      expertise: [
        'Photo Booth Curation',
        'Analog Photography',
        'Geographic Directories',
        'User Experience Design',
        'Community Building',
      ],
      bio: 'Founder of Booth Beacon, dedicated to preserving and celebrating analog photo booth culture worldwide.',
      sameAs: [
        'https://twitter.com/jkw',
        'https://linkedin.com/in/jaschakayka',
      ],
    },
    expertise: [
      'Analog Photo Booths',
      'Photochemical Photography',
      'Vintage Photo Booth Restoration',
      'Photo Booth Location Directory',
      'Classic Photo Booth Machines',
      'Film-Based Photography',
      'Photo Booth History',
      'Geographic Photo Booth Mapping',
    ],
    knowledgeBase: {
      name: 'Photo Booth Directory',
      description:
        'Comprehensive database of analog photo booths worldwide, with detailed information on machine models, locations, operators, and booth characteristics.',
      url: 'https://boothbeacon.org/booths',
    },
    sameAs: [
      'https://twitter.com/boothbeacon',
      'https://instagram.com/boothbeacon',
    ],
    contactPoint: {
      contactType: 'Customer Service',
      email: 'hello@boothbeacon.org',
    },
  });
}

// ============================================================================
// Place Schema for Individual Booths
// ============================================================================

/**
 * Generate Place schema for an individual photo booth location.
 * Includes geo coordinates, address, opening hours, and parent organization link.
 *
 * @param config - Booth configuration with location and operational details
 * @returns Schema.org Place structured data
 */
export function generatePlaceSchema(config: PlaceConfig): StructuredData {
  const { booth } = config;
  const boothUrl = `https://boothbeacon.org/booth/${booth.slug}`;

  // Determine best image
  const image =
    booth.photo_exterior_url ||
    booth.ai_generated_image_url ||
    booth.ai_preview_url;

  const schema: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    '@id': `${boothUrl}#place`,
    name: booth.name,
    description:
      booth.description ||
      `Analog photo booth in ${booth.city}${booth.country ? `, ${booth.country}` : ''}. ${
        booth.booth_type
          ? `${booth.booth_type.charAt(0).toUpperCase() + booth.booth_type.slice(1)} booth`
          : 'Classic photo booth'
      }${booth.photo_type ? ` producing ${booth.photo_type} photos` : ''}.`,
    url: boothUrl,
    identifier: booth.id,
  };

  // Add image if available
  if (image) {
    schema.image = {
      '@type': 'ImageObject',
      url: image,
    };
  }

  // Add address (required for Place schema)
  if (booth.city) {
    schema.address = {
      '@type': 'PostalAddress',
      ...(booth.address && { streetAddress: booth.address }),
      addressLocality: booth.city,
      ...(booth.state && { addressRegion: booth.state }),
      ...(booth.postal_code && { postalCode: booth.postal_code }),
      ...(booth.country && { addressCountry: booth.country }),
    };
  }

  // Add geo coordinates (critical for map functionality)
  if (booth.latitude && booth.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: booth.latitude,
      longitude: booth.longitude,
    };
  }

  // Add contact information
  if (booth.phone) {
    schema.telephone = booth.phone;
  }

  if (booth.website) {
    schema.url = booth.website;
  }

  // Add opening hours if provided
  if (config.openingHours || booth.hours) {
    schema.openingHours = config.openingHours || booth.hours;
  }

  // Add price range if provided
  if (config.priceRange || booth.cost) {
    schema.priceRange = config.priceRange || booth.cost;
  }

  // Add aggregate rating if available (from Google)
  if (booth.google_rating && booth.google_user_ratings_total) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: booth.google_rating,
      reviewCount: booth.google_user_ratings_total,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Add amenity features
  const amenities: Array<{ name: string; value: string | number | boolean }> = [];

  if (booth.booth_type) {
    amenities.push({
      name: 'Booth Type',
      value: booth.booth_type,
    });
  }

  if (booth.photo_type) {
    amenities.push({
      name: 'Photo Type',
      value: booth.photo_type,
    });
  }

  if (booth.accepts_cash) {
    amenities.push({
      name: 'Accepts Cash',
      value: true,
    });
  }

  if (booth.accepts_card) {
    amenities.push({
      name: 'Accepts Card',
      value: true,
    });
  }

  if (booth.machine_model) {
    amenities.push({
      name: 'Machine Model',
      value: booth.machine_model,
    });
  }

  if (booth.machine_manufacturer) {
    amenities.push({
      name: 'Manufacturer',
      value: booth.machine_manufacturer,
    });
  }

  if (booth.machine_year) {
    amenities.push({
      name: 'Machine Year',
      value: booth.machine_year,
    });
  }

  // Add custom amenity features if provided
  if (config.amenityFeature) {
    amenities.push(...config.amenityFeature);
  }

  // Add amenities to schema if any exist
  if (amenities.length > 0) {
    schema.amenityFeature = amenities.map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity.name,
      value: amenity.value,
    }));
  }

  // Add contained in place (link to parent organization)
  schema.containedInPlace = {
    '@type': 'Organization',
    '@id': 'https://boothbeacon.org#organization',
    name: 'Booth Beacon',
    url: 'https://boothbeacon.org',
  };

  // Add additional properties for photo booth context
  schema.additionalType = 'PhotoBooth';
  schema.publicAccess = booth.status === 'active';

  // Add verification status
  if (booth.last_verified) {
    schema.lastReviewed = booth.last_verified;
  }

  return schema;
}

/**
 * Generate TouristAttraction schema for photo booths.
 * Useful for promoting booths as destinations for photography enthusiasts.
 *
 * @param booth - The booth to create tourist attraction schema for
 * @returns Schema.org TouristAttraction structured data
 */
export function generateBoothTouristAttractionSchema(
  booth: RenderableBooth
): StructuredData {
  const boothUrl = `https://boothbeacon.org/booth/${booth.slug}`;
  const image =
    booth.photo_exterior_url ||
    booth.ai_generated_image_url ||
    booth.ai_preview_url;

  const schema: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    '@id': `${boothUrl}#tourist-attraction`,
    name: booth.name,
    description:
      booth.description ||
      `Vintage analog photo booth in ${booth.city}. Experience authentic photochemical photography and create timeless photo strips.`,
    url: boothUrl,
  };

  if (image) {
    schema.image = image;
  }

  if (booth.city) {
    schema.address = {
      '@type': 'PostalAddress',
      ...(booth.address && { streetAddress: booth.address }),
      addressLocality: booth.city,
      ...(booth.state && { addressRegion: booth.state }),
      ...(booth.postal_code && { postalCode: booth.postal_code }),
      ...(booth.country && { addressCountry: booth.country }),
    };
  }

  if (booth.latitude && booth.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: booth.latitude,
      longitude: booth.longitude,
    };
  }

  // Add tourist types
  schema.touristType = [
    'Photographer',
    'Photography Enthusiast',
    'Tourist',
    'Analog Photography Fan',
    'Vintage Technology Enthusiast',
  ];

  // Add activity/experience description
  schema.isAccessibleForFree = false; // Most booths require payment

  return schema;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert structured data object to JSON-LD string for embedding in HTML.
 *
 * @param data - The structured data object
 * @returns JSON string suitable for script tag
 */
export function injectStructuredData(data: StructuredData): string {
  return JSON.stringify(data);
}

/**
 * Generate multiple schemas for a booth detail page.
 * Returns array of schemas that can be embedded together.
 *
 * @param booth - The booth to generate schemas for
 * @returns Array of structured data objects
 */
export function generateBoothPageSchemas(
  booth: RenderableBooth
): StructuredData[] {
  return [
    generatePlaceSchema({ booth }),
    generateBoothTouristAttractionSchema(booth),
  ];
}

/**
 * Generate all core schemas for the homepage.
 * Includes Organization, DefinedTermSet glossary, and WebSite schema.
 *
 * @returns Array of structured data objects for homepage
 */
export function generateHomepageSchemas(): StructuredData[] {
  return [
    generateBoothBeaconOrganizationSchema(),
    generatePhotoBoothGlossary(),
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': 'https://boothbeacon.org#website',
      name: 'Booth Beacon',
      url: 'https://boothbeacon.org',
      description:
        "The world's ultimate directory of classic analog photo booths.",
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://boothbeacon.org/search?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}
