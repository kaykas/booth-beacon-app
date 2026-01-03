'use client';

import React from 'react';
import Script from 'next/script';
import { cn } from '@/lib/utils';
import { MessageSquare, CheckCircle2 } from 'lucide-react';

/**
 * FeaturedAnswer Component - Phase 4 Featured Snippets Implementation
 *
 * Optimized for Google Featured Snippets with direct, concise answers (40-60 words)
 * to common questions. Structured to maximize search engine visibility.
 *
 * Features:
 * - Concise 40-60 word answers optimized for featured snippets
 * - Schema.org Question/Answer markup
 * - Visual prominence with vintage styling
 * - data-ai attributes for crawler visibility
 * - Accessible and mobile-responsive
 *
 * Usage:
 * - FAQ pages
 * - Guide pages with common questions
 * - Blog posts answering specific queries
 *
 * @see docs/AI_SEO_IMPLEMENTATION_PLAN.md Phase 4, Task 4.1
 */

export interface FeaturedAnswerProps {
  /**
   * The question being answered
   */
  question: string;

  /**
   * The answer (40-60 words for optimal featured snippet format)
   */
  answer: string;

  /**
   * Optional detailed answer/elaboration
   */
  details?: string;

  /**
   * Related question IDs for Schema.org linking
   */
  relatedQuestions?: string[];

  /**
   * Display variant
   * - default: Full card with icon
   * - compact: Minimal inline version
   * - prominent: Highlighted box for primary Q&A
   */
  variant?: 'default' | 'compact' | 'prominent';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Enable Schema.org Question/Answer markup
   * @default true
   */
  showSchema?: boolean;

  /**
   * Unique ID for this Q&A (used in schema linking)
   */
  id?: string;
}

/**
 * Helper to count words in a string
 */
const countWords = (text: string): number => {
  return text.trim().split(/\s+/).length;
};

/**
 * FeaturedAnswer Component
 */
