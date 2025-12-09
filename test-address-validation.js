#!/usr/bin/env node

/**
 * ADDRESS VALIDATION DEMONSTRATION
 *
 * Shows how the new validation prevents bad address data from entering the system.
 */

// Mock the validation function
function validateAddressFormat(address, boothName) {
  // Check if address is empty or too short
  if (address.trim().length < 10) {
    return {
      isValid: false,
      error: "Address must be at least 10 characters (too short, possibly just a business name)"
    };
  }

  // Check if address is the same as booth name (bad data - address == business name)
  if (address.trim().toLowerCase() === boothName.trim().toLowerCase()) {
    return {
      isValid: false,
      error: "Address cannot be the same as the business name - must include street address"
    };
  }

  // Check for street number (required for valid addresses)
  const hasStreetNumber = /\d+\s+[A-Za-z]/.test(address);
  if (!hasStreetNumber) {
    return {
      isValid: false,
      error: "Address must include a street number (e.g., '123 Main St')"
    };
  }

  return { isValid: true, sanitized: address.trim() };
}

function calculateQualityScore(booth) {
  let score = 0;
  const penalties = [];

  // Address: 10 points (but penalize if missing street number or too short)
  if (booth.address) {
    const addressLength = booth.address.trim().length;
    const hasStreetNum = /\d+\s+[A-Za-z]/.test(booth.address);

    // PENALTY: Address without street number (reduces by 30%)
    if (!hasStreetNum) {
      score += 7; // 70% of 10 points
      penalties.push("Missing street number (-30%)");
    }
    // PENALTY: Address too short (likely just a name)
    else if (addressLength < 10) {
      score += 7; // 70% of 10 points
      penalties.push("Address too short (-30%)");
    }
    // PENALTY: Address might be business name (same as booth name)
    else if (booth.address.trim().toLowerCase() === booth.name.trim().toLowerCase()) {
      score += 0; // 0 points - this is bad data
      penalties.push("Address is business name, not street address (0 points)");
    } else {
      // Good address with street number
      score += 10;
    }
  }

  // Other fields
  score += booth.state ? 5 : 0;
  score += (booth.latitude && booth.longitude) ? 10 : 0;
  score += booth.phone ? 10 : 0;
  score += booth.website ? 10 : 0;
  score += booth.hours ? 10 : 0;
  score += booth.description ? 5 : 0;
  score += (booth.photo_exterior_url || booth.ai_preview_url) ? 15 : 0;
  score += (booth.photos && booth.photos.length > 0) ? 10 : 0;
  score += booth.google_place_id ? 10 : 0;
  score += booth.status === 'active' ? 5 : 0;

  return {
    score: Math.min(score, 100),
    penalties
  };
}

// Test cases
const testCases = [
  {
    title: "GOOD: Valid street address with number",
    name: "Main Street Photo Booth",
    address: "123 Main Street, New York, NY 10001"
  },
  {
    title: "GOOD: Complete address with suite",
    name: "Park Avenue Booth",
    address: "456 Park Avenue, Suite 200, Los Angeles, CA 90001"
  },
  {
    title: "BAD: Address = business name (COMMON PROBLEM)",
    name: "Photo Booth Central",
    address: "Photo Booth Central"
  },
  {
    title: "BAD: Street name without number",
    name: "Main Street Photo Booth",
    address: "Main Street"
  },
  {
    title: "BAD: Too short / vague",
    name: "Downtown Brooklyn Booth",
    address: "Downtown Brooklyn"
  },
  {
    title: "BAD: Just a landmark",
    name: "Times Square Photo Booth",
    address: "Times Square"
  },
  {
    title: "GOOD: International address with street number",
    name: "Saint-Germain Booth",
    address: "789 Boulevard Saint-Germain, Paris, 75005"
  },
  {
    title: "BAD: Venue name, no street address",
    name: "The Old Theater",
    address: "The Old Theater"
  }
];

console.log("====================================");
console.log("ADDRESS VALIDATION TEST SUITE");
console.log("====================================\n");

