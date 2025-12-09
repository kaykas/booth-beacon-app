/**
 * 4-Layer Geocoding Validation System for Booth Beacon
 *
 * Ensures accurate geocoding by validating:
 * 1. Address completeness (before geocoding)
 * 2. Geocode result quality (after geocoding)
 * 3. Distance validation (geographic accuracy)
 * 4. Confidence scoring (for manual review flagging)
 */

// ============================================================================
// Types
// ============================================================================

export type ValidationConfidence = 'high' | 'medium' | 'low' | 'reject';

export interface BoothAddressData {
  name: string;
  address: string;
  city: string;
  state?: string | null;
  country: string;
}

export interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
  importance: number;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export interface AddressValidationResult {
  isValid: boolean;
  confidence: ValidationConfidence;
  issues: string[];
  addressQuality: {
    hasStreetNumber: boolean;
    hasStreetName: boolean;
    hasCity: boolean;
    hasCountry: boolean;
    isCompleteAddress: boolean;
  };
}

export interface GeocodeValidationResult {
  isValid: boolean;
  confidence: ValidationConfidence;
  matchScore: number;
  issues: string[];
  matchDetails: {
    nameMatch: number;
    cityMatch: boolean;
    placeTypeAppropriate: boolean;
    hasAddressComponents: boolean;
  };
}

export interface DistanceValidationResult {
  isValid: boolean;
  distance: number | null;
  withinThreshold: boolean;
  threshold: number;
  reason?: string;
}

export interface FinalValidationResult {
  isValid: boolean;
  shouldGeocode: boolean;
  confidence: ValidationConfidence;
  geocodeProvider: string;
  issues: string[];
  metadata: {
    addressValidation: AddressValidationResult;
    geocodeValidation?: GeocodeValidationResult;
    distanceValidation?: DistanceValidationResult;
  };
}

// ============================================================================
// Layer 1: Address Completeness Validation
// ============================================================================

/**
 * Validates whether an address is complete enough for geocoding
 *
 * @param booth - Booth data with address fields
 * @returns Validation result with confidence level
 */
export function validateAddressCompleteness(
  booth: BoothAddressData
): AddressValidationResult {
  const issues: string[] = [];

  // Parse address to check for components
  const addressLower = booth.address.toLowerCase().trim();
  const hasDigits = /\d/.test(booth.address);

  // Check for street number (digits at start or after common prefixes)
  const hasStreetNumber = hasDigits && /^\d+|\b\d+\b/.test(booth.address);

  // Check for street name (anything after potential street number)
  const hasStreetName = booth.address.split(/\s+/).length >= 2;

  // Check for city and country
  const hasCity = !!booth.city && booth.city.trim().length > 0;
  const hasCountry = !!booth.country && booth.country.trim().length > 0;

  // Determine completeness
  const isCompleteAddress = hasStreetNumber && hasStreetName && hasCity && hasCountry;

  // Build issues list
  if (!hasStreetNumber) {
    issues.push('Missing street number');
  }

  if (!hasStreetName) {
    issues.push('Missing street name');
  }

  if (!hasCity) {
    issues.push('Missing city');
  }

  if (!hasCountry) {
    issues.push('Missing country');
  }

  // Determine confidence level
  let confidence: ValidationConfidence;
  let isValid: boolean;

  if (!hasStreetNumber || !hasStreetName) {
    // REJECT: Cannot reliably geocode without basic address
    confidence = 'reject';
    isValid = false;
    issues.push('Address too incomplete for reliable geocoding');
  } else if (isCompleteAddress) {
    // HIGH: Full address with all components
    confidence = 'high';
    isValid = true;
  } else if (hasStreetNumber && hasStreetName && hasCity) {
    // MEDIUM: Has street address and city but missing country
    confidence = 'medium';
    isValid = true;
  } else {
    // LOW: Has some components but questionable quality
    confidence = 'low';
    isValid = true;
  }

  return {
    isValid,
    confidence,
    issues,
    addressQuality: {
      hasStreetNumber,
      hasStreetName,
      hasCity,
      hasCountry,
      isCompleteAddress,
    },
  };
}

// ============================================================================
// Layer 2: Geocode Result Validation
// ============================================================================

/**
 * Calculates fuzzy string similarity using Levenshtein distance
 * Returns a score between 0 (no match) and 1 (perfect match)
 */
function fuzzyMatch(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Quick exact match check
  if (s1 === s2) return 1.0;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return shorter / longer;
  }

  // Levenshtein distance
  const matrix: number[][] = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - (distance / maxLength);
}

