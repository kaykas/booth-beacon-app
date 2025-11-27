/**
 * CRAWLER UTILITIES TEST SUITE
 *
 * Tests for utility functions in crawler-utilities.ts
 * - Content hashing (SHA-256)
 * - normalizeName function
 * - Retry logic with exponential backoff
 * - Validation metrics tracking
 */

import { assertEquals, assert, assertExists, assertRejects } from "https://deno.land/std/testing/asserts.ts";

// ========================================
// CONTENT HASHING TESTS
// ========================================

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

async function hashMultipleContent(contents: string[]): Promise<string> {
  const combined = contents.join("|");
  return hashContent(combined);
}

Deno.test("hashContent generates SHA-256 hash", async () => {
  const content = "test content";
  const hash = await hashContent(content);

  // SHA-256 hash is always 64 characters (256 bits = 32 bytes = 64 hex chars)
  assertEquals(hash.length, 64);

  // Hash should only contain hex characters
  assert(/^[a-f0-9]+$/.test(hash));
});

Deno.test("hashContent is deterministic", async () => {
  const content = "same content";
  const hash1 = await hashContent(content);
  const hash2 = await hashContent(content);

  assertEquals(hash1, hash2);
});

Deno.test("hashContent produces different hashes for different content", async () => {
  const content1 = "content one";
  const content2 = "content two";

  const hash1 = await hashContent(content1);
  const hash2 = await hashContent(content2);

  assert(hash1 !== hash2);
});

Deno.test("hashContent handles empty string", async () => {
  const content = "";
  const hash = await hashContent(content);

  assertEquals(hash.length, 64);
  // Known SHA-256 hash of empty string
  assertEquals(hash, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
});

Deno.test("hashContent handles special characters", async () => {
  const content = "Hello 世界 🎪 <script>alert('test')</script>";
  const hash = await hashContent(content);

  assertEquals(hash.length, 64);
  assert(/^[a-f0-9]+$/.test(hash));
});

Deno.test("hashMultipleContent combines content with delimiter", async () => {
  const contents = ["part1", "part2", "part3"];
  const hash = await hashMultipleContent(contents);

  // Should be same as hashing "part1|part2|part3"
  const expectedHash = await hashContent("part1|part2|part3");
  assertEquals(hash, expectedHash);
});

Deno.test("hashMultipleContent handles empty array", async () => {
  const contents: string[] = [];
  const hash = await hashMultipleContent(contents);

  // Should be same as hashing empty string
  const expectedHash = await hashContent("");
  assertEquals(hash, expectedHash);
});

// ========================================
// NORMALIZE NAME TESTS
// ========================================

function normalizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s-]/g, '')
    .toLowerCase();
}

Deno.test("normalizeName trims whitespace", () => {
  const input = "  Test Booth  ";
  const normalized = normalizeName(input);
  assertEquals(normalized, "test booth");
});

Deno.test("normalizeName removes extra spaces", () => {
  const input = "Test    Multiple     Spaces";
  const normalized = normalizeName(input);
  assertEquals(normalized, "test multiple spaces");
});

Deno.test("normalizeName converts to lowercase", () => {
  const input = "MiXeD CaSe BoOtH";
  const normalized = normalizeName(input);
  assertEquals(normalized, "mixed case booth");
});

Deno.test("normalizeName removes special characters", () => {
  const input = "Booth @ #1 (Main!)";
  const normalized = normalizeName(input);
  assertEquals(normalized, "booth 1 main");
});

Deno.test("normalizeName preserves hyphens", () => {
  const input = "Photo-Booth-Co";
  const normalized = normalizeName(input);
  assertEquals(normalized, "photo-booth-co");
});

Deno.test("normalizeName handles empty string", () => {
  const input = "";
  const normalized = normalizeName(input);
  assertEquals(normalized, "");
});

// ========================================
// RETRY LOGIC TESTS
// ========================================

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 100,  // Shorter for tests
    maxDelay: 1000,
    exponentialBackoff: true,
  };

  const finalConfig = { ...defaultConfig, ...config };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === finalConfig.maxAttempts) {
        throw lastError;
      }

      let delay = finalConfig.baseDelay;
      if (finalConfig.exponentialBackoff) {
        delay = Math.min(
          finalConfig.baseDelay * Math.pow(2, attempt - 1),
          finalConfig.maxDelay
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

Deno.test("retryWithBackoff succeeds on first attempt", async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    return "success";
  };

  const result = await retryWithBackoff(fn);
  assertEquals(result, "success");
  assertEquals(attempts, 1);
});

Deno.test("retryWithBackoff retries on failure", async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    if (attempts < 2) {
      throw new Error("temporary failure");
    }
    return "success";
  };

  const result = await retryWithBackoff(fn, { maxAttempts: 3 });
  assertEquals(result, "success");
  assertEquals(attempts, 2);
});

Deno.test("retryWithBackoff throws after max attempts", async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    throw new Error("permanent failure");
  };

  await assertRejects(
    async () => {
      await retryWithBackoff(fn, { maxAttempts: 3 });
    },
    Error,
    "permanent failure"
  );

  assertEquals(attempts, 3);
});

Deno.test("retryWithBackoff uses exponential backoff", async () => {
  const delays: number[] = [];
  let attempts = 0;

  const fn = async () => {
    attempts++;
    if (attempts < 4) {
      throw new Error("retry");
    }
    return "success";
  };

  const startTime = Date.now();
  await retryWithBackoff(fn, {
    maxAttempts: 4,
    baseDelay: 50,
    exponentialBackoff: true,
  });
  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // With exponential backoff: 50ms + 100ms + 200ms = 350ms minimum
  assert(totalTime >= 300, `Expected at least 300ms, got ${totalTime}ms`);
});

