/**
 * Shared utility functions used across all extractors
 * 
 * This module consolidates duplicate functions that were previously
 * scattered across extractors.ts, city-guide-extractors.ts, 
 * european-extractors.ts, and ai-extraction-engine.ts
 */

import type { BoothData } from "./extractors";

/**
 * Clean HTML by removing scripts, styles, tags, and normalizing whitespace
 */
export function cleanHtml(text: string): string {
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize name for deduplication and matching
 * Converts to lowercase and removes all non-alphanumeric characters
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finalize booth data with defaults for all required fields
 */
export function finalizeBooth(booth: Partial<BoothData>, sourceName: string): BoothData {
  return {
    name: booth.name || 'Unknown',
    address: booth.address || '',
    city: booth.city || '',
    state: booth.state || '',
    country: booth.country || 'Unknown',
    postal_code: booth.postal_code || '',
    latitude: booth.latitude,
    longitude: booth.longitude,
    machine_model: booth.machine_model || '',
    machine_manufacturer: booth.machine_manufacturer || '',
    booth_type: booth.booth_type || 'analog',
    cost: booth.cost || '',
    hours: booth.hours || '',
    is_operational: booth.is_operational ?? true,
    status: booth.status || 'active',
    description: booth.description || '',
    website: booth.website || '',
    phone: booth.phone || '',
    source_name: sourceName,
    source_url: booth.source_url || '',
    photos: booth.photos || [],
  };
}

/**
 * Clean and normalize text by removing extra whitespace
 */
export function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Extract coordinates from a string like "48.8566, 2.3522"
 * Returns [latitude, longitude] or null if not found
 */
export function extractCoordinates(text: string): [number, number] | null {
  const coordMatch = text.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }
  return null;
}

/**
 * Check if a line looks like a booth name (heuristic-based)
 */
export function looksLikeBoothName(line: string): boolean {
  // Too short
  if (line.length < 3) return false;
  
  // Too long (probably a paragraph)
  if (line.length > 100) return false;
  
  // Has multiple sentences (probably not a name)
  if (line.split('.').length > 2) return false;
  
  return true;
}

/**
 * Check if a line looks like an address
 */
export function looksLikeAddress(line: string): boolean {
  // Contains common address patterns
  const addressPatterns = [
    /\d+\s+[A-Z]/i,  // Starts with number + street name
    /street|st\.|avenue|ave\.|road|rd\.|boulevard|blvd\./i,
    /\d{5}(-\d{4})?/,  // US ZIP code
    /[A-Z]\d[A-Z]\s*\d[A-Z]\d/i,  // Canadian postal code
  ];
  
  return addressPatterns.some(pattern => pattern.test(line));
}

/**
 * Extract phone number from text
 */
export function extractPhone(text: string): string | null {
  const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const match = text.match(phonePattern);
  return match ? match[0] : null;
}

/**
 * Extract website URL from text
 */
export function extractWebsite(text: string): string | null {
  const urlPattern = /(https?:\/\/[^\s]+)/i;
  const match = text.match(urlPattern);
  return match ? match[1] : null;
}

/**
 * Deduplicate array of booths by normalized name + country
 */
export function deduplicateBooths(booths: BoothData[]): BoothData[] {
  const seen = new Map<string, BoothData>();
  
  for (const booth of booths) {
    const key = `${normalizeName(booth.name)}:${booth.country}`;
    
    // Keep the first occurrence (or could use more sophisticated merge logic)
    if (!seen.has(key)) {
      seen.set(key, booth);
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Parse address components from a full address string
 * Returns { street, city, state, postal_code, country } or partial match
 */
export function parseAddress(address: string): Partial<{
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}> {
  const result: any = {};
  
  // Extract postal code (US 5-digit or 5+4)
  const zipMatch = address.match(/\b\d{5}(-\d{4})?\b/);
  if (zipMatch) {
    result.postal_code = zipMatch[0];
  }
  
  // Extract Canadian postal code
  const canadaMatch = address.match(/\b[A-Z]\d[A-Z]\s*\d[A-Z]\d\b/i);
  if (canadaMatch) {
    result.postal_code = canadaMatch[0];
    result.country = 'Canada';
  }
  
  // Extract US state abbreviation
  const stateMatch = address.match(/\b([A-Z]{2})\b/);
  if (stateMatch && !canadaMatch) {
    result.state = stateMatch[1];
    result.country = result.country || 'USA';
  }
  
  return result;
}
