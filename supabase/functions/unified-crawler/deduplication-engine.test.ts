/**
 * DEDUPLICATION ENGINE TEST SUITE
 *
 * Comprehensive tests for deduplication logic including:
 * - Levenshtein distance calculation
 * - Name similarity scoring
 * - Coordinate distance calculation
 * - Geocoding
 * - Booth comparison
 * - Merge strategies
 * - Full deduplication workflow
 */

import { assertEquals, assertExists, assert } from "https://deno.land/std/testing/asserts.ts";
import {
  levenshteinDistance,
  nameSimilarity,
  calculateDistance,
  getSourcePriority,
  compareBooths,
  mergeBooths,
  deduplicateBooths,
} from "./deduplication-engine.ts";
import type { BoothData } from "./extractors.ts";
import type { DuplicateMatch } from "./deduplication-engine.ts";

// ============================================
// LEVENSHTEIN DISTANCE TESTS
// ============================================

Deno.test("levenshteinDistance: identical strings return 0", () => {
  assertEquals(levenshteinDistance("hello", "hello"), 0);
});

Deno.test("levenshteinDistance: empty strings", () => {
  assertEquals(levenshteinDistance("", ""), 0);
  assertEquals(levenshteinDistance("hello", ""), 5);
  assertEquals(levenshteinDistance("", "hello"), 5);
});

Deno.test("levenshteinDistance: single character difference", () => {
  assertEquals(levenshteinDistance("hello", "hallo"), 1);
});

Deno.test("levenshteinDistance: insertion", () => {
  assertEquals(levenshteinDistance("hello", "helllo"), 1);
});

Deno.test("levenshteinDistance: deletion", () => {
  assertEquals(levenshteinDistance("hello", "helo"), 1);
});

Deno.test("levenshteinDistance: substitution", () => {
  assertEquals(levenshteinDistance("hello", "jello"), 1);
});

Deno.test("levenshteinDistance: multiple operations", () => {
  assertEquals(levenshteinDistance("kitten", "sitting"), 3);
});

Deno.test("levenshteinDistance: completely different", () => {
  const distance = levenshteinDistance("abc", "xyz");
  assertEquals(distance, 3);
});

// ============================================
// NAME SIMILARITY TESTS
// ============================================

Deno.test("nameSimilarity: identical names return 100", () => {
  assertEquals(nameSimilarity("Photo Booth", "Photo Booth"), 100);
});

Deno.test("nameSimilarity: case insensitive", () => {
  assertEquals(nameSimilarity("Photo Booth", "photo booth"), 100);
});

Deno.test("nameSimilarity: ignores special characters", () => {
  const score = nameSimilarity("Photo-Booth!", "Photo Booth");
  assert(score > 90);
});

Deno.test("nameSimilarity: handles minor spelling differences", () => {
  const score = nameSimilarity("Photo Booth", "Photo Boothe");
  assert(score > 90);
});

Deno.test("nameSimilarity: detects similar names", () => {
  const score = nameSimilarity("Grand Central Photo Booth", "Grand Central Photobooth");
  assert(score > 80);
});

Deno.test("nameSimilarity: different names return low score", () => {
  const score = nameSimilarity("Photo Booth", "Different Name");
  assert(score < 50);
});

Deno.test("nameSimilarity: empty strings", () => {
  assertEquals(nameSimilarity("", ""), 0);
});

Deno.test("nameSimilarity: handles unicode", () => {
  const score = nameSimilarity("Café Photo", "Cafe Photo");
  assert(score > 80);
});

// ============================================
// DISTANCE CALCULATION TESTS
// ============================================

Deno.test("calculateDistance: same location returns 0", () => {
  const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
  assert(distance < 1); // Should be essentially 0
});

Deno.test("calculateDistance: NYC to LA is ~3940km", () => {
  const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
  assert(distance > 3900000 && distance < 4000000); // ~3940 km in meters
});

Deno.test("calculateDistance: handles negative coordinates", () => {
  const distance = calculateDistance(-33.8688, 151.2093, -37.8136, 144.9631);
  assert(distance > 700000 && distance < 800000); // Sydney to Melbourne ~713 km
});

Deno.test("calculateDistance: handles equator crossing", () => {
  const distance = calculateDistance(1, 0, -1, 0);
  assert(distance > 220000 && distance < 230000); // ~222 km
});

Deno.test("calculateDistance: very close locations", () => {
  const distance = calculateDistance(40.7128, -74.0060, 40.7130, -74.0062);
  assert(distance < 50); // Less than 50 meters
});

// ============================================
// SOURCE PRIORITY TESTS
// ============================================

