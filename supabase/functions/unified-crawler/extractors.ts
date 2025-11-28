/**
 * SOURCE-SPECIFIC EXTRACTORS
 * Each extractor handles a specific website's structure and data format
 */

import { BaseExtractor } from './base-extractor';
import type { AnthropicResponse, AnthropicContentBlock } from "./types";
import { toError } from "./types";

export interface BoothData {
  name: string;
  address: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  machine_model?: string;
  machine_manufacturer?: string;
  booth_type?: string;
  cost?: string;
  accepts_cash?: boolean;
  accepts_card?: boolean;
  hours?: string;
  is_operational?: boolean;
  status: "active" | "inactive" | "unverified";
  source_url: string;
  source_name: string;
  description?: string;
  website?: string;
  phone?: string;
  photos?: string[];
}

export interface ExtractorResult {
  booths: BoothData[];
  errors: string[];
  metadata: {
    pages_processed: number;
    total_found: number;
    extraction_time_ms: number;
  };
}

/**
 * PHOTOMATICA.COM EXTRACTOR
 * European focused, detailed machine information
 */
class PhotomaticaExtractor extends BaseExtractor {
  constructor() {
    super('photomatica.com', {
      defaultCountry: 'Europe',
      defaultBoothType: 'analog',
    });
  }

  protected async parseContent(
    html: string,
    markdown: string,
    _sourceUrl: string
  ): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: "Location Name" followed by address
      const locationMatch = this.matchBold(line);
      if (locationMatch) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: locationMatch[1] };
        continue;
      }

      if (currentBooth) {
        // Extract address
        if (line.match(/^Address:|^Location:/i)) {
          const nextLine = lines[i + 1];
          if (nextLine) currentBooth.address = nextLine;
        }

        // Extract city
        if (line.match(/^City:/i)) {
          const nextLine = lines[i + 1];
          if (nextLine) currentBooth.city = nextLine;
        }

        // Extract country
        if (line.match(/^Country:/i)) {
          const nextLine = lines[i + 1];
          if (nextLine) currentBooth.country = nextLine;
        }

        // Extract machine model
        if (line.match(/^Model:|^Machine:/i)) {
          const nextLine = lines[i + 1];
          if (nextLine) {
            currentBooth.machine_model = nextLine;
            // Infer manufacturer from model
            if (nextLine.toLowerCase().includes('photo-me')) {
              currentBooth.machine_manufacturer = 'Photo-Me International';
            }
          }
        }

        // Extract coordinates
        const coords = this.extractCoordinates(line);
        if (coords.latitude) Object.assign(currentBooth, coords);

        // Extract operational status
        const status = this.checkOperationalStatus(line);
        if (status !== undefined) {
          currentBooth.is_operational = status;
          currentBooth.status = status ? 'active' : 'inactive';
        }
      }
    }

    // Add final booth
    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    // Fallback: HTML parsing for JSON-LD structured data
    if (booths.length === 0) {
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      if (jsonLdMatch) {
        try {
          const data = JSON.parse(jsonLdMatch[1]);
          if (data['@type'] === 'ItemList' && data.itemListElement) {
            for (const item of data.itemListElement) {
              if (item.location) {
                booths.push({
                  name: item.name || 'Unknown',
                  address: item.location.address || '',
                  city: item.location.addressLocality,
                  country: item.location.addressCountry || 'Europe',
                  latitude: item.location.geo?.latitude,
                  longitude: item.location.geo?.longitude,
                });
              }
            }
          }
        } catch (e) {
          console.error(`JSON-LD parsing failed: ${e}`);
        }
      }
    }

    return booths;
  }
}

export async function extractPhotomatica(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const extractor = new PhotomaticaExtractor();
  return extractor.extract(html, markdown, sourceUrl);
}

/**
 * PHOTOAUTOMAT.DE EXTRACTOR
 * German focused, particularly Berlin
 */
class PhotoautomatDeExtractor extends BaseExtractor {
  constructor() {
    super('photoautomat.de', {
      defaultCountry: 'Germany',
      defaultCity: 'Berlin',
      defaultBoothType: 'analog',
    });
  }

