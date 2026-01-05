'use client';

import { useEffect, useRef } from 'react';
import { Booth } from '@/types';

interface StreetViewEmbedProps {
  booth: Booth;
  className?: string;
}

export function StreetViewEmbed({ booth, className = '' }: StreetViewEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!booth.street_view_available) return;

    // Load Google Maps JavaScript API
    const loadGoogleMaps = () => {
      return new Promise<void>((resolve, reject) => {
        if (typeof google !== 'undefined' && google.maps) {
          resolve();
          return;
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          reject(new Error('Google Maps API key not found'));
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps'));
        document.head.appendChild(script);
      });
    };

    loadGoogleMaps()
      .then(() => {
        if (!containerRef.current) return;

        // Initialize Street View
        const panorama = new google.maps.StreetViewPanorama(containerRef.current, {
          // Use panorama ID if available (most reliable)
          pano: booth.street_view_panorama_id || undefined,
          // Fallback to position
          position: booth.street_view_panorama_id
            ? undefined
            : { lat: booth.latitude!, lng: booth.longitude! },
          // Set heading to face the booth
          pov: {
            heading: booth.street_view_heading || 0,
            pitch: 0,
          },
          zoom: 1,
          // UI controls
          addressControl: false,
          linksControl: true,
          panControl: true,
          enableCloseButton: false,
          zoomControl: true,
          fullscreenControl: true,
          motionTracking: false,
          motionTrackingControl: false,
        });

        panoramaRef.current = panorama;
      })
      .catch((error) => {
        console.error('Failed to load Street View:', error);
      });

    // Cleanup
    return () => {
      panoramaRef.current = null;
    };
  }, [booth]);

  if (!booth.street_view_available) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 ${className}`}>
        <div className="text-center text-neutral-500">
          <p className="text-lg font-medium">Street View Not Available</p>
          <p className="text-sm mt-2">No Street View imagery found for this location</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: '400px' }}
    />
  );
}
