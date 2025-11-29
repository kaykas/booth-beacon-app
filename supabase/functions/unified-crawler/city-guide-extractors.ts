/**
 * CITY GUIDE EXTRACTORS - TIER 3A
 * Blog and city guide sources for validation and supplemental data
 * These sources provide context-rich information embedded in articles
 *
 * Priority: MEDIUM (validation sources)
 * Expected quality: Variable (requires manual verification)
 *
 * REFACTORED: All extractors now use BaseExtractor to eliminate code duplication
 * Before: 2063 lines | After: ~950 lines (~54% reduction)
 */

import { BaseExtractor } from './base-extractor.ts';
import type { BoothData } from './extractors.ts';

/**
 * BERLIN SOURCES (3)
 */

/**
 * Digital Cosmonaut - Berlin Photoautomat Locations
 * https://digitalcosmonaut.com/berlin-photoautomat-locations/
 */
class DigitalCosmonautBerlinExtractor extends BaseExtractor {
  constructor() {
    super('digital-cosmonaut-berlin', {
      defaultCountry: 'Germany',
      defaultCity: 'Berlin',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (const line of lines) {
      // Pattern 1: Bold location names
      const boldMatch = this.matchBold(line);
      if (boldMatch) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: boldMatch[1] };
        continue;
      }

      // Pattern 2: Headers
      const headerMatch = this.matchHeading(line);
      if (headerMatch && !headerMatch[1].match(/^(Where|How|Why|What|Tips)/i)) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: headerMatch[1] };
        continue;
      }

      if (currentBooth) {
        // Extract address (German street patterns)
        const addressMatch = line.match(/\d{1,5}\s+[A-Z][a-zäöüß]+(?:str|straße|Straße|platz|Platz)/i);
        if (addressMatch) {
          currentBooth.address = addressMatch[0];
        }

        // Extract neighborhood
        const neighborhoodMatch = line.match(/(?:in|neighborhood:|district:)\s*(Mitte|Kreuzberg|Neukölln|Friedrichshain|Prenzlauer Berg|Charlottenburg|Tempelhof|Wedding|Schöneberg)/i);
        if (neighborhoodMatch) {
          currentBooth.description = (currentBooth.description || '') + ` Located in ${neighborhoodMatch[1]}.`;
        }

        // Cost
        const cost = this.extractCost(line, '€');
        if (cost) currentBooth.cost = cost;

        // Operational status
        const operational = this.checkOperationalStatus(line);
        if (operational !== undefined) {
          currentBooth.is_operational = operational;
          currentBooth.status = operational ? 'active' : 'inactive';
        }
      }
    }

    // Add final booth
    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    return booths;
  }
}

/**
 * Phelt Magazine - Photo Booths of Berlin
 * https://pheltmagazine.co/photo-booths-of-berlin/
 */
class PheltMagazineBerlinExtractor extends BaseExtractor {
  constructor() {
    super('phelt-magazine-berlin', {
      defaultCountry: 'Germany',
      defaultCity: 'Berlin',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (const line of lines) {
      // Numbered format
      const numberedMatch = this.matchNumberedList(line);
      if (numberedMatch) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: numberedMatch[2], description: '' };
        continue;
      }

      // Header format
      const headerMatch = this.matchHeading(line);
      if (headerMatch && headerMatch[1].match(/\d/)) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: headerMatch[1].replace(/^\d+\.\s*/, ''), description: '' };
        continue;
      }

      if (currentBooth) {
        // Address
        const address = this.extractAddress(line);
        if (address) {
          currentBooth.address = address;
        }

        // German street pattern
        const germanAddress = line.match(/\d{1,5}\s+[A-Z][a-zäöüß]+(?:str|straße|Straße|platz|Platz)[\s,]+\d{5}/i);
        if (germanAddress) {
          currentBooth.address = germanAddress[0];
        }
      }
    }

    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    return booths;
  }
}

/**
 * Aperture Tours - Berlin Photoautomat
 * https://www.aperturetours.com/blog/2017/berlin-photoautomat
 */
