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

  // Check if AI preview URL is the broken Unsplash Source API
  const isBrokenUnsplashUrl = booth.ai_preview_url?.includes('source.unsplash.com');

  // Use photo_exterior_url, or ai_preview_url only if it's not broken
  const imageUrl = booth.photo_exterior_url || (!isBrokenUnsplashUrl ? booth.ai_preview_url : null);
  const hasAiPreview = booth.ai_preview_url && !booth.photo_exterior_url && !isBrokenUnsplashUrl;
  const hasNoImage = !imageUrl;

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

  // Ensure ID is safe string
  const safeId = typeof booth?.id === 'string' ? booth.id : 'unknown-booth';

  return (
    <div
      className={`relative ${sizeClasses[size]} ${containerClasses[size]} overflow-hidden bg-neutral-100 group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {usePattern ? (
        // Fallback Pattern (Deterministic Art)
        <div className="w-full h-full relative">
          <BoothPattern boothId={safeId} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/5">
            <div className="bg-white/90 p-3 rounded-full shadow-sm">
              <Camera className="w-6 h-6 text-neutral-400" />
            </div>
          </div>
        </div>
      ) : (
        // Real Image or Valid AI Preview
        <>
          <Image
            src={imageUrl || '/placeholder-booth.svg'} // Fallback string to satisfy types even if not rendered
            alt={booth.name || 'Photo Booth'}
            fill
            className={`object-cover transition-opacity duration-300 ${isAiPreview ? 'opacity-95' : 'opacity-100'}`}
            sizes={
              size === 'hero'
                ? '100vw'
                : size === 'card'
                ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                : '96px'
            }
            onError={() => setImageError(true)}
          />
}
