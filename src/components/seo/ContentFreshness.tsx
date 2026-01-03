'use client';

import { formatDistanceToNow } from 'date-fns';

interface ContentFreshnessProps {
  /**
   * ISO date string of when content was last updated
   */
  updatedAt: string;
  /**
   * Optional label text (defaults to "Last Updated")
   */
  label?: string;
  /**
   * Optional CSS classes to apply
   */
  className?: string;
  /**
   * Threshold in days - show relative date if within threshold, absolute date if older
   * Default: 30 days
   */
  relativeDateThreshold?: number;
}

/**
 * ContentFreshness Component
 *
 * Displays content freshness signals for SEO and user trust.
 * Shows relative dates for recent updates (e.g., "Updated 2 days ago")
 * Shows absolute dates for older content (e.g., "Updated January 3, 2026")
 *
 * Features:
 * - Proper semantic HTML with <time> element
 * - dateTime attribute for machine-readable format
 * - Checkmark icon for trust signal
 * - Vintage amber/orange styling to match theme
 * - Responsive design
 *
 * Usage:
 * ```tsx
 * <ContentFreshness updatedAt={booth.updated_at} />
 * <ContentFreshness updatedAt="2026-01-03T10:00:00Z" label="Content Reviewed" />
 * ```
 */
export function ContentFreshness({
  updatedAt,
  label = 'Last Updated',
  className = '',
  relativeDateThreshold = 30,
}: ContentFreshnessProps) {
  // Validate date
  const date = new Date(updatedAt);
  if (isNaN(date.getTime())) {
    console.error('Invalid date provided to ContentFreshness:', updatedAt);
    return null;
  }

  // Calculate days since update
  const now = new Date();
  const daysSinceUpdate = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  // Determine display format
  const useRelativeDate = daysSinceUpdate <= relativeDateThreshold;

  // Format display text
  let displayText: string;
  if (useRelativeDate) {
    // Show relative date for recent updates
    displayText = formatDistanceToNow(date, { addSuffix: true });
  } else {
    // Show absolute date for older content
    displayText = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // ISO format for dateTime attribute
  const isoDate = date.toISOString();

  return (
    <div
      className={`content-freshness inline-flex items-center gap-2 text-sm text-vintage-text-secondary ${className}`}
      role="contentinfo"
      aria-label={`${label}: ${displayText}`}
    >
      <span className="text-vintage-amber font-bold" aria-hidden="true">
        ✓
      </span>
      <p className="m-0">
        <strong className="font-semibold text-vintage-text">{label}:</strong>{' '}
        <time
          dateTime={isoDate}
          className="text-vintage-text-secondary"
          title={date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            timeZoneName: 'short',
          })}
        >
          {displayText}
        </time>
      </p>
    </div>
  );
}
