/**
 * Distance calculation utilities for booth locations
 */

import { Coordinates, Booth } from '@/types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted distance string (e.g., "2.5 km" or "850 m")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Fast approximate distance calculation using Euclidean distance
 * Good enough for sorting, much faster than Haversine
 */
function fastDistanceApprox(coord1: Coordinates, coord2: Coordinates): number {
  const latDiff = coord2.lat - coord1.lat;
  const lngDiff = (coord2.lng - coord1.lng) * Math.cos(toRad(coord1.lat));
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111.32; // Convert to km
}

/**
 * Sort booths by distance from a given location
 * Optimized: uses fast approximation for sorting, then precise calculation for display
 * @param booths Array of booths to sort
 * @param userLocation User's current location
 * @returns Sorted array of booths with distance property added
 */
export function sortBoothsByDistance(
  booths: Booth[],
  userLocation: Coordinates
): (Booth & { distance?: number })[] {
  // First pass: fast approximation for sorting
  const boothsWithApproxDistance = booths.map((booth) => {
    if (!booth.latitude || !booth.longitude) {
      return { booth, approxDistance: Infinity };
    }

    const approxDistance = fastDistanceApprox(userLocation, {
      lat: booth.latitude,
      lng: booth.longitude,
    });

    return { booth, approxDistance };
  });

  // Sort by approximate distance
  boothsWithApproxDistance.sort((a, b) => a.approxDistance - b.approxDistance);

  // Second pass: calculate precise distance only for nearest 100 booths
  // For the rest, use the approximation
  return boothsWithApproxDistance.map(({ booth, approxDistance }, index) => {
    if (approxDistance === Infinity) {
      return { ...booth, distance: undefined };
    }

    // Use precise calculation for top 100, approximation for the rest
    const distance = index < 100
      ? calculateDistance(userLocation, {
          lat: booth.latitude!,
          lng: booth.longitude!,
        })
      : approxDistance;

    return { ...booth, distance };
  });
}

/**
 * Filter booths within a certain radius
 * @param booths Array of booths to filter
 * @param userLocation User's current location
 * @param radiusKm Maximum distance in kilometers
 * @returns Filtered array of booths within radius
 */
export function filterBoothsByRadius(
  booths: Booth[],
  userLocation: Coordinates,
  radiusKm: number
): Booth[] {
  return booths.filter((booth) => {
    if (!booth.latitude || !booth.longitude) return false;

    const distance = calculateDistance(userLocation, {
      lat: booth.latitude,
      lng: booth.longitude,
    });

    return distance <= radiusKm;
  });
}