  protected async parseContent(
    html: string,
    markdown: string,
    _sourceUrl: string
  ): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);

    for (const line of lines) {
      // Pattern: "Location | Address | Details"
      if (line.includes('|') && line.split('|').length >= 3) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length >= 2 && parts[0].length > 2 && parts[1].length > 5) {
          booths.push({
            name: parts[0],
            address: parts[1],
          });
        }
      }

      // Pattern: "Location - Address, Berlin"
      const dashMatch = line.match(/^(.+?)\s*[-–—]\s*(.+?),\s*(Berlin|München|Hamburg)/i);
      if (dashMatch) {
        booths.push({
          name: dashMatch[1].trim(),
          address: dashMatch[2].trim(),
          city: dashMatch[3],
        });
      }
    }

    // HTML fallback
    if (booths.length === 0) {
      const locationRegex = /<div[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
      const matches = html.matchAll(locationRegex);

      for (const match of matches) {
        const content = match[1];
        const nameMatch = content.match(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/i);
        const addressMatch = content.match(/<p[^>]*>([^<]+)<\/p>/i);

        if (nameMatch && addressMatch) {
          booths.push({
            name: this.cleanHtml(nameMatch[1]),
            address: this.cleanHtml(addressMatch[1]),
          });
        }
      }
    }

    return booths;
  }
}

export async function extractPhotoautomatDe(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const extractor = new PhotoautomatDeExtractor();
  return extractor.extract(html, markdown, sourceUrl);
}

/**
 * PHOTOMATIC.NET EXTRACTOR
 * Australia/New Zealand focused
 */
class PhotomaticExtractor extends BaseExtractor {
  constructor() {
    super('photomatic.net', {
      defaultCountry: 'Australia',
      defaultCity: 'Melbourne',
      defaultBoothType: 'analog',
    });
  }

  protected async parseContent(
    html: string,
    markdown: string,
    _sourceUrl: string
  ): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);

    for (const line of lines) {
      // Pattern: "Name - Address, City, State"
      const match = line.match(/^(.+?)\s*[-–—]\s*(.+?),\s*([^,]+)(?:,\s*([A-Z]{2,3}))?/);
      if (match && match[1].length > 2) {
        const state = match[4]?.trim();
        let country = 'Australia';

        // Determine country from state codes
        if (state && ['AKL', 'WLG', 'CHC'].includes(state)) {
          country = 'New Zealand';
        }

        booths.push({
          name: match[1].trim(),
          address: match[2].trim(),
          city: match[3].trim(),
          state,
          country,
        });
      }

      // Pattern: "City: Name - Address"
      const cityFirstMatch = line.match(/^([A-Z][a-z]+):\s*(.+?)\s*[-–—]\s*(.+)/);
      if (cityFirstMatch) {
        booths.push({
          name: cityFirstMatch[2].trim(),
          address: cityFirstMatch[3].trim(),
          city: cityFirstMatch[1].trim(),
        });
      }
    }

    // HTML fallback
    if (booths.length === 0) {
      const listRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      const matches = html.matchAll(listRegex);

      for (const match of matches) {
        const content = this.cleanHtml(match[1]);
        const parts = content.split(/[-–—,]/).map(p => p.trim());

        if (parts.length >= 2 && parts[0].length > 2) {
          booths.push({
            name: parts[0],
            address: parts[1],
            city: parts[2] || 'Melbourne',
          });
        }
      }
    }

    return booths;
  }
}

export async function extractPhotomatic(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const extractor = new PhotomaticExtractor();
  return extractor.extract(html, markdown, sourceUrl);
}

/**
 * PHOTOBOOTH.NET EXTRACTOR
 * Global directory with focus on chemical/analog booths
 * http://www.photobooth.net/locations/
 */
class PhotoboothNetExtractor extends BaseExtractor {
  constructor() {
    super('photobooth.net', {
      defaultCountry: 'USA',
      defaultBoothType: 'analog',
    });
  }

  protected async parseContent(
    html: string,
    markdown: string,
    _sourceUrl: string
  ): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: Location name (often in bold or heading)
      const locationMatch = this.matchHeading(line) || this.matchBold(line);
      if (locationMatch) {
        if (currentBooth?.name && currentBooth?.address && currentBooth?.country) {
          booths.push(currentBooth);
        }
        currentBooth = { name: locationMatch[1] };
        continue;
      }

