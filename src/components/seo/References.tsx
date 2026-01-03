'use client';

import React, { useState } from 'react';
import Script from 'next/script';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

/**
 * Types of references supported
 */
export type ReferenceType = 'web' | 'book' | 'article' | 'journal' | 'video' | 'interview';

/**
 * Common fields for all reference types
 */
interface BaseReference {
  id: string;
  type: ReferenceType;
  title: string;
  url?: string;
  accessDate?: string;
  description?: string;
}

/**
 * Web page reference
 */
export interface WebReference extends BaseReference {
  type: 'web';
  author?: string;
  siteName: string;
  publishDate?: string;
}

/**
 * Book reference
 */
export interface BookReference extends BaseReference {
  type: 'book';
  author: string;
  publisher: string;
  publishDate: string;
  isbn?: string;
}

/**
 * Article/blog post reference
 */
export interface ArticleReference extends BaseReference {
  type: 'article';
  author: string;
  publication: string;
  publishDate: string;
}

/**
 * Academic journal reference
 */
export interface JournalReference extends BaseReference {
  type: 'journal';
  authors: string[];
  journal: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publishDate: string;
  doi?: string;
}

/**
 * Video reference
 */
export interface VideoReference extends BaseReference {
  type: 'video';
  creator: string;
  platform: string;
  publishDate: string;
  duration?: string;
}

/**
 * Interview reference
 */
export interface InterviewReference extends BaseReference {
  type: 'interview';
  interviewee: string;
  interviewer?: string;
  publishDate: string;
}

/**
 * Union type of all reference types
 */
export type Reference =
  | WebReference
  | BookReference
  | ArticleReference
  | JournalReference
  | VideoReference
  | InterviewReference;

/**
 * Props for the References component
 */
export interface ReferencesProps {
  /**
   * Array of references to display
   */
  references: Reference[];

  /**
   * Title for the references section
   * @default "References"
   */
  title?: string;

  /**
   * Number of references to show before collapsing
   * Set to 0 to disable collapsing
   * @default 5
   */
  collapseThreshold?: number;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Show reference type badges
   * @default true
   */
  showTypeBadges?: boolean;

  /**
   * Enable Schema.org structured data
   * @default true
   */
  enableStructuredData?: boolean;
}

/**
 * Formats a date string to a human-readable format
 */
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Returns the icon color class based on reference type
 */
const getTypeColor = (type: ReferenceType): string => {
  const colors: Record<ReferenceType, string> = {
    web: 'text-vintage-amber',
    book: 'text-vintage-orange',
    article: 'text-vintage-amber',
    journal: 'text-primary',
    video: 'text-vintage-orange',
    interview: 'text-vintage-amber',
  };
  return colors[type] || 'text-vintage-amber';
};

/**
 * Returns the display label for a reference type
 */
const getTypeLabel = (type: ReferenceType): string => {
  const labels: Record<ReferenceType, string> = {
    web: 'Web',
    book: 'Book',
    article: 'Article',
    journal: 'Journal',
    video: 'Video',
    interview: 'Interview',
  };
  return labels[type] || type;
};

/**
 * Renders a single reference item with appropriate formatting
 */
const ReferenceItem: React.FC<{
  reference: Reference;
  index: number;
  showTypeBadge: boolean;
}> = ({ reference, index, showTypeBadge }) => {
  const renderContent = () => {
    switch (reference.type) {
      case 'web': {
        const ref = reference as WebReference;
        return (
          <>
            {ref.author && <span className="font-medium">{ref.author}. </span>}
            <span className="italic">{ref.title}</span>
            {ref.siteName && <span>. {ref.siteName}</span>}
            {ref.publishDate && <span> ({formatDate(ref.publishDate)})</span>}
            {ref.accessDate && (
              <span className="text-sm text-muted-foreground">
                . Accessed {formatDate(ref.accessDate)}
              </span>
            )}
          </>
        );
      }

      case 'book': {
        const ref = reference as BookReference;
        return (
          <>
            <span className="font-medium">{ref.author}. </span>
            <span className="italic">{ref.title}</span>
            <span>. {ref.publisher}, {formatDate(ref.publishDate)}</span>
            {ref.isbn && (
              <span className="text-sm text-muted-foreground">. ISBN: {ref.isbn}</span>
            )}
          </>
        );
      }

      case 'article': {
        const ref = reference as ArticleReference;
        return (
          <>
            <span className="font-medium">{ref.author}. </span>
            <span>"{ref.title}." </span>
            <span className="italic">{ref.publication}</span>
            <span>, {formatDate(ref.publishDate)}</span>
          </>
        );
      }

      case 'journal': {
        const ref = reference as JournalReference;
        return (
          <>
            <span className="font-medium">
              {ref.authors.join(', ')}.
            </span>
            <span> "{ref.title}." </span>
            <span className="italic">{ref.journal}</span>
            {ref.volume && <span> {ref.volume}</span>}
            {ref.issue && <span>.{ref.issue}</span>}
            {ref.pages && <span> ({ref.pages})</span>}
            <span>. {formatDate(ref.publishDate)}</span>
            {ref.doi && (
              <span className="text-sm text-muted-foreground">
                . DOI: {ref.doi}
              </span>
            )}
          </>
        );
      }

      case 'video': {
        const ref = reference as VideoReference;
        return (
          <>
            <span className="font-medium">{ref.creator}. </span>
            <span className="italic">{ref.title}</span>
            <span>. {ref.platform}, {formatDate(ref.publishDate)}</span>
            {ref.duration && (
              <span className="text-sm text-muted-foreground">. Duration: {ref.duration}</span>
            )}
          </>
        );
      }

      case 'interview': {
        const ref = reference as InterviewReference;
        return (
          <>
            <span className="font-medium">{ref.interviewee}. </span>
            <span>"{ref.title}."</span>
            {ref.interviewer && <span> Interview by {ref.interviewer}. </span>}
            <span> {formatDate(ref.publishDate)}</span>
          </>
        );
      }
    }
  };

  return (
    <li className="group relative pl-0">
      <div className="flex gap-3">
        {/* Citation number */}
        <span
          className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-vintage-amber/10 text-vintage-amber text-sm font-semibold border border-vintage-amber/20"
          aria-label={`Reference ${index + 1}`}
        >
          {index + 1}
        </span>

        {/* Reference content */}
        <div className="flex-1 pt-0.5">
          <div className="flex items-start gap-2 flex-wrap">
            {showTypeBadge && (
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
                  'bg-vintage-amber/5 border-vintage-amber/20',
                  getTypeColor(reference.type)
                )}
              >
                {getTypeLabel(reference.type)}
              </span>
            )}

            <div className="flex-1 text-sm leading-relaxed text-foreground">
              {renderContent()}
              {reference.description && (
                <p className="mt-1 text-muted-foreground italic">
                  {reference.description}
                </p>
              )}
            </div>
          </div>

          {/* Link */}
          {reference.url && (
            <a
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1 mt-2 text-sm font-medium',
                'text-vintage-amber hover:text-vintage-amber-dark',
                'transition-colors duration-200',
                'hover:underline decoration-vintage-amber/30 hover:decoration-vintage-amber',
                'underline-offset-2'
              )}
            >
              <span>View source</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </li>
  );
};

/**
 * References Component
 *
 * Displays a formatted list of citations and references with:
 * - Numbered citation list
 * - Multiple citation formats (web, book, article, journal, video, interview)
 * - Clickable links to sources
 * - Type badges for quick identification
 * - Collapse/expand for long reference lists
 * - Schema.org Citation markup for SEO
 * - Vintage amber/orange aesthetic matching site theme
 *
 * @example
 * ```tsx
 * import { References } from '@/components/seo/References';
 *
 * const references = [
 *   {
 *     id: 'ref-1',
 *     type: 'web',
 *     title: 'The History of Photo Booths',
 *     url: 'https://example.com/photo-booth-history',
 *     author: 'John Smith',
 *     siteName: 'Photo Booth Magazine',
 *     publishDate: '2023-05-15',
 *     accessDate: '2026-01-02'
 *   },
 *   {
 *     id: 'ref-2',
 *     type: 'book',
 *     title: 'Analog Photography: A Complete Guide',
 *     author: 'Jane Doe',
 *     publisher: 'Photo Press',
 *     publishDate: '2020-08-01',
 *     isbn: '978-1234567890'
 *   }
 * ];
 *
 * <References references={references} />
 * ```
 */
