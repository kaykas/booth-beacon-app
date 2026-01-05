'use client';

import { CheckCircle, AlertCircle, Clock, Banknote, CreditCard } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StatusBarProps {
  // Status
  status?: string;
  needsVerification?: boolean;
  lastVerified?: string | null;

  // Hours
  hours?: string | null;

  // Cost & Payment
  cost?: string | null;
  acceptsCash?: boolean;
  acceptsCard?: boolean;
}

function isOpenNow(hours: string): boolean {
  if (!hours) return false;

  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = dayNames[now.getDay()];

  const lines = hours.split('\n');
  const todayLine = lines.find(line => line.startsWith(today));

  if (!todayLine) return false;
  if (todayLine.includes('Closed')) return false;
  if (todayLine.includes('Open 24 hours')) return true;

  return true; // Simplified - assume open if has hours
}

function isRecentlyVerified(lastVerified: string): boolean {
  const verifiedDate = new Date(lastVerified);
  const daysSince = (Date.now() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= 30;
}

export function StatusBar({
  status,
  needsVerification,
  lastVerified,
  hours,
  cost,
  acceptsCash,
  acceptsCard,
}: StatusBarProps) {
  const isOpen = hours && isOpenNow(hours);
  const isRecentVerified = lastVerified && isRecentlyVerified(lastVerified);
  const isClosedOrInvalid = status === 'closed' || status === 'permanently_closed' || status === 'invalid';

  return (
    <div className="space-y-3">
      {/* Verification Badge */}
      {isRecentVerified && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border-2 border-green-500 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-green-900 font-semibold text-sm">
            Verified {formatDistanceToNow(new Date(lastVerified), { addSuffix: true })}
          </span>
        </div>
      )}

      {/* Main Status Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Operational Status */}
        {isClosedOrInvalid ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-md">
            <AlertCircle className="w-4 h-4" />
            Unverified - Use Caution
          </span>
        ) : status === 'active' && !needsVerification ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-md">
            <CheckCircle className="w-4 h-4" />
            Currently Operational
          </span>
        ) : (status === 'unverified' || needsVerification) && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm font-semibold rounded-md">
            <AlertCircle className="w-4 h-4" />
            Needs Verification
          </span>
        )}

        {/* Open/Closed Status */}
        {isOpen && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-md">
            <Clock className="w-4 h-4" />
            Open Now
          </span>
        )}

        {/* Cost */}
        {cost && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm font-bold rounded-md">
            {cost} per strip
          </span>
        )}

        {/* Payment Methods */}
        {acceptsCash && !acceptsCard && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 text-white text-sm font-semibold rounded-md">
            <Banknote className="w-4 h-4" />
            Cash Only
          </span>
        )}
        {acceptsCard && !acceptsCash && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white text-sm font-semibold rounded-md">
            <CreditCard className="w-4 h-4" />
            Card Only
          </span>
        )}
        {acceptsCash && acceptsCard && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white text-sm font-semibold rounded-md">
            <Banknote className="w-4 h-4" />
            <CreditCard className="w-4 h-4" />
            Cash & Card
          </span>
        )}
      </div>
    </div>
  );
}