      if (currentBooth) {
        // Extract venue name (if different from location)
        if (line.match(/^Venue:|^Location Name:/i)) {
          const nextLine = lines[i + 1];
          if (nextLine && nextLine.length > 2) currentBooth.name = nextLine;
        }

        // Extract address
        if (line.match(/^Address:|^Street:/i)) {
          const nextLine = lines[i + 1];
          if (nextLine) currentBooth.address = nextLine;
        }

        // Extract city
        if (line.match(/^City:/i)) {
          const nextLine = lines[i + 1];
          if (nextLine) currentBooth.city = nextLine;
        }

        // Extract country
        if (line.match(/^Country:/i)) {
          const nextLine = lines[i + 1];
          if (nextLine) currentBooth.country = nextLine;
        }

        // Extract machine model
        if (line.match(/^Model:|^Machine Model:|^Type:/i)) {
          const nextLine = lines[i + 1];
          if (nextLine) {
            currentBooth.machine_model = nextLine;
            // Detect booth type - only chemical booths
            if (nextLine.toLowerCase().includes('chemical')) {
              currentBooth.booth_type = 'analog';
            }
          }
        }

        // Extract operator
        if (line.match(/^Operator:|^Owner:/i)) {
          const nextLine = lines[i + 1];
          if (nextLine) {
            currentBooth.description = `Operated by: ${nextLine}`;
          }
        }

        // Extract date reported
        if (line.match(/^Date:|^Reported:/i)) {
          const nextLine = lines[i + 1];
          if (nextLine) {
            currentBooth.description = currentBooth.description
              ? `${currentBooth.description}. Reported: ${nextLine}`
              : `Reported: ${nextLine}`;
          }
        }

        // Extract price/cost
        if (line.match(/^Price:|^Cost:/i)) {
          const nextLine = lines[i + 1];
          if (nextLine) currentBooth.cost = nextLine;
        }

        // Extract photo type
        if (line.match(/^Photo Type:|^Format:/i)) {
          const nextLine = lines[i + 1];
          if (nextLine) {
            currentBooth.description = currentBooth.description
              ? `${currentBooth.description}. Format: ${nextLine}`
              : `Format: ${nextLine}`;
          }
        }

        // Extract coordinates
        const coords = this.extractCoordinates(line);
        if (coords.latitude) Object.assign(currentBooth, coords);
      }
    }

    // Add final booth
    if (currentBooth?.name && currentBooth?.address && currentBooth?.country) {
      booths.push(currentBooth);
    }

    // HTML fallback: Look for table or list structure
    if (booths.length === 0) {
      const tableRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      const tableMatches = html.matchAll(tableRegex);

      for (const match of tableMatches) {
        const content = match[1];
        const cells = content.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);

        if (cells && cells.length >= 3) {
          const name = this.cleanHtml(cells[0]);
          const address = this.cleanHtml(cells[1]);
          const city = cells[2] ? this.cleanHtml(cells[2]) : undefined;
          const country = cells[3] ? this.cleanHtml(cells[3]) : undefined;

          if (name.length > 2 && address.length > 5) {
            booths.push({
              name,
              address,
              city,
              country,
              is_operational: true,
            });
          }
        }
      }
    }

    return booths;
  }
}

export async function extractPhotoboothNet(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const extractor = new PhotoboothNetExtractor();
  return extractor.extract(html, markdown, sourceUrl);
}

/**
 * LOMOGRAPHY STORE LOCATOR EXTRACTOR
 * https://www.lomography.com/about/stores
 * Embassy stores typically have analog photo booths
 */
class LomographyExtractor extends BaseExtractor {
  constructor() {
    super('lomography.com', {
      defaultCountry: 'Unknown',
      defaultBoothType: 'analog',
    });
  }

  protected async parseContent(
    html: string,
    markdown: string,
    _sourceUrl: string
  ): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentStore: Partial<BoothData> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Store name pattern
      const storeMatch = line.match(/^#+\s*Lomography\s+(Embassy|Gallery Store|Partner Store)\s+([^#]+)$/i);
      if (storeMatch) {
        if (currentStore?.name && currentStore?.address && currentStore?.country) {
          booths.push(currentStore);
        }
        currentStore = {
          name: `Lomography ${storeMatch[1]} - ${storeMatch[2].trim()}`,
          description: storeMatch[1].toLowerCase() === 'embassy'
            ? 'Embassy store - likely has analog photo booth'
            : 'Lomography store - may have photo booth',
        };
        continue;
      }

      if (currentStore) {
        // Extract structured fields
        if (line.match(/^Address:/i)) currentStore.address = lines[i + 1];
        if (line.match(/^City:/i)) currentStore.city = lines[i + 1];
        if (line.match(/^Country:/i)) currentStore.country = lines[i + 1];
        if (line.match(/^Hours:|^Opening Hours:/i)) currentStore.hours = lines[i + 1];
        if (line.match(/^Website:|^URL:/i)) currentStore.website = lines[i + 1];
        if (line.match(/^Phone:|^Tel:/i)) currentStore.phone = lines[i + 1];

        // Booth availability
        if (line.match(/photo\s*booth|passport\s*booth|analog\s*booth/i)) {
          currentStore.status = 'active';
        }

        // Coordinates
        const coords = this.extractCoordinates(line);
        if (coords.latitude) Object.assign(currentStore, coords);
      }
    }

    // Add final store
    if (currentStore?.name && currentStore?.address && currentStore?.country) {
      booths.push(currentStore);
    }

    return booths;
  }
}

export async function extractLomography(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const extractor = new LomographyExtractor();
  return extractor.extract(html, markdown, sourceUrl);
}

