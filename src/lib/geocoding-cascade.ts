/**
 * Multi-Provider Geocoding Cascade System
 *
 * Implements the CTO-recommended cascade strategy:
 * Layer 1 (Free): Nominatim - Strict, structured addresses only
 * Layer 2 (Generous): Mapbox - Forgiving, 100k free requests/month
 * Layer 3 (Premium): Google Places - Source of truth, pay per request
 *
 * Strategy: Try each provider in order until we get a high-confidence result
 */

import { validateGeocodeResult, type BoothAddressData, type NominatimResult } from './geocoding-validation';

// ============================================================================
// Types
// ============================================================================

export interface GeocodeResult {
  lat: number;
  lng: number;
  provider: 'nominatim' | 'mapbox' | 'google';
  confidence: 'high' | 'medium' | 'low';
  displayName: string;
  matchScore: number;
  validationIssues: string[];
  needsReview: boolean;
}

export interface CascadeConfig {
  enableNominatim: boolean;
  enableMapbox: boolean;
  enableGoogle: boolean;
  mapboxToken?: string;
  googleApiKey?: string;
}

// ============================================================================
// Provider Implementations
// ============================================================================

/**
 * Layer 1: Nominatim (OpenStreetMap)
 * Free, 1 req/sec limit, strict about address format
 * Use only for structured addresses (Street + City + Zip)
 */
async function geocodeWithNominatim(
  booth: BoothAddressData
): Promise<GeocodeResult | null> {
  // Build structured query (DO NOT include venue name per CTO feedback)
  const parts = [
    booth.address,
    booth.city,
    booth.state,
    booth.country,
  ].filter(Boolean);

  const query = parts.join(', ');

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'BoothBeacon/1.0 (https://boothbeacon.org)',
    },
  });

  if (!response.ok) {
    return null;
  }

  const results = await response.json();

  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const result = results[0] as NominatimResult;

  // Validate the result
  const validation = validateGeocodeResult(booth, result);

  if (!validation.isValid || validation.confidence === 'reject') {
    return null;
  }

  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    provider: 'nominatim',
    confidence: validation.confidence,
    displayName: result.display_name,
    matchScore: validation.matchScore,
    validationIssues: validation.issues,
    needsReview: validation.confidence === 'low',
  };
}

/**
 * Layer 2: Mapbox Geocoding
 * Generous free tier (100k requests/month), more forgiving than Nominatim
 * Better at handling venue names and incomplete addresses
 */
async function geocodeWithMapbox(
  booth: BoothAddressData,
  token: string
): Promise<GeocodeResult | null> {
  // Include venue name for Mapbox (it handles this well)
  const query = [
    booth.name,
    booth.address,
    booth.city,
    booth.state,
    booth.country,
  ].filter(Boolean).join(', ');

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
  const params = new URLSearchParams({
    access_token: token,
    limit: '1',
    types: 'address,poi',
  });

  const response = await fetch(`${url}?${params}`);

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (!data.features || data.features.length === 0) {
    return null;
  }

  const feature = data.features[0];
  const [lng, lat] = feature.center;

  // Calculate confidence based on relevance score
  const relevance = feature.relevance || 0;
  let confidence: 'high' | 'medium' | 'low';

  if (relevance >= 0.9) {
    confidence = 'high';
  } else if (relevance >= 0.7) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    lat,
    lng,
    provider: 'mapbox',
    confidence,
    displayName: feature.place_name,
    matchScore: Math.round(relevance * 100),
    validationIssues: [],
    needsReview: confidence === 'low',
  };
}

/**
 * Layer 3: Google Places API
 * Most accurate but costs $17/1k requests
 * Use only as last resort when Nominatim and Mapbox fail
 */
async function geocodeWithGoogle(
  booth: BoothAddressData,
  apiKey: string
): Promise<GeocodeResult | null> {
  // Include venue name and full address
  const query = [
    booth.name,
    booth.address,
    booth.city,
    booth.state,
    booth.country,
  ].filter(Boolean).join(', ');

  const url = 'https://maps.googleapis.com/maps/api/geocode/json';
  const params = new URLSearchParams({
    address: query,
    key: apiKey,
  });

  const response = await fetch(`${url}?${params}`);

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    return null;
  }

  const result = data.results[0];
  const { lat, lng } = result.geometry.location;

  // Google results are generally high quality
  const locationType = result.geometry.location_type;
  let confidence: 'high' | 'medium' | 'low';

  if (locationType === 'ROOFTOP') {
    confidence = 'high';
  } else if (locationType === 'RANGE_INTERPOLATED' || locationType === 'GEOMETRIC_CENTER') {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    lat,
    lng,
    provider: 'google',
    confidence,
    displayName: result.formatted_address,
    matchScore: 95, // Google is generally very accurate
    validationIssues: [],
    needsReview: confidence === 'low',
  };
}

// ============================================================================
// Cascade Logic
// ============================================================================

/**
 * Rate limiter for Nominatim (1 req/sec)
 */
let lastNominatimRequest = 0;
async function rateLimitNominatim() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastNominatimRequest;
  const minInterval = 1100; // 1.1 seconds to be safe

  if (timeSinceLastRequest < minInterval) {
    await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest));
  }

  lastNominatimRequest = Date.now();
}

/**
 * Main cascade function: tries providers in order until success
 */
export async function geocodeWithCascade(
  booth: BoothAddressData,
  config: CascadeConfig
): Promise<GeocodeResult | null> {
  const results: Array<{ provider: string; result: GeocodeResult | null }> = [];

  // Layer 1: Nominatim (Free)
  if (config.enableNominatim) {
    await rateLimitNominatim();
    const nominatimResult = await geocodeWithNominatim(booth);
    results.push({ provider: 'nominatim', result: nominatimResult });

    if (nominatimResult && nominatimResult.confidence === 'high') {
      return nominatimResult;
    }
  }

  // Layer 2: Mapbox (Generous Free Tier)
  if (config.enableMapbox && config.mapboxToken) {
    const mapboxResult = await geocodeWithMapbox(booth, config.mapboxToken);
    results.push({ provider: 'mapbox', result: mapboxResult });

    if (mapboxResult && (mapboxResult.confidence === 'high' || mapboxResult.confidence === 'medium')) {
      return mapboxResult;
    }
  }

  // Layer 3: Google (Premium)
  if (config.enableGoogle && config.googleApiKey) {
    const googleResult = await geocodeWithGoogle(booth, config.googleApiKey);
    results.push({ provider: 'google', result: googleResult });

    if (googleResult) {
      return googleResult;
    }
  }

  // If we got here, no provider succeeded with high/medium confidence
  // Return the best result we found, or null
  const bestResult = results
    .filter(r => r.result !== null)
    .sort((a, b) => {
      if (!a.result || !b.result) return 0;
      return b.result.matchScore - a.result.matchScore;
    })[0];

  return bestResult?.result || null;
}

/**
 * Helper to get default config from environment variables
 */
export function getDefaultCascadeConfig(): CascadeConfig {
  // Support both GOOGLE_MAPS_API_KEY and GOOGLE_MAPS_API_KEY_BACKEND
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY_BACKEND;

  return {
    enableNominatim: true, // Always enabled (free)
    enableMapbox: !!process.env.MAPBOX_API_TOKEN,
    enableGoogle: !!googleApiKey,
    mapboxToken: process.env.MAPBOX_API_TOKEN,
    googleApiKey,
  };
}
