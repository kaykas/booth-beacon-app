/**
 * ENHANCED DEDUPLICATION ENGINE
 *
 * Implements intelligent deduplication using:
 * - Levenshtein distance for name matching
 * - Geocoding and coordinate comparison
 * - Source priority resolution
 * - Conflict detection and manual review flagging
 *
 * This engine runs AFTER extractors and BEFORE database insertion
 * to prevent duplicate booths from entering the system.
 */

import { BoothData } from "./extractors";

/**
 * Levenshtein Distance Algorithm
 * Calculates the minimum number of edits (insertions, deletions, substitutions)
 * needed to transform one string into another
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity percentage between two strings
 * Returns 0-100 where 100 is exact match
 */
export function nameSimilarity(name1: string, name2: string): number {
  // Normalize names: lowercase, remove special chars, trim whitespace
  const normalized1 = name1.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const normalized2 = name2.toLowerCase().replace(/[^\w\s]/g, '').trim();

  if (normalized1 === normalized2) return 100;

  const maxLen = Math.max(normalized1.length, normalized2.length);
  if (maxLen === 0) return 0;

  const distance = levenshteinDistance(normalized1, normalized2);
  const similarity = ((maxLen - distance) / maxLen) * 100;

  return Math.round(similarity * 100) / 100; // Round to 2 decimal places
}

/**
 * Haversine Formula for calculating distance between coordinates
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
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
 * Geocode an address to lat/long coordinates
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
export async function geocodeAddress(
  address: string,
  city?: string,
  country?: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    // Build query string
    const parts = [address];
    if (city) parts.push(city);
    if (country) parts.push(country);
    const query = encodeURIComponent(parts.join(', '));

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'BoothBeacon/1.0 (booth-beacon.com)', // Required by Nominatim
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * SOURCE PRIORITY LEVELS
 * Higher priority = more trustworthy
 */
export const SOURCE_PRIORITY: Record<string, number> = {
  // Tier 1: Operator Sites (highest priority)
  'photobooth.net': 100,
  'photomatica.com': 95,
  'photoautomat.de': 90,
  'photomatic.net': 85,

  // Tier 2: Aggregators
  'yelp': 70,
  'google_maps': 75,
  'foursquare': 65,

  // Tier 3: Directories
  'atlas_obscura': 60,
  'roadtrippers': 55,

  // Tier 4: Community Sources (validation only)
  'reddit_analog': 40,
  'reddit_photobooth': 45,
  'analog_cafe': 35,
  'smithsonian': 50,

  // Default
  'generic': 30,
};

/**
 * Get priority for a source
 */
export function getSourcePriority(sourceName: string): number {
  const normalized = sourceName.toLowerCase().replace(/[^\w]/g, '_');
  return SOURCE_PRIORITY[normalized] || SOURCE_PRIORITY.generic;
}

/**
 * Deduplication Match Result
 */
export interface DuplicateMatch {
  booth1: BoothData;
  booth2: BoothData;
  confidence_score: number; // 0-100
  match_type: "exact" | "high_confidence" | "probable" | "manual_review";
  name_similarity: number;
  location_similarity: number;
  distance_meters?: number;
  recommended_action: "merge" | "keep_both" | "manual_review";
  merge_strategy?: "keep_primary" | "keep_duplicate" | "merge_fields";
  primary_booth?: BoothData; // Which booth to keep
  conflicts?: string[]; // Fields with conflicting data
}

/**
 * Compare two booths and determine if they're duplicates
 */