/**
 * FLICKR PHOTOBOOTH GROUP EXTRACTOR
 * https://www.flickr.com/groups/photobooth/
 * Extract location data from photo geotags and user comments
 */
class FlickrPhotoboothExtractor extends BaseExtractor {
  constructor() {
    super('flickr.com/groups/photobooth', {
      defaultCountry: 'Unknown',
      defaultBoothType: 'analog',
    });
  }

  protected async parseContent(
    html: string,
    markdown: string,
    _sourceUrl: string
  ): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: "Location: [name] - [address], [city], [country]"
      const locationMatch = line.match(/Location:\s*([^-]+)\s*-\s*([^,]+),\s*([^,]+),\s*([^,\n]+)/i);
      if (locationMatch) {
        booths.push({
          name: locationMatch[1].trim(),
          address: locationMatch[2].trim(),
          city: locationMatch[3].trim(),
          country: locationMatch[4].trim(),
          status: 'active',
          description: 'Verified from Flickr photo upload',
        });
      }

      // Pattern: "Taken at [venue], [city]"
      const takenAtMatch = line.match(/Taken\s+(?:at|in)\s+([^,]+),\s*([^,\n]+)/i);
      if (takenAtMatch && takenAtMatch[1].length > 2) {
        const booth: Partial<BoothData> = {
          name: takenAtMatch[1].trim(),
          address: takenAtMatch[2].trim(),
          city: takenAtMatch[2].trim(),
          status: 'unverified',
          description: 'From Flickr photo metadata',
        };

        // Look for nearby coordinates
        for (let j = Math.max(0, i - 3); j < Math.min(lines.length, i + 3); j++) {
          const coords = this.extractCoordinates(lines[j]);
          if (coords.latitude) {
            Object.assign(booth, coords);
            break;
          }
        }

        booths.push(booth);
      }

      // Pattern: "This booth is at [location]"
      const commentMatch = line.match(/(?:booth|machine)\s+(?:is\s+)?(?:at|in|located\s+at)\s+([^.,!?\n]+)/i);
      if (commentMatch) {
        const location = commentMatch[1].trim();
        if (location.length > 5 && location.length < 100) {
          const parts = location.split(/,\s*/);
          if (parts.length >= 2) {
            booths.push({
              name: parts[0],
              address: parts[0],
              city: parts[1],
              country: parts[2],
              status: 'unverified',
              description: 'From Flickr user comment',
            });
          }
        }
      }

      // Recent photo verification
      const dateMatch = line.match(/(?:Posted|Uploaded|Taken):\s*(\d{4})-(\d{2})-(\d{2})/i);
      if (dateMatch && booths.length > 0) {
        const year = parseInt(dateMatch[1]);
        const currentYear = new Date().getFullYear();

        if (currentYear - year <= 2) {
          const lastBooth = booths[booths.length - 1];
          lastBooth.status = 'active';
          lastBooth.description = (lastBooth.description || '') + ` - Recent photo: ${dateMatch[0]}`;
        }
      }
    }

    return booths;
  }
}

export async function extractFlickrPhotobooth(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const extractor = new FlickrPhotoboothExtractor();
  return extractor.extract(html, markdown, sourceUrl);
}

/**
 * PINTEREST EXTRACTOR
 * https://www.pinterest.com/search/pins/?q=vintage%20photobooth%20locations
 * Extract location mentions from pin descriptions and board titles
 */
class PinterestExtractor extends BaseExtractor {
  constructor() {
    super('pinterest.com', {
      defaultCountry: 'Unknown',
      defaultBoothType: 'analog',
    });
  }

  protected async parseContent(
    _html: string,
    markdown: string,
    _sourceUrl: string
  ): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    const seen = new Set<string>();

