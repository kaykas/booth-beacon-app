'use client';

import React from 'react';
import Script from 'next/script';
import { cn } from '@/lib/utils';
import { Check, X, Minus, Info } from 'lucide-react';

/**
 * ComparisonTable Component - Phase 4 Featured Snippets Implementation
 *
 * Creates feature comparison tables optimized for Google's comparison snippets.
 * Perfect for comparing photo booth types, machine models, or service features.
 *
 * Features:
 * - Responsive table design (stacks on mobile)
 * - Visual indicators (checkmarks, X marks, neutral)
 * - Highlighted recommended options
 * - Schema.org Table markup
 * - data-ai attributes for crawler visibility
 * - Vintage styling matching site theme
 *
 * Usage:
 * - Photo booth types comparison
 * - Machine model comparisons
 * - Service tier comparisons
 * - Feature availability matrices
 *
 * @see docs/AI_SEO_IMPLEMENTATION_PLAN.md Phase 4, Task 4.2
 */

/**
 * Feature value types
 */
export type FeatureValue = boolean | string | number;

/**
 * Comparison item with features
 */
export interface ComparisonItem {
  /**
   * Item name (e.g., "Analog Photo Booth")
   */
  name: string;

  /**
   * Optional description
   */
  description?: string;

  /**
   * Feature values keyed by feature name
   */
  features: Record<string, FeatureValue>;

  /**
   * Highlight this column as recommended
   */
  recommended?: boolean;

  /**
   * Optional badge text (e.g., "Most Popular", "Best Value")
   */
  badge?: string;
}

/**
 * Feature definition
 */
export interface ComparisonFeature {
  /**
   * Feature key (must match keys in ComparisonItem.features)
   */
  key: string;

  /**
   * Display label for the feature
   */
  label: string;

  /**
   * Optional tooltip/description
   */
  description?: string;
}

export interface ComparisonTableProps {
  /**
   * Title for the comparison
   */
  title: string;

  /**
   * Optional subtitle/description
   */
  subtitle?: string;

  /**
   * Items being compared
   */
  items: ComparisonItem[];

  /**
   * Feature definitions (order determines display order)
   */
  features: ComparisonFeature[];

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Enable Schema.org Table markup
   * @default true
   */
  showSchema?: boolean;

  /**
   * Display variant
   * - default: Standard table
   * - compact: Smaller padding and text
   * - cards: Card-based layout on mobile
   */
  variant?: 'default' | 'compact' | 'cards';
}

/**
 * Renders a feature value cell with appropriate icon/text
 */
const FeatureCell: React.FC<{
  value: FeatureValue;
  compact?: boolean;
}> = ({ value, compact = false }) => {
  const sizeClass = compact ? 'w-4 h-4' : 'w-5 h-5';

  if (typeof value === 'boolean') {
    if (value) {
      return (
        <div className="flex items-center justify-center">
          <div className={cn(
            'rounded-full bg-green-500/10 flex items-center justify-center',
            compact ? 'w-7 h-7' : 'w-8 h-8'
          )}>
            <Check className={cn(sizeClass, 'text-green-500')} aria-label="Yes" />
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center">
          <div className={cn(
            'rounded-full bg-red-500/10 flex items-center justify-center',
            compact ? 'w-7 h-7' : 'w-8 h-8'
          )}>
            <X className={cn(sizeClass, 'text-red-500')} aria-label="No" />
          </div>
        </div>
      );
    }
  }

  if (value === '-' || value === 'N/A' || value === '') {
    return (
      <div className="flex items-center justify-center text-muted-foreground">
        <Minus className={sizeClass} aria-label="Not applicable" />
      </div>
    );
  }

  return (
    <div className={cn(
      'text-center font-medium',
      compact ? 'text-sm' : 'text-base'
    )}>
      {String(value)}
    </div>
  );
};

/**
 * ComparisonTable Component
 */