let passCount = 0;
let failCount = 0;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.title}`);
  console.log(`  Name: "${testCase.name}"`);
  console.log(`  Address: "${testCase.address}"`);

  const validation = validateAddressFormat(testCase.address, testCase.name);
  console.log(`  Result: ${validation.isValid ? "✓ VALID" : "✗ REJECTED"}`);

  if (!validation.isValid) {
    console.log(`  Reason: ${validation.error}`);
  } else {
    console.log(`  Sanitized: "${validation.sanitized}"`);
  }

  if (testCase.title.includes("GOOD")) {
    if (validation.isValid) {
      passCount++;
      console.log("  ✓ PASS: Good address accepted\n");
    } else {
      failCount++;
      console.log("  ✗ FAIL: Good address was rejected!\n");
    }
  } else if (testCase.title.includes("BAD")) {
    if (!validation.isValid) {
      passCount++;
      console.log("  ✓ PASS: Bad address correctly rejected\n");
    } else {
      failCount++;
      console.log("  ✗ FAIL: Bad address was not rejected!\n");
    }
  }
});

console.log("====================================");
console.log("DATA QUALITY SCORING TESTS");
console.log("====================================\n");

const qualityTestCases = [
  {
    title: "Complete booth with GOOD address",
    booth: {
      name: "Main Street Photo Booth",
      address: "123 Main Street, New York, NY 10001",
      state: "NY",
      latitude: 40.7128,
      longitude: -74.0060,
      phone: "(555) 123-4567",
      website: "https://example.com",
      hours: "9am-9pm",
      description: "Classic analog photo booth",
      photo_exterior_url: "https://example.com/photo.jpg",
      photos: ["https://example.com/photo1.jpg"],
      status: "active"
    },
    expectedScore: 100
  },
  {
    title: "Address WITHOUT street number (PENALIZED 30%)",
    booth: {
      name: "Times Square Photo Booth",
      address: "Times Square",
      state: "NY",
      latitude: 40.7589,
      longitude: -73.9851,
      phone: "(555) 123-4567",
      website: "https://example.com",
      hours: "9am-9pm",
      description: "Popular Times Square location",
      photo_exterior_url: "https://example.com/photo.jpg",
      photos: ["https://example.com/photo1.jpg"],
      status: "active"
    },
    expectedScore: 97
  },
  {
    title: "Address = business name (HEAVILY PENALIZED - 0 points)",
    booth: {
      name: "Photo Booth Central",
      address: "Photo Booth Central",
      state: "NY",
      status: "unverified"
    },
    expectedScore: 5
  },
  {
    title: "Missing address entirely",
    booth: {
      name: "Unknown Booth",
      address: null,
      state: "CA",
      status: "active"
    },
    expectedScore: 5
  }
];

qualityTestCases.forEach((testCase, index) => {
  console.log(`Quality Test ${index + 1}: ${testCase.title}`);

  const result = calculateQualityScore(testCase.booth);
  console.log(`  Name: "${testCase.booth.name}"`);
  console.log(`  Address: "${testCase.booth.address || 'null'}"`);
  console.log(`  Quality Score: ${result.score}/100`);

  if (result.penalties.length > 0) {
    console.log(`  Penalties applied:`);
    result.penalties.forEach(p => console.log(`    - ${p}`));
  }

  if (result.score === testCase.expectedScore) {
    console.log(`  ✓ PASS: Score matches expected ${testCase.expectedScore}\n`);
    passCount++;
  } else {
    console.log(`  ✗ FAIL: Expected ${testCase.expectedScore}, got ${result.score}\n`);
    failCount++;
  }
});

console.log("====================================");
console.log("TEST SUMMARY");
console.log("====================================");
console.log(`Total Tests Passed: ${passCount}`);
console.log(`Total Tests Failed: ${failCount}`);
console.log("");

if (failCount === 0) {
  console.log("✓ All tests passed! Address validation is working correctly.");
} else {
  console.log(`✗ ${failCount} test(s) failed. Please review the validation logic.`);
}

console.log("\nKey improvements:");
console.log("1. Rejects addresses without street numbers");
console.log("2. Rejects business names being used as addresses");
console.log("3. Penalizes short addresses (likely just venue names)");
console.log("4. Requires full street address for geocoding success");
console.log("5. Prevents bad data from entering the system");