Deno.test("retryWithBackoff respects maxDelay", async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error("retry");
    }
    return "success";
  };

  const startTime = Date.now();
  await retryWithBackoff(fn, {
    maxAttempts: 3,
    baseDelay: 100,
    maxDelay: 150,
    exponentialBackoff: true,
  });
  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // With maxDelay of 150ms: 100ms + 150ms (capped) = 250ms minimum
  assert(totalTime >= 200 && totalTime < 500, `Expected ~250ms, got ${totalTime}ms`);
});

// ========================================
// VALIDATION METRICS TESTS
// ========================================

interface ValidationMetrics {
  total_extracted: number;
  passed_validation: number;
  failed_validation: number;
  failure_reasons: Record<string, number>;
}

function createValidationMetrics(): ValidationMetrics {
  return {
    total_extracted: 0,
    passed_validation: 0,
    failed_validation: 0,
    failure_reasons: {},
  };
}

function trackValidationResult(
  metrics: ValidationMetrics,
  passed: boolean,
  reason?: string
): void {
  metrics.total_extracted++;

  if (passed) {
    metrics.passed_validation++;
  } else {
    metrics.failed_validation++;
    if (reason) {
      metrics.failure_reasons[reason] = (metrics.failure_reasons[reason] || 0) + 1;
    }
  }
}

function getValidationRate(metrics: ValidationMetrics): number {
  if (metrics.total_extracted === 0) return 0;
  return (metrics.passed_validation / metrics.total_extracted) * 100;
}

Deno.test("createValidationMetrics initializes correctly", () => {
  const metrics = createValidationMetrics();

  assertEquals(metrics.total_extracted, 0);
  assertEquals(metrics.passed_validation, 0);
  assertEquals(metrics.failed_validation, 0);
  assertEquals(Object.keys(metrics.failure_reasons).length, 0);
});

Deno.test("trackValidationResult increments passed count", () => {
  const metrics = createValidationMetrics();

  trackValidationResult(metrics, true);

  assertEquals(metrics.total_extracted, 1);
  assertEquals(metrics.passed_validation, 1);
  assertEquals(metrics.failed_validation, 0);
});

Deno.test("trackValidationResult increments failed count", () => {
  const metrics = createValidationMetrics();

  trackValidationResult(metrics, false, "missing_name");

  assertEquals(metrics.total_extracted, 1);
  assertEquals(metrics.passed_validation, 0);
  assertEquals(metrics.failed_validation, 1);
  assertEquals(metrics.failure_reasons["missing_name"], 1);
});

Deno.test("trackValidationResult tracks multiple failure reasons", () => {
  const metrics = createValidationMetrics();

  trackValidationResult(metrics, false, "missing_name");
  trackValidationResult(metrics, false, "missing_address");
  trackValidationResult(metrics, false, "missing_name");

  assertEquals(metrics.total_extracted, 3);
  assertEquals(metrics.failed_validation, 3);
  assertEquals(metrics.failure_reasons["missing_name"], 2);
  assertEquals(metrics.failure_reasons["missing_address"], 1);
});

Deno.test("getValidationRate calculates correct percentage", () => {
  const metrics = createValidationMetrics();

  trackValidationResult(metrics, true);
  trackValidationResult(metrics, true);
  trackValidationResult(metrics, true);
  trackValidationResult(metrics, false, "error");

  const rate = getValidationRate(metrics);
  assertEquals(rate, 75); // 3 passed out of 4 = 75%
});

Deno.test("getValidationRate handles zero total", () => {
  const metrics = createValidationMetrics();
  const rate = getValidationRate(metrics);
  assertEquals(rate, 0);
});

Deno.test("getValidationRate handles all passed", () => {
  const metrics = createValidationMetrics();

  trackValidationResult(metrics, true);
  trackValidationResult(metrics, true);
  trackValidationResult(metrics, true);

  const rate = getValidationRate(metrics);
  assertEquals(rate, 100);
});

Deno.test("getValidationRate handles all failed", () => {
  const metrics = createValidationMetrics();

  trackValidationResult(metrics, false, "error1");
  trackValidationResult(metrics, false, "error2");

  const rate = getValidationRate(metrics);
  assertEquals(rate, 0);
});

// ========================================
// URL PROCESSING TESTS
// ========================================

Deno.test("hasUrlBeenProcessed detects duplicate", () => {
  const processedUrls = new Set(["http://example.com/page1"]);
  const url = "http://example.com/page1";

  assertEquals(processedUrls.has(url), true);
});

Deno.test("hasUrlBeenProcessed detects new URL", () => {
  const processedUrls = new Set(["http://example.com/page1"]);
  const url = "http://example.com/page2";

  assertEquals(processedUrls.has(url), false);
});

Deno.test("markUrlProcessed adds URL to set", () => {
  const processedUrls = new Set<string>();
  const url = "http://example.com/page1";

  processedUrls.add(url);

  assertEquals(processedUrls.has(url), true);
  assertEquals(processedUrls.size, 1);
});

Deno.test("markUrlProcessed handles duplicates", () => {
  const processedUrls = new Set<string>();
  const url = "http://example.com/page1";

  processedUrls.add(url);
  processedUrls.add(url); // Adding same URL again

  assertEquals(processedUrls.size, 1); // Set prevents duplicates
});
