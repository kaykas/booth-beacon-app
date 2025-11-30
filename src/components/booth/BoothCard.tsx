'use client';

import { Booth } from '@/types';
import { MapPin, Camera, Navigation, ShieldCheck, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistance } from '@/lib/distanceUtils';
import { BookmarkButton } from '@/components/BookmarkButton';

interface BoothCardProps {
  booth: Booth;
  variant?: 'default' | 'compact' | 'featured';
  showDistance?: boolean;
  onDirections?: () => void;
}

export function BoothCard({
  booth,
  variant: _variant = 'default',
  showDistance = false,
  onDirections: _onDirections,
}: BoothCardProps) {
  const statusColors = {
    active: 'bg-green-500 text-white',
    unverified: 'bg-amber-500 text-white',
    inactive: 'bg-gray-400 text-white',
    closed: 'bg-red-500 text-white',
  };

  // Check if AI preview URL is the broken Unsplash Source API
  const isBrokenUnsplashUrl = booth.ai_preview_url?.includes('source.unsplash.com');

  // Use photo_exterior_url, or ai_preview_url only if it's not broken
  const imageUrl = booth.photo_exterior_url || (!isBrokenUnsplashUrl ? booth.ai_preview_url : null) || '/placeholder-booth.svg';
  const hasAiPreview = booth.ai_preview_url && !booth.photo_exterior_url && !isBrokenUnsplashUrl;
  const verificationLabel =
    booth.verification_badge ||
    (booth.verification_level === 'official'
      ? 'Official source verified'
      : booth.verification_level === 'trusted'
      ? 'Trusted operator verified'
      : booth.verification_level === 'community'
      ? 'Community confirmed'
      : booth.last_verified || booth.source_verified_date
      ? 'Recently verified'
      : undefined);
  const verifiedDate = booth.last_verified || booth.source_verified_date || booth.last_checked_at;
  const primarySource = booth.primary_source || booth.source_primary;

  return (
    <div className="group relative bg-white rounded-lg shadow-photo overflow-hidden transition-transform hover:scale-[1.02]">
      {/* Bookmark button overlay */}
      <div className="absolute top-2 right-2 z-10">
        <BookmarkButton boothId={booth.id} variant="outline" size="sm" showText={false} />
      </div>

      {/* Image */}
      <Link href={`/booth/${booth.slug}`}>
        <div className="aspect-[4/3] relative bg-neutral-100">
          <Image
            src={imageUrl}
            alt={booth.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {hasAiPreview && (
            <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
              AI Preview
            </span>
          )}
          <span className={`absolute top-2 left-2 px-2 py-1 text-xs rounded ${statusColors[booth.status]}`}>
            {booth.status.charAt(0).toUpperCase() + booth.status.slice(1)}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/booth/${booth.slug}`}>
          <h3 className="font-display text-lg font-medium text-neutral-900 truncate hover:text-primary transition">
            {booth.name}
          </h3>
        </Link>

        <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          {booth.city}, {booth.country}
        </p>

        {showDistance && 'distance' in booth && booth.distance !== undefined && (
          <p className="text-sm text-primary font-medium flex items-center gap-1 mt-1">
            <Navigation className="w-4 h-4 flex-shrink-0" />
            {formatDistance(booth.distance as number)}
          </p>
        )}

        {booth.machine_model && (
          <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
            <Camera className="w-4 h-4 flex-shrink-0" />
            {booth.machine_model}
          </p>
        )}

        {(verificationLabel || primarySource) && (
          <div className="mt-3 space-y-1 text-xs text-neutral-600">
            {verificationLabel && (
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 font-medium">
                <ShieldCheck className="w-3 h-3" />
                {verificationLabel}
              </div>
            )}
            {verifiedDate && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span className="text-[11px]">
                  Last checked {new Date(verifiedDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {primarySource && (
              <p className="text-[11px] text-neutral-500">Primary source: {primarySource}</p>
            )}
          </div>
        )}

        {booth.photo_type && (
          <span className="inline-block mt-2 px-2 py-1 text-xs bg-secondary rounded">
            {booth.photo_type === 'black-and-white' ? 'B&W' : booth.photo_type === 'color' ? 'Color' : 'B&W & Color'}
          </span>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/booth/${booth.slug}`}
            className="flex-1 px-4 py-2 bg-primary text-white text-sm font-medium rounded hover:bg-primary-dark transition text-center"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
