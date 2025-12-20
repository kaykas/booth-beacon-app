/**
 * Map Optimization Utilities
 * Council Recommendation: Viewport-based loading with clustering
 */

import { Loader } from '@googlemaps/js-api-loader';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface BoothMarkerData {
  id: string;
  venue_name: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  verification_status?: string;
  photo_count?: number;
}

/**
 * Debounce function to limit API calls during map movement
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Convert Google Maps bounds to our MapBounds interface
 */
export function convertBounds(bounds: google.maps.LatLngBounds): MapBounds {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  return {
    north: ne.lat(),
    south: sw.lat(),
    east: ne.lng(),
    west: sw.lng(),
  };
}

/**
 * Calculate if a booth is within the viewport bounds
 */
export function isInBounds(booth: BoothMarkerData, bounds: MapBounds): boolean {
  return (
    booth.latitude >= bounds.south &&
    booth.latitude <= bounds.north &&
    booth.longitude >= bounds.west &&
    booth.longitude <= bounds.east
  );
}

/**
 * Filter booths by viewport with limit
 */
export function filterBoothsByViewport(
  booths: BoothMarkerData[],
  bounds: MapBounds,
  maxMarkers: number = 100
): BoothMarkerData[] {
  const filtered = booths.filter(booth => isInBounds(booth, bounds));

  // Sort by verification status and photo count for priority
  const sorted = filtered.sort((a, b) => {
    const aScore = (a.verification_status === 'verified' ? 100 : 0) + (a.photo_count || 0);
    const bScore = (b.verification_status === 'verified' ? 100 : 0) + (b.photo_count || 0);
    return bScore - aScore;
  });

  return sorted.slice(0, maxMarkers);
}

/**
 * Create optimized cluster configuration
 */
export function getClusterConfig(zoom: number): {
  gridSize: number;
  maxZoom: number;
  minimumClusterSize: number;
} {
  // Dynamic clustering based on zoom level
  if (zoom < 5) {
    // Very zoomed out - large clusters
    return { gridSize: 80, maxZoom: 15, minimumClusterSize: 5 };
  } else if (zoom < 10) {
    // Medium zoom - moderate clusters
    return { gridSize: 60, maxZoom: 15, minimumClusterSize: 3 };
  } else {
    // Zoomed in - smaller clusters
    return { gridSize: 40, maxZoom: 15, minimumClusterSize: 2 };
  }
}

/**
 * Custom marker renderer for clusters
 */
export class OptimizedClusterRenderer {
  render(
    cluster: { count: number; position: google.maps.LatLng },
    stats: any
  ): google.maps.Marker {
    const color = cluster.count > 100 ? '#ff0000' : cluster.count > 10 ? '#ff9900' : '#00cc00';

    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${color}" opacity="0.8" stroke="white" stroke-width="2"/>
        <text x="20" y="25" text-anchor="middle" font-size="14" fill="white" font-weight="bold">
          ${cluster.count > 999 ? '999+' : cluster.count}
        </text>
      </svg>
    `;

    const icon = {
      url: `data:image/svg+xml;base64,${btoa(svg)}`,
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20),
    };

    return new google.maps.Marker({
      position: cluster.position,
      icon,
      label: {
        text: cluster.count.toString(),
        color: 'transparent', // Hide default label since we're using SVG
      },
      zIndex: 1000 + cluster.count,
    });
  }
}

/**
 * React hook for viewport-based booth loading
 * Usage in your map component:
 *
 * const visibleBooths = useViewportBooths(map, allBooths, {
 *   maxMarkers: 100,
 *   debounceMs: 300
 * });
 */
export function createViewportBoothsHook() {
  return function useViewportBooths(
    map: google.maps.Map | null,
    allBooths: BoothMarkerData[],
    options: { maxMarkers?: number; debounceMs?: number } = {}
  ) {
    const { maxMarkers = 100, debounceMs = 300 } = options;
    const [visibleBooths, setVisibleBooths] = React.useState<BoothMarkerData[]>([]);

    React.useEffect(() => {
      if (!map) return;

      const updateVisibleBooths = debounce(() => {
        const bounds = map.getBounds();
        if (!bounds) return;

        const mapBounds = convertBounds(bounds);
        const filtered = filterBoothsByViewport(allBooths, mapBounds, maxMarkers);
        setVisibleBooths(filtered);
      }, debounceMs);

      // Initial update
      updateVisibleBooths();

      // Listen to map changes
      const listeners = [
        google.maps.event.addListener(map, 'bounds_changed', updateVisibleBooths),
        google.maps.event.addListener(map, 'zoom_changed', updateVisibleBooths),
      ];

      return () => {
        listeners.forEach(listener => google.maps.event.removeListener(listener));
      };
    }, [map, allBooths, maxMarkers, debounceMs]);

    return visibleBooths;
  };
}

/**
 * Server-side viewport query helper for Supabase
 */
export function buildViewportQuery(bounds: MapBounds, limit: number = 100) {
  return {
    filter: {
      latitude: {
        gte: bounds.south,
        lte: bounds.north,
      },
      longitude: {
        gte: bounds.west,
        lte: bounds.east,
      },
      is_active: true,
    },
    select: `
      id,
      venue_name,
      latitude,
      longitude,
      city,
      state,
      verification_status,
      photo_count
    `,
    order: [
      { column: 'verification_status', ascending: false },
      { column: 'photo_count', ascending: false },
    ],
    limit,
  };
}

/**
 * Create marker with optimized icon
 */
export function createOptimizedMarker(
  booth: BoothMarkerData,
  map: google.maps.Map
): google.maps.Marker {
  const isVerified = booth.verification_status === 'verified';
  const color = isVerified ? '#00cc00' : '#ff9900';

  const svg = `
    <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C9.5 0 5 4.5 5 10c0 7.5 10 20 10 20s10-12.5 10-20c0-5.5-4.5-10-10-10z"
            fill="${color}" opacity="0.9" stroke="white" stroke-width="2"/>
      <circle cx="15" cy="10" r="4" fill="white"/>
    </svg>
  `;

  const icon = {
    url: `data:image/svg+xml;base64,${btoa(svg)}`,
    scaledSize: new google.maps.Size(30, 40),
    anchor: new google.maps.Point(15, 40),
  };

  return new google.maps.Marker({
    position: { lat: booth.latitude, lng: booth.longitude },
    map,
    icon,
    title: booth.venue_name,
    optimized: true, // Use canvas rendering for better performance
  });
}

/**
 * Performance monitoring helper
 */
export class MapPerformanceMonitor {
  private metrics: {
    markerCount: number;
    clusterCount: number;
    renderTime: number;
    lastUpdate: Date;
  };

  constructor() {
    this.metrics = {
      markerCount: 0,
      clusterCount: 0,
      renderTime: 0,
      lastUpdate: new Date(),
    };
  }

  startRender() {
    return performance.now();
  }

  endRender(startTime: number, markerCount: number, clusterCount: number) {
    this.metrics = {
      markerCount,
      clusterCount,
      renderTime: performance.now() - startTime,
      lastUpdate: new Date(),
    };

    console.log(`🗺️ Map render: ${markerCount} markers, ${clusterCount} clusters, ${this.metrics.renderTime.toFixed(2)}ms`);
  }

  getMetrics() {
    return { ...this.metrics };
  }
}
