'use client';

import { Navigation, MapPin, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface StickyActionBarProps {
  boothName: string;
  latitude: number;
  longitude: number;
  hasValidLocation: boolean;
  locationString: string;
}

export function StickyActionBar({
  boothName,
  latitude,
  longitude,
  hasValidLocation,
  locationString,
}: StickyActionBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar after scrolling 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${boothName} - ${locationString}`,
          text: `Check out this photo booth: ${boothName}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  if (!hasValidLocation) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-lg transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{boothName}</h3>
            <p className="text-xs text-neutral-600 truncate">{locationString}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" asChild>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="w-4 h-4 mr-1" />
                Directions
              </a>
            </Button>
            <Button size="sm" variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
