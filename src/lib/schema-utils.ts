/**
 * Schema Utilities - Phase 4 Featured Snippets Implementation
 *
 * Utility functions for generating Schema.org structured data markup
 * for SEO and AI crawler optimization.
 *
 * Supported schemas:
 * - FAQPage: For FAQ sections
 * - HowTo: For step-by-step guides
 * - Question/Answer: For individual Q&As
 * - BreadcrumbList: For navigation hierarchy
 *
 * @see docs/AI_SEO_IMPLEMENTATION_PLAN.md Phase 4, Task 4.4
 */

/**
 * Q&A item for FAQPage schema
 */
export interface FAQItem {
  question: string;
  answer: string;
  id?: string;
}

/**
 * Generates FAQPage schema markup
 *
 * @example
 * ```tsx
 * const faqSchema = generateFAQPageSchema([
 *   {
 *     question: "What is an analog photo booth?",
 *     answer: "An analog photo booth uses traditional film and chemical processing..."
 *   }
 * ]);
 * ```
 */
export function generateFAQPageSchema(items: FAQItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      ...(item.id && { '@id': `#${item.id}` }),
      name: item.question,
      text: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Step in a HowTo guide
 */
export interface HowToStep {
  /**
   * Step name/title
   */
  name: string;

  /**
   * Detailed instruction text
   */
  text: string;

  /**
   * Optional image URL for the step
   */
  image?: string;

  /**
   * Optional URL for more details
   */
  url?: string;
}

/**
 * Supply/tool needed for HowTo
 */
export interface HowToSupply {
  name: string;
  url?: string;
}

/**
 * Generates HowTo schema markup for step-by-step guides
 *
 * @example
 * ```tsx
 * const howToSchema = generateHowToSchema({
 *   name: "How to Find Photo Booths in Berlin",
 *   description: "A complete guide to discovering analog photo booths in Berlin",
 *   steps: [
 *     {
 *       name: "Check major train stations",
 *       text: "Start by visiting Berlin Hauptbahnhof and other major stations..."
 *     },
 *     {
 *       name: "Explore popular neighborhoods",
 *       text: "Visit Kreuzberg, Friedrichshain, and Neukölln..."
 *     }
 *   ]
 * });
 * ```
 */
export function generateHowToSchema({
  name,
  description,
  image,
  totalTime,
  estimatedCost,
  steps,
  supply,
  tool,
}: {
  name: string;
  description?: string;
  image?: string;
  totalTime?: string; // ISO 8601 duration format (e.g., "PT30M" for 30 minutes)
  estimatedCost?: {
    currency: string;
    value: string;
  };
  steps: HowToStep[];
  supply?: HowToSupply[];
  tool?: HowToSupply[];
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    ...(description && { description }),
    ...(image && { image }),
    ...(totalTime && { totalTime }),
    ...(estimatedCost && { estimatedCost }),
    ...(supply && supply.length > 0 && {
      supply: supply.map((item) => ({
        '@type': 'HowToSupply',
        name: item.name,
        ...(item.url && { url: item.url }),
      })),
    }),
    ...(tool && tool.length > 0 && {
      tool: tool.map((item) => ({
        '@type': 'HowToTool',
        name: item.name,
        ...(item.url && { url: item.url }),
      })),
    }),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
      ...(step.url && { url: step.url }),
    })),
  };
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generates BreadcrumbList schema markup
 *
 * @example
 * ```tsx
 * const breadcrumbSchema = generateBreadcrumbSchema([
 *   { name: "Home", url: "https://boothbeacon.org" },
 *   { name: "Guides", url: "https://boothbeacon.org/guides" },
 *   { name: "Berlin", url: "https://boothbeacon.org/guides/berlin" }
 * ]);
 * ```
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]): object {
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

/**
 * Generates Article schema markup for content pages
 *
 * @example
 * ```tsx
 * const articleSchema = generateArticleSchema({
 *   headline: "The Ultimate Guide to Photo Booths in Berlin",
 *   description: "Discover the best analog photo booths...",
 *   author: "Jascha Kaykas-Wolff",
 *   datePublished: "2026-01-03",
 *   dateModified: "2026-01-03",
 *   image: "/images/berlin-guide.jpg"
 * });
 * ```
 */
export function generateArticleSchema({
  headline,
  description,
  author,
  datePublished,
  dateModified,
  image,
  url,
}: {
  headline: string;
  description: string;
  author: string;
  datePublished: string; // ISO 8601 date
  dateModified?: string; // ISO 8601 date
  image?: string;
  url?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    author: {
      '@type': 'Person',
      name: author,
    },
    datePublished,
    ...(dateModified && { dateModified }),
    ...(image && { image }),
    ...(url && { url }),
    publisher: {
      '@type': 'Organization',
      name: 'Booth Beacon',
      url: 'https://boothbeacon.org',
      logo: {
        '@type': 'ImageObject',
        url: 'https://boothbeacon.org/logo.png',
      },
    },
  };
}

/**
 * Generates WebSite schema with search action
 */
export function generateWebSiteSchema({
  name,
  url,
  description,
}: {
  name: string;
  url: string;
  description: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generates Organization schema
 */
export function generateOrganizationSchema({
  name,
  url,
  logo,
  description,
  foundingDate,
  founder,
  sameAs,
}: {
  name: string;
  url: string;
  logo: string;
  description: string;
  foundingDate?: string;
  founder?: string;
  sameAs?: string[]; // Social media URLs
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo: {
      '@type': 'ImageObject',
      url: logo,
    },
    description,
    ...(foundingDate && { foundingDate }),
    ...(founder && {
      founder: {
        '@type': 'Person',
        name: founder,
      },
    }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
  };
}

/**
 * Generates Place schema for booth locations
 */
export function generatePlaceSchema({
  name,
  description,
  address,
  latitude,
  longitude,
  url,
  image,
}: {
  name: string;
  description?: string;
  address: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  latitude: number;
  longitude: number;
  url?: string;
  image?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name,
    ...(description && { description }),
    address: {
      '@type': 'PostalAddress',
      ...(address.streetAddress && { streetAddress: address.streetAddress }),
      addressLocality: address.addressLocality,
      ...(address.addressRegion && { addressRegion: address.addressRegion }),
      ...(address.postalCode && { postalCode: address.postalCode }),
      addressCountry: address.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude,
      longitude,
    },
    ...(url && { url }),
    ...(image && { image }),
  };
}

/**
 * Helper to serialize schema to JSON-LD script tag
 *
 * @example
 * ```tsx
 * import Script from 'next/script';
 * import { generateFAQPageSchema, serializeSchema } from '@/lib/schema-utils';
 *
 * export default function FAQPage() {
 *   const schema = generateFAQPageSchema(faqItems);
 *
 *   return (
 *     <>
 *       <Script
 *         id="faq-schema"
 *         type="application/ld+json"
 *         dangerouslySetInnerHTML={{ __html: serializeSchema(schema) }}
 *       />
 *       <div>FAQ content...</div>
 *     </>
 *   );
 * }
 * ```
 */
export function serializeSchema(schema: object): string {
  return JSON.stringify(schema);
}

/**
 * Validates that a schema object has required fields
 * Useful for development/testing
 */
export function validateSchema(schema: object, type: string): boolean {
  const schemaObj = schema as { '@type'?: string; '@context'?: string };

  if (!schemaObj['@context'] || !schemaObj['@type']) {
    console.warn(
      `Schema validation warning: Missing @context or @type for ${type} schema`
    );
    return false;
  }

  if (schemaObj['@type'] !== type) {
    console.warn(
      `Schema validation warning: Expected type ${type} but got ${schemaObj['@type']}`
    );
    return false;
  }

  return true;
}
