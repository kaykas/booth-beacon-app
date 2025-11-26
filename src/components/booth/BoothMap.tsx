'use client';

import { useEffect, useRef, useState } from 'react';
import { Booth, Coordinates } from '@/types';
import { MapPin, Loader2 } from 'lucide-react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

interface BoothMapProps {
  booths: Booth[];
  center?: Coordinates;
  zoom?: number;
  onBoothClick?: (booth: Booth) => void;
  showClustering?: boolean;
  showUserLocation?: boolean;
}

// Custom map styling - warm, muted tones per PRD
const mapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ saturation: -20 }, { lightness: 10 }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#E8E0D4' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#F5F0E8' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

// Marker colors based on booth status
const statusColors = {
  active: '#22C55E',
  inactive: '#EF4444',
  unverified: '#F59E0B',
  closed: '#9CA3AF',
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

  // Initialize Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      setIsLoading(false);
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps script with marker clustering library
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    script.onerror = () => {
      console.error('Error loading Google Maps');
      setError('Failed to load Google Maps');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    function initializeMap() {
      if (!mapRef.current) return;

      try {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          styles: mapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: 'greedy',
        });

        setMap(mapInstance);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
        setIsLoading(false);
      }
    }
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

  // Get user location
  useEffect(() => {
    if (!showUserLocation) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userPos);

          // Add user location marker
          if (map) {
            new google.maps.Marker({
              position: userPos,
              map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#C73E3A',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
                scale: 10,
              },
              title: 'Your location',
            });
          }
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }
  }, [map, showUserLocation]);

  // Center on user location
  const centerOnUser = () => {
    if (!map || !userLocation) return;
    map.panTo(userLocation);
    map.setZoom(14);
  };

  if (error) {
    return (
      <div className="w-full h-full min-h-[500px] bg-neutral-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-neutral-500">
          <MapPin className="w-12 h-12 mb-4 text-error mx-auto" />
          <p className="text-lg font-medium">{error}</p>
          <p className="text-sm mt-2">Please check your environment configuration</p>
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
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="text-center text-neutral-500">
            <Loader2 className="w-12 h-12 mb-4 text-primary mx-auto animate-spin" />
            <p className="text-lg font-medium">Loading map...</p>
          </div>
        </div>
      )}

      {/* User location button */}
      {showUserLocation && !isLoading && (
        <button
          onClick={centerOnUser}
          className="absolute top-4 right-4 p-3 bg-white shadow-lg rounded-lg hover:bg-neutral-50 transition"
          title="Find my location"
          disabled={!userLocation}
        >
          <MapPin className={`w-5 h-5 ${userLocation ? 'text-primary' : 'text-neutral-400'}`} />
        </button>
      )}

      {/* Booth count indicator */}
      {!isLoading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white shadow-lg rounded-full text-sm">
          <span className="font-medium text-neutral-900">{booths.length}</span>
          <span className="text-neutral-500 ml-1">
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