export function ComparisonTable({
  title,
  subtitle,
  items,
  features,
  className = '',
  showSchema = true,
  variant = 'default',
}: ComparisonTableProps) {
  const compact = variant === 'compact';

  // Generate Schema.org Table markup
  const tableSchema = showSchema
    ? {
        '@context': 'https://schema.org',
        '@type': 'Table',
        about: title,
        ...(subtitle && { description: subtitle }),
      }
    : null;

  return (
    <>
      {tableSchema && (
        <Script
          id="comparison-table-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(tableSchema) }}
        />
      )}

      <div
        className={cn(
          'comparison-table-container',
          'rounded-xl border border-border bg-card shadow-lg overflow-hidden',
          className
        )}
        data-ai-section="comparison-table"
        data-ai-type="feature-comparison"
        data-ai-importance="high"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-vintage-amber/10 via-vintage-orange/5 to-transparent border-b border-vintage-amber/20 px-6 py-5">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th
                  className={cn(
                    'text-left font-semibold text-foreground bg-muted/50',
                    compact ? 'px-4 py-3 text-sm' : 'px-6 py-4'
                  )}
                >
                  Feature
                </th>
                {items.map((item, idx) => (
                  <th
                    key={idx}
                    className={cn(
                      'text-center font-semibold relative',
                      compact ? 'px-4 py-3' : 'px-6 py-4',
                      item.recommended
                        ? 'bg-gradient-to-b from-vintage-amber/10 to-transparent'
                        : 'bg-muted/50'
                    )}
                  >
                    {/* Recommended badge */}
                    {item.badge && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-vintage-amber to-vintage-orange shadow-lg">
                          {item.badge}
                        </span>
                      </div>
                    )}

                    <div className={cn(compact ? 'text-sm' : 'text-base', 'text-foreground')}>
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground font-normal mt-1">
                        {item.description}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, featureIdx) => (
                <tr
                  key={feature.key}
                  className={cn(
                    'border-b border-border',
                    featureIdx % 2 === 0 ? 'bg-muted/20' : ''
                  )}
                >
                  <td
                    className={cn(
                      'font-medium text-foreground',
                      compact ? 'px-4 py-3 text-sm' : 'px-6 py-4'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{feature.label}</span>
                      {feature.description && (
                        <div className="group relative">
                          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-popover border border-border rounded-lg shadow-lg text-xs text-muted-foreground z-10">
                            {feature.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  {items.map((item, itemIdx) => (
                    <td
                      key={itemIdx}
                      className={cn(
                        compact ? 'px-4 py-3' : 'px-6 py-4',
                        item.recommended ? 'bg-vintage-amber/5' : ''
                      )}
                    >
                      <FeatureCell
                        value={item.features[feature.key] ?? false}
                        compact={compact}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-6 p-4">
          {items.map((item, itemIdx) => (
            <div
              key={itemIdx}
              className={cn(
                'border rounded-lg overflow-hidden',
                item.recommended
                  ? 'border-vintage-amber/50 ring-2 ring-vintage-amber/20'
                  : 'border-border'
              )}
            >
              {/* Item header */}
              <div
                className={cn(
                  'px-4 py-3 border-b',
                  item.recommended
                    ? 'bg-gradient-to-r from-vintage-amber/10 to-transparent border-vintage-amber/20'
                    : 'bg-muted/50 border-border'
                )}
              >
                {item.badge && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-vintage-amber to-vintage-orange mb-2">
                    {item.badge}
                  </span>
                )}
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="divide-y divide-border">
                {features.map((feature) => (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {feature.label}
                      </div>
                      {feature.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {feature.description}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <FeatureCell
                        value={item.features[feature.key] ?? false}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * Usage Example:
 *
 * <ComparisonTable
 *   title="Photo Booth Types Comparison"
 *   subtitle="Compare features of different photo booth types"
 *   items={[
 *     {
 *       name: "Classic Analog",
 *       description: "Traditional chemical photo booths",
 *       recommended: true,
 *       badge: "Most Authentic",
 *       features: {
 *         authentic: true,
 *         instant: true,
 *         filters: false,
 *         cost: "€2-4",
 *         quality: "Excellent",
 *         digital: false,
 *       }
 *     },
 *     {
 *       name: "Digital Booth",
 *       description: "Modern digital photo booths",
 *       features: {
 *         authentic: false,
 *         instant: true,
 *         filters: true,
 *         cost: "€5-8",
 *         quality: "Good",
 *         digital: true,
 *       }
 *     },
 *     {
 *       name: "Hybrid Booth",
 *       description: "Digital with analog-style prints",
 *       features: {
 *         authentic: false,
 *         instant: true,
 *         filters: true,
 *         cost: "€4-6",
 *         quality: "Very Good",
 *         digital: true,
 *       }
 *     }
 *   ]}
 *   features={[
 *     { key: 'authentic', label: 'Authentic Chemical Prints', description: 'Uses real photochemical process' },
 *     { key: 'instant', label: 'Instant Results' },
 *     { key: 'filters', label: 'Digital Filters' },
 *     { key: 'cost', label: 'Typical Cost' },
 *     { key: 'quality', label: 'Print Quality' },
 *     { key: 'digital', label: 'Digital Copy Available' },
 *   ]}
 * />
 */
