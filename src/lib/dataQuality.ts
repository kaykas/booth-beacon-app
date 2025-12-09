/**
 * DATA QUALITY SCORING SYSTEM
 *
 * Calculates a quality score (0-100%) for booth records based on field completeness.
 * Target: 80% data quality for all booth pages.
 *
 * Scoring Breakdown:
 * - Address: 10 points
 * - State: 5 points
 * - Coordinates (lat/lng): 10 points
 * - Phone: 10 points
 * - Website: 10 points
 * - Hours: 10 points
 * - Description: 5 points
 * - Image (photo_exterior_url or ai_preview_url): 15 points (CRITICAL)
 * - Photos array: 10 points
 * - Google Place ID: 10 points
 * - Active status: 5 points
 *
 * Total: 100 points
 */

export interface BoothQualityData {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  description: string | null;
  photo_exterior_url: string | null;
  ai_preview_url: string | null;
  photos: string[] | null;
  google_place_id: string | null;
  status: string;
}

export interface QualityScore {
  score: number; // 0-100
  missingFields: string[];
  needsEnrichment: boolean; // true if score < 80
  enrichmentPriority: 'critical' | 'high' | 'medium' | 'low' | 'complete';
}

export interface EnrichmentNeeds {
  needsVenueData: boolean;
  needsImage: boolean;
  needsGeocoding: boolean;
  missingFields: {
    address: boolean;
    state: boolean;
    phone: boolean;
    website: boolean;
    hours: boolean;
    image: boolean;
    coordinates: boolean;
    googlePlaceId: boolean;
  };
}

/**
 * Check if address has a street number (required for valid addresses)
 */
function hasStreetNumber(address: string | null): boolean {
  if (!address) return false;
  return /\d+\s+[A-Za-z]/.test(address);
}

/**
 * Calculate data quality score for a booth
 *
 * UPDATED: Now penalizes addresses without street numbers or addresses matching business name
 */
export function calculateQualityScore(booth: BoothQualityData): QualityScore {
  let score = 0;
  const missingFields: string[] = [];

  // Address: 10 points (but penalize if missing street number or too short)
  if (booth.address) {
    // Check for bad address indicators
    const addressLength = booth.address.trim().length;
    const hasStreetNum = hasStreetNumber(booth.address);

    // PENALTY: Address without street number (reduces by 30%)
    if (!hasStreetNum) {
      score += 7; // 70% of 10 points
      missingFields.push('address (missing street number)');
    }
    // PENALTY: Address too short (likely just a name)
    else if (addressLength < 10) {
      score += 7; // 70% of 10 points
      missingFields.push('address (too short - <10 chars)');
    }
    // PENALTY: Address might be business name (same as booth name)
    else if (booth.address.trim().toLowerCase() === booth.name.trim().toLowerCase()) {
      score += 0; // 0 points - this is bad data
      missingFields.push('address (appears to be business name, not street address)');
    } else {
      // Good address with street number
      score += 10;
    }
  } else {
    missingFields.push('address');
  }

  // State: 5 points
  if (booth.state) {
    score += 5;
  } else {
    missingFields.push('state');
  }

  // Coordinates: 10 points (both required)
  if (booth.latitude && booth.longitude) {
    score += 10;
  } else {
    missingFields.push('coordinates');
  }

  // Phone: 10 points
  if (booth.phone) {
    score += 10;
  } else {
    missingFields.push('phone');
  }

  // Website: 10 points
  if (booth.website) {
    score += 10;
  } else {
    missingFields.push('website');
  }

  // Hours: 10 points
  if (booth.hours) {
    score += 10;
  } else {
    missingFields.push('hours');
  }

  // Description: 5 points
  if (booth.description) {
    score += 5;
  } else {
    missingFields.push('description');
  }

  // Image: 15 points (CRITICAL - either real photo or AI preview)
  if (booth.photo_exterior_url || booth.ai_preview_url) {
    score += 15;
  } else {
    missingFields.push('image');
  }

  // Photos array: 10 points
  if (booth.photos && booth.photos.length > 0) {
    score += 10;
  } else {
    missingFields.push('photos');
  }

  // Google Place ID: 10 points
  if (booth.google_place_id) {
    score += 10;
  } else {
    missingFields.push('google_place_id');
  }

  // Active status: 5 points
  if (booth.status === 'active') {
    score += 5;
  } else {
    missingFields.push('status');
  }

  // Determine enrichment priority
  let enrichmentPriority: QualityScore['enrichmentPriority'];
  if (score >= 80) {
    enrichmentPriority = 'complete';
  } else if (score < 50) {
    enrichmentPriority = 'critical';
  } else if (score < 65) {
    enrichmentPriority = 'high';
  } else if (score < 80) {
    enrichmentPriority = 'medium';
  } else {
    enrichmentPriority = 'low';
  }

  return {
    score,
    missingFields,
    needsEnrichment: score < 80,
    enrichmentPriority,
  };
}