export async function compareBooths(
  booth1: BoothData,
  booth2: BoothData
): Promise<DuplicateMatch | null> {
  // Calculate name similarity
  const nameScore = nameSimilarity(booth1.name, booth2.name);

  // Calculate address similarity if both have addresses
  let addressScore = 0;
  if (booth1.address && booth2.address) {
    addressScore = nameSimilarity(booth1.address, booth2.address);
  }

  // Calculate location similarity (city + country)
  let locationScore = 0;
  if (booth1.city && booth2.city) {
    const cityScore = nameSimilarity(booth1.city, booth2.city);
    const countryMatch = booth1.country === booth2.country ? 100 : 0;
    locationScore = (cityScore + countryMatch) / 2;
  }

  // Calculate distance between coordinates if both exist
  let distanceMeters: number | undefined;
  if (
    booth1.latitude &&
    booth1.longitude &&
    booth2.latitude &&
    booth2.longitude
  ) {
    distanceMeters = calculateDistance(
      booth1.latitude,
      booth1.longitude,
      booth2.latitude,
      booth2.longitude
    );
  }

  // If missing coordinates, try to geocode
  if (!distanceMeters && booth1.address && booth2.address) {
    const coords1 = await geocodeAddress(booth1.address, booth1.city, booth1.country);
    const coords2 = await geocodeAddress(booth2.address, booth2.city, booth2.country);

    if (coords1 && coords2) {
      distanceMeters = calculateDistance(
        coords1.latitude,
        coords1.longitude,
        coords2.latitude,
        coords2.longitude
      );

      // Update booth coordinates for future use
      booth1.latitude = coords1.latitude;
      booth1.longitude = coords1.longitude;
      booth2.latitude = coords2.latitude;
      booth2.longitude = coords2.longitude;
    }
  }

  // Calculate overall confidence score
  let confidenceScore = 0;
  let weights = 0;

  // Name is most important
  confidenceScore += nameScore * 0.4;
  weights += 0.4;

  // Address if available
  if (addressScore > 0) {
    confidenceScore += addressScore * 0.3;
    weights += 0.3;
  }

  // Location (city/country)
  if (locationScore > 0) {
    confidenceScore += locationScore * 0.2;
    weights += 0.2;
  }

  // Distance penalty/boost
  if (distanceMeters !== undefined) {
    let distanceScore = 0;
    if (distanceMeters < 10) distanceScore = 100; // Same location
    else if (distanceMeters < 50) distanceScore = 80; // Very close
    else if (distanceMeters < 200) distanceScore = 50; // Same block
    else if (distanceMeters < 1000) distanceScore = 20; // Same neighborhood
    else distanceScore = 0; // Too far apart

    confidenceScore += distanceScore * 0.1;
    weights += 0.1;
  }

  // Normalize confidence score
  if (weights > 0) {
    confidenceScore = (confidenceScore / weights);
  }

  // Determine match type and recommended action
  let match_type: DuplicateMatch["match_type"];
  let recommended_action: DuplicateMatch["recommended_action"];
  let merge_strategy: DuplicateMatch["merge_strategy"] | undefined;

  if (confidenceScore >= 95) {
    match_type = "exact";
    recommended_action = "merge";
  } else if (confidenceScore >= 80) {
    match_type = "high_confidence";
    recommended_action = "merge";
  } else if (confidenceScore >= 60) {
    match_type = "probable";
    recommended_action = "manual_review";
  } else if (confidenceScore >= 40) {
    match_type = "manual_review";
    recommended_action = "manual_review";
  } else {
    // Not a duplicate
    return null;
  }

  // Determine which booth to keep as primary based on source priority
  const priority1 = getSourcePriority(booth1.source_name);
  const priority2 = getSourcePriority(booth2.source_name);

  let primary_booth: BoothData;
  if (priority1 > priority2) {
    primary_booth = booth1;
    merge_strategy = "keep_primary";
  } else if (priority2 > priority1) {
    primary_booth = booth2;
    merge_strategy = "keep_primary";
  } else {
    // Same priority - merge fields from both
    primary_booth = booth1;
    merge_strategy = "merge_fields";
  }

  // Detect conflicts
  const conflicts: string[] = [];
  if (booth1.is_operational !== booth2.is_operational) {
    conflicts.push("operational_status");
  }
  if (booth1.cost && booth2.cost && booth1.cost !== booth2.cost) {
    conflicts.push("cost");
  }
  if (booth1.hours && booth2.hours && booth1.hours !== booth2.hours) {
    conflicts.push("hours");
  }
  if (booth1.machine_model && booth2.machine_model && booth1.machine_model !== booth2.machine_model) {
    conflicts.push("machine_model");
  }

  // If conflicts exist, flag for manual review
  if (conflicts.length > 0 && confidenceScore < 95) {
    recommended_action = "manual_review";
  }

  return {
    booth1,
    booth2,
    confidence_score: Math.round(confidenceScore * 100) / 100,
    match_type,
    name_similarity: nameScore,
    location_similarity: locationScore,
    distance_meters: distanceMeters ? Math.round(distanceMeters * 10) / 10 : undefined,
    recommended_action,
    merge_strategy,
    primary_booth,
    conflicts: conflicts.length > 0 ? conflicts : undefined,
  };
}

