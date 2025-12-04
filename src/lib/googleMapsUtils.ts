/**
 * Google Maps Integration Utilities
 *
 * Generates shareable Google Maps URLs for photo booth tours.
 * Provides professional attribution and cross-platform compatibility.
 */

import { Booth } from '@/types';

interface MapUrlOptions {
  booths: Booth[];
  city: string;
  country?: string;
  attribution?: string;
}

/**
 * Generate a shareable Google Maps URL for a city's photo booth tour
 *
 * Creates a multi-waypoint map that users can save to their Google Maps.
 * Includes proper editorial attribution to Booth Beacon.
 *
 * @param options - Configuration for map URL generation
 * @returns Google Maps URL string
 */
export function generateCityTourMapUrl(options: MapUrlOptions): string {
  const { booths, city, country, attribution = 'Booth Beacon' } = options;

  // Filter booths with valid coordinates
  const validBooths = booths.filter(
    (booth) => booth.latitude !== null && booth.longitude !== null
  );

  if (validBooths.length === 0) {
    // Fallback to city search if no valid booth coordinates
    return generateCitySearchUrl(city, country);
  }

  // Google Maps has URL length limits (~2000 chars)
  // Prioritize booths and limit to ~20 waypoints for reliability
  const maxWaypoints = 20;
  const selectedBooths = validBooths.slice(0, maxWaypoints);

  // Build the waypoints parameter
  // Format: waypoints=lat1,lng1|lat2,lng2|lat3,lng3
  const waypoints = selectedBooths
    .map((booth) => `${booth.latitude},${booth.longitude}`)
    .join('|');

  // Use the first booth as the destination for better UX
  const firstBooth = selectedBooths[0];
  const destination = `${firstBooth.latitude},${firstBooth.longitude}`;

  // Google Maps URL structure:
  // https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&waypoints=LAT,LNG|LAT,LNG&travelmode=walking
  const baseUrl = 'https://www.google.com/maps/dir/';
  const params = new URLSearchParams({
    api: '1',
    destination: destination,
    waypoints: waypoints,
    travelmode: 'walking', // Photo booth tours are typically walking tours
  });

  const url = `${baseUrl}?${params.toString()}`;

  // If URL is too long, fall back to a simpler version
  if (url.length > 2000) {
    return generateSimplifiedTourMapUrl(selectedBooths.slice(0, 10), city, attribution);
  }

  return url;
}

/**
 * Generate a simplified tour map URL with fewer waypoints
 * Used as fallback when full URL exceeds length limits
 */
function generateSimplifiedTourMapUrl(
  booths: Booth[],
  _city: string,
  _attribution: string
): string {
  const destination = `${booths[0].latitude},${booths[0].longitude}`;
  const waypoints = booths
    .slice(1)
    .map((booth) => `${booth.latitude},${booth.longitude}`)
    .join('|');

  const baseUrl = 'https://www.google.com/maps/dir/';
  const params = new URLSearchParams({
    api: '1',
    destination: destination,
    waypoints: waypoints,
    travelmode: 'walking',
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate a Google Maps search URL for a city
 * Fallback when no booth coordinates are available
 */
export function generateCitySearchUrl(city: string, country?: string): string {
  const query = country ? `${city}, ${country}` : city;
  const baseUrl = 'https://www.google.com/maps/search/';
  const params = new URLSearchParams({
    api: '1',
    query: `photo booths ${query}`,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate directions URL to a specific booth
 *
 * @param booth - The booth to navigate to
 * @returns Google Maps directions URL
 */
export function generateBoothDirectionsUrl(booth: Booth): string {
  if (!booth.latitude || !booth.longitude) {
    // Fallback to address search
    const query = booth.address
      ? `${booth.address}, ${booth.city}, ${booth.country}`
      : `${booth.name}, ${booth.city}, ${booth.country}`;

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  // Direct coordinates for precise navigation
  const baseUrl = 'https://www.google.com/maps/dir/';
  const params = new URLSearchParams({
    api: '1',
    destination: `${booth.latitude},${booth.longitude}`,
    destination_place_id: '', // Could be enhanced with Google Places API
    travelmode: 'walking',
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate a Google Maps "Save" URL that prompts users to save a custom map
 *
 * Note: Google My Maps API requires OAuth and is more complex.
 * This version opens a map view that users can manually save.
 *
 * @param booths - Array of booths for the tour
 * @param city - City name for the map title
 * @returns Google Maps URL optimized for saving
 */
export function generateSaveableMapUrl(booths: Booth[], city: string): string {
  // For now, this returns the same as the tour map URL
  // Future enhancement: Integrate with Google My Maps API for programmatic list creation
  return generateCityTourMapUrl({ booths, city });
}

/**
 * Get a user-friendly map title for display
 *
 * @param city - City name
 * @param boothCount - Number of booths in the tour
 * @returns Formatted title string
 */
export function getMapTitle(city: string, boothCount: number): string {
  if (boothCount === 1) {
    return `${city} Photo Booth`;
  }

  return `${city} Photo Booth Tour (${boothCount} locations)`;
}

/**
 * Get editorial description for the map
 *
 * @param city - City name
 * @param boothCount - Number of booths
 * @returns Editorial description
 */
export function getMapDescription(city: string, boothCount: number): string {
  if (boothCount === 0) {
    return `Discover photo booths in ${city}`;
  }

  if (boothCount === 1) {
    return `A curated photo booth location in ${city}, hand-picked by Booth Beacon.`;
  }

  if (boothCount <= 5) {
    return `A curated selection of ${boothCount} photo booth locations in ${city}, hand-picked by Booth Beacon.`;
  }

  if (boothCount <= 10) {
    return `Explore ${boothCount} vintage photo booths across ${city}. Curated by Booth Beacon, the world's photo booth directory.`;
  }

  return `The ultimate photo booth tour of ${city}: ${boothCount} authentic locations curated by Booth Beacon. Save this map and explore them all!`;
}
