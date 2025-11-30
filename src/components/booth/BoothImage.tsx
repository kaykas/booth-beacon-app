'use client';

import { Booth } from '@/types';
import Image from 'next/image';
import { Camera, Upload } from 'lucide-react';
import { useState } from 'react';
import { BoothPattern } from './BoothPattern';

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
  const [imageError, setImageError] = useState(false);

  // Robust URL check
  const isBrokenUnsplashUrl = booth.ai_preview_url?.includes('source.unsplash.com');
  const validPhotoUrl = booth.photo_exterior_url;
  const validAiUrl = !isBrokenUnsplashUrl ? booth.ai_preview_url : null;
  
  // Determine source
  const imageUrl = validPhotoUrl || validAiUrl;
  const isAiPreview = !!validAiUrl && !validPhotoUrl;
  
  // Use pattern if no image OR if image failed to load
  const usePattern = !imageUrl || imageError;

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
      className={`relative ${sizeClasses[size]} ${containerClasses[size]} overflow-hidden bg-neutral-100 group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {usePattern ? (
        // Fallback Pattern (Deterministic Art)
        <div className="w-full h-full relative">
          <BoothPattern boothId={booth.id} />
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
            src={imageUrl!}
            alt={booth.name}
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
          {isAiPreview && showAiBadge && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded backdrop-blur-sm font-medium tracking-wide">
              AI PREVIEW
            </div>
          )}
        </>
      )}

      {/* Add Photo Overlay */}
      {onAddPhoto && (
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={onAddPhoto}
            className="px-4 py-2 bg-white text-neutral-900 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-neutral-50 hover:scale-105 transition-all shadow-lg"
          >
            <Upload className="w-4 h-4" />
            {usePattern ? 'Add Photo' : 'Add Real Photo'}
          </button>
        </div>
      )}

      {/* Tooltip for AI Preview */}
      {isAiPreview && showAiBadge && isHovered && !usePattern && (
        <div className="absolute top-2 left-2 right-2 p-2 bg-black/75 text-white text-xs rounded backdrop-blur-sm">
          This is an AI-generated preview. Help us by adding a real photo!
        </div>
      )}
    </div>
  );
}