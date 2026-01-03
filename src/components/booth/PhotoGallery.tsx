'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn, Users } from 'lucide-react';

interface PhotoGalleryProps {
  photos: string[];
  boothName: string;
  communityPhotosCount?: number;
}

export function PhotoGallery({ photos, boothName, communityPhotosCount = 0 }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [lightboxOpen]);

  if (photos.length === 0) return null;

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Calculate if a photo is from the community (last N photos)
  const isCommunityPhoto = (index: number) => {
    if (communityPhotosCount === 0) return false;
    return index >= photos.length - communityPhotosCount;
  };

  return (
    <>
      {/* Community Photos Info */}
      {communityPhotosCount > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm text-neutral-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <Users className="w-4 h-4 text-blue-600" />
          <span>
            <span className="font-medium text-blue-700">{communityPhotosCount}</span> photo{communityPhotosCount > 1 ? 's' : ''} contributed by the community
          </span>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((url, i) => (
          <button
            key={i}
            onClick={() => openLightbox(i)}
            className="relative aspect-square bg-neutral-200 rounded-lg overflow-hidden group cursor-pointer"
          >
            <Image
              src={url}
              alt={`${boothName} photo ${i + 1}`}
              fill
              className="object-cover transition-transform group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            {isCommunityPhoto(i) && (
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Users className="w-3 h-3" />
                <span>Community</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* Image */}
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] p-4">
            <Image
              src={photos[currentIndex]}
              alt={`${boothName} photo ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Counter */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm">
              {currentIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
