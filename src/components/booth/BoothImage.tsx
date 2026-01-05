'use client';

import { Booth } from '@/types';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import { VintageBoothPlaceholder } from './VintageBoothPlaceholder';

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

  // Helper: Generate Street View URL from booth data
  const getStreetViewUrl = (): string | null => {
    if (!booth.street_view_available) return null;

    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) return null;

    // Size based on component size
    const sizeMap = {
      thumbnail: '200x200',
      card: '800x600',
      hero: '1200x800',
    };
    const imageSize = sizeMap[size];

    // Use panorama ID if available (most reliable)
    if (booth.street_view_panorama_id) {
      return `https://maps.googleapis.com/maps/api/streetview?size=${imageSize}&pano=${booth.street_view_panorama_id}&heading=${booth.street_view_heading || 0}&pitch=0&fov=90&key=${googleApiKey}`;
    }

    // Fallback to coordinates
    if (booth.latitude && booth.longitude) {
      return `https://maps.googleapis.com/maps/api/streetview?size=${imageSize}&location=${booth.latitude},${booth.longitude}&heading=${booth.street_view_heading || 0}&pitch=0&fov=90&key=${googleApiKey}`;
    }

    return null;
  };

  // Priority: photo_exterior_url > Street View > ai_generated_image_url > ai_preview_url
  const streetViewUrl = getStreetViewUrl();
  const imageUrl = booth.photo_exterior_url
    || streetViewUrl
    || booth.ai_generated_image_url
    || (!isBrokenUnsplashUrl ? booth.ai_preview_url : null);

  const hasStreetView = !!streetViewUrl && !booth.photo_exterior_url;
  const hasAiGenerated = booth.ai_generated_image_url && !booth.photo_exterior_url && !streetViewUrl;
  const hasAiPreview = booth.ai_preview_url && !booth.photo_exterior_url && !booth.ai_generated_image_url && !streetViewUrl && !isBrokenUnsplashUrl;
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
      className={`relative ${sizeClasses[size]} ${containerClasses[size]} overflow-hidden ${size === 'hero' ? 'photo-strip-border-no-radius' : 'photo-strip-border'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {hasNoImage ? (
        // Vintage booth placeholder
        <VintageBoothPlaceholder
          onAddPhoto={onAddPhoto}
          showUploadButton={!!onAddPhoto}
        />
      ) : (
        // Image with optional AI badge - add sepia filter to AI images
        <div className={`relative w-full h-full ${(hasAiGenerated || hasAiPreview) ? 'ai-image-sepia' : ''}`}>
          <Image
            src={imageUrl}
            alt={`${booth.name} - Classic analog photo booth located in ${booth.city}${booth.state ? `, ${booth.state}` : ''}, ${booth.country}. ${
              hasStreetView ? 'Street View of venue exterior.' :
              hasAiGenerated ? 'AI-generated artistic visualization.' :
              hasAiPreview ? 'AI preview image.' :
              'Real community-submitted photo.'
            }`}
            fill
            className="object-cover transition-opacity"
            sizes={
              size === 'hero'
                ? '100vw'
                : size === 'card'
                ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                : '96px'
            }
            onError={() => setHasImageError(true)}
          />
          {/* Photo Source Badge */}
          {showAiBadge && (
            <>
              {booth.photo_exterior_url && !hasAiGenerated && !hasAiPreview && !hasStreetView && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-green-600/90 text-white text-xs rounded backdrop-blur-sm flex items-center gap-1 shadow-sm z-10">
                  <span className="text-[10px]">📸</span> Community Photo
                </div>
              )}
              {hasStreetView && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-blue-600/90 text-white text-xs rounded backdrop-blur-sm flex items-center gap-1 shadow-sm z-10">
                  <span className="text-[10px]">🗺️</span> Street View
                </div>
              )}
              {hasAiGenerated && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-purple-600/90 text-white text-xs rounded backdrop-blur-sm flex items-center gap-1 shadow-sm z-10">
                  <span className="text-[10px]">🤖</span> AI Generated
                </div>
              )}
              {hasAiPreview && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded backdrop-blur-sm shadow-sm z-10">
                  AI Preview
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Add Photo Overlay */}
      {onAddPhoto && isHovered && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity">
          <button
            onClick={onAddPhoto}
            className="px-4 py-2 bg-white text-neutral-900 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-neutral-100 transition"
            aria-label={hasNoImage ? `Add photo for ${booth.name}` : `Add real photo for ${booth.name} to replace AI-generated image`}
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            {hasNoImage ? 'Add Photo' : 'Add Real Photo'}
          </button>
        </div>
      )}

      {/* Tooltip for AI-Generated Art */}
      {hasAiGenerated && showAiBadge && isHovered && (
        <div className="absolute top-2 left-2 right-2 p-2 bg-purple-800/85 text-white text-xs rounded backdrop-blur-sm">
          Artistic AI-generated visualization of this location. Help us by adding a real photo!
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