    for (const line of lines) {
      // Pattern: "Vintage photobooth at [venue], [city], [country]"
      const pinMatch = line.match(/(?:photobooth|photo\s+booth)\s+(?:at|in)\s+([^,]+),\s*([^,]+)(?:,\s*([^,\n]+))?/i);
      if (pinMatch && pinMatch[1].length > 2 && pinMatch[2].length > 2) {
        booths.push({
          name: pinMatch[1].trim(),
          address: pinMatch[1].trim(),
          city: pinMatch[2].trim(),
          country: pinMatch[3]?.trim(),
          status: 'unverified',
          description: 'From Pinterest pin description',
        });
      }

      // Pattern: "Photo Booths in NYC"
      const boardMatch = line.match(/(?:photo\s*booths?\s+in|photobooths?\s+in)\s+([^-\n]+)/i);
      if (boardMatch) {
        const city = boardMatch[1].trim();
        if (city.length > 2 && city.length < 50) {
          booths.push({
            name: `Photo booth in ${city}`,
            address: city,
            city: city,
            status: 'unverified',
            description: `From Pinterest board: Photo booths in ${city}`,
          });
        }
      }

      // Pattern: Major city mentions
      const cityPattern = /\b(New York|NYC|Los Angeles|LA|Chicago|San Francisco|Berlin|Paris|London|Tokyo|Seoul|Melbourne|Sydney|Toronto|Vancouver)\b/i;
      const cityOnlyMatch = line.match(cityPattern);
      if (cityOnlyMatch && line.toLowerCase().includes('booth')) {
        const city = cityOnlyMatch[1];
        const normalizedCity = city === 'NYC' ? 'New York' : city === 'LA' ? 'Los Angeles' : city;
        const venueMatch = line.match(/(?:at|in)\s+([^,\n]+?)(?:\s+(?:in|,)\s+)?/i);
        const venue = venueMatch?.[1]?.trim() || `Photo booth in ${normalizedCity}`;
        const key = `${venue}-${normalizedCity}`;

        if (!seen.has(key)) {
          seen.add(key);
          booths.push({
            name: venue,
            address: normalizedCity,
            city: normalizedCity,
            status: 'unverified',
            description: 'From Pinterest location tag',
          });
        }
      }
    }

    return booths;
  }
}

export async function extractPinterest(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const extractor = new PinterestExtractor();
  return extractor.extract(html, markdown, sourceUrl);
}

/**
 * AUTOPHOTO (NYC & NORTHEAST) EXTRACTOR
 * https://www.autophoto.org/locations
 * Operator site with detailed booth specs, pricing, hours
 */
class AutophotoExtractor extends BaseExtractor {
  constructor() {
    super('autophoto.org', {
      defaultCountry: 'USA',
      defaultState: 'NY',
      defaultBoothType: 'analog',
    });
  }

  protected async parseContent(
    html: string,
    markdown: string,
    _sourceUrl: string
  ): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for location headings (h2, h3, or bold text)
      const locationMatch = this.matchHeading(line) || this.matchBold(line);
      if (locationMatch) {
        // Save previous booth
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }

        currentBooth = {
          name: locationMatch[1],
          machine_manufacturer: 'Photo-Booth Inc.',
        };
        continue;
      }

      if (currentBooth) {
        // Extract address - look for street patterns
        if (line.match(/\d+\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*(\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd))?/i)) {
          if (!currentBooth.address) {
            currentBooth.address = line;
          }
        }

        // Extract city, state, zip pattern
        const cityStateMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s*(\d{5})?/);
        if (cityStateMatch) {
          currentBooth.city = cityStateMatch[1];
          currentBooth.state = cityStateMatch[2];
          if (cityStateMatch[3]) {
            currentBooth.postal_code = cityStateMatch[3];
          }
        }

        // Extract phone
        const phone = this.extractPhone(line);
        if (phone) currentBooth.phone = phone;

        // Extract hours
        if (line.match(/hours?:/i)) {
          const hoursText = lines[i + 1];
          if (hoursText) currentBooth.hours = hoursText;
        }

        // Extract cost/price
        const cost = this.extractCost(line);
        if (cost) currentBooth.cost = cost;

        // Extract machine model
        if (line.match(/model[:\s]/i)) {
          const modelText = line.split(/model[:\s]/i)[1]?.trim();
          if (modelText) currentBooth.machine_model = modelText;
        }

        // Extract operational status
        const status = this.checkOperationalStatus(line);
        if (status !== undefined) {
          currentBooth.is_operational = status;
          currentBooth.status = status ? 'active' : 'inactive';
        }

        // Extract coordinates
        const coords = this.extractCoordinates(line);
        if (coords.latitude) Object.assign(currentBooth, coords);

        // Extract website
        const website = this.extractWebsite(line);
        if (website) currentBooth.website = website;

        // Look for photo samples
        const imgMatch = html.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
        if (imgMatch && currentBooth.name) {
          currentBooth.photos = currentBooth.photos || [];
          if (!currentBooth.photos.includes(imgMatch[1])) {
            currentBooth.photos.push(imgMatch[1]);
          }
        }
      }
    }

    // Add final booth
    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    // HTML fallback: Look for structured divs/sections
    if (booths.length === 0) {
      const locationRegex = /<div[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
      const matches = html.matchAll(locationRegex);

      for (const match of matches) {
        const content = match[1];
        const nameMatch = content.match(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/i);
        const addressMatch = content.match(/<p[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)<\/p>/i) ||
                            content.match(/<div[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)<\/div>/i);

        if (nameMatch && addressMatch) {
          const booth: Partial<BoothData> = {
            name: this.cleanHtml(nameMatch[1]),
            address: this.cleanHtml(addressMatch[1]),
          };

          // Try to extract more details from content
          const phoneMatch = content.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
          if (phoneMatch) booth.phone = phoneMatch[0];

          const priceMatch = content.match(/\$(\d+)/);
          if (priceMatch) booth.cost = `$${priceMatch[1]}`;

          booths.push(booth);
        }
      }
    }

    return booths;
  }
}

