'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Booth, Coordinates } from '@/types';
import { MapPin, Loader2 } from 'lucide-react';
import { MarkerClusterer, GridAlgorithm } from '@googlemaps/markerclusterer';
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
  onCenterComplete?: () => void; // Callback when auto-centering is complete
  disableAutoFit?: boolean; // Disable automatic fitBounds on initial load (for fixed zoom/center views)
  onViewportChange?: (viewport: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
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

// Marker colors based on booth status - warm vintage amber/orange theme
const statusColors = {
  active: '#F59E0B', // Amber for active booths
  inactive: '#EF4444', // Red for inactive
  unverified: '#FB923C', // Light orange for unverified
  closed: '#6B7280', // Gray for closed
};

// Cache for marker SVG icons to prevent regeneration
// Key format: "status-boothId"
const markerIconCache = new Map<string, string>();

// Generate cached marker icon
function getMarkerIcon(boothId: string, status: string): string {
  const cacheKey = `${status}-${boothId}`;
  const cached = markerIconCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const markerColor = statusColors[status as keyof typeof statusColors] || statusColors.unverified;

  // Create custom HTML marker using SVG icon
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
      <!-- Drop shadow -->
      <defs>
        <filter id="shadow-${boothId}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.4"/>
        </filter>
      </defs>
      <!-- Teardrop pin shape -->
      <g transform="translate(22, 18)" filter="url(#shadow-${boothId})">
        <path d="M 0,-18 C -10,-18 -18,-10 -18,0 C -18,6 -10,14 0,26 C 10,14 18,6 18,0 C 18,-10 10,-18 0,-18 Z"
              fill="${markerColor}"
              stroke="white"
              stroke-width="3"/>
        <!-- Camera icon -->
        <g transform="translate(0, -5)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M 5,-6 L 3,-3 L -7,-3 C -8,-3 -9,-2 -9,0 L -9,7 C -9,8 -8,9 -7,9 L 7,9 C 8,9 9,8 9,7 L 9,0 C 9,-2 8,-3 7,-3 L -3,-3 L -5,-6 Z"/>
          <circle cx="0" cy="3" r="3"/>
        </g>
      </g>
    </svg>
  `;

  markerIconCache.set(cacheKey, svgIcon);

  // Limit cache size to prevent memory issues with 1000+ booths
  if (markerIconCache.size > 1000) {
    const firstKey = markerIconCache.keys().next().value;
    if (firstKey) markerIconCache.delete(firstKey);
  }

  return svgIcon;
}

export function BoothMap({
  booths,
  center,
  zoom,
  onBoothClick,
  showClustering = true,
  showUserLocation = false,
  externalUserLocation,
  autoCenterOnUser = false,
  onCenterComplete,
  disableAutoFit = false,
  onViewportChange,
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
  const hasInitialFitBoundsRef = useRef(false); // Track if we've done initial fitBounds
  const selectedBoothIdRef = useRef<string | null>(null); // Track which booth's info window is open
  const openInfoWindowRef = useRef<google.maps.InfoWindow | null>(null); // Track currently open info window

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

        // Add viewport change listener if callback provided
        if (onViewportChange) {
          // Trigger initial viewport after map loads
          const initialBounds = mapInstance.getBounds();
          if (initialBounds) {
            const ne = initialBounds.getNorthEast();
            const sw = initialBounds.getSouthWest();
            onViewportChange({
              north: ne.lat(),
              south: sw.lat(),
              east: ne.lng(),
              west: sw.lng(),
            });
          }

          // Listen for idle events (after pan, zoom, etc.)
          mapInstance.addListener('idle', () => {
            const bounds = mapInstance.getBounds();
            if (bounds) {
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              onViewportChange({
                north: ne.lat(),
                south: sw.lat(),
                east: ne.lng(),
                west: sw.lng(),
              });
            }
          });
        }
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Google Maps');
        setIsLoading(false);
        isInitializedRef.current = false; // Allow retry on error
      }
    };

    initMap();
  }, [stableCenter, stableZoom, onViewportChange]);

  // Update map center when center prop changes (for booth detail pages)
  useEffect(() => {
    if (!map || !center) return;

    // Pan to new center if it's different from current
    const currentCenter = map.getCenter();
    if (currentCenter &&
        (Math.abs(currentCenter.lat() - center.lat) > 0.0001 ||
         Math.abs(currentCenter.lng() - center.lng) > 0.0001)) {
      map.panTo({ lat: center.lat, lng: center.lng });
      if (zoom) {
        map.setZoom(zoom);
      }
    }
  }, [map, center, zoom]);

  // Create markers for booths
  // ========================
  // PERFORMANCE OPTIMIZATIONS FOR 900+ MARKERS:
  // ========================
  // 1. Icon Caching: Marker SVGs are memoized (getMarkerIcon function)
  // 2. GridAlgorithm: Most performant clustering for large datasets
  // 3. Viewport Loading: Only load markers in visible viewport (parent handles this)
  // 4. Debounced Updates: Marker recreation only on map/booths change
  // 5. Optimized Rendering: optimized:false for SVG markers, proper z-index
  // 6. Smart Bounds: Only fitBounds on initial load, not on updates
  // 7. Cluster Click: Zoom into cluster bounds for better UX
  // 8. Tiered Cluster Styling: 5 cluster tiers (10, 20, 50, 100, 100+)
  // ========================
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

      // Get cached marker icon (memoized for performance)
      const svgIcon = getMarkerIcon(booth.id, booth.status);

      const marker = new google.maps.Marker({
        position,
        map: showClustering ? null : map,
        title: booth.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 44),
        },
        optimized: false,
      });

      // Create InfoWindow content
      const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(booth),
      });

      // Add hover scale effect - optimized with cached icons
      marker.addListener('mouseover', () => {
        // Create scaled up version for hover
        const scaledSvgIcon = svgIcon.replace('width="44" height="44"', 'width="52" height="52"');
        marker.setIcon({
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(scaledSvgIcon),
          scaledSize: new google.maps.Size(52, 52),
          anchor: new google.maps.Point(26, 52),
        });
      });

      marker.addListener('mouseout', () => {
        // Reset to normal size using cached icon
        marker.setIcon({
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 44),
        });
      });

      // Add click listener with zoom to booth
      marker.addListener('click', () => {
        // Close any previously open info window
        if (openInfoWindowRef.current) {
          openInfoWindowRef.current.close();
        }

        // Track which booth's info window is open
        selectedBoothIdRef.current = booth.id;
        openInfoWindowRef.current = infoWindow;

        // Zoom to booth location
        map.panTo(position);
        map.setZoom(16);

        // Open info window
        infoWindow.open(map, marker);

        if (onBoothClick) {
          onBoothClick(booth);
        }
      });

      // Listen for info window close to clear selected booth
      infoWindow.addListener('closeclick', () => {
        if (selectedBoothIdRef.current === booth.id) {
          selectedBoothIdRef.current = null;
          openInfoWindowRef.current = null;
        }
      });

      // If this is the selected booth, automatically re-open its info window
      // (This handles the case where markers are recreated due to viewport changes)
      if (selectedBoothIdRef.current === booth.id) {
        // Use setTimeout to ensure map is ready and marker is rendered
        setTimeout(() => {
          infoWindow.open(map, marker);
          openInfoWindowRef.current = infoWindow; // Update ref to track reopened window
        }, 100);
      }

      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;

    // Add marker clustering if enabled
    // Performance optimized for 900+ markers:
    // - GridAlgorithm for faster clustering
    // - Custom renderer with tiered styling
    // - Proper z-index management
    // - Click handlers for zoom to cluster
    if (showClustering && newMarkers.length > 0) {
      const clusterer = new MarkerClusterer({
        map,
        markers: newMarkers,
        // GridAlgorithm is most performant for large marker sets (900+)
        // Default maxZoom is 14, meaning clusters won't form beyond zoom level 14
        algorithm: new GridAlgorithm({ maxZoom: 15 }),
        // Optimize for performance - zoom into cluster on click
        onClusterClick: (_event, cluster, mapInstance) => {
          // Zoom into cluster on click
          const bounds = new google.maps.LatLngBounds();
          cluster.markers?.forEach((marker) => {
            // Handle both regular Marker and AdvancedMarkerElement
            if ('position' in marker && marker.position) {
              bounds.extend(marker.position as google.maps.LatLng);
            } else if ('getPosition' in marker) {
              const pos = (marker as google.maps.Marker).getPosition();
              if (pos) bounds.extend(pos);
            }
          });
          mapInstance.fitBounds(bounds);
          // Slight zoom out for better context
          const currentZoom = mapInstance.getZoom();
          if (currentZoom && currentZoom > 15) {
            mapInstance.setZoom(15);
          }
        },
        renderer: {
          render: ({ count, position }) => {
            // Tiered cluster styling with amber/orange vintage theme
            // More granular tiers for better visual feedback at scale
            let color: string;
            let size: number;
            let fontSize: string;

            if (count > 100) {
              color = '#B45309'; // Dark amber for massive clusters
              size = 70;
              fontSize = '16px';
            } else if (count > 50) {
              color = '#D97706'; // Amber-700 for large clusters
              size = 60;
              fontSize = '15px';
            } else if (count > 20) {
              color = '#F59E0B'; // Amber-500 for medium clusters
              size = 50;
              fontSize = '14px';
            } else if (count > 10) {
              color = '#FB923C'; // Light orange for small-medium clusters
              size = 42;
              fontSize = '13px';
            } else {
              color = '#FCD34D'; // Lighter amber for tiny clusters
              size = 36;
              fontSize = '12px';
            }

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
                fontSize,
                fontWeight: 'bold',
              },
              // Higher z-index for larger clusters ensures they're always clickable
              zIndex: 1000 + count,
            });
          },
        },
      });
      markerClustererRef.current = clusterer;
    }

    // Fit map to show all booths ONLY on initial load, not on subsequent updates
    // This prevents the map from zooming out after user interactions
    // Skip if disableAutoFit is true (for fixed zoom/center views like homepage preview)
    if (booths.length > 1 && !hasInitialFitBoundsRef.current && !disableAutoFit) {
      map.fitBounds(bounds);
      hasInitialFitBoundsRef.current = true;
    }

    // Cleanup function
    return () => {
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
      }
    };
  }, [map, booths, onBoothClick, showClustering, disableAutoFit]);

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
      // Notify parent that centering is complete
      if (onCenterComplete) {
        onCenterComplete();
      }
    }
  }, [autoCenterOnUser, userLocation, map, onCenterComplete]);

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

  // Priority: photo_exterior_url > ai_generated_image_url > ai_preview_url (if not broken)
  const photoUrl = booth.photo_exterior_url
    || booth.ai_generated_image_url
    || (!isBrokenUnsplashUrl ? booth.ai_preview_url : null)
    || '/placeholder-booth.svg';
  const hasAiGenerated = booth.ai_generated_image_url && !booth.photo_exterior_url;
  const hasAiPreview = booth.ai_preview_url && !booth.photo_exterior_url && !booth.ai_generated_image_url && !isBrokenUnsplashUrl;

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

  // AI badge HTML - smaller and tighter
  const aiBadge = hasAiGenerated
    ? `<div style="position: absolute; bottom: 6px; right: 6px; background: rgba(147, 51, 234, 0.9); backdrop-filter: blur(4px); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px;">✨ AI ART</div>`
    : hasAiPreview
    ? `<div style="position: absolute; bottom: 6px; right: 6px; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px;">AI PREVIEW</div>`
    : '';

  // Generate directions URLs
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${booth.latitude},${booth.longitude}`;

  return `
    <div style="width: 280px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding-bottom: 2px; background: linear-gradient(135deg, #FFF9F0 0%, #FFF5E6 100%);">
      <!-- Image Container with Vintage Border -->
      <div style="position: relative; height: 150px; margin-bottom: 12px; border-radius: 8px; overflow: hidden; background: linear-gradient(135deg, #F4E4C1 0%, #E8D4B1 100%); border: 3px solid #8B7355; box-shadow: 0 4px 12px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.3);">
        <img
          src="${photoUrl}"
          alt="${booth.name}"
          style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s; filter: sepia(0.1) contrast(1.05);"
          onerror="this.onerror=null; this.src='/placeholder-booth.svg';"
        />
        <!-- Status Badge with Vintage Colors -->
        <div style="position: absolute; top: 8px; left: 8px; background: ${statusColor}; color: white; padding: 3px 10px; border-radius: 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(0,0,0,0.25), 0 0 0 2px rgba(255,255,255,0.3);">
          ${statusText}
        </div>
        ${aiBadge}
      </div>

      <!-- Content with Warm Background -->
      <div style="padding: 0 8px;">
        <h3 style="margin: 0 0 6px 0; font-size: 17px; font-weight: 700; color: #2C2416; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${booth.name}
        </h3>

        <div style="display: flex; align-items: center; margin-bottom: 4px; color: #8B7355;">
          <svg style="width: 14px; height: 14px; margin-right: 5px; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span style="font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${booth.city}, ${booth.country}
          </span>
        </div>

        <div style="font-size: 12px; color: #6b5d4f; margin-left: 19px; margin-bottom: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${displayAddress}
        </div>

        <!-- Buttons with Vintage Styling -->
        <div style="display: flex; gap: 6px; margin-bottom: 8px;">
          <a
            href="${googleMapsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 9px 0; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2);"
            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 10px rgba(245, 158, 11, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3)';"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(245, 158, 11, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)';"
          >
            <svg style="width: 15px; height: 15px; margin-right: 5px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
            </svg>
            Directions
          </a>
          <a
            href="/booth/${booth.slug}"
            style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 9px 0; background: linear-gradient(135deg, #8B7355 0%, #6B5745 100%); color: #FFF9F0; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(139, 115, 85, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.15);"
            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 10px rgba(139, 115, 85, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.25)';"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(139, 115, 85, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.15)';"
          >
            Details
            <svg style="width: 14px; height: 14px; margin-left: 5px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  `;
}
