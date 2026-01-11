'use client';

import { CheckCircle, AlertTriangle, XCircle, MapPin, Clock, HelpCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { VerificationType, VERIFICATION_TYPE_LABELS } from '@/types/verification';

interface VerificationBadgeProps {
  lastVerifiedAt?: string | null;
  lastVerificationType?: VerificationType | null;
  totalVerifications?: number;
  compact?: boolean;
  showTooltip?: boolean;
}

// Determine badge status based on recency
function getRecencyStatus(lastVerifiedAt: string | null | undefined): {
  status: 'verified' | 'stale' | 'unknown';
  colorClass: string;
  bgClass: string;
  borderClass: string;
  daysAgo: number | null;
} {
  if (!lastVerifiedAt) {
    return {
      status: 'unknown',
      colorClass: 'text-neutral-500',
      bgClass: 'bg-neutral-100',
      borderClass: 'border-neutral-200',
      daysAgo: null,
    };
  }

  const daysAgo = Math.floor(
    (Date.now() - new Date(lastVerifiedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysAgo <= 30) {
    return {
      status: 'verified',
      colorClass: 'text-green-700',
      bgClass: 'bg-green-50',
      borderClass: 'border-green-200',
      daysAgo,
    };
  } else if (daysAgo <= 90) {
    return {
      status: 'stale',
      colorClass: 'text-amber-700',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
      daysAgo,
    };
  } else {
    return {
      status: 'stale',
      colorClass: 'text-red-700',
      bgClass: 'bg-red-50',
      borderClass: 'border-red-200',
      daysAgo,
    };
  }
}

// Get icon for verification type
function getVerificationIcon(type: VerificationType | null | undefined) {
  switch (type) {
    case 'working':
      return <CheckCircle className="w-4 h-4" />;
    case 'not_working':
      return <AlertTriangle className="w-4 h-4" />;
    case 'closed':
      return <XCircle className="w-4 h-4" />;
    case 'moved':
      return <MapPin className="w-4 h-4" />;
    default:
      return <HelpCircle className="w-4 h-4" />;
  }
}

export function VerificationBadge({
  lastVerifiedAt,
  lastVerificationType,
  totalVerifications,
  compact = false,
  showTooltip = true,
}: VerificationBadgeProps) {
  const recency = getRecencyStatus(lastVerifiedAt);

  // Compact mode: just icon and short text
  if (compact) {
    if (recency.status === 'unknown') {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${recency.bgClass} ${recency.colorClass}`}
          title="Not yet verified by community"
        >
          <HelpCircle className="w-3 h-3" />
          Unverified
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${recency.bgClass} ${recency.colorClass}`}
        title={lastVerifiedAt ? `Verified ${formatDistanceToNow(new Date(lastVerifiedAt), { addSuffix: true })}` : 'Not verified'}
      >
        {getVerificationIcon(lastVerificationType)}
        {recency.daysAgo !== null && recency.daysAgo <= 7
          ? 'Just verified'
          : recency.daysAgo !== null && recency.daysAgo <= 30
          ? `${recency.daysAgo}d ago`
          : recency.daysAgo !== null
          ? `${Math.floor(recency.daysAgo / 30)}mo ago`
          : 'Unverified'}
      </span>
    );
  }

  // Full mode
  if (recency.status === 'unknown') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${recency.bgClass} ${recency.borderClass}`}
      >
        <HelpCircle className={`w-5 h-5 ${recency.colorClass}`} />
        <div className="text-sm">
          <div className={`font-medium ${recency.colorClass}`}>Needs Verification</div>
          <div className="text-neutral-500 text-xs">Be the first to verify this booth</div>
        </div>
      </div>
    );
  }

  const timeAgo = lastVerifiedAt
    ? formatDistanceToNow(new Date(lastVerifiedAt), { addSuffix: true })
    : '';

  const statusLabel = lastVerificationType
    ? VERIFICATION_TYPE_LABELS[lastVerificationType]
    : 'Verified';

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${recency.bgClass} ${recency.borderClass}`}
    >
      <div className={recency.colorClass}>
        {getVerificationIcon(lastVerificationType)}
      </div>
      <div className="text-sm">
        <div className={`font-medium ${recency.colorClass}`}>
          {statusLabel} {timeAgo}
        </div>
        {totalVerifications && totalVerifications > 1 && (
          <div className="text-neutral-500 text-xs">
            {totalVerifications} community verifications
          </div>
        )}
      </div>
    </div>
  );
}

// Inline version for use in cards or lists
export function VerificationBadgeInline({
  lastVerifiedAt,
  lastVerificationType,
}: {
  lastVerifiedAt?: string | null;
  lastVerificationType?: VerificationType | null;
}) {
  const recency = getRecencyStatus(lastVerifiedAt);

  if (recency.status === 'unknown') {
    return null; // Don't show anything for unverified booths in inline mode
  }

  const timeAgo = lastVerifiedAt
    ? formatDistanceToNow(new Date(lastVerifiedAt), { addSuffix: true })
    : '';

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${recency.colorClass}`}
      title={`Last verified ${timeAgo}${lastVerificationType ? ` as ${VERIFICATION_TYPE_LABELS[lastVerificationType]}` : ''}`}
    >
      {getVerificationIcon(lastVerificationType)}
      <span>{timeAgo}</span>
    </span>
  );
}