class ApertureToursBerlinExtractor extends BaseExtractor {
  constructor() {
    super('aperture-tours-berlin', {
      defaultCountry: 'Germany',
      defaultCity: 'Berlin',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);

    for (const line of lines) {
      if (line.length < 10) continue;

      // Pattern: "Location Name - Address, Berlin"
      const dashMatch = line.match(/^(.{3,50}?)\s*[-–—]\s*(.+?),?\s*(?:Berlin|10\d{3})/i);
      if (dashMatch && dashMatch[1].length > 3 && dashMatch[2].length > 5) {
        booths.push({
          name: dashMatch[1].trim(),
          address: dashMatch[2].trim(),
        });
        continue;
      }

      // Pattern: "Location Name at Address"
      const atMatch = line.match(/^(.{3,50}?)\s+(?:at|on)\s+(.+?),?\s*(?:Berlin|10\d{3})/i);
      if (atMatch && atMatch[1].length > 3 && atMatch[2].length > 5) {
        booths.push({
          name: atMatch[1].trim(),
          address: atMatch[2].trim(),
        });
      }
    }

    return booths;
  }
}

/**
 * LONDON SOURCES (3)
 */

/**
 * DesignMyNight - Bars with Photo Booths
 * https://www.designmynight.com/london/bars/bars-with-photo-booths
 */
class DesignMyNightLondonExtractor extends BaseExtractor {
  constructor() {
    super('designmynight-london', {
      defaultCountry: 'United Kingdom',
      defaultCity: 'London',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const venueMatch = this.matchHeading(line);

      if (venueMatch && venueMatch[1].length > 3) {
        // Look ahead for address in next 5 lines
        const nextLines = lines.slice(i + 1, i + 6);
        for (const nextLine of nextLines) {
          const addressMatch = nextLine.match(/\d+\s+[A-Z][a-z]+\s+(?:Street|Road|Lane|Avenue|Square|Place)/i);
          const postcodeMatch = nextLine.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i);

          if (addressMatch || postcodeMatch) {
            booths.push({
              name: venueMatch[1].trim(),
              address: addressMatch ? addressMatch[0] : postcodeMatch![0],
              status: 'active',
            });
            break;
          }
        }
      }
    }

    return booths;
  }
}

/**
 * London World - 25 Quirky Photo Booths
 * https://www.londonworld.com/read-this/25-quirky-photo-booths-in-london
 */
class LondonWorldExtractor extends BaseExtractor {
  constructor() {
    super('london-world', {
      defaultCountry: 'United Kingdom',
      defaultCity: 'London',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (const line of lines) {
      // Numbered list
      const numberedMatch = this.matchNumberedList(line);
      if (numberedMatch && numberedMatch[2].length > 3) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: numberedMatch[2] };
        continue;
      }

      // Header format
      const headerMatch = this.matchHeading(line);
      if (headerMatch && !headerMatch[1].match(/^(Introduction|Conclusion)/i)) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: headerMatch[1].replace(/^\d+\.\s*/, '') };
        continue;
      }

      if (currentBooth) {
        // Extract address
        const address = this.extractAddress(line);
        if (address) {
          currentBooth.address = address;
        }

        // UK street pattern
        const streetMatch = line.match(/\d+\s+[A-Z][a-z]+\s+(?:Street|Road|Lane|Avenue|Square|Place)[^.,]{0,40}/i);
        if (streetMatch) {
          currentBooth.address = streetMatch[0];
        }

        // UK postcode
        const postcodeMatch = line.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i);
        if (postcodeMatch) {
          currentBooth.postal_code = postcodeMatch[0];
        }

        // Neighborhood
        const neighborhoodMatch = line.match(/(?:in|neighborhood:)\s*(Shoreditch|Soho|Camden|Hackney|Brixton|Dalston|Peckham|Clapham)/i);
        if (neighborhoodMatch) {
          currentBooth.description = `Located in ${neighborhoodMatch[1]}.`;
        }
      }
    }

    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    return booths;
  }
}

/**
 * The Flash Pack - Best Photo Booths in London
 * https://itstheflashpack.com/the-lens/the-best-photo-booths-in-london
 */
class FlashPackLondonExtractor extends BaseExtractor {
  constructor() {
    super('flashpack-london', {
      defaultCountry: 'United Kingdom',
      defaultCity: 'London',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (const line of lines) {
      // Header format
      const headerMatch = this.matchHeading(line);
      if (headerMatch && !headerMatch[1].match(/^(Where to|How to|Best time)/i)) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: headerMatch[1] };
        continue;
      }

      // Bold location names
      const boldMatch = this.matchBold(line, 4);
      if (boldMatch && boldMatch[1].length <= 50) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: boldMatch[1] };
        continue;
      }

      if (currentBooth) {
        const address = this.extractAddress(line);
        if (address) {
          currentBooth.address = address;
        }

        const hoursMatch = line.match(/(?:Hours?:|Open(?:ing hours)?:)\s*(.+)/i);
        if (hoursMatch) {
          currentBooth.hours = hoursMatch[1];
        }
      }
    }

    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    return booths;
  }
}

/**
 * LOS ANGELES SOURCES (2)
 */

/**
 * TimeOut LA - Best Bars with Photo Booths
 * https://www.timeout.com/los-angeles/bars/best-bars-with-photo-booths
 */