export function FeaturedAnswer({
  question,
  answer,
  details,
  relatedQuestions,
  variant = 'default',
  className = '',
  showSchema = true,
  id,
}: FeaturedAnswerProps) {
  const wordCount = countWords(answer);
  const isOptimalLength = wordCount >= 40 && wordCount <= 60;

  // Generate Schema.org Question/Answer markup
  const qaSchema = showSchema
    ? {
        '@context': 'https://schema.org',
        '@type': 'Question',
        '@id': id ? `#${id}` : undefined,
        name: question,
        text: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
          ...(details && { description: details }),
        },
        ...(relatedQuestions && relatedQuestions.length > 0 && {
          relatedLink: relatedQuestions.map(qId => `#${qId}`),
        }),
      }
    : null;

  // Compact variant - minimal inline Q&A
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'py-3 border-l-2 border-vintage-amber/30 pl-4',
          className
        )}
        data-ai-section="faq-item"
        data-ai-type="qa-pair"
        data-ai-importance="medium"
      >
        <h4 className="text-sm font-semibold text-foreground mb-1.5">
          {question}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {answer}
        </p>
        {qaSchema && (
          <Script
            id={`qa-schema-${id || 'compact'}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(qaSchema) }}
          />
        )}
      </div>
    );
  }

  // Prominent variant - highlighted featured answer
  if (variant === 'prominent') {
    return (
      <>
        <div
          className={cn(
            'group relative overflow-hidden',
            'bg-gradient-to-br from-vintage-amber/10 via-vintage-orange/5 to-transparent',
            'border-2 border-vintage-amber/30 rounded-xl p-6 sm:p-8',
            'shadow-lg hover:shadow-xl transition-all duration-300',
            'hover:border-vintage-amber/50',
            className
          )}
          data-ai-section="featured-answer"
          data-ai-type="qa-pair"
          data-ai-importance="high"
        >
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-vintage-amber/20 to-transparent blur-2xl" />

          {/* Header with icon */}
          <div className="relative z-10 flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-vintage-amber to-vintage-orange flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-vintage-amber uppercase tracking-wider">
                  Featured Answer
                </span>
                {isOptimalLength && (
                  <CheckCircle2 className="w-4 h-4 text-vintage-amber" aria-label="Optimized for featured snippets" />
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground leading-tight">
                {question}
              </h3>
            </div>
          </div>

          {/* Answer */}
          <div className="relative z-10 space-y-4">
            <p className="text-base sm:text-lg leading-relaxed text-foreground font-medium">
              {answer}
            </p>

            {details && (
              <div className="pt-4 border-t border-vintage-amber/10">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {details}
                </p>
              </div>
            )}
          </div>

          {/* Snippet optimization indicator */}
          {!isOptimalLength && (
            <div className="mt-4 text-xs text-muted-foreground italic">
              Note: Answer is {wordCount} words ({wordCount < 40 ? 'consider expanding' : 'consider condensing'} for optimal featured snippet format)
            </div>
          )}
        </div>

        {qaSchema && (
          <Script
            id={`qa-schema-${id || 'prominent'}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(qaSchema) }}
          />
        )}
      </>
    );
  }

  // Default variant - standard card
  return (
    <>
      <div
        className={cn(
          'group relative',
          'bg-card border border-primary/10 rounded-xl p-5 sm:p-6',
          'hover:border-vintage-amber/30 transition-all duration-300',
          'shadow-md hover:shadow-lg',
          className
        )}
        data-ai-section="faq-item"
        data-ai-type="qa-pair"
        data-ai-importance="medium"
      >
        {/* Question */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-vintage-amber/10 border border-vintage-amber/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-vintage-amber" />
          </div>
          <h3 className="flex-1 text-base sm:text-lg font-semibold text-foreground leading-snug pt-0.5">
            {question}
          </h3>
        </div>

        {/* Answer */}
        <div className="pl-11 space-y-3">
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {answer}
          </p>

          {details && (
            <p className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-primary/10">
              {details}
            </p>
          )}
        </div>
      </div>

      {qaSchema && (
        <Script
          id={`qa-schema-${id || 'default'}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(qaSchema) }}
        />
      )}
    </>
  );
}

/**
 * FeaturedAnswerList - Container for multiple Q&As with FAQPage schema
 */
export interface FeaturedAnswerListProps {
  /**
   * Array of Q&A items
   */
  items: Array<{
    id: string;
    question: string;
    answer: string;
    details?: string;
  }>;

  /**
   * Title for the FAQ section
   */
  title?: string;

  /**
   * Display variant for individual items
   */
  variant?: 'default' | 'compact' | 'prominent';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Enable FAQPage schema
   * @default true
   */
  showFAQSchema?: boolean;
}

export function FeaturedAnswerList({
  items,
  title = 'Frequently Asked Questions',
  variant = 'default',
  className = '',
  showFAQSchema = true,
}: FeaturedAnswerListProps) {
  // Generate FAQPage schema for the entire list
  const faqPageSchema = showFAQSchema
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map(item => ({
          '@type': 'Question',
          '@id': `#${item.id}`,
          name: item.question,
          text: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
            ...(item.details && { description: item.details }),
          },
        })),
      }
    : null;

  return (
    <>
      {faqPageSchema && (
        <Script
          id="faq-page-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
        />
      )}

      <section
        className={cn('space-y-6', className)}
        aria-labelledby="faq-heading"
      >
        {title && (
          <div className="flex items-center gap-3 pb-4 border-b border-vintage-amber/20">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-vintage-amber/10 border border-vintage-amber/20">
              <MessageSquare className="w-5 h-5 text-vintage-amber" />
            </div>
            <h2
              id="faq-heading"
              className="text-2xl sm:text-3xl font-display font-bold text-foreground"
            >
              {title}
            </h2>
          </div>
        )}

        <div className="space-y-4">
          {items.map((item) => (
            <FeaturedAnswer
              key={item.id}
              id={item.id}
              question={item.question}
              answer={item.answer}
              details={item.details}
              variant={variant}
              showSchema={false} // Schema handled by parent FAQPage
            />
          ))}
        </div>
      </section>
    </>
  );
}

/**
 * Usage Examples:
 *
 * // Single prominent featured answer
 * <FeaturedAnswer
 *   variant="prominent"
 *   question="What is an analog photo booth?"
 *   answer="An analog photo booth is a self-service machine that uses traditional photochemical film and paper to create instant prints. Unlike digital booths, analog booths produce authentic chemical photographs with unique characteristics, grain, and warmth that cannot be replicated digitally."
 * />
 *
 * // Compact Q&A in a guide
 * <FeaturedAnswer
 *   variant="compact"
 *   question="Where can I find photo booths in Berlin?"
 *   answer="Berlin has over 30 analog photo booths located in train stations, shopping centers, and popular neighborhoods like Kreuzberg and Friedrichshain."
 * />
 *
 * // FAQ list with schema
 * <FeaturedAnswerList
 *   items={[
 *     {
 *       id: 'q1',
 *       question: 'How much does a photo booth cost?',
 *       answer: 'Most analog photo booths cost between €2-6 per session, producing 4-6 photos in a strip format.',
 *     },
 *     {
 *       id: 'q2',
 *       question: 'How long do photos take?',
 *       answer: 'Photos typically take 3-5 minutes to develop after your session.',
 *       details: 'The chemical development process varies by machine type and temperature conditions.'
 *     }
 *   ]}
 * />
 */