/**
 * Merge two booths according to strategy
 */
export function mergeBooths(
  primary: BoothData,
  duplicate: BoothData,
  strategy: "keep_primary" | "keep_duplicate" | "merge_fields"
): BoothData {
  if (strategy === "keep_duplicate") {
    // Swap and use keep_primary logic
    return mergeBooths(duplicate, primary, "keep_primary");
  }

  if (strategy === "keep_primary") {
    // Keep all primary data, only add missing fields from duplicate
    return {
      ...primary,
      // Fill in missing coordinates
      latitude: primary.latitude || duplicate.latitude,
      longitude: primary.longitude || duplicate.longitude,
      // Fill in missing details
      machine_model: primary.machine_model || duplicate.machine_model,
      machine_manufacturer: primary.machine_manufacturer || duplicate.machine_manufacturer,
      cost: primary.cost || duplicate.cost,
      hours: primary.hours || duplicate.hours,
      phone: primary.phone || duplicate.phone,
      website: primary.website || duplicate.website,
      // Combine photos
      photos: [
        ...(primary.photos || []),
        ...(duplicate.photos || []).filter(p => !primary.photos?.includes(p)),
      ],
    };
  }

  // merge_fields strategy: intelligently combine data from both
  return {
    // Use more complete name
    name: primary.name.length >= duplicate.name.length ? primary.name : duplicate.name,
    // Use more complete address
    address: primary.address || duplicate.address,
    city: primary.city || duplicate.city,
    state: primary.state || duplicate.state,
    country: primary.country || duplicate.country,
    postal_code: primary.postal_code || duplicate.postal_code,
    // Use coordinates with better precision
    latitude: primary.latitude || duplicate.latitude,
    longitude: primary.longitude || duplicate.longitude,
    // Machine info: prefer more specific
    machine_model: primary.machine_model || duplicate.machine_model,
    machine_manufacturer: primary.machine_manufacturer || duplicate.machine_manufacturer,
    booth_type: primary.booth_type || duplicate.booth_type,
    // Operational details: prefer most recent/specific
    cost: primary.cost || duplicate.cost,
    accepts_cash: primary.accepts_cash ?? duplicate.accepts_cash,
    accepts_card: primary.accepts_card ?? duplicate.accepts_card,
    hours: primary.hours || duplicate.hours,
    // Status: if either says operational, it probably is
    is_operational: primary.is_operational || duplicate.is_operational,
    status: primary.status === 'active' ? primary.status : duplicate.status,
    // Combine descriptions
    description: [primary.description, duplicate.description]
      .filter(Boolean)
      .join(' | '),
    // Contact info
    website: primary.website || duplicate.website,
    phone: primary.phone || duplicate.phone,
    // Combine photos
    photos: [
      ...(primary.photos || []),
      ...(duplicate.photos || []).filter(p => !primary.photos?.includes(p)),
    ],
    // Source tracking (combined in the database layer)
    source_url: primary.source_url,
    source_name: primary.source_name,
  };
}

/**
 * Process an array of booths and identify all duplicates
 * Returns: deduplicated booths and duplicate matches for database storage
 */