class TimeOutLAExtractor extends BaseExtractor {
  constructor() {
    super('timeout-la', {
      defaultCountry: 'United States',
      defaultCity: 'Los Angeles',
      defaultState: 'CA',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (const line of lines) {
      const numberedMatch = this.matchNumberedList(line);
      if (numberedMatch && numberedMatch[2].length > 3) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: numberedMatch[2] };
        continue;
      }

      const headerMatch = this.matchHeading(line);
      if (headerMatch && !headerMatch[1].match(/^(Best|Top|Where)/i)) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: headerMatch[1].replace(/^\d+\.\s*/, '') };
        continue;
      }

      if (currentBooth) {
        const address = this.extractAddress(line);
        if (address) currentBooth.address = address;

        const usAddress = line.match(/\d+\s+[NSEW]?\.?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive)/i);
        if (usAddress) currentBooth.address = usAddress[0];

        const neighborhoodMatch = line.match(/(?:in|neighborhood:)\s*(Downtown|Hollywood|Silver Lake|Echo Park|Arts District|Santa Monica|Venice|West Hollywood|DTLA)/i);
        if (neighborhoodMatch) {
          currentBooth.description = `Located in ${neighborhoodMatch[1]}.`;
        }

        const cost = this.extractCost(line);
        if (cost) currentBooth.cost = cost;
      }
    }

    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    return booths;
  }
}

/**
 * Locale Magazine - Best LA Photo Booths
 * https://localemagazine.com/best-la-photo-booths/
 */
class LocaleMagazineLAExtractor extends BaseExtractor {
  constructor() {
    super('locale-magazine-la', {
      defaultCountry: 'United States',
      defaultCity: 'Los Angeles',
      defaultState: 'CA',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (const line of lines) {
      const headerMatch = line.match(/^#{2,4}\s+(.+)/);
      if (headerMatch && !headerMatch[1].match(/^(About|Contact|Best of)/i)) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: headerMatch[1] };
        continue;
      }

      if (currentBooth) {
        const address = this.extractAddress(line);
        if (address) currentBooth.address = address;

        const website = this.extractWebsite(line);
        if (website) currentBooth.website = website;
      }
    }

    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    return booths;
  }
}

/**
 * CHICAGO SOURCES (2)
 */

/**
 * TimeOut Chicago - 20 Chicago Bars with Photo Booths
 * https://www.timeout.com/chicago/bars/20-chicago-bars-with-a-photo-booth
 */
class TimeOutChicagoExtractor extends BaseExtractor {
  constructor() {
    super('timeout-chicago', {
      defaultCountry: 'United States',
      defaultCity: 'Chicago',
      defaultState: 'IL',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (const line of lines) {
      const numberedMatch = this.matchNumberedList(line);
      if (numberedMatch && numberedMatch[2].length > 3) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: numberedMatch[2] };
        continue;
      }

      const headerMatch = this.matchHeading(line);
      if (headerMatch && !headerMatch[1].match(/^(Best|Top|Guide)/i)) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: headerMatch[1].replace(/^\d+\.\s*/, '') };
        continue;
      }

      if (currentBooth) {
        const address = this.extractAddress(line);
        if (address) currentBooth.address = address;

        const neighborhoodMatch = line.match(/(?:in|neighborhood:)\s*(Wicker Park|Logan Square|Pilsen|Bucktown|Lincoln Park|Lakeview|River North)/i);
        if (neighborhoodMatch) {
          currentBooth.description = `Located in ${neighborhoodMatch[1]}.`;
        }
      }
    }

    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    return booths;
  }
}

/**
 * Block Club Chicago - Vintage Photo Booths Article
 * https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed/
 */
class BlockClubChicagoExtractor extends BaseExtractor {
  constructor() {
    super('blockclub-chicago', {
      defaultCountry: 'United States',
      defaultCity: 'Chicago',
      defaultState: 'IL',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);

    for (const line of lines) {
      if (line.length < 20) continue;

      // Pattern: "at Location Name, Address"
      const atMatch = line.match(/at\s+([A-Z][^,]{3,40}),\s+(\d+\s+[NSEW]?\.?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St|Street|Ave|Avenue))/i);
      if (atMatch) {
        booths.push({
          name: atMatch[1].trim(),
          address: atMatch[2].trim(),
          status: 'unverified',
        });
        continue;
      }

      // Pattern: "Location Name (Address)"
      const parensMatch = line.match(/([A-Z][^(]{3,40})\s*\((\d+\s+[NSEW]?\.?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St|Street|Ave|Avenue)[^)]*)/i);
      if (parensMatch) {
        const booth: Partial<BoothData> = {
          name: parensMatch[1].trim(),
          address: parensMatch[2].trim(),
          status: 'unverified',
        };

        // Check for closure mention
        if (line.match(/(?:closed|shut down|no longer|removed)/i)) {
          booth.is_operational = false;
          booth.status = 'inactive';
        }

        booths.push(booth);
      }
    }

    return booths;
  }
}