/**
 * Validates a Nominatim geocoding result against the original booth data
 *
 * @param booth - Original booth data
 * @param result - Nominatim API result
 * @returns Validation result with match score
 */
export function validateGeocodeResult(
  booth: BoothAddressData,
  result: NominatimResult
): GeocodeValidationResult {
  const issues: string[] = [];
  const displayName = result.display_name.toLowerCase();

  // Check 1: Booth name fuzzy match (>70% similarity)
  const nameMatch = fuzzyMatch(booth.name, displayName);
  const nameMatchesWell = nameMatch > 0.7;

  if (!nameMatchesWell && nameMatch > 0.5) {
    issues.push(`Weak name match (${Math.round(nameMatch * 100)}%)`);
  } else if (!nameMatchesWell) {
    issues.push(`Poor name match (${Math.round(nameMatch * 100)}%)`);
  }

  // Check 2: City match
  const cityMatch = displayName.includes(booth.city.toLowerCase());
  if (!cityMatch) {
    issues.push(`City "${booth.city}" not found in result`);
  }

  // Check 3: Place type appropriateness
  // Reject cross-streets, intersections, and generic landmarks
  const inappropriateTypes = ['highway', 'intersection', 'crossing', 'traffic_signals'];
  const isInappropriateType = inappropriateTypes.includes(result.type) ||
                               inappropriateTypes.includes(result.class);

  if (isInappropriateType) {
    issues.push(`Inappropriate place type: ${result.type}/${result.class}`);
  }

  // Check 4: Has address components
  const hasAddressComponents = !!(
    result.address &&
    (result.address.road || result.address.house_number)
  );

  if (!hasAddressComponents) {
    issues.push('Result lacks detailed address components');
  }

  // Calculate overall match score (0-100)
  let matchScore = 0;
  matchScore += nameMatch * 40;  // Name match worth 40 points
  matchScore += cityMatch ? 30 : 0;  // City match worth 30 points
  matchScore += !isInappropriateType ? 20 : 0;  // Appropriate type worth 20 points
  matchScore += hasAddressComponents ? 10 : 0;  // Address components worth 10 points

  // Determine confidence and validity
  let confidence: ValidationConfidence;
  let isValid: boolean;

  if (matchScore >= 80) {
    confidence = 'high';
    isValid = true;
  } else if (matchScore >= 60) {
    confidence = 'medium';
    isValid = true;
  } else if (matchScore >= 40) {
    confidence = 'low';
    isValid = true;
    issues.push('Low overall match score - manual review recommended');
  } else {
    confidence = 'reject';
    isValid = false;
    issues.push('Match score too low - likely incorrect location');
  }

  return {
    isValid,
    confidence,
    matchScore,
    issues,
    matchDetails: {
      nameMatch,
      cityMatch,
      placeTypeAppropriate: !isInappropriateType,
      hasAddressComponents,
    },
  };
}

// ============================================================================
// Layer 3: Distance Validation
// ============================================================================

/**
 * Calculates the Haversine distance between two lat/lng points in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Validates the distance between geocoded coordinates and expected location
 *
 * @param addressQuality - Address quality from Layer 1
 * @param newLat - Newly geocoded latitude
 * @param newLng - Newly geocoded longitude
 * @param existingLat - Existing latitude (optional, for comparison)
 * @param existingLng - Existing longitude (optional, for comparison)
 * @returns Distance validation result
 */
export function validateDistance(
  addressQuality: AddressValidationResult['addressQuality'],
  newLat: number,
  newLng: number,
  existingLat?: number | null,
  existingLng?: number | null
): DistanceValidationResult {
  // If no existing coordinates, we can't validate distance
  if (existingLat == null || existingLng == null) {
    return {
      isValid: true,
      distance: null,
      withinThreshold: true,
      threshold: 0,
      reason: 'No existing coordinates to compare against',
    };
  }

  // Calculate distance
  const distance = calculateDistance(existingLat, existingLng, newLat, newLng);

  // Determine threshold based on address quality
  let threshold: number;

  if (addressQuality.isCompleteAddress) {
    // Full address: expect very close match (<50m)
    threshold = 50;
  } else if (addressQuality.hasStreetNumber && addressQuality.hasStreetName) {
    // Partial address: expect reasonable match (<200m)
    threshold = 200;
  } else {
    // Business name only: allow more variance (<500m)
    threshold = 500;
  }

  // Validate against threshold
  const withinThreshold = distance <= threshold;
  const isValid = withinThreshold || distance <= 500; // Hard limit at 500m

  let reason: string | undefined;
  if (!withinThreshold && distance <= 500) {
    reason = `Distance ${Math.round(distance)}m exceeds quality threshold of ${threshold}m but within 500m limit`;
  } else if (!isValid) {
    reason = `Distance ${Math.round(distance)}m exceeds maximum threshold of 500m`;
  }

  return {
    isValid,
    distance,
    withinThreshold,
    threshold,
    reason,
  };
}

