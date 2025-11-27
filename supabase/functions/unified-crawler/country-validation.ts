/**
 * Country Validation and Normalization for Booth Data
 *
 * Ensures all booth records have valid, standardized country names.
 * Prevents "Unknown", "Brian |", and other corrupted country data.
 */

export interface CountryValidationResult {
  isValid: boolean;
  standardizedCountry: string;
  error?: string;
}

/**
 * Valid country names (expanded list for photo booth locations)
 * Format: Standard name as it should appear in database
 */
const VALID_COUNTRIES = new Set([
  // North America
  "United States",
  "Canada",
  "Mexico",

  // Western Europe
  "United Kingdom",
  "France",
  "Germany",
  "Italy",
  "Spain",
  "Portugal",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Ireland",
  "Luxembourg",

  // Northern Europe
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Iceland",

  // Eastern Europe
  "Poland",
  "Czech Republic",
  "Hungary",
  "Slovakia",
  "Romania",
  "Bulgaria",
  "Croatia",
  "Slovenia",
  "Serbia",
  "Bosnia and Herzegovina",
  "Estonia",
  "Latvia",
  "Lithuania",

  // Southern Europe
  "Greece",
  "Malta",
  "Cyprus",

  // Oceania
  "Australia",
  "New Zealand",

  // Asia
  "Japan",
  "South Korea",
  "Singapore",
  "Hong Kong",
  "Taiwan",
  "China",
  "Thailand",
  "Vietnam",
  "Malaysia",
  "Philippines",
  "Indonesia",
  "India",
  "Israel",
  "United Arab Emirates",
  "Turkey",

  // South America
  "Brazil",
  "Argentina",
  "Chile",
  "Colombia",
  "Peru",
  "Uruguay",

  // Other
  "South Africa",
  "Russia",
]);

/**
 * Country name variations and aliases
 * Maps common variations to standard names
 */
const COUNTRY_ALIASES: Record<string, string> = {
  // United States variations
  "usa": "United States",
  "us": "United States",
  "u.s.": "United States",
  "u.s.a.": "United States",
  "america": "United States",
  "united states of america": "United States",
  "estados unidos": "United States",

  // United Kingdom variations
  "uk": "United Kingdom",
  "u.k.": "United Kingdom",
  "great britain": "United Kingdom",
  "britain": "United Kingdom",
  "england": "United Kingdom",
  "scotland": "United Kingdom",
  "wales": "United Kingdom",
  "northern ireland": "United Kingdom",

  // Germany variations
  "deutschland": "Germany",
  "de": "Germany",

  // France variations
  "fr": "France",
  "république française": "France",

  // Netherlands variations
  "holland": "Netherlands",
  "nl": "Netherlands",

  // Czech Republic variations
  "czechia": "Czech Republic",
  "czech": "Czech Republic",

  // Australia variations
  "au": "Australia",
  "aus": "Australia",

  // Common misspellings
  "untied states": "United States",
  "united stated": "United States",
};

/**
 * City-to-country mappings for when country is missing but city is known
 */
