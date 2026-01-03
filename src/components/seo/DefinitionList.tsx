'use client';

import React, { useState } from 'react';
import Script from 'next/script';
import { cn } from '@/lib/utils';
import { BookOpen, ChevronDown, ChevronUp, Search } from 'lucide-react';

/**
 * DefinitionList Component - Phase 4 Featured Snippets Implementation
 *
 * Creates glossary and definition lists optimized for Google's definition snippets.
 * Perfect for photo booth terminology, technical terms, and key concepts.
 *
 * Features:
 * - Structured definition markup with <dl>, <dt>, <dd>
 * - Schema.org DefinedTerm and DefinedTermSet markup
 * - Search/filter functionality for large glossaries
 * - Collapsible definitions
 * - Alphabetical organization
 * - data-ai attributes for crawler visibility
 * - Vintage styling matching site theme
 *
 * Usage:
 * - Photo booth glossary pages
 * - Technical terminology guides
 * - Concept definitions in guides
 * - Educational content
 *
 * @see docs/AI_SEO_IMPLEMENTATION_PLAN.md Phase 4, Task 4.3
 */

/**
 * Single definition term
 */
export interface DefinitionTerm {
  /**
   * The term being defined
   */
  term: string;

  /**
   * The definition (concise, 1-2 sentences ideal)
   */
  definition: string;

  /**
   * Optional detailed explanation
   */
  details?: string;

  /**
   * Optional related terms
   */
  relatedTerms?: string[];

  /**
   * Optional URL for more information
   */
  url?: string;

  /**
   * Optional category for grouping
   */
  category?: string;
}

export interface DefinitionListProps {
  /**
   * Title for the glossary/definition list
   */
  title: string;

  /**
   * Optional subtitle/description
   */
  subtitle?: string;

  /**
   * Array of definition terms
   */
  terms: DefinitionTerm[];

  /**
   * Display variant
   * - default: Standard list with separators
   * - cards: Card-based layout
   * - compact: Minimal spacing
   */
  variant?: 'default' | 'cards' | 'compact';

  /**
   * Enable search/filter functionality
   * @default true for lists with 5+ terms
   */
  searchable?: boolean;

  /**
   * Group terms alphabetically
   * @default true
   */
  alphabetize?: boolean;

  /**
   * Make definitions collapsible
   * @default false
   */
  collapsible?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Enable Schema.org DefinedTermSet markup
   * @default true
   */
  showSchema?: boolean;
}

/**
 * Single definition item component
 */
const DefinitionItem: React.FC<{
  term: DefinitionTerm;
  variant: 'default' | 'cards' | 'compact';
  collapsible: boolean;
  searchTerm?: string;
}> = ({ term, variant, collapsible, searchTerm }) => {
  const [isExpanded, setIsExpanded] = useState(!collapsible);

  // Highlight search term in text
  const highlightText = (text: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-vintage-amber/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (variant === 'cards') {
    return (
      <div className="bg-card border border-primary/10 rounded-lg p-5 hover:border-vintage-amber/30 transition-all duration-300 shadow-sm hover:shadow-md">
        <dt className="text-lg font-semibold text-foreground mb-2">
          {highlightText(term.term)}
        </dt>
        <dd className="text-sm text-muted-foreground leading-relaxed">
          {highlightText(term.definition)}
          {term.details && isExpanded && (
            <p className="mt-3 pt-3 border-t border-primary/10">
              {highlightText(term.details)}
            </p>
          )}
          {term.relatedTerms && term.relatedTerms.length > 0 && (
            <div className="mt-3 pt-3 border-t border-primary/10">
              <p className="text-xs font-semibold text-foreground mb-1">
                Related Terms:
              </p>
              <div className="flex flex-wrap gap-2">
                {term.relatedTerms.map((related, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-2 py-1 rounded-md text-xs bg-vintage-amber/10 text-vintage-amber border border-vintage-amber/20"
                  >
                    {related}
                  </span>
                ))}
              </div>
            </div>
          )}
          {collapsible && term.details && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 text-xs text-vintage-amber hover:text-vintage-amber-dark font-medium"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </dd>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="py-2">
        <dt className="font-semibold text-foreground inline">
          {highlightText(term.term)}:{' '}
        </dt>
        <dd className="text-sm text-muted-foreground inline">
          {highlightText(term.definition)}
        </dd>
      </div>
    );
  }

  // Default variant
  return (
    <div className="border-b border-primary/10 last:border-0 py-4">
      <dt className="flex items-start justify-between gap-2 mb-2">
        <span className="text-lg font-semibold text-foreground">
          {highlightText(term.term)}
        </span>
        {term.category && (
          <span className="flex-shrink-0 text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
            {term.category}
          </span>
        )}
      </dt>
      <dd className="text-sm text-muted-foreground leading-relaxed ml-0 md:ml-4">
        {highlightText(term.definition)}
        {term.details && isExpanded && (
          <p className="mt-3 pt-3 border-t border-primary/10">
            {highlightText(term.details)}
          </p>
        )}
        {term.relatedTerms && term.relatedTerms.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-foreground mb-1.5">
              Related: {term.relatedTerms.join(', ')}
            </p>
          </div>
        )}
        {term.url && (
          <a
            href={term.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-vintage-amber hover:text-vintage-amber-dark hover:underline"
          >
            Learn more →
          </a>
        )}
        {collapsible && term.details && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 flex items-center gap-1 text-xs text-vintage-amber hover:text-vintage-amber-dark font-medium"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Read more
              </>
            )}
          </button>
        )}
      </dd>
    </div>
  );
};