export async function extractAutophoto(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const extractor = new AutophotoExtractor();
  return extractor.extract(html, markdown, sourceUrl);
}

/**
 * PHOTOMATICA (WEST COAST) EXTRACTOR
 * https://www.photomatica.com/photo-booth-locations/
 * Includes permanent + pop-up locations, rental placements
 */
class PhotomaticaWestCoastExtractor extends BaseExtractor {
  constructor() {
    super('photomatica.com', {
      defaultCountry: 'USA',
      defaultState: 'CA',
      defaultBoothType: 'analog',
    });
  }

  protected async parseContent(
    html: string,
    markdown: string,
    _sourceUrl: string
  ): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;
    let inPermanentSection = false;
    let inPopupSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Section detection
      if (line.match(/permanent\s+location/i)) {
        inPermanentSection = true;
        inPopupSection = false;
        continue;
      }
      if (line.match(/pop[-\s]?up|temporary|rental/i)) {
        inPermanentSection = false;
        inPopupSection = true;
        continue;
      }

      // Location heading
      const locationMatch = this.matchHeading(line) || this.matchBold(line);
      if (locationMatch) {
        // Save previous booth
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }

        currentBooth = {
          name: locationMatch[1],
          machine_manufacturer: 'Photomatica',
          description: inPopupSection ? 'Pop-up/temporary location' : 'Permanent installation',
        };
        continue;
      }

      if (currentBooth) {
        // Address extraction
        if (line.match(/address[:\s]/i)) {
          currentBooth.address = lines[i + 1] || line.split(/address[:\s]/i)[1]?.trim();
        } else if (!currentBooth.address && line.match(/\d+\s+[A-Z]/)) {
          currentBooth.address = line;
        }

        // City/State extraction for West Coast states
        const cityStateMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*(CA|OR|WA|NV|AZ)\s*(\d{5})?/);
        if (cityStateMatch) {
          currentBooth.city = cityStateMatch[1];
          currentBooth.state = cityStateMatch[2];
          if (cityStateMatch[3]) {
            currentBooth.postal_code = cityStateMatch[3];
          }
        }

        // Venue type detection
        if (line.match(/museum/i)) currentBooth.description = (currentBooth.description || '') + ' - Museum';
        if (line.match(/bar|restaurant|cafe/i)) currentBooth.description = (currentBooth.description || '') + ' - Food/Beverage venue';
        if (line.match(/gallery|art/i)) currentBooth.description = (currentBooth.description || '') + ' - Art venue';

        // Hours
        if (line.match(/hours?[:\s]/i) || line.match(/open[:\s]/i)) {
          const hoursText = lines[i + 1] || line.split(/hours?[:\s]|open[:\s]/i)[1]?.trim();
          if (hoursText) currentBooth.hours = hoursText;
        }

        // Price
        const cost = this.extractCost(line);
        if (cost) currentBooth.cost = cost;

        // Machine model
        if (line.match(/model[:\s]|machine[:\s]/i)) {
          const modelText = line.split(/model[:\s]|machine[:\s]/i)[1]?.trim();
          if (modelText) currentBooth.machine_model = modelText;
        }

        // Contact info
        const phone = this.extractPhone(line);
        if (phone) currentBooth.phone = phone;

        const emailMatch = line.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
        if (emailMatch) currentBooth.description = (currentBooth.description || '') + ` - Contact: ${emailMatch[0]}`;

        // Coordinates
        const coords = this.extractCoordinates(line);
        if (coords.latitude) Object.assign(currentBooth, coords);

        // Photos
        const imgRegex = new RegExp(`<img[^>]*alt="[^"]*${currentBooth.name}[^"]*"[^>]*src="([^"]+)"`, 'i');
        const imgMatch = html.match(imgRegex);
        if (imgMatch) {
          currentBooth.photos = currentBooth.photos || [];
          currentBooth.photos.push(imgMatch[1]);
        }
      }
    }

    // Add final booth
    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    // HTML fallback: Look for blog posts and case studies
    if (booths.length === 0) {
      // Look for article/post structures
      const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
      const articles = html.matchAll(articleRegex);

      for (const article of articles) {
        const content = article[1];
        const titleMatch = content.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i);

        if (titleMatch) {
          const cleanContent = this.cleanHtml(content);
          const addressMatch = cleanContent.match(/(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd))?[,\s]+(?:CA|OR|WA|NV|AZ))/i);

          if (addressMatch) {
            booths.push({
              name: this.cleanHtml(titleMatch[1]),
              address: addressMatch[1],
              state: addressMatch[1].match(/CA|OR|WA|NV|AZ/)?.[0] || 'CA',
            });
          }
        }
      }
    }

    return booths;
  }
}