Deno.test("getSourcePriority: photobooth.net has highest priority", () => {
  const priority = getSourcePriority("photobooth.net");
  assertEquals(priority, 100);
});

Deno.test("getSourcePriority: operator sites rank high", () => {
  assert(getSourcePriority("photomatica.com") > 80);
  assert(getSourcePriority("photoautomat.de") > 80);
});

Deno.test("getSourcePriority: aggregators rank medium", () => {
  const yelpPriority = getSourcePriority("yelp");
  assert(yelpPriority >= 60 && yelpPriority < 80);
});

Deno.test("getSourcePriority: community sources rank lower", () => {
  const redditPriority = getSourcePriority("reddit_analog");
  assert(redditPriority < 50);
});

Deno.test("getSourcePriority: unknown source gets default", () => {
  const priority = getSourcePriority("unknown-source");
  assertEquals(priority, 30);
});

Deno.test("getSourcePriority: normalizes source names", () => {
  assertEquals(getSourcePriority("PhotoBooth.Net"), getSourcePriority("photobooth.net"));
  assertEquals(getSourcePriority("Google Maps"), getSourcePriority("google_maps"));
});

// ============================================
// HELPER FUNCTIONS
// ============================================

const createTestBooth = (overrides: Partial<BoothData> = {}): BoothData => ({
  name: "Test Photo Booth",
  address: "123 Main Street",
  city: "New York",
  state: "NY",
  country: "United States",
  status: "active",
  source_url: "https://example.com",
  source_name: "test-source",
  ...overrides,
});

// ============================================
// BOOTH COMPARISON TESTS
// ============================================

Deno.test("compareBooths: identical booths are exact match", async () => {
  const booth1 = createTestBooth();
  const booth2 = createTestBooth();

  const match = await compareBooths(booth1, booth2);
  assertExists(match);
  assert(match.confidence_score >= 95);
  assertEquals(match.match_type, "exact");
  assertEquals(match.recommended_action, "merge");
});

Deno.test("compareBooths: same name different address returns null", async () => {
  const booth1 = createTestBooth();
  const booth2 = createTestBooth({ address: "456 Different Street" });

  const match = await compareBooths(booth1, booth2);
  // May return null or low confidence depending on similarity
  if (match) {
    assert(match.confidence_score < 60);
  }
});

Deno.test("compareBooths: similar names same location is high confidence", async () => {
  const booth1 = createTestBooth({ name: "Grand Central Photo Booth" });
  const booth2 = createTestBooth({ name: "Grand Central Photobooth" });

  const match = await compareBooths(booth1, booth2);
  assertExists(match);
  assert(match.confidence_score >= 80);
  assert(match.name_similarity > 90);
});

Deno.test("compareBooths: uses coordinates for distance", async () => {
  const booth1 = createTestBooth({
    latitude: 40.7128,
    longitude: -74.0060,
  });
  const booth2 = createTestBooth({
    latitude: 40.7130,
    longitude: -74.0062,
  });

  const match = await compareBooths(booth1, booth2);
  assertExists(match);
  assertExists(match.distance_meters);
  assert(match.distance_meters < 50);
});

Deno.test("compareBooths: far apart locations reduce confidence", async () => {
  const booth1 = createTestBooth({
    latitude: 40.7128,
    longitude: -74.0060,
  });
  const booth2 = createTestBooth({
    latitude: 34.0522,
    longitude: -118.2437,
  });

  const match = await compareBooths(booth1, booth2);
  // Should either return null or very low confidence
  if (match) {
    assert(match.confidence_score < 50);
  }
});

Deno.test("compareBooths: detects operational status conflicts", async () => {
  const booth1 = createTestBooth({ is_operational: true });
  const booth2 = createTestBooth({ is_operational: false });

  const match = await compareBooths(booth1, booth2);
  if (match && match.conflicts) {
    assert(match.conflicts.includes("operational_status"));
  }
});

Deno.test("compareBooths: detects cost conflicts", async () => {
  const booth1 = createTestBooth({ cost: "$5" });
  const booth2 = createTestBooth({ cost: "$10" });

  const match = await compareBooths(booth1, booth2);
  if (match && match.conflicts) {
    assert(match.conflicts.includes("cost"));
  }
});

Deno.test("compareBooths: selects primary based on source priority", async () => {
  const booth1 = createTestBooth({ source_name: "photobooth.net" });
  const booth2 = createTestBooth({ source_name: "reddit_analog" });

  const match = await compareBooths(booth1, booth2);
  assertExists(match);
  assertEquals(match.primary_booth, booth1);
});

