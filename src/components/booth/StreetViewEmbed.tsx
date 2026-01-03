'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, ExternalLink, Navigation, AlertCircle, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StreetViewEmbedProps {
  latitude: number;
  longitude: number;
  boothName: string;
  boothId?: string;
  streetViewAvailable?: boolean | null;
  streetViewPanoramaId?: string | null;
  streetViewDistanceMeters?: number | null;
  streetViewHeading?: number | null;
  heading?: number;
  pitch?: number;
  fov?: number;
}

export function StreetViewEmbed({
  latitude,
  longitude,
  boothName,
  boothId,
  streetViewAvailable,
  streetViewPanoramaId,
  streetViewDistanceMeters,
  streetViewHeading,
  heading = 0,
  pitch = 10,
  fov = 90,
}: StreetViewEmbedProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check if validation indicates Street View is unavailable
  const isValidatedUnavailable = streetViewAvailable === false;

  // Show distance warning if panorama is >25m from booth
  const showDistanceWarning =
    streetViewDistanceMeters !== null &&
    streetViewDistanceMeters !== undefined &&
    streetViewDistanceMeters > 25;

  useEffect(() => {
    // Short loading delay for iframe
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [latitude, longitude, streetViewPanoramaId]);

  // Use panorama ID if available (more reliable than coordinates)
  // Otherwise fall back to coordinates
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const optimalHeading = streetViewHeading ?? heading;

  const streetViewUrl = streetViewPanoramaId
    ? `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&pano=${streetViewPanoramaId}&heading=${optimalHeading}&pitch=${pitch}&fov=${fov}`
    : `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${latitude},${longitude}&heading=${optimalHeading}&pitch=${pitch}&fov=${fov}`;

  // Fallback URL to open in Google Maps with Street View
  const fallbackUrl = `https://www.google.com/maps/@${latitude},${longitude},19z/data=!3m1!1e3`;

  // Direct link to open Street View in Google Maps at exact coordinates
  const openInMapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;

  // Handle report issue
  const handleReportIssue = () => {
    // TODO: Implement report issue functionality
    // This could open a modal or navigate to a report page
    console.log('Report issue for booth:', boothId);
    alert('Report functionality coming soon. Thank you for helping improve our data!');
  };

  // If validated as unavailable, show unavailable message
  if (isValidatedUnavailable) {
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
      {/* Distance Warning Alert */}
      {showDistanceWarning && streetViewDistanceMeters && (
        <Alert variant="default" className="rounded-none border-l-4 border-l-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Street View is approximately {Math.round(streetViewDistanceMeters)}m from the booth location.</strong>
            {' '}The view may not show the exact booth entrance. Use the map below for precise navigation.
          </AlertDescription>
        </Alert>
      )}

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
              {streetViewDistanceMeters && (
                <span className="ml-2 text-xs font-normal text-neutral-500">
                  (~{Math.round(streetViewDistanceMeters)}m away)
                </span>
              )}
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

        {/* Location Info and Report Button */}
        <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            Location: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReportIssue}
            className="h-6 text-xs"
          >
            <Flag className="w-3 h-3 mr-1" />
            Report Issue
          </Button>
        </div>
      </div>
    </Card>
  );
}