export async function extractPhotomaticaWestCoast(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const extractor = new PhotomaticaWestCoastExtractor();
  return extractor.extract(html, markdown, sourceUrl);
}

/**
 * CLASSIC PHOTO BOOTH CO EXTRACTOR
 * https://www.classicphotoboothco.com/locations
 * Venue placements with detailed case studies
 */
class ClassicPhotoBoothCoExtractor extends BaseExtractor {
  constructor() {
    super('classicphotoboothco.com', {
      defaultCountry: 'USA',
      defaultBoothType: 'analog',
    });
  }

  protected async parseContent(
    html: string,
    markdown: string,
    _sourceUrl: string
  ): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Venue name detection (heading or bold)
      const venueMatch = this.matchHeading(line) || this.matchBold(line);
      if (venueMatch) {
        // Save previous booth
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }

        currentBooth = {
          name: venueMatch[1],
          machine_manufacturer: 'Classic Photo Booth Co.',
        };
        continue;
      }

      if (currentBooth) {
        // Address
        if (line.match(/location[:\s]|address[:\s]/i)) {
          currentBooth.address = lines[i + 1] || line.split(/location[:\s]|address[:\s]/i)[1]?.trim();
        } else if (!currentBooth.address && line.match(/\d+\s+[A-Z][a-z]/)) {
          currentBooth.address = line;
        }

        // City, State, ZIP
        const cityStateMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s*(\d{5})?/);
        if (cityStateMatch) {
          currentBooth.city = cityStateMatch[1];
          currentBooth.state = cityStateMatch[2];
          if (cityStateMatch[3]) {
            currentBooth.postal_code = cityStateMatch[3];
          }
        }

        // Venue type detection
        if (line.match(/venue type[:\s]/i)) {
          const venueType = lines[i + 1];
          if (venueType) currentBooth.description = `Venue type: ${venueType}`;
        }

        // Infer venue type from context
        if (line.match(/bar|pub|tavern/i)) currentBooth.description = 'Bar/Pub venue';
        if (line.match(/restaurant|diner|cafe/i)) currentBooth.description = 'Restaurant/Cafe venue';
        if (line.match(/arcade|game/i)) currentBooth.description = 'Arcade/Gaming venue';
        if (line.match(/mall|shopping/i)) currentBooth.description = 'Shopping mall venue';
        if (line.match(/hotel|resort/i)) currentBooth.description = 'Hotel/Resort venue';

        // Machine model
        if (line.match(/model[:\s]/i)) {
          const modelText = line.split(/model[:\s]/i)[1]?.trim() || lines[i + 1];
          if (modelText) currentBooth.machine_model = modelText;
        }

        // Installation date
        const dateMatch = line.match(/installed[:\s]|since[:\s]|(\d{4})/i);
        if (dateMatch) {
          const year = dateMatch[1] || line.match(/\d{4}/)?.[0];
          if (year && parseInt(year) > 1900 && parseInt(year) <= new Date().getFullYear()) {
            currentBooth.description = (currentBooth.description || '') + ` - Installed: ${year}`;
          }
        }

        // Hours
        if (line.match(/hours?[:\s]|open[:\s]/i)) {
          const hoursText = lines[i + 1] || line.split(/hours?[:\s]|open[:\s]/i)[1]?.trim();
          if (hoursText) currentBooth.hours = hoursText;
        }

        // Price
        const cost = this.extractCost(line);
        if (cost) currentBooth.cost = cost;

        // Contact
        const phone = this.extractPhone(line);
        if (phone) currentBooth.phone = phone;

        // Website
        const website = this.extractWebsite(line);
        if (website) currentBooth.website = website;

        // Coordinates
        const coords = this.extractCoordinates(line);
        if (coords.latitude) Object.assign(currentBooth, coords);

        // Operational status
        if (line.match(/operational|active|open/i) && !line.match(/not|no longer/i)) {
          currentBooth.is_operational = true;
        }
        if (line.match(/closed|removed|inactive/i)) {
          currentBooth.is_operational = false;
          currentBooth.status = 'inactive';
        }
      }
    }

    // Add final booth
    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    // HTML fallback: Look for case study sections
    if (booths.length === 0) {
      // Look for location cards or case study sections
      const locationRegex = /<div[^>]*class="[^"]*(?:location|venue|placement)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
      const matches = html.matchAll(locationRegex);

      for (const match of matches) {
        const content = match[1];
        const nameMatch = content.match(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/i);
        const addressMatch = content.match(/<p[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)<\/p>/i) ||
                            content.match(/(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);

        if (nameMatch && addressMatch) {
          const booth: Partial<BoothData> = {
            name: this.cleanHtml(nameMatch[1]),
            address: this.cleanHtml(addressMatch[1]),
          };

          // Try to extract state from address
          const stateMatch = this.cleanHtml(addressMatch[1]).match(/,\s*([A-Z]{2})/);
          if (stateMatch) booth.state = stateMatch[1];

          booths.push(booth);
        }
      }
    }

    return booths;
  }
}