const CITY_COUNTRY_MAP: Record<string, string> = {
  // United States
  "new york": "United States",
  "nyc": "United States",
  "brooklyn": "United States",
  "manhattan": "United States",
  "los angeles": "United States",
  "san francisco": "United States",
  "chicago": "United States",
  "seattle": "United States",
  "portland": "United States",
  "austin": "United States",
  "boston": "United States",
  "philadelphia": "United States",
  "miami": "United States",
  "denver": "United States",
  "atlanta": "United States",

  // United Kingdom
  "london": "United Kingdom",
  "manchester": "United Kingdom",
  "birmingham": "United Kingdom",
  "glasgow": "United Kingdom",
  "edinburgh": "United Kingdom",
  "bristol": "United Kingdom",
  "liverpool": "United Kingdom",

  // Germany
  "berlin": "Germany",
  "munich": "Germany",
  "hamburg": "Germany",
  "cologne": "Germany",
  "frankfurt": "Germany",

  // France
  "paris": "France",
  "lyon": "France",
  "marseille": "France",
  "toulouse": "France",

  // Canada
  "toronto": "Canada",
  "vancouver": "Canada",
  "montreal": "Canada",
  "calgary": "Canada",

  // Australia
  "sydney": "Australia",
  "melbourne": "Australia",
  "brisbane": "Australia",
  "perth": "Australia",

  // Other major cities
  "tokyo": "Japan",
  "singapore": "Singapore",
  "hong kong": "Hong Kong",
  "barcelona": "Spain",
  "madrid": "Spain",
  "rome": "Italy",
  "florence": "Italy",
  "venice": "Italy",
  "milan": "Italy",
  "amsterdam": "Netherlands",
  "vienna": "Austria",
  "prague": "Czech Republic",
  "dublin": "Ireland",
  "brussels": "Belgium",
  "zurich": "Switzerland",
};

/**
 * Validate and standardize a country name
 */
export function validateCountry(
  country: string | undefined | null,
  city?: string | undefined | null
): CountryValidationResult {
  // If country is missing, try to infer from city
  if (!country || country.trim().length === 0) {
    if (city) {
      const inferredCountry = inferCountryFromCity(city);
      if (inferredCountry) {
        return {
          isValid: true,
          standardizedCountry: inferredCountry,
        };
      }
    }

    return {
      isValid: false,
      standardizedCountry: "",
      error: "Country is required and could not be inferred from city",
    };
  }

  // Normalize input
  const normalized = country.trim().toLowerCase();

  // Check if it's obviously corrupted (HTML, URLs, special chars)
  if (isCorruptedCountryName(normalized)) {
    return {
      isValid: false,
      standardizedCountry: "",
      error: `Country name appears corrupted: "${country.substring(0, 50)}"`,
    };
  }

  // Check against valid countries (case-insensitive)
  for (const validCountry of VALID_COUNTRIES) {
    if (validCountry.toLowerCase() === normalized) {
      return {
        isValid: true,
        standardizedCountry: validCountry,
      };
    }
  }

  // Check against aliases
  if (COUNTRY_ALIASES[normalized]) {
    return {
      isValid: true,
      standardizedCountry: COUNTRY_ALIASES[normalized],
    };
  }

  // If we reach here, country is not recognized
  return {
    isValid: false,
    standardizedCountry: "",
    error: `Unrecognized country: "${country}"`,
  };
}

/**
 * Infer country from city name
 */
function inferCountryFromCity(city: string): string | null {
  const normalized = city.trim().toLowerCase();
  return CITY_COUNTRY_MAP[normalized] || null;
}

/**
 * Check if a country name is corrupted (HTML, URLs, encoded text, etc.)
 */
function isCorruptedCountryName(countryLower: string): boolean {
  // Check for HTML tags
  if (/<[^>]+>/i.test(countryLower)) {
    return true;
  }

  // Check for URL encoding
  if (/%[0-9a-f]{2}/i.test(countryLower)) {
    return true;
  }

  // Check for URLs
  if (/https?:\/\//i.test(countryLower)) {
    return true;
  }

  // Check for excessive special characters (likely garbage)
  const specialCharCount = (countryLower.match(/[^a-z0-9\s-]/g) || []).length;
  if (specialCharCount > 3) {
    return true;
  }

  // Check for numbers (country names shouldn't have numbers)
  if (/\d/.test(countryLower)) {
    return true;
  }

  // Check for excessively long strings (likely concatenated data)
  if (countryLower.length > 50) {
    return true;
  }

  return false;
}

/**
 * Get list of all valid country names
 */
export function getAllValidCountries(): string[] {
  return Array.from(VALID_COUNTRIES).sort();
}

/**
 * Check if a country name is valid (for quick checks)
 */
export function isValidCountry(country: string): boolean {
  const result = validateCountry(country);
  return result.isValid;
}
