'use client';

import { useEffect, useRef, useState } from 'react';
import { Booth, Coordinates } from '@/types';
import { MapPin, Loader2 } from 'lucide-react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';

interface BoothMapProps {
  booths: Booth[];
  center?: Coordinates;
  zoom?: number;
  onBoothClick?: (booth: Booth) => void;
  showClustering?: boolean;
  showUserLocation?: boolean;
}

// Dark map styling - sophisticated nightclub aesthetic
const mapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ saturation: -100 }, { lightness: -50 }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#e8dfd5' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a1a1a' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0f0f0f' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#1a1a1a' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2a2a2a' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca3af' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d14371' }, { weight: 0.5 }],
  },
];

// Marker colors based on booth status - pink theme
const statusColors = {
  active: '#d14371', // Pink for active booths
  inactive: '#EF4444',
  unverified: '#F59E0B',
  closed: '#6B7280',
};

export function BoothMap({
  booths,
  center = { lat: 40.7128, lng: -74.0060 }, // Default to NYC
  zoom = 12,
  onBoothClick,
  showClustering = true,
  showUserLocation = false,
}: BoothMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [markerClusterer, setMarkerClusterer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  // Initialize Google Maps using robust loader
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsLoading(true);
        await loadGoogleMaps();

        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          styles: mapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          gestureHandling: 'greedy',
        });

        setMap(mapInstance);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Google Maps');
        setIsLoading(false);
      }
    };

    initMap();
  }, [center, zoom]);

  // Create markers for booths
  useEffect(() => {
    if (!map || booths.length === 0) return;

    // Clear existing markers and clusterer
    markers.forEach((marker) => marker.setMap(null));
    if (markerClusterer) {
      markerClusterer.clearMarkers();
    }

    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();

    booths.forEach((booth) => {
      if (!booth.latitude || !booth.longitude) return;

      const position = { lat: booth.latitude, lng: booth.longitude };
      bounds.extend(position);

      // Create custom marker
      const marker = new google.maps.Marker({
        position,
        map: showClustering ? null : map, // Don't add to map if clustering
        title: booth.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: statusColors[booth.status] || statusColors.unverified,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8,
        },
      });

      // Create InfoWindow content
      const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(booth),
      });

      // Add click listener
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        if (onBoothClick) {
          onBoothClick(booth);
        }
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Add marker clustering if enabled
    if (showClustering && newMarkers.length > 0) {
      const clusterer = new MarkerClusterer({
        map,
        markers: newMarkers,
      });
      setMarkerClusterer(clusterer);
    }

    // Fit map to show all booths if we have multiple
    if (booths.length > 1) {
      map.fitBounds(bounds);
    }

    // Cleanup function
    return () => {
      if (markerClusterer) {
        markerClusterer.clearMarkers();
      }
    };
  }, [map, booths, onBoothClick, showClustering]);

  // Get user location (only once when component mounts)
  useEffect(() => {
    if (!showUserLocation || !map) return;
    if (userLocation) return; // Don't ask again if we already have it

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userPos);

          // Clean up existing marker if any
          if (userMarkerRef.current) {
            userMarkerRef.current.setMap(null);
          }

          // Add user location marker
          userMarkerRef.current = new google.maps.Marker({
            position: userPos,
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#d14371',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 10,
            },
            title: 'Your location',
            zIndex: 1000,
          });
        },
        (error) => {
          console.log('User denied location or error:', error.message);
          // Silently fail - user chose not to share location
        }
      );
    }

    // Cleanup function
    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }
    };
  }, [map, showUserLocation, userLocation]);

  // Center on user location
  const centerOnUser = () => {
    if (!map || !userLocation) return;
    map.panTo(userLocation);
    map.setZoom(14);
  };

  if (error) {
    return (
      <div className="w-full h-full min-h-[500px] bg-card border border-primary/10 rounded-lg flex items-center justify-center">
        <div className="text-center text-muted-foreground max-w-md px-6">
          <MapPin className="w-12 h-12 mb-4 text-primary mx-auto" />
          <p className="text-lg font-medium text-foreground mb-2">Map Unavailable</p>
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-4 text-muted-foreground/70">
            The NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable needs to be configured.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[500px] relative overflow-hidden rounded-lg">
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/95 backdrop-blur-sm">
          <div className="text-center text-muted-foreground">
            <Loader2 className="w-12 h-12 mb-4 text-primary mx-auto animate-spin" />
            <p className="text-lg font-medium text-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* User location button */}
      {showUserLocation && !isLoading && (
        <button
          onClick={centerOnUser}
          className="absolute top-4 right-4 z-[1000] p-3 bg-card border border-primary/20 shadow-glow rounded-lg hover:bg-card/80 hover:shadow-glow-strong transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Find my location"
          disabled={!userLocation}
        >
          <MapPin className={`w-5 h-5 ${userLocation ? 'text-primary' : 'text-muted-foreground'}`} />
        </button>
      )}

      {/* Booth count indicator */}
      {!isLoading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 bg-card/95 backdrop-blur-sm border border-primary/20 shadow-glow rounded-full text-sm">
          <span className="font-medium text-foreground">{booths.length}</span>
          <span className="text-muted-foreground ml-1">
            {booths.length === 1 ? 'booth' : 'booths'}
          </span>
        </div>
      )}
    </div>
  );
}

// Helper function to create InfoWindow content
function createInfoWindowContent(booth: Booth): string {
  const photoUrl = booth.photo_exterior_url || booth.ai_preview_url || '/placeholder-booth.jpg';
  const machineInfo = booth.machine_model
    ? `${booth.machine_model} • ${booth.booth_type || 'analog'}`
    : booth.booth_type || 'Unknown type';

  return `
    <div style="max-width: 280px; font-family: Inter, sans-serif;">
      <img
        src="${photoUrl}"
        alt="${booth.name}"
        style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;"
      />
      <h3 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600; color: #1A1A1A;">
        ${booth.name}
      </h3>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #737373;">
        ${booth.city || 'Unknown'}, ${booth.country || 'Unknown'}
      </p>
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #404040;">
        ${machineInfo}
      </p>
      <a
        href="/booth/${booth.id}"
        style="display: inline-block; padding: 8px 16px; background: #C73E3A; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;"
      >
        View Details
      </a>
    </div>
  `;
}
