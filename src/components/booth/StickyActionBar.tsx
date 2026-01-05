'use client';

import { Navigation, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { BookmarkButton } from '@/components/BookmarkButton';

interface StickyActionBarProps {
  boothId: string;
  boothName: string;
  latitude: number;
  longitude: number;
  hasValidLocation: boolean;
  locationString: string;
}

export function StickyActionBar({
  boothId,
  boothName,
  latitude,
  longitude,
  hasValidLocation,
  locationString,
}: StickyActionBarProps) {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    // Trigger slide-up animation after component mounts
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 300); // Delay to ensure smooth entrance

    return () => clearTimeout(timer);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${boothName} - ${locationString}`,
          text: `Check out this photo booth: ${boothName}`,
          url: window.location.href,
        });
      } catch (_err) {
        // User cancelled or share failed
      }
    }
  };

  if (!hasValidLocation) return null;

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-white border-t-2 border-neutral-200
        shadow-[0_-4px_20px_rgba(0,0,0,0.1)]
        transition-transform duration-500 ease-out
        lg:hidden
        ${isAnimated ? 'translate-y-0' : 'translate-y-full'}
      `}
      style={{
        // Add safe area padding for mobile devices with notches/home indicators
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="max-w-lg mx-auto px-4 py-2.5">
        <div className="flex items-center gap-2">
          {/* Primary CTA - Get Directions (70% width) */}
          <Button
            size="default"
            className="flex-[0_0_70%] bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-200"
            asChild
          >
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </a>
          </Button>

          {/* Secondary Actions - Bookmark & Share (30% width split) */}
          <div className="flex-1 flex gap-2">
            {/* Bookmark Button */}
            <BookmarkButton
              boothId={boothId}
              variant="outline"
              size="default"
              showText={false}
            />

            {/* Share Button */}
            <Button
              size="default"
              variant="outline"
              onClick={handleShare}
              className="flex-1"
              aria-label="Share this booth"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
