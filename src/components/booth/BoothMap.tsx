'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
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
  externalUserLocation?: Coordinates | null; // Pass user location from parent to avoid duplicate geolocation requests
  autoCenterOnUser?: boolean;
}

// Default center coordinates (NYC)
const DEFAULT_CENTER = { lat: 40.7128, lng: -74.0060 };
const DEFAULT_ZOOM = 12;

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
  center,
  zoom,
  onBoothClick,
  showClustering = true,
  showUserLocation = false,
  externalUserLocation,
  autoCenterOnUser = false,
}: BoothMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const markerClustererRef = useRef<MarkerClusterer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalUserLocation, setInternalUserLocation] = useState<Coordinates | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const isInitializedRef = useRef(false);

  // Use external location if provided, otherwise use internal state
  const userLocation = externalUserLocation ?? internalUserLocation;

  // Memoize center and zoom to prevent unnecessary re-renders
  const stableCenter = useMemo(() => ({
    lat: center?.lat ?? DEFAULT_CENTER.lat,
    lng: center?.lng ?? DEFAULT_CENTER.lng
  }), [center?.lat, center?.lng]);
  const stableZoom = useMemo(() => zoom ?? DEFAULT_ZOOM, [zoom]);

  // Initialize Google Maps using robust loader - only once
  useEffect(() => {
    // Prevent re-initialization
    if (isInitializedRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        isInitializedRef.current = true;
        setIsLoading(true);
        await loadGoogleMaps();

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: stableCenter,
          zoom: stableZoom,
          styles: mapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          gestureHandling: 'greedy',
        });

        mapInstanceRef.current = mapInstance;
        setMap(mapInstance);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Google Maps');
        setIsLoading(false);
        isInitializedRef.current = false; // Allow retry on error
      }
    };

    initMap();
  }, [stableCenter, stableZoom]);

  // Create markers for booths
  // Performance optimized: markers only created when map or booths change
  // Clustering handles 100+ markers efficiently with custom renderer
  useEffect(() => {
    if (!map || booths.length === 0) return;

    // Clear existing markers and clusterer
    markersRef.current.forEach((marker) => marker.setMap(null));
    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
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

    markersRef.current = newMarkers;

    // Add marker clustering if enabled
    if (showClustering && newMarkers.length > 0) {
      const clusterer = new MarkerClusterer({
        map,
        markers: newMarkers,
        renderer: {
          render: ({ count, position }) => {
            // Custom cluster styling with pink theme
            const color = count > 50 ? '#d14371' : count > 20 ? '#e75480' : '#f06595';
            const size = count > 50 ? 60 : count > 20 ? 50 : 40;

            return new google.maps.Marker({
              position,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: color,
                fillOpacity: 0.9,
                strokeColor: '#ffffff',
                strokeWeight: 3,
                scale: size / 2,
              },
              label: {
                text: String(count),
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 'bold',
              },
              zIndex: 1000 + count,
            });
          },
        },
      });
      markerClustererRef.current = clusterer;
    }

    // Fit map to show all booths if we have multiple
    if (booths.length > 1) {
      map.fitBounds(bounds);
    }

    // Cleanup function
    return () => {
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
      }
    };
  }, [map, booths, onBoothClick, showClustering]);

  // Get user location (only once when component mounts)
  const locationRequestedRef = useRef(false);

  useEffect(() => {
    if (!showUserLocation || !map) return;
    // Skip if external location is provided or already have location
    if (externalUserLocation || locationRequestedRef.current || internalUserLocation) return;

    if ('geolocation' in navigator) {
      locationRequestedRef.current = true;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setInternalUserLocation(userPos);

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
  }, [map, showUserLocation, internalUserLocation, externalUserLocation]);

  // Create user marker when external location is provided
  useEffect(() => {
    if (!showUserLocation || !map || !externalUserLocation) return;

    // Clean up existing marker if any
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    // Add user location marker for external location
    userMarkerRef.current = new google.maps.Marker({
      position: externalUserLocation,
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

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }
    };
  }, [map, showUserLocation, externalUserLocation]);

  // Center on user location
  const centerOnUser = () => {
    if (!map || !userLocation) return;
    map.panTo(userLocation);
    map.setZoom(14);
  };

  // Auto-center effect
  useEffect(() => {
    if (autoCenterOnUser && userLocation && map) {
      map.panTo(userLocation);
      map.setZoom(14);
    }
  }, [autoCenterOnUser, userLocation, map]);

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
      {/* Map container - must have explicit height for Google Maps to render */}
      <div ref={mapRef} className="w-full h-full min-h-[500px] absolute inset-0" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/95 backdrop-blur-sm">
          <div className="text-center text-muted-foreground">
            <Loader2 className="w-12 h-12 mb-4 text-primary mx-auto animate-spin" />
            <p className="text-lg font-medium text-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Near Me button - center on user location */}
      {showUserLocation && !isLoading && (
        <button
          onClick={centerOnUser}
          className="absolute top-4 right-4 z-[1000] px-4 py-2 bg-card/95 backdrop-blur-sm border border-primary/20 shadow-glow rounded-lg hover:bg-card/80 hover:shadow-glow-strong transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title={userLocation ? 'Center map on your location' : 'Enable location to use this feature'}
          disabled={!userLocation}
        >
          <MapPin className={`w-5 h-5 ${userLocation ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`text-sm font-medium ${userLocation ? 'text-foreground' : 'text-muted-foreground'}`}>
            Near Me
          </span>
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

// Helper function to trigger AI preview generation in the background
// This is called asynchronously and doesn't block the UI
async function triggerAIPreviewGeneration(boothId: string): Promise<void> {
  try {
    // Fire and forget - don't await this, let it run in background
    fetch('/api/booths/generate-preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ boothId }),
    }).catch((error) => {
      console.warn(`Background AI preview generation failed for booth ${boothId}:`, error);
    });
  } catch (error) {
    console.warn(`Failed to trigger AI preview generation for booth ${boothId}:`, error);
  }
}

// Helper function to create InfoWindow content
function createInfoWindowContent(booth: Booth): string {
  // Check if AI preview URL is the broken Unsplash Source API
  const isBrokenUnsplashUrl = booth.ai_preview_url?.includes('source.unsplash.com');

  // Use photo_exterior_url, or ai_preview_url only if it's not broken
  const photoUrl = booth.photo_exterior_url || (!isBrokenUnsplashUrl ? booth.ai_preview_url : null) || '/placeholder-booth.svg';
  const hasAiPreview = booth.ai_preview_url && !booth.photo_exterior_url && !isBrokenUnsplashUrl;

  // Trigger AI preview generation if booth has no photo and no AI preview (or broken one)
  if (!booth.photo_exterior_url && (!booth.ai_preview_url || isBrokenUnsplashUrl)) {
    triggerAIPreviewGeneration(booth.id);
  }

  // Status badge
  const statusColors = {
    active: '#10b981',
    inactive: '#EF4444',
    unverified: '#F59E0B',
    closed: '#6B7280',
  };
  const statusColor = statusColors[booth.status] || statusColors.unverified;
  const statusText = booth.status.charAt(0).toUpperCase() + booth.status.slice(1);

  // Address info - truncate if too long
  const address = booth.address || 'Address not available';
  const displayAddress = address.length > 40 ? address.substring(0, 37) + '...' : address;

  // AI Preview badge HTML - smaller and tighter
  const aiBadge = hasAiPreview
    ? `<div style="position: absolute; bottom: 6px; right: 6px; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px;">AI PREVIEW</div>`
    : '';

  return `
    <div style="width: 260px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding-bottom: 2px;">
      <!-- Image Container -->
      <div style="position: relative; height: 140px; margin-bottom: 10px; border-radius: 8px; overflow: hidden; background-color: #f3f4f6;">
        <img
          src="${photoUrl}"
          alt="${booth.name}"
          style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s;"
          onerror="this.onerror=null; this.src='/placeholder-booth.svg';"
        />
        <!-- Status Badge -->
        <div style="position: absolute; top: 8px; left: 8px; background: ${statusColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${statusText}
        </div>
        ${aiBadge}
      </div>

      <!-- Content -->
      <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #111827; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${booth.name}
      </h3>

      <div style="display: flex; align-items: center; margin-bottom: 4px; color: #4b5563;">
        <svg style="width: 14px; height: 14px; margin-right: 4px; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        <span style="font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${booth.city}, ${booth.country}
        </span>
      </div>

      <div style="font-size: 12px; color: #6b7280; margin-left: 18px; margin-bottom: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${displayAddress}
      </div>

      <!-- Button -->
      <a
        href="/booth/${booth.slug}"
        style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 8px 0; background: linear-gradient(135deg, #d14371 0%, #c73e3a 100%); color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; transition: transform 0.1s ease; box-shadow: 0 2px 4px rgba(209, 67, 113, 0.25);"
        onmouseover="this.style.transform='scale(1.02)'"
        onmouseout="this.style.transform='scale(1)'"
      >
        View Details
        <svg style="width: 14px; height: 14px; margin-left: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </a>
    </div>
  `;
}