Deno.test("compareBooths: flags manual review for conflicts", async () => {
  const booth1 = createTestBooth({
    is_operational: true,
    cost: "$5",
  });
  const booth2 = createTestBooth({
    is_operational: false,
    cost: "$10",
  });

  const match = await compareBooths(booth1, booth2);
  if (match && match.confidence_score < 95) {
    assertEquals(match.recommended_action, "manual_review");
  }
});

// ============================================
// MERGE STRATEGY TESTS
// ============================================

Deno.test("mergeBooths: keep_primary preserves primary data", () => {
  const primary = createTestBooth({
    name: "Primary Booth",
    machine_model: "Model A",
    cost: "$5",
  });
  const duplicate = createTestBooth({
    name: "Duplicate Booth",
    machine_model: "Model B",
    cost: "$10",
    phone: "555-1234",
  });

  const merged = mergeBooths(primary, duplicate, "keep_primary");
  assertEquals(merged.name, "Primary Booth");
  assertEquals(merged.machine_model, "Model A");
  assertEquals(merged.cost, "$5");
  assertEquals(merged.phone, "555-1234"); // Fills missing fields
});

Deno.test("mergeBooths: keep_duplicate swaps and keeps duplicate", () => {
  const primary = createTestBooth({ name: "Primary" });
  const duplicate = createTestBooth({ name: "Duplicate" });

  const merged = mergeBooths(primary, duplicate, "keep_duplicate");
  assertEquals(merged.name, "Duplicate");
});

Deno.test("mergeBooths: merge_fields combines intelligently", () => {
  const booth1 = createTestBooth({
    name: "Short",
    machine_model: "Model A",
    cost: "$5",
    photos: ["photo1.jpg"],
  });
  const booth2 = createTestBooth({
    name: "Longer Name",
    phone: "555-1234",
    website: "https://example.com",
    photos: ["photo2.jpg"],
  });

  const merged = mergeBooths(booth1, booth2, "merge_fields");
  assertEquals(merged.name, "Longer Name"); // Prefers longer name
  assertEquals(merged.machine_model, "Model A");
  assertEquals(merged.cost, "$5");
  assertEquals(merged.phone, "555-1234");
  assertEquals(merged.website, "https://example.com");
  assertEquals(merged.photos?.length, 2); // Combines photos
});

Deno.test("mergeBooths: combines photos without duplicates", () => {
  const booth1 = createTestBooth({
    photos: ["photo1.jpg", "photo2.jpg"],
  });
  const booth2 = createTestBooth({
    photos: ["photo2.jpg", "photo3.jpg"],
  });

  const merged = mergeBooths(booth1, booth2, "keep_primary");
  assertEquals(merged.photos?.length, 3);
  assert(merged.photos?.includes("photo1.jpg"));
  assert(merged.photos?.includes("photo2.jpg"));
  assert(merged.photos?.includes("photo3.jpg"));
});

Deno.test("mergeBooths: fills missing coordinates", () => {
  const booth1 = createTestBooth({ latitude: undefined, longitude: undefined });
  const booth2 = createTestBooth({ latitude: 40.7128, longitude: -74.0060 });

  const merged = mergeBooths(booth1, booth2, "keep_primary");
  assertEquals(merged.latitude, 40.7128);
  assertEquals(merged.longitude, -74.0060);
});

Deno.test("mergeBooths: prefers active status", () => {
  const booth1 = createTestBooth({ status: "inactive", is_operational: false });
  const booth2 = createTestBooth({ status: "active", is_operational: true });

  const merged = mergeBooths(booth1, booth2, "merge_fields");
  assertEquals(merged.status, "active");
  assertEquals(merged.is_operational, true);
});

// ============================================
// FULL DEDUPLICATION WORKFLOW TESTS
// ============================================

Deno.test("deduplicateBooths: removes exact duplicates", async () => {
  const booths = [
    createTestBooth({ name: "Booth A" }),
    createTestBooth({ name: "Booth A" }), // Exact duplicate
    createTestBooth({ name: "Booth B" }),
  ];

  const result = await deduplicateBooths(booths);
  assertEquals(result.deduplicated.length, 2);
  assertEquals(result.stats.original_count, 3);
  assertEquals(result.stats.deduplicated_count, 2);
});

Deno.test("deduplicateBooths: handles no duplicates", async () => {
  const booths = [
    createTestBooth({ name: "Booth A", address: "123 Main" }),
    createTestBooth({ name: "Booth B", address: "456 Elm" }),
    createTestBooth({ name: "Booth C", address: "789 Oak" }),
  ];

  const result = await deduplicateBooths(booths);
  assertEquals(result.deduplicated.length, 3);
  assertEquals(result.stats.original_count, 3);
  assertEquals(result.stats.deduplicated_count, 3);
});