/**
 * NEW YORK SOURCES (3)
 */

/**
 * DesignMyNight NY - New York Venues
 * https://www.designmynight.com/new-york
 */
class DesignMyNightNYExtractor extends BaseExtractor {
  constructor() {
    super('designmynight-ny', {
      defaultCountry: 'United States',
      defaultCity: 'New York',
      defaultState: 'NY',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const venueMatch = this.matchHeading(line);

      if (venueMatch && venueMatch[1].length > 3) {
        const nextLines = lines.slice(i + 1, i + 5);
        for (const nextLine of nextLines) {
          const addressMatch = nextLine.match(/\d+\s+[A-Z][a-z]+\s+(?:Street|Avenue|St|Ave|Road|Rd)/i);
          const zipcodeMatch = nextLine.match(/\b\d{5}\b/);

          if (addressMatch || zipcodeMatch) {
            booths.push({
              name: venueMatch[1].trim(),
              address: addressMatch ? addressMatch[0] : zipcodeMatch![0],
              status: 'active',
            });
            break;
          }
        }
      }
    }

    return booths;
  }
}

/**
 * Roxy Hotel - Photo Booths of New York
 * https://www.roxyhotelnyc.com/stories/photo-booths-of-new-new-york
 */
class RoxyHotelNYExtractor extends BaseExtractor {
  constructor() {
    super('roxy-hotel-ny', {
      defaultCountry: 'United States',
      defaultCity: 'New York',
      defaultState: 'NY',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (const line of lines) {
      const headerMatch = this.matchHeading(line);
      if (headerMatch && !headerMatch[1].match(/^(About|Contact|Stories)/i)) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: headerMatch[1] };
        continue;
      }

      const boldMatch = this.matchBold(line, 4);
      if (boldMatch && boldMatch[1].length <= 50) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: boldMatch[1] };
        continue;
      }

      if (currentBooth) {
        const address = this.extractAddress(line);
        if (address) currentBooth.address = address;

        const neighborhoodMatch = line.match(/(?:in|neighborhood:)\s*(Manhattan|Brooklyn|Queens|East Village|West Village|Soho|Tribeca|Williamsburg|Bushwick)/i);
        if (neighborhoodMatch) {
          currentBooth.description = `Located in ${neighborhoodMatch[1]}.`;
        }
      }
    }

    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    return booths;
  }
}

/**
 * Airial Travel - Vintage Photo Booths Brooklyn
 * https://www.airial.travel/attractions/united-states/vintage-photo-booths-brooklyn
 */
class AirialTravelBrooklynExtractor extends BaseExtractor {
  constructor() {
    super('airial-travel-brooklyn', {
      defaultCountry: 'United States',
      defaultCity: 'Brooklyn',
      defaultState: 'NY',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (const line of lines) {
      const headerMatch = this.matchHeading(line);
      if (headerMatch && !headerMatch[1].match(/^(About|Getting|Best time)/i)) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: headerMatch[1] };
        continue;
      }

      if (currentBooth) {
        const address = this.extractAddress(line);
        if (address) currentBooth.address = address;

        const neighborhoodMatch = line.match(/(?:in|neighborhood:)\s*(Williamsburg|Bushwick|Greenpoint|Park Slope|Carroll Gardens|DUMBO|Red Hook|Prospect Heights)/i);
        if (neighborhoodMatch) {
          currentBooth.description = `Located in ${neighborhoodMatch[1]}, Brooklyn.`;
        }
      }
    }

    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    return booths;
  }
}

/**
 * TIER 3B: INTERNATIONAL CITY GUIDES
 */

/**
 * Solo Sophie - Paris Vintage Photo Booths
 * https://www.solosophie.com/vintage-photo-booth-paris/
 */
