'use client';

import { Booth } from '@/types';
import { MapPin, Camera, Navigation } from 'lucide-react';
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
  variant = 'default',
  showDistance = false,
  onDirections,
}: BoothCardProps) {
  const statusColors = {
    active: 'bg-green-500 text-white',
    unverified: 'bg-amber-500 text-white',
    inactive: 'bg-gray-400 text-white',
    closed: 'bg-red-500 text-white',
  };

  const imageUrl = booth.photo_exterior_url || booth.ai_preview_url || '/placeholder-booth.jpg';
  const hasAiPreview = booth.ai_preview_url && !booth.photo_exterior_url;

  return (
    <div className="group relative bg-white rounded-lg shadow-photo overflow-hidden transition-transform hover:scale-[1.02]">
      {/* Bookmark button overlay */}
      <div className="absolute top-2 right-2 z-10">
        <BookmarkButton boothId={booth.id} variant="outline" size="sm" showText={false} />
      </div>

      {/* Image */}
      <Link href={`/booth/${booth.id}`}>
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
        <Link href={`/booth/${booth.id}`}>
          <h3 className="font-display text-lg font-medium text-neutral-900 truncate hover:text-primary transition">
            {booth.name}
          </h3>
        </Link>

        <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          {booth.city}, {booth.country}
        </p>

        {showDistance && (booth as any).distance !== undefined && (
          <p className="text-sm text-primary font-medium flex items-center gap-1 mt-1">
            <Navigation className="w-4 h-4 flex-shrink-0" />
            {formatDistance((booth as any).distance)}
          </p>
        )}

        {booth.machine_model && (
          <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
            <Camera className="w-4 h-4 flex-shrink-0" />
            {booth.machine_model}
          </p>
        )}

        {booth.photo_type && (
          <span className="inline-block mt-2 px-2 py-1 text-xs bg-secondary rounded">
            {booth.photo_type === 'black-and-white' ? 'B&W' : booth.photo_type === 'color' ? 'Color' : 'B&W & Color'}
          </span>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/booth/${booth.id}`}
            className="flex-1 px-4 py-2 bg-primary text-white text-sm font-medium rounded hover:bg-primary-dark transition text-center"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
