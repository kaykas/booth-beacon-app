/**
 * BASE EXTRACTOR - ABSTRACT CLASS
 *
 * Template method pattern for all extractors to eliminate 90% of code duplication.
 *
 * Each extractor only needs to:
 * 1. Extend this class
 * 2. Implement parseContent() method (20-30 lines)
 * 3. Set sourceName in constructor
 *
 * The base class handles:
 * - Error handling
 * - Metadata tracking (timing, counts)
 * - Booth finalization (defaults, validation)
 * - Standard result structure
 * - HTML/markdown utilities
 */

import type { BoothData, ExtractorResult } from './extractors.ts';
import { cleanHtml } from './shared-utilities.ts';

export abstract class BaseExtractor {
  protected sourceName: string;
  protected defaultCountry: string;
  protected defaultCity?: string;
  protected defaultState?: string;
  protected defaultBoothType: 'analog' | 'digital';

  constructor(
    sourceName: string,
    options: {
      defaultCountry: string;
      defaultCity?: string;
      defaultState?: string;
      defaultBoothType?: 'analog' | 'digital';
    }
  ) {
    this.sourceName = sourceName;
    this.defaultCountry = options.defaultCountry;
    this.defaultCity = options.defaultCity;
    this.defaultState = options.defaultState;
    this.defaultBoothType = options.defaultBoothType || 'analog';
  }

  /**
   * Template method - final implementation
   * Subclasses cannot override this method
   */
  public async extract(
    html: string,
    markdown: string,
    sourceUrl: string
  ): Promise<ExtractorResult> {
    const startTime = Date.now();
    const booths: BoothData[] = [];
    const errors: string[] = [];

    try {
      // Call the abstract method that subclasses must implement
      const extractedBooths = await this.parseContent(html, markdown, sourceUrl);

      // Finalize each booth with defaults and validation
      for (const booth of extractedBooths) {
        booths.push(this.finalizeBooth(booth, sourceUrl));
      }

    } catch (error) {
      const errorMessage = `${this.sourceName} extraction error: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      errors.push(errorMessage);
    }

    return {
      booths,
      errors,
      metadata: {
        pages_processed: 1,
        total_found: booths.length,
        extraction_time_ms: Date.now() - startTime,
      },
    };
  }

  /**
   * Abstract method - subclasses MUST implement this
   * This is the only method extractors need to write
   */
  protected abstract parseContent(
    html: string,
    markdown: string,
    sourceUrl: string
  ): Promise<Partial<BoothData>[]>;

  /**
   * Finalize booth with defaults and required fields
   */
  protected finalizeBooth(booth: Partial<BoothData>, sourceUrl: string): BoothData {
    return {
      // Required fields
      name: booth.name || 'Unknown',
      address: booth.address || '',
      country: booth.country || this.defaultCountry,
      source_url: sourceUrl,
      source_name: this.sourceName,
      status: booth.status || 'active',

      // Optional fields with defaults
      city: booth.city || this.defaultCity,
      state: booth.state || this.defaultState,
      postal_code: booth.postal_code,
      latitude: booth.latitude,
      longitude: booth.longitude,
      machine_model: booth.machine_model,
      machine_manufacturer: booth.machine_manufacturer,
      booth_type: booth.booth_type || this.defaultBoothType,
      cost: booth.cost,
      accepts_cash: booth.accepts_cash,
      accepts_card: booth.accepts_card,
      hours: booth.hours,
      is_operational: booth.is_operational ?? true,
      description: booth.description,
      website: booth.website,
      phone: booth.phone,
      photos: booth.photos,
    };
  }

  /**
   * Utility: Clean HTML tags and entities
   */
  protected cleanHtml(text: string): string {
    return cleanHtml(text);
  }

  /**
   * Utility: Extract coordinates from text
   */
  protected extractCoordinates(line: string): { latitude?: number; longitude?: number } {
    const coordMatch = line.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (coordMatch) {
      return {
        latitude: parseFloat(coordMatch[1]),
        longitude: parseFloat(coordMatch[2]),
      };
    }
    return {};
  }

  /**
   * Utility: Parse markdown lines into array
   */
  protected parseLines(markdown: string): string[] {
    return markdown.split('\n').map(line => line.trim());
  }

  /**
   * Utility: Check if line matches a heading pattern
   */
  protected matchHeading(line: string, minLength = 3): RegExpMatchArray | null {
    const match = line.match(/^#{2,3}\s+(.+)/);
    if (match && match[1].length >= minLength) {
      return match;
    }
    return null;
  }

  /**
   * Utility: Check if line matches a bold pattern
   */
  protected matchBold(line: string, minLength = 3): RegExpMatchArray | null {
    const match = line.match(/^\*\*([^*]+)\*\*/);
    if (match && match[1].length >= minLength) {
      return match;
    }
    return null;
  }

  /**
   * Utility: Check if line matches a numbered list pattern
   */
  protected matchNumberedList(line: string): RegExpMatchArray | null {
    return line.match(/^(\d+)\.\s+(.+)/);
  }

  /**
   * Utility: Extract address from common patterns
   */
  protected extractAddress(line: string): string | null {
    const patterns = [
      /Address:\s*(.+)/i,
      /Location:\s*(.+)/i,
      /Where:\s*(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Utility: Extract price/cost from line
   */
  protected extractCost(line: string, currency = '$'): string | null {
    const escapedCurrency = currency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`${escapedCurrency}(\\d+(?:[.,]\\d{2})?)`);
    const match = line.match(pattern);
    if (match) {
      return `${currency}${match[1]}`;
    }
    return null;
  }

  /**
   * Utility: Extract phone number
   */
  protected extractPhone(line: string): string | null {
    const phoneMatch = line.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})|(\(\d{3}\)\s*\d{3}[-.]?\d{4})/);
    return phoneMatch ? phoneMatch[0] : null;
  }

  /**
   * Utility: Extract website URL
   */
  protected extractWebsite(line: string): string | null {
    const urlMatch = line.match(/(https?:\/\/[^\s)]+)/);
    if (urlMatch && !urlMatch[1].includes(this.sourceName)) {
      return urlMatch[1];
    }
    return null;
  }

  /**
   * Utility: Check if booth is likely operational based on text
   */
  protected checkOperationalStatus(text: string): boolean | undefined {
    if (text.match(/operational|working|active|open/i)) {
      return true;
    }
    if (text.match(/closed|removed|inactive|out of service/i)) {
      return false;
    }
    return undefined;
  }
}
