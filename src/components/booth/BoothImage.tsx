'use client';

import { Booth } from '@/types';
import Image from 'next/image';
import { Camera, Upload } from 'lucide-react';
import { useState } from 'react';

interface BoothImageProps {
  booth: Booth;
  size?: 'thumbnail' | 'card' | 'hero';
  showAiBadge?: boolean;
  onAddPhoto?: () => void;
}

export function BoothImage({
  booth,
  size = 'card',
  showAiBadge = true,
  onAddPhoto,
}: BoothImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  // Check if AI preview URL is the broken Unsplash Source API
  const isBrokenUnsplashUrl = booth.ai_preview_url?.includes('source.unsplash.com');

  // Use photo_exterior_url, or ai_preview_url only if it's not broken
  const imageUrl = booth.photo_exterior_url || (!isBrokenUnsplashUrl ? booth.ai_preview_url : null);
  const hasAiPreview = booth.ai_preview_url && !booth.photo_exterior_url && !isBrokenUnsplashUrl;
  const hasNoImage = !imageUrl || hasImageError;

  const sizeClasses = {
    thumbnail: 'w-24 h-24',
    card: 'aspect-[4/3] w-full',
    hero: 'aspect-[16/9] w-full',
  };

  const containerClasses = {
    thumbnail: 'rounded-md',
    card: 'rounded-lg',
    hero: 'rounded-xl',
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} ${containerClasses[size]} overflow-hidden bg-neutral-100`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {hasNoImage ? (
        // No image placeholder
        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
          <Camera className="w-8 h-8 mb-2" />
          <p className="text-xs">No photo yet</p>
        </div>
      ) : (
        // Image with optional AI badge
        <>
          <Image
            src={imageUrl}
            alt={booth.name}
            fill
            className={`object-cover transition-opacity ${hasAiPreview ? 'opacity-95' : 'opacity-100'}`}
            sizes={
              size === 'hero'
                ? '100vw'
                : size === 'card'
                ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                : '96px'
            }
            onError={() => setHasImageError(true)}
          />
          {hasAiPreview && showAiBadge && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded backdrop-blur-sm">
              AI Preview
            </div>
          )}
        </>
      )}

      {/* Add Photo Overlay */}
      {onAddPhoto && isHovered && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity">
          <button
            onClick={onAddPhoto}
            className="px-4 py-2 bg-white text-neutral-900 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-neutral-100 transition"
          >
            <Upload className="w-4 h-4" />
            {hasNoImage ? 'Add Photo' : 'Add Real Photo'}
          </button>
        </div>
      )}

      {/* Tooltip for AI Preview */}
      {hasAiPreview && showAiBadge && isHovered && (
        <div className="absolute top-2 left-2 right-2 p-2 bg-black/75 text-white text-xs rounded backdrop-blur-sm">
          This is an AI-generated preview. Help us by adding a real photo!
        </div>
      )}
    </div>
  );
}
