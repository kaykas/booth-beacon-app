'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StreetViewEmbedProps {
  latitude: number;
  longitude: number;
  boothName: string;
  heading?: number;
  pitch?: number;
  fov?: number;
}

export function StreetViewEmbed({
  latitude,
  longitude,
  boothName,
  heading = 0,
  pitch = 0,
  fov = 90,
}: StreetViewEmbedProps) {
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Check if Street View is available for this location
    // Note: This is a basic check. In production, you'd want to use Google's API
    // to check StreetViewService.getPanorama() availability
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [latitude, longitude]);

  const streetViewUrl = `https://www.google.com/maps/embed/v1/streetview?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&location=${latitude},${longitude}&heading=${heading}&pitch=${pitch}&fov=${fov}`;

  const fallbackUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}&heading=${heading}&pitch=${pitch}&fov=${fov}`;

  if (!isAvailable && !isLoading) {
    return (
      <Card className="p-6 bg-neutral-50 text-center">
        <MapPin className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
        <h3 className="font-semibold text-neutral-700 mb-2">
          Street View Not Available
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          Google Street View imagery is not available for this exact location
        </p>
        <Button variant="outline" size="sm" asChild>
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Google Maps
          </a>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative w-full h-[400px] bg-neutral-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-neutral-500 text-sm">Loading Street View...</div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={streetViewUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Street View of ${boothName}`}
          onError={() => {
            setIsAvailable(false);
            setIsLoading(false);
          }}
          onLoad={() => setIsLoading(false)}
        />
      </div>
      <div className="p-4 bg-white border-t border-neutral-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            360° Street View
          </p>
          <Button variant="ghost" size="sm" asChild>
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Open in Maps
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