export async function extractClassicPhotoBoothCo(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const extractor = new ClassicPhotoBoothCoExtractor();
  return extractor.extract(html, markdown, sourceUrl);
}

/**
 * GENERIC EXTRACTOR
 * Fallback for unknown sources using AI-powered extraction
 */
export async function extractGeneric(
  html: string,
  markdown: string,
  sourceUrl: string,
  sourceName: string,
  anthropicApiKey: string
): Promise<ExtractorResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    const content = markdown || cleanHtml(html);
    const chunkSize = 40000;
    const chunks = [];

    for (let i = 0; i < content.length && chunks.length < 10; i += chunkSize) {
      chunks.push(content.substring(i, i + chunkSize));
    }

    console.log(`Processing ${chunks.length} chunks for ${sourceName}`);

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "x-api-key": anthropicApiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-5-20250929",  // Claude Sonnet 4.5 (latest)
            max_tokens: 8000,
            temperature: 0.0,
            system: "Extract ALL photo booth locations with maximum detail. Include name, address, city, country, and any other available information. Focus on analog/chemical photo booths when possible.",
            messages: [
              {
                role: "user",
                content: `Extract ALL photo booth locations from this content:\n\n${chunks[i]}`,
              },
            ],
            tools: [
              {
                name: "extract_booths",
                description: "Extract photo booth location data",
                input_schema: {
                  type: "object",
                  properties: {
                    booths: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          address: { type: "string" },
                          city: { type: "string" },
                          state: { type: "string" },
                          country: { type: "string" },
                          latitude: { type: "number" },
                          longitude: { type: "number" },
                          hours: { type: "string" },
                          cost: { type: "string" },
                          website: { type: "string" },
                          phone: { type: "string" },
                        },
                        required: ["name", "address", "country"],
                      },
                    },
                  },
                  required: ["booths"],
                },
              },
            ],
            tool_choice: { type: "tool", name: "extract_booths" },
          }),
        });

        clearTimeout(timeoutId);

        console.log(`Anthropic API response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Anthropic API error: ${response.status} - ${errorText}`);
          errors.push(`AI extraction failed for chunk ${i + 1}: ${response.status} - ${errorText}`);
          continue;
        }

        const result = await response.json() as AnthropicResponse;
        const toolUse = result.content?.find((block: AnthropicContentBlock) => block.type === "tool_use");

        if (toolUse && toolUse.input?.booths) {
          const extractedBooths = (toolUse.input as any).booths as any[];
          console.log(`Extracted ${extractedBooths.length} booths from chunk ${i + 1}`);
          for (const booth of extractedBooths) {
            booths.push({
              name: booth.name,
              address: booth.address,
              city: booth.city,
              state: booth.state,
              country: booth.country,
              latitude: booth.latitude,
              longitude: booth.longitude,
              hours: booth.hours,
              cost: booth.cost,
              website: booth.website,
              phone: booth.phone,
              source_url: sourceUrl,
              source_name: sourceName,
              status: 'unverified',
              booth_type: 'analog',
              is_operational: true,
            });
          }
        } else {
          console.warn(`No tool_use content in response for chunk ${i + 1}`);
        }
      } catch (chunkError) {
        const errorMessage = chunkError instanceof Error && chunkError.name === 'AbortError' 
          ? `Timeout after 30s processing chunk ${i + 1}`
          : `AI extraction failed for chunk ${i + 1}: ${chunkError instanceof Error ? chunkError.message : String(chunkError)}`;
        
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }

    console.log(`AI extraction complete: ${booths.length} unique booths from ${chunks.length} total chunks`);
  } catch (error) {
    const errorMessage = `Generic extraction error: ${error instanceof Error ? error.message : String(error)}`;
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
 * UTILITY FUNCTIONS
 */

// cleanHtml is used by extractGeneric (AI-powered extraction)
// All other extractors use BaseExtractor.cleanHtml
function cleanHtml(text: string): string {
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