export const References: React.FC<ReferencesProps> = ({
  references,
  title = 'References',
  collapseThreshold = 5,
  className,
  showTypeBadges = true,
  enableStructuredData = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine if we should show collapse/expand
  const shouldCollapse = collapseThreshold > 0 && references.length > collapseThreshold;
  const displayedReferences = shouldCollapse && !isExpanded
    ? references.slice(0, collapseThreshold)
    : references;
  const hiddenCount = references.length - collapseThreshold;

  // Generate Schema.org structured data
  const structuredData = enableStructuredData ? {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    citation: references.map(ref => ({
      '@type': 'CreativeWork',
      name: ref.title,
      url: ref.url,
      ...(ref.type === 'web' && {
        '@type': 'WebPage',
        author: (ref as WebReference).author,
        publisher: (ref as WebReference).siteName,
        datePublished: (ref as WebReference).publishDate,
      }),
      ...(ref.type === 'book' && {
        '@type': 'Book',
        author: (ref as BookReference).author,
        publisher: (ref as BookReference).publisher,
        datePublished: (ref as BookReference).publishDate,
        isbn: (ref as BookReference).isbn,
      }),
      ...(ref.type === 'article' && {
        '@type': 'Article',
        author: (ref as ArticleReference).author,
        publisher: (ref as ArticleReference).publication,
        datePublished: (ref as ArticleReference).publishDate,
      }),
      ...(ref.type === 'journal' && {
        '@type': 'ScholarlyArticle',
        author: (ref as JournalReference).authors,
        publisher: (ref as JournalReference).journal,
        datePublished: (ref as JournalReference).publishDate,
      }),
      ...(ref.type === 'video' && {
        '@type': 'VideoObject',
        creator: (ref as VideoReference).creator,
        datePublished: (ref as VideoReference).publishDate,
      }),
    }))
  } : null;

  if (references.length === 0) {
    return null;
  }

  return (
    <>
      {structuredData && (
        <Script
          id="structured-data-references"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      <section
        className={cn(
          'references-section',
          'rounded-xl border border-border bg-card p-6 sm:p-8',
          'shadow-lg',
          className
        )}
        aria-labelledby="references-heading"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-vintage-amber/20">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-vintage-amber/10 border border-vintage-amber/20">
            <svg
              className="w-5 h-5 text-vintage-amber"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <div className="flex-1">
            <h2
              id="references-heading"
              className="text-2xl font-display font-semibold text-foreground"
            >
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {references.length} {references.length === 1 ? 'citation' : 'citations'}
            </p>
          </div>
        </div>

        {/* References list */}
        <ol className="space-y-4 list-none p-0 m-0" aria-label="List of references">
          {displayedReferences.map((reference, index) => (
            <ReferenceItem
              key={reference.id}
              reference={reference}
              index={index}
              showTypeBadge={showTypeBadges}
            />
          ))}
        </ol>

        {/* Expand/Collapse button */}
        {shouldCollapse && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'mt-6 w-full flex items-center justify-center gap-2',
              'px-4 py-3 rounded-lg',
              'bg-vintage-amber/5 hover:bg-vintage-amber/10',
              'border border-vintage-amber/20 hover:border-vintage-amber/30',
              'text-sm font-medium text-vintage-amber',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-vintage-amber/50 focus:ring-offset-2 focus:ring-offset-background'
            )}
            aria-expanded={isExpanded}
            aria-controls="references-list"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
                <span>
                  Show {hiddenCount} more {hiddenCount === 1 ? 'reference' : 'references'}
                </span>
              </>
            )}
          </button>
        )}
      </section>
    </>
  );
};