// ============================================================================
// Layer 4: Confidence Scoring & Final Validation
// ============================================================================

/**
 * Performs complete validation of geocoding operation
 * Combines all layers into a final decision
 *
 * @param booth - Booth data
 * @param geocodeResult - Nominatim result (optional if not yet geocoded)
 * @param existingLat - Existing latitude (optional)
 * @param existingLng - Existing longitude (optional)
 * @returns Final validation result with metadata
 */
export function performFinalValidation(
  booth: BoothAddressData,
  geocodeResult?: NominatimResult | null,
  existingLat?: number | null,
  existingLng?: number | null
): FinalValidationResult {
  const allIssues: string[] = [];

  // Layer 1: Address completeness
  const addressValidation = validateAddressCompleteness(booth);
  allIssues.push(...addressValidation.issues);

  // If address validation rejects, don't proceed with geocoding
  if (!addressValidation.isValid || addressValidation.confidence === 'reject') {
    return {
      isValid: false,
      shouldGeocode: false,
      confidence: 'reject',
      geocodeProvider: 'none',
      issues: allIssues,
      metadata: {
        addressValidation,
      },
    };
  }

  // If no geocode result provided, return address validation only
  if (!geocodeResult) {
    return {
      isValid: addressValidation.isValid,
      shouldGeocode: true,
      confidence: addressValidation.confidence,
      geocodeProvider: 'nominatim',
      issues: allIssues,
      metadata: {
        addressValidation,
      },
    };
  }

  // Layer 2: Geocode result validation
  const geocodeValidation = validateGeocodeResult(booth, geocodeResult);
  allIssues.push(...geocodeValidation.issues);

  // Layer 3: Distance validation (if we have existing coordinates)
  const distanceValidation = validateDistance(
    addressValidation.addressQuality,
    parseFloat(geocodeResult.lat),
    parseFloat(geocodeResult.lon),
    existingLat,
    existingLng
  );

  if (distanceValidation.reason) {
    allIssues.push(distanceValidation.reason);
  }

  // Determine final confidence (use the lowest confidence from all layers)
  const confidenceLevels: ValidationConfidence[] = [
    addressValidation.confidence,
    geocodeValidation.confidence,
  ];

  // Add distance confidence impact
  if (!distanceValidation.withinThreshold && distanceValidation.distance && distanceValidation.distance > 200) {
    confidenceLevels.push('low');
  }

  const confidenceOrder: ValidationConfidence[] = ['reject', 'low', 'medium', 'high'];
  const finalConfidence = confidenceLevels.reduce((lowest, current) => {
    return confidenceOrder.indexOf(current) < confidenceOrder.indexOf(lowest)
      ? current
      : lowest;
  });

  // Final validity check
  const isValid =
    addressValidation.isValid &&
    geocodeValidation.isValid &&
    distanceValidation.isValid &&
    finalConfidence !== 'reject';

  return {
    isValid,
    shouldGeocode: true,
    confidence: finalConfidence,
    geocodeProvider: 'nominatim',
    issues: allIssues,
    metadata: {
      addressValidation,
      geocodeValidation,
      distanceValidation,
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Converts validation result to database-friendly format
 */
export function getGeocodeMetadata(validation: FinalValidationResult) {
  return {
    geocode_provider: validation.geocodeProvider,
    geocode_confidence: validation.confidence,
    geocode_match_score: validation.metadata.geocodeValidation?.matchScore ?? null,
    geocode_validation_issues: validation.issues.length > 0 ? validation.issues : null,
    geocode_validated_at: new Date().toISOString(),
  };
}

/**
 * Determines if a booth should be flagged for manual review
 */
export function shouldFlagForReview(validation: FinalValidationResult): boolean {
  return (
    !validation.isValid ||
    validation.confidence === 'low' ||
    validation.confidence === 'reject' ||
    (validation.metadata.geocodeValidation?.matchScore ?? 100) < 60 ||
    (validation.metadata.distanceValidation?.distance ?? 0) > 200
  );
}