/**
 * DefinitionList Component
 */
export function DefinitionList({
  title,
  subtitle,
  terms,
  variant = 'default',
  searchable,
  alphabetize = true,
  collapsible = false,
  className = '',
  showSchema = true,
}: DefinitionListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-enable search for large lists
  const shouldShowSearch = searchable ?? terms.length >= 5;

  // Filter and sort terms
  let displayTerms = [...terms];

  // Apply search filter
  if (searchTerm) {
    displayTerms = displayTerms.filter(
      (term) =>
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.details?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Alphabetize if enabled
  if (alphabetize) {
    displayTerms.sort((a, b) => a.term.localeCompare(b.term));
  }

  // Group by first letter for navigation
  const groupedTerms: Record<string, DefinitionTerm[]> = {};
  if (alphabetize && !searchTerm) {
    displayTerms.forEach((term) => {
      const firstLetter = term.term[0].toUpperCase();
      if (!groupedTerms[firstLetter]) {
        groupedTerms[firstLetter] = [];
      }
      groupedTerms[firstLetter].push(term);
    });
  }

  // Generate Schema.org DefinedTermSet markup
  const termSetSchema = showSchema
    ? {
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        name: title,
        ...(subtitle && { description: subtitle }),
        hasDefinedTerm: terms.map((term) => ({
          '@type': 'DefinedTerm',
          name: term.term,
          description: term.definition,
          ...(term.url && { url: term.url }),
          ...(term.category && { inDefinedTermSet: term.category }),
        })),
      }
    : null;

  return (
    <>
      {termSetSchema && (
        <Script
          id="definition-list-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(termSetSchema) }}
        />
      )}

      <section
        className={cn(
          'definition-list-container',
          'rounded-xl border border-border bg-card shadow-lg',
          className
        )}
        data-ai-section="glossary"
        data-ai-type="definition-list"
        data-ai-importance="high"
        aria-labelledby="glossary-heading"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-vintage-amber/10 via-vintage-orange/5 to-transparent border-b border-vintage-amber/20 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-vintage-amber/10 border border-vintage-amber/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-vintage-amber" />
            </div>
            <div className="flex-1">
              <h2
                id="glossary-heading"
                className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-1"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {terms.length} {terms.length === 1 ? 'term' : 'terms'}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        {shouldShowSearch && (
          <div className="px-6 py-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-vintage-amber/50 focus:border-vintage-amber"
                aria-label="Search glossary terms"
              />
            </div>
            {searchTerm && (
              <p className="text-xs text-muted-foreground mt-2">
                Found {displayTerms.length} {displayTerms.length === 1 ? 'result' : 'results'}
              </p>
            )}
          </div>
        )}

        {/* Terms */}
        <div className={cn('px-6 py-5', variant === 'cards' && 'space-y-4')}>
          {alphabetize && !searchTerm ? (
            // Grouped by letter
            <dl>
              {Object.entries(groupedTerms).map(([letter, letterTerms]) => (
                <div key={letter} className="mb-8 last:mb-0">
                  <h3 className="text-2xl font-bold text-vintage-amber mb-4 pb-2 border-b-2 border-vintage-amber/30">
                    {letter}
                  </h3>
                  <div className={variant === 'cards' ? 'space-y-4' : ''}>
                    {letterTerms.map((term, idx) => (
                      <DefinitionItem
                        key={idx}
                        term={term}
                        variant={variant}
                        collapsible={collapsible}
                        searchTerm={searchTerm}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </dl>
          ) : (
            // Simple list
            <dl className={variant === 'cards' ? 'space-y-4' : ''}>
              {displayTerms.length > 0 ? (
                displayTerms.map((term, idx) => (
                  <DefinitionItem
                    key={idx}
                    term={term}
                    variant={variant}
                    collapsible={collapsible}
                    searchTerm={searchTerm}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No terms found matching &quot;{searchTerm}&quot;
                </p>
              )}
            </dl>
          )}
        </div>
      </section>
    </>
  );
}

/**
 * Usage Examples:
 *
 * // Photo booth glossary
 * <DefinitionList
 *   title="Photo Booth Glossary"
 *   subtitle="Essential terminology for analog photo booth enthusiasts"
 *   terms={[
 *     {
 *       term: "Analog Photo Booth",
 *       definition: "A self-service machine that uses traditional photochemical film and paper to create instant prints.",
 *       details: "Unlike digital booths, analog booths produce authentic chemical photographs with unique grain, tone, and warmth.",
 *       category: "Booth Types",
 *       relatedTerms: ["Chemical Process", "Photo Strip"]
 *     },
 *     {
 *       term: "Photo Strip",
 *       definition: "A vertical strip of 4-6 photos produced by a photo booth in a single session.",
 *       category: "Formats"
 *     },
 *     {
 *       term: "Development Time",
 *       definition: "The time required for photos to chemically develop, typically 3-5 minutes.",
 *       category: "Process"
 *     }
 *   ]}
 *   variant="cards"
 * />
 *
 * // Compact inline definitions
 * <DefinitionList
 *   title="Quick Reference"
 *   terms={photoBoothTerms}
 *   variant="compact"
 *   searchable={false}
 * />
 */