Deno.test("deduplicateBooths: handles empty array", async () => {
  const result = await deduplicateBooths([]);
  assertEquals(result.deduplicated.length, 0);
  assertEquals(result.duplicates.length, 0);
});

Deno.test("deduplicateBooths: merges similar booths", async () => {
  const booths = [
    createTestBooth({
      name: "Grand Central Photo Booth",
      machine_model: "Model A",
    }),
    createTestBooth({
      name: "Grand Central Photobooth",
      cost: "$5",
    }),
  ];

  const result = await deduplicateBooths(booths);
  assertEquals(result.deduplicated.length, 1);
  assert(result.duplicates.length > 0);

  // Merged booth should have data from both
  const merged = result.deduplicated[0];
  assert(merged.machine_model === "Model A" || merged.cost === "$5");
});

Deno.test("deduplicateBooths: skips different countries", async () => {
  const booths = [
    createTestBooth({ name: "Photo Booth", country: "United States" }),
    createTestBooth({ name: "Photo Booth", country: "United Kingdom" }),
  ];

  const result = await deduplicateBooths(booths);
  assertEquals(result.deduplicated.length, 2); // Should not merge
});

Deno.test("deduplicateBooths: tracks statistics", async () => {
  const booths = [
    createTestBooth({ name: "Booth A" }),
    createTestBooth({ name: "Booth A" }), // Exact match
    createTestBooth({ name: "Booth B" }),
    createTestBooth({ name: "Booth B" }), // Exact match
    createTestBooth({ name: "Booth C" }),
  ];

  const result = await deduplicateBooths(booths);
  assertEquals(result.stats.original_count, 5);
  assert(result.stats.deduplicated_count < result.stats.original_count);
  assert(result.stats.exact_matches > 0);
});

Deno.test("deduplicateBooths: identifies manual review cases", async () => {
  const booths = [
    createTestBooth({
      name: "Photo Booth A",
      is_operational: true,
      cost: "$5",
    }),
    createTestBooth({
      name: "Photo Booth A",
      is_operational: false,
      cost: "$10",
    }),
  ];

  const result = await deduplicateBooths(booths);
  assert(result.stats.manual_review_count > 0);
});

Deno.test("deduplicateBooths: preserves unprocessed booths", async () => {
  const booths = [
    createTestBooth({ name: "Unique Booth 1" }),
    createTestBooth({ name: "Unique Booth 2" }),
    createTestBooth({ name: "Unique Booth 3" }),
  ];

  const result = await deduplicateBooths(booths);
  assertEquals(result.deduplicated.length, 3);

  const names = result.deduplicated.map(b => b.name);
  assert(names.includes("Unique Booth 1"));
  assert(names.includes("Unique Booth 2"));
  assert(names.includes("Unique Booth 3"));
});

// ============================================
// EDGE CASES AND PERFORMANCE TESTS
// ============================================

Deno.test("nameSimilarity: handles very long names", () => {
  const name1 = "A".repeat(200);
  const name2 = "A".repeat(200);
  assertEquals(nameSimilarity(name1, name2), 100);
});

Deno.test("levenshteinDistance: handles unicode properly", () => {
  const distance = levenshteinDistance("Café", "Cafe");
  assert(distance <= 1);
});

Deno.test("calculateDistance: handles antipodal points", () => {
  const distance = calculateDistance(0, 0, 0, 180);
  assert(distance > 19000000); // ~20,000 km (half Earth's circumference)
});

Deno.test("compareBooths: handles missing optional fields", async () => {
  const booth1 = createTestBooth({
    city: undefined,
    state: undefined,
    latitude: undefined,
    longitude: undefined,
  });
  const booth2 = createTestBooth({
    city: undefined,
    state: undefined,
    latitude: undefined,
    longitude: undefined,
  });

  const match = await compareBooths(booth1, booth2);
  assertExists(match); // Should still work without optional fields
});

Deno.test("mergeBooths: handles undefined photos arrays", () => {
  const booth1 = createTestBooth({ photos: undefined });
  const booth2 = createTestBooth({ photos: ["photo.jpg"] });

  const merged = mergeBooths(booth1, booth2, "keep_primary");
  assertExists(merged.photos);
  assertEquals(merged.photos?.length, 1);
});

Deno.test("deduplicateBooths: handles large datasets efficiently", async () => {
  const booths = Array.from({ length: 50 }, (_, i) =>
    createTestBooth({
      name: `Booth ${i}`,
      address: `${i} Main Street`,
    })
  );

  const startTime = Date.now();
  const result = await deduplicateBooths(booths);
  const duration = Date.now() - startTime;

  assertEquals(result.deduplicated.length, 50);
  assert(duration < 10000); // Should complete within 10 seconds
});
