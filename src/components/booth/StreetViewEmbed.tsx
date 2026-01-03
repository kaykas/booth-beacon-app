'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
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
  pitch = 10,
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

  // Use the booth's actual coordinates for Street View
  // The embed API automatically finds the nearest Street View panorama
  const streetViewUrl = `https://www.google.com/maps/embed/v1/streetview?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&location=${latitude},${longitude}&heading=${heading}&pitch=${pitch}&fov=${fov}`;

  // Fallback URL to open in Google Maps with Street View at the booth's location
  const fallbackUrl = `https://www.google.com/maps/@${latitude},${longitude},19z/data=!3m1!1e3`;

  // Direct link to open Street View in Google Maps at exact coordinates
  const openInMapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;

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
    <Card className="overflow-hidden shadow-md">
      <div className="relative w-full h-[400px] bg-neutral-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
            <div className="text-neutral-600 text-sm font-medium">Loading Street View...</div>
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
          title={`Street View of ${boothName} at ${latitude}, ${longitude}`}
          onError={() => {
            setIsAvailable(false);
            setIsLoading(false);
          }}
          onLoad={() => setIsLoading(false)}
        />
      </div>
      {/* Enhanced Footer with Better Contrast and Actions */}
      <div className="p-4 bg-white border-t-2 border-neutral-200">
        <div className="flex items-center justify-between gap-4">
          {/* Left Side - Street View Label with High Contrast */}
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-neutral-700" />
            <p className="text-sm font-semibold text-neutral-900">
              360° Street View
            </p>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="h-8">
              <a
                href={openInMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Open in Maps
              </a>
            </Button>
          </div>
        </div>

        {/* Location Coordinates Footer Info */}
        <div className="mt-2 pt-2 border-t border-neutral-100">
          <p className="text-xs text-neutral-500">
            Location: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        </div>
      </div>
    </Card>
  );
}