export async function deduplicateBooths(
  booths: BoothData[]
): Promise<{
  deduplicated: BoothData[];
  duplicates: DuplicateMatch[];
  stats: {
    original_count: number;
    deduplicated_count: number;
    exact_matches: number;
    high_confidence_matches: number;
    probable_matches: number;
    manual_review_count: number;
  };
}> {
  const duplicates: DuplicateMatch[] = [];
  const processed = new Set<number>();
  const deduplicated: BoothData[] = [];

  console.log(`Starting deduplication of ${booths.length} booths...`);

  // Compare each booth with every other booth
  for (let i = 0; i < booths.length; i++) {
    if (processed.has(i)) continue;

    const booth1 = booths[i];
    let hasDuplicate = false;

    for (let j = i + 1; j < booths.length; j++) {
      if (processed.has(j)) continue;

      const booth2 = booths[j];

      // Quick filter: skip if countries don't match
      if (booth1.country !== booth2.country) continue;

      // Quick filter: skip if names are too different (optimization)
      const quickNameScore = nameSimilarity(
        booth1.name.substring(0, 20),
        booth2.name.substring(0, 20)
      );
      if (quickNameScore < 30) continue;

      // Full comparison
      const match = await compareBooths(booth1, booth2);

      if (match) {
        duplicates.push(match);
        hasDuplicate = true;

        // If auto-merge recommended, merge and mark duplicate as processed
        if (match.recommended_action === "merge") {
          const merged = mergeBooths(
            match.primary_booth!,
            match.primary_booth === booth1 ? booth2 : booth1,
            match.merge_strategy!
          );

          // Replace booth1 with merged version
          booths[i] = merged;
          processed.add(j);

          console.log(
            `Auto-merged: "${booth1.name}" + "${booth2.name}" (confidence: ${match.confidence_score}%)`
          );
        }
      }
    }

    // Add booth (original or merged) to deduplicated list
    if (!processed.has(i)) {
      deduplicated.push(booths[i]);
      processed.add(i);
    }
  }

  // Calculate stats
  const stats = {
    original_count: booths.length,
    deduplicated_count: deduplicated.length,
    exact_matches: duplicates.filter(d => d.match_type === "exact").length,
    high_confidence_matches: duplicates.filter(d => d.match_type === "high_confidence").length,
    probable_matches: duplicates.filter(d => d.match_type === "probable").length,
    manual_review_count: duplicates.filter(d => d.recommended_action === "manual_review").length,
  };

  console.log(`Deduplication complete:`);
  console.log(`  Original: ${stats.original_count}`);
  console.log(`  Deduplicated: ${stats.deduplicated_count}`);
  console.log(`  Removed: ${stats.original_count - stats.deduplicated_count}`);
  console.log(`  Manual review needed: ${stats.manual_review_count}`);

  return {
    deduplicated,
    duplicates,
    stats,
  };
}

/**
 * Store duplicate matches in the database for manual review
 */
export async function storeDuplicateMatches(
  duplicates: DuplicateMatch[],
  supabase: any // Supabase client
): Promise<void> {
  for (const dup of duplicates) {
    try {
      // Find booth IDs in database (would need to query by name/address)
      // This is a placeholder - actual implementation would query the booths table

      const duplicateRecord = {
        // primary_booth_id: primaryId,
        // duplicate_booth_id: duplicateId,
        confidence_score: dup.confidence_score,
        match_type: dup.match_type,
        name_similarity: dup.name_similarity,
        location_similarity: dup.location_similarity,
        distance_meters: dup.distance_meters,
        merge_status: dup.recommended_action === "merge" ? "merged" : "manual_review",
        merge_strategy: dup.merge_strategy,
        primary_sources: [dup.booth1.source_name],
        duplicate_sources: [dup.booth2.source_name],
      };

      // Would insert into booth_duplicates table
      // await supabase.from('booth_duplicates').insert(duplicateRecord);

      console.log(
        `Stored duplicate: ${dup.booth1.name} vs ${dup.booth2.name} (${dup.confidence_score}%)`
      );
    } catch (error) {
      console.error(`Failed to store duplicate record:`, error);
    }
  }
}