/**
 * Determine what enrichment operations are needed for a booth
 */
export function determineEnrichmentNeeds(booth: BoothQualityData): EnrichmentNeeds {
  const needsAddress = !booth.address;
  const needsPhone = !booth.phone;
  const needsWebsite = !booth.website;
  const needsHours = !booth.hours;
  const needsImage = !booth.photo_exterior_url && !booth.ai_preview_url;
  const needsCoordinates = !booth.latitude || !booth.longitude;
  const needsGooglePlaceId = !booth.google_place_id;

  // Venue enrichment can provide: address, phone, website, hours, photos, coordinates, google_place_id
  const needsVenueData = needsAddress || needsPhone || needsWebsite || needsHours || needsGooglePlaceId;

  // Image generation needed if no photo exists
  const needsImageGeneration = needsImage;

  // Geocoding needed if no coordinates (and venue enrichment might not provide them)
  const needsGeocoding = needsCoordinates;

  return {
    needsVenueData,
    needsImage: needsImageGeneration,
    needsGeocoding,
    missingFields: {
      address: needsAddress,
      state: !booth.state,
      phone: needsPhone,
      website: needsWebsite,
      hours: needsHours,
      image: needsImage,
      coordinates: needsCoordinates,
      googlePlaceId: needsGooglePlaceId,
    },
  };
}

/**
 * Query booths that need enrichment (score < 80%)
 * Returns SQL query filter
 */
export function getEnrichmentQuery() {
  // This would be used in a Supabase query
  // We can't calculate score in SQL easily, so we filter by missing critical fields
  return `
    (
      address.is.null
      OR phone.is.null
      OR website.is.null
      OR (photo_exterior_url.is.null AND ai_preview_url.is.null)
      OR latitude.is.null
      OR longitude.is.null
    )
    AND status.eq.active
  `;
}

/**
 * Get summary statistics for booth quality across the database
 */
export interface QualityStatistics {
  total: number;
  complete: number; // >= 80%
  needsEnrichment: number; // < 80%
  critical: number; // < 50%
  averageScore: number;
  missingByField: {
    address: number;
    phone: number;
    website: number;
    image: number;
    coordinates: number;
    hours: number;
  };
}

export function calculateQualityStatistics(booths: BoothQualityData[]): QualityStatistics {
  const scores = booths.map((b) => calculateQualityScore(b));

  const total = booths.length;
  const complete = scores.filter((s) => s.score >= 80).length;
  const needsEnrichment = scores.filter((s) => s.score < 80).length;
  const critical = scores.filter((s) => s.score < 50).length;
  const averageScore = scores.reduce((sum, s) => sum + s.score, 0) / total;

  // Count missing fields
  const missingByField = {
    address: booths.filter((b) => !b.address).length,
    phone: booths.filter((b) => !b.phone).length,
    website: booths.filter((b) => !b.website).length,
    image: booths.filter((b) => !b.photo_exterior_url && !b.ai_preview_url).length,
    coordinates: booths.filter((b) => !b.latitude || !b.longitude).length,
    hours: booths.filter((b) => !b.hours).length,
  };

  return {
    total,
    complete,
    needsEnrichment,
    critical,
    averageScore,
    missingByField,
  };
}