class SoloSophieExtractor extends BaseExtractor {
  constructor() {
    super('solo-sophie', {
      defaultCountry: 'France',
      defaultCity: 'Paris',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (const line of lines) {
      const headerMatch = this.matchHeading(line);
      if (headerMatch && !headerMatch[1].match(/^(Paris|Introduction|Map|Where|How)/i)) {
        if (currentBooth?.name && currentBooth?.address) {
          const normalized = normalizeParisAddress(currentBooth.address);
          currentBooth.address = normalized.normalized;
          if (normalized.postal_code) currentBooth.postal_code = normalized.postal_code;
          booths.push(currentBooth);
        }
        currentBooth = { name: headerMatch[1] };
        continue;
      }

      if (currentBooth) {
        const address = this.extractAddress(line);
        if (address) currentBooth.address = address;

        const metroMatch = line.match(/Metro:\s*(.+)/i);
        if (metroMatch) {
          currentBooth.description = (currentBooth.description || '') + ` Metro: ${metroMatch[1]}.`;
        }

        const cost = this.extractCost(line, '€');
        if (cost) currentBooth.cost = cost;
      }
    }

    if (currentBooth?.name && currentBooth?.address) {
      const normalized = normalizeParisAddress(currentBooth.address);
      currentBooth.address = normalized.normalized;
      if (normalized.postal_code) currentBooth.postal_code = normalized.postal_code;
      booths.push(currentBooth);
    }

    return booths;
  }
}

/**
 * Misadventures with Andi - Foto Automat Paris
 * https://misadventureswithandi.com/foto-automat-paris/
 */
class MisadventuresAndiExtractor extends BaseExtractor {
  constructor() {
    super('misadventures-andi', {
      defaultCountry: 'France',
      defaultCity: 'Paris',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (const line of lines) {
      // Numbered entries: 1. **Foto Automat - Marais**
      const numberedMatch = line.match(/^(\d+)\.\s*\*\*(.+?)\*\*/);
      if (numberedMatch) {
        if (currentBooth?.name && currentBooth?.address) {
          const normalized = normalizeParisAddress(currentBooth.address);
          currentBooth.address = normalized.normalized;
          if (normalized.postal_code) currentBooth.postal_code = normalized.postal_code;
          booths.push(currentBooth);
        }
        currentBooth = { name: numberedMatch[2] };
        continue;
      }

      if (currentBooth) {
        const address = this.extractAddress(line);
        if (address) currentBooth.address = address;

        const coords = this.extractCoordinates(line);
        if (coords.latitude && coords.longitude) {
          currentBooth.latitude = coords.latitude;
          currentBooth.longitude = coords.longitude;
        }

        const metroMatch = line.match(/Metro:\s*(.+)/i);
        if (metroMatch) {
          currentBooth.description = (currentBooth.description || '') + ` Metro: ${metroMatch[1]}.`;
        }

        const cost = this.extractCost(line, '€');
        if (cost) currentBooth.cost = cost;
      }
    }

    if (currentBooth?.name && currentBooth?.address) {
      const normalized = normalizeParisAddress(currentBooth.address);
      currentBooth.address = normalized.normalized;
      if (normalized.postal_code) currentBooth.postal_code = normalized.postal_code;
      booths.push(currentBooth);
    }

    return booths;
  }
}

/**
 * No Camera Bag - Photo Spots Vienna
 * https://nocamerabag.com/blog/photo-spots-vienna
 */
class NoCameraBagExtractor extends BaseExtractor {
  constructor() {
    super('no-camera-bag', {
      defaultCountry: 'Austria',
      defaultCity: 'Vienna',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentSection = '';
    let currentDistrict = '';

    for (const line of lines) {
      const headerMatch = this.matchHeading(line);
      if (headerMatch) {
        currentSection = headerMatch[1];
      }

      if (line.match(/photo\s*booth/i)) {
        const districtMatch = line.match(/(\d{1,2})\.\s*Bezirk/i);
        if (districtMatch) {
          currentDistrict = districtMatch[0];
        }

        const addressMatch = line.match(/([A-ZÄÖÜ][a-zäöüß]+(?:straße|strasse|gasse|platz|ring|weg))\s+\d+/i);
        if (addressMatch && currentSection.length > 3) {
          const normalized = normalizeViennaAddress(addressMatch[0], currentDistrict);
          booths.push({
            name: currentSection,
            address: normalized.normalized,
            postal_code: normalized.postal_code,
            status: 'unverified',
          });
        }
      }
    }

    return booths;
  }
}

/**
 * Girl in Florence - Fotoautomatica Search
 * https://girlinflorence.com/?s=Fotoautomatica
 */
class GirlInFlorenceExtractor extends BaseExtractor {
  constructor() {
    super('girl-in-florence', {
      defaultCountry: 'Italy',
      defaultCity: 'Florence',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    const seen = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const addressMatch = line.match(/(Via|Piazza|Viale|Borgo|Lungarno)\s+[A-Z][a-zàèéìòù]+(?:\s+[A-Z][a-zàèéìòù]+)*\s+\d+r?/i);

      if (addressMatch) {
        const address = normalizeFlorenceAddress(addressMatch[0]);

        let name = 'Fotoautomatica';
        for (let j = Math.max(0, i - 5); j < i; j++) {
          const nameMatch = lines[j].match(/^#{2,3}\s+(.+)/);
          if (nameMatch && !nameMatch[1].match(/^(Search|Results|Florence)/i)) {
            name = nameMatch[1];
            break;
          }
        }

        const key = `${name.toLowerCase()}_florence`;
        if (!seen.has(key)) {
          seen.add(key);
          const booth: Partial<BoothData> = { name, address };

          const cost = this.extractCost(line, '€');
          if (cost) booth.cost = cost;

          booths.push(booth);
        }
      }
    }

    return booths;
  }
}

/**
 * Accidentally Wes Anderson - Fotoautomatica
 * https://accidentallywesanderson.com/places/fotoautomatica/
 */
class AccidentallyWesAndersonExtractor extends BaseExtractor {
  constructor() {
    super('accidentally-wes-anderson', {
      defaultCountry: 'Italy',
      defaultCity: 'Florence',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const lines = this.parseLines(markdown);
    const booth: Partial<BoothData> = { name: 'Fotoautomatica' };

    for (const line of lines) {
      const addressMatch = line.match(/\*\*Address:\*\*\s*(.+)/i);
      if (addressMatch) {
        booth.address = normalizeFlorenceAddress(addressMatch[1].trim());
      }

      const hoursMatch = line.match(/\*\*Hours:\*\*\s*(.+)/i);
      if (hoursMatch) {
        booth.hours = hoursMatch[1].trim();
      }

      const coords = this.extractCoordinates(line);
      if (coords.latitude && coords.longitude) {
        booth.latitude = coords.latitude;
        booth.longitude = coords.longitude;
      }

      const costMatch = line.match(/\*\*Cost:\*\*\s*(.+)/i);
      if (costMatch) {
        booth.cost = costMatch[1].trim();
      }

      if (line.length > 50 && !line.match(/\*\*/)) {
        booth.description = (booth.description || '') + ' ' + line;
      }
    }

    return booth.address ? [booth] : [];
  }
}

/**
 * DoTheBay - Photo Booths in the Bay
 * https://dothebay.com/p/photo-booths-in-the-bay
 */
class DoTheBayExtractor extends BaseExtractor {
  constructor() {
    super('dothebay', {
      defaultCountry: 'United States',
      defaultCity: 'San Francisco',
      defaultState: 'CA',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    const bayCities = ['San Francisco', 'Oakland', 'Berkeley', 'San Jose', 'Palo Alto', 'Daly City'];

    for (const line of lines) {
      const numberedMatch = line.match(/^(\d+)\.\s*\*\*(.+?)\*\*/);
      if (numberedMatch) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: numberedMatch[2] };
        continue;
      }

      if (currentBooth) {
        const addressMatch = line.match(/\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road),\s*([A-Za-z\s]+),?\s*CA\s*(\d{5})?/i);
        if (addressMatch) {
          currentBooth.address = addressMatch[0];
          if (addressMatch[2]) currentBooth.postal_code = addressMatch[2];

          const cityName = addressMatch[1].trim();
          const matchedCity = bayCities.find(c => cityName.toLowerCase().includes(c.toLowerCase()));
          if (matchedCity) currentBooth.city = matchedCity;
        }

        const cost = this.extractCost(line);
        if (cost) currentBooth.cost = cost;
      }
    }

    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    return booths;
  }
}

/**
 * Concrete Playground - Melbourne/Sydney Bars
 * https://concreteplayground.com/melbourne/bars
 */
class ConcretePlaygroundExtractor extends BaseExtractor {
  constructor() {
    super('concrete-playground', {
      defaultCountry: 'Australia',
      defaultCity: 'Melbourne',
      defaultState: 'VIC',
    });
  }

  protected async parseContent(_html: string, markdown: string, sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentVenue = '';

    // Detect city from URL
    const city = sourceUrl.includes('/sydney/') ? 'Sydney' : 'Melbourne';
    const state = city === 'Sydney' ? 'NSW' : 'VIC';

    for (const line of lines) {
      const headerMatch = this.matchHeading(line);
      if (headerMatch) {
        currentVenue = headerMatch[1];
      }

      if (line.match(/photo\s*booth/i) && currentVenue) {
        const addressMatch = line.match(/\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St|Street|Ave|Avenue|Rd|Road|Pl|Place),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);

        if (addressMatch) {
          booths.push({
            name: currentVenue,
            address: addressMatch[0],
            city: addressMatch[1],
            state: state,
            status: 'active',
          });
        } else {
          booths.push({
            name: currentVenue,
            address: city,
            city: city,
            state: state,
            status: 'unverified',
            description: 'Venue with photo booth (address details pending verification)',
          });
        }
      }
    }

    return booths;
  }
}

/**
 * Japan Experience - Purikura Tokyo
 * https://www.japan-experience.com/all-about-japan/tokyo/attractions-excursions/purikura-tokyo
 */
class JapanExperienceExtractor extends BaseExtractor {
  constructor() {
    super('japan-experience', {
      defaultCountry: 'Japan',
      defaultCity: 'Tokyo',
      defaultBoothType: 'digital', // CRITICAL: Purikura are digital
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (const line of lines) {
      const headerMatch = this.matchHeading(line);
      if (headerMatch && !headerMatch[1].match(/^(Purikura|What|How|Where|Tokyo)/i)) {
        if (currentBooth?.name && currentBooth?.address) {
          booths.push(currentBooth);
        }
        currentBooth = { name: headerMatch[1], booth_type: 'digital' };
        continue;
      }

      if (currentBooth) {
        const wardMatch = line.match(/(Shibuya|Shinjuku|Minato|Chiyoda|Chūō|Taitō|Sumida|Kōtō|Shinagawa|Meguro|Ōta|Setagaya|Nakano|Suginami|Toshima|Kita|Arakawa|Itabashi|Nerima|Adachi|Katsushika|Edogawa)-ku/i);
        if (wardMatch) {
          currentBooth.address = wardMatch[0];
        }

        const stationMatch = line.match(/Station:\s*(.+)/i) || line.match(/Near:\s*(.+?)\s*Station/i);
        if (stationMatch) {
          currentBooth.description = (currentBooth.description || '') + ` Near ${stationMatch[1]} Station.`;
        }

        const cost = this.extractCost(line, '¥');
        if (cost) currentBooth.cost = cost;
      }
    }

    if (currentBooth?.name && currentBooth?.address) {
      booths.push(currentBooth);
    }

    return booths;
  }
}

/**
 * Smithsonian Magazine - Photo Booth History Search
 * https://www.smithsonianmag.com/search/?q=photo+booth+history
 */
class SmithsonianExtractor extends BaseExtractor {
  constructor() {
    super('smithsonian', {
      defaultCountry: 'Unknown',
    });
  }

  protected async parseContent(_html: string, markdown: string, _sourceUrl: string): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentContext = '';

    for (const line of lines) {
      if (line.length > 50 && !line.match(/^#{1,6}/)) {
        currentContext = line;
      }

      const locationMatch = line.match(/in\s+([A-Z][a-z]+(?:,\s*[A-Z]{2})?)/);
      if (locationMatch && currentContext.match(/photo\s*booth/i)) {
        const location = locationMatch[1];
        const parts = location.split(',').map(p => p.trim());

        const booth: Partial<BoothData> = {
          name: 'Historical Photo Booth',
          address: location,
          city: parts[0],
          country: parts.length > 1 ? 'United States' : 'Unknown',
          is_operational: false,
          status: 'inactive',
          description: currentContext.slice(0, 300),
        };

        const dateMatch = currentContext.match(/circa\s*(\d{4})/i) || currentContext.match(/(\d{4})s\b/);
        if (dateMatch) {
          booth.description = `Historical booth (circa ${dateMatch[1]}): ` + (booth.description || '');
        }

        booths.push(booth);
      }
    }

    return booths;
  }
}

/**
 * INTERNATIONAL ADDRESS NORMALIZATION FUNCTIONS
 */

function normalizeParisAddress(address: string): { normalized: string; postal_code?: string } {
  let normalized = address
    .replace(/\b(rue|avenue|boulevard|place)\b/gi, (match) =>
      match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
    )
    .replace(/\s+/g, ' ')
    .trim();

  const postalMatch = normalized.match(/\b(75\d{3})\b/);
  const postal_code = postalMatch ? postalMatch[1] : undefined;

  return { normalized, postal_code };
}

function normalizeViennaAddress(address: string, districtText?: string): { normalized: string; postal_code?: string } {
  let normalized = address
    .replace(/\b(straße|strasse|gasse|platz|ring|weg)\b/gi, (match) =>
      match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
    );

  let postal_code: string | undefined;
  if (districtText) {
    const districtMatch = districtText.match(/(\d{1,2})\.\s*Bezirk/i);
    if (districtMatch) {
      const district = parseInt(districtMatch[1]);
      postal_code = `1${district.toString().padStart(3, '0')}0`;
    }
  }

  return { normalized, postal_code };
}

function normalizeFlorenceAddress(address: string): string {
  return address
    .replace(/\b(via|piazza|viale|borgo|lungarno)\b/gi, (match) =>
      match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
    )
    .trim();
}

/**
 * EXPORTED EXTRACTOR FUNCTIONS
 * These maintain the original function signatures for backward compatibility
 */

const digitalCosmonautBerlin = new DigitalCosmonautBerlinExtractor();
export const extractDigitalCosmonautBerlin = (html: string, markdown: string, sourceUrl: string) =>
  digitalCosmonautBerlin.extract(html, markdown, sourceUrl);

const pheltMagazineBerlin = new PheltMagazineBerlinExtractor();
export const extractPheltMagazineBerlin = (html: string, markdown: string, sourceUrl: string) =>
  pheltMagazineBerlin.extract(html, markdown, sourceUrl);

const apertureToursBerlin = new ApertureToursBerlinExtractor();
export const extractApertureToursberlin = (html: string, markdown: string, sourceUrl: string) =>
  apertureToursBerlin.extract(html, markdown, sourceUrl);

const designMyNightLondon = new DesignMyNightLondonExtractor();
export const extractDesignMyNightLondon = (html: string, markdown: string, sourceUrl: string) =>
  designMyNightLondon.extract(html, markdown, sourceUrl);

const londonWorld = new LondonWorldExtractor();
export const extractLondonWorld = (html: string, markdown: string, sourceUrl: string) =>
  londonWorld.extract(html, markdown, sourceUrl);

const flashPackLondon = new FlashPackLondonExtractor();
export const extractFlashPackLondon = (html: string, markdown: string, sourceUrl: string) =>
  flashPackLondon.extract(html, markdown, sourceUrl);

const timeOutLA = new TimeOutLAExtractor();
export const extractTimeOutLA = (html: string, markdown: string, sourceUrl: string) =>
  timeOutLA.extract(html, markdown, sourceUrl);

const localeMagazineLA = new LocaleMagazineLAExtractor();
export const extractLocaleMagazineLA = (html: string, markdown: string, sourceUrl: string) =>
  localeMagazineLA.extract(html, markdown, sourceUrl);

const timeOutChicago = new TimeOutChicagoExtractor();
export const extractTimeOutChicago = (html: string, markdown: string, sourceUrl: string) =>
  timeOutChicago.extract(html, markdown, sourceUrl);

const blockClubChicago = new BlockClubChicagoExtractor();
export const extractBlockClubChicago = (html: string, markdown: string, sourceUrl: string) =>
  blockClubChicago.extract(html, markdown, sourceUrl);

const designMyNightNY = new DesignMyNightNYExtractor();
export const extractDesignMyNightNY = (html: string, markdown: string, sourceUrl: string) =>
  designMyNightNY.extract(html, markdown, sourceUrl);

const roxyHotelNY = new RoxyHotelNYExtractor();
export const extractRoxyHotelNY = (html: string, markdown: string, sourceUrl: string) =>
  roxyHotelNY.extract(html, markdown, sourceUrl);

const airialTravelBrooklyn = new AirialTravelBrooklynExtractor();
export const extractAirialTravelBrooklyn = (html: string, markdown: string, sourceUrl: string) =>
  airialTravelBrooklyn.extract(html, markdown, sourceUrl);

const soloSophie = new SoloSophieExtractor();
export const extractSoloSophie = (html: string, markdown: string, sourceUrl: string) =>
  soloSophie.extract(html, markdown, sourceUrl);

const misadventuresAndi = new MisadventuresAndiExtractor();
export const extractMisadventuresAndi = (html: string, markdown: string, sourceUrl: string) =>
  misadventuresAndi.extract(html, markdown, sourceUrl);

const noCameraBag = new NoCameraBagExtractor();
export const extractNoCameraBag = (html: string, markdown: string, sourceUrl: string) =>
  noCameraBag.extract(html, markdown, sourceUrl);

const girlInFlorence = new GirlInFlorenceExtractor();
export const extractGirlInFlorence = (html: string, markdown: string, sourceUrl: string) =>
  girlInFlorence.extract(html, markdown, sourceUrl);

const accidentallyWesAnderson = new AccidentallyWesAndersonExtractor();
export const extractAccidentallyWesAnderson = (html: string, markdown: string, sourceUrl: string) =>
  accidentallyWesAnderson.extract(html, markdown, sourceUrl);

const doTheBay = new DoTheBayExtractor();
export const extractDoTheBay = (html: string, markdown: string, sourceUrl: string) =>
  doTheBay.extract(html, markdown, sourceUrl);

const concretePlayground = new ConcretePlaygroundExtractor();
export const extractConcretePlayground = (html: string, markdown: string, sourceUrl: string) =>
  concretePlayground.extract(html, markdown, sourceUrl);

const japanExperience = new JapanExperienceExtractor();
export const extractJapanExperience = (html: string, markdown: string, sourceUrl: string) =>
  japanExperience.extract(html, markdown, sourceUrl);

const smithsonian = new SmithsonianExtractor();
export const extractSmithsonian = (html: string, markdown: string, sourceUrl: string) =>
  smithsonian.extract(html, markdown, sourceUrl);
