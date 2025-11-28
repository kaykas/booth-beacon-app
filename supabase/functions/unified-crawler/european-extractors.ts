/**
 * TIER 2B: EUROPEAN OPERATORS EXTRACTORS
 * 8 European/Pacific operator sources with multi-language support
 */

import type { BoothData, ExtractorResult } from "./extractors";

/**
 * FOTOAUTOMAT BERLIN EXTRACTOR
 * PRIMARY Berlin source - http://www.fotoautomat.de/standorte.html
 * German language, detailed location listings
 */
export async function extractFotoautomatBerlin(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    const lines = markdown.split('\n');
    let currentBooth: Partial<BoothData> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Pattern: Bold location names followed by address
      const locationMatch = line.match(/^\*\*([^*]+)\*\*/);
      if (locationMatch) {
        if (currentBooth && currentBooth.name && currentBooth.address) {
          booths.push(finalizeBooth(currentBooth, sourceUrl, 'fotoautomat-berlin'));
        }
        currentBooth = { name: locationMatch[1].trim(), city: 'Berlin', country: 'Germany' };
        continue;
      }

      if (currentBooth) {
        // Extract address (typically follows location name)
        if (!currentBooth.address && line.length > 10 && !line.startsWith('*')) {
          // German address format: Street Number, Postal City
          const addressMatch = line.match(/^([^,]+),?\s*(\d{5})?\s*(Berlin)?/i);
          if (addressMatch) {
            currentBooth.address = addressMatch[1].trim();
            if (addressMatch[2]) currentBooth.postal_code = addressMatch[2];
          } else if (line.length < 150) {
            currentBooth.address = line;
          }
        }

        // Extract district/neighborhood (common in Berlin listings)
        if (line.match(/^(Mitte|Kreuzberg|Friedrichshain|Prenzlauer Berg|Neukölln|Charlottenburg|Schöneberg)/i)) {
          currentBooth.description = `District: ${line}`;
        }
      }
    }

    // Add final booth
    if (currentBooth && currentBooth.name && currentBooth.address) {
      booths.push(finalizeBooth(currentBooth, sourceUrl, 'fotoautomat-berlin'));
    }

    // HTML fallback: Look for list structure
    if (booths.length === 0) {
      const listRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      const matches = html.matchAll(listRegex);

      for (const match of matches) {
        const content = cleanHtml(match[1]);
        const parts = content.split(/[-–—,]/).map(p => p.trim());

        if (parts.length >= 2 && parts[0].length > 2) {
          booths.push({
            name: parts[0],
            address: parts[1],
            city: 'Berlin',
            country: 'Germany',
            source_url: sourceUrl,
            source_name: 'fotoautomat-berlin',
            status: 'active',
            booth_type: 'analog',
            is_operational: true,
          });
        }
      }
    }

  } catch (error) {
    errors.push(`Fotoautomat Berlin extraction error: ${error}`);
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
 * AUTOFOTO UK & SPAIN EXTRACTOR
 * https://www.autofoto.org/find-our-booths
 * London + Barcelona locations
 */
export async function extractAutofoto(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    const lines = markdown.split('\n');
    let currentCity: string | null = null;
    let currentCountry: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect city headers (London, Barcelona)
      if (line.match(/^(London|Barcelona)$/i)) {
        currentCity = line;
        currentCountry = line.toLowerCase() === 'london' ? 'United Kingdom' : 'Spain';
        continue;
      }

      // Pattern: Location name followed by address
      const locationMatch = line.match(/^(.+?)\s*[-–—]\s*(.+)/);
      if (locationMatch && currentCity && currentCountry) {
        booths.push({
          name: locationMatch[1].trim(),
          address: locationMatch[2].trim(),
          city: currentCity,
          country: currentCountry,
          source_url: sourceUrl,
          source_name: 'autofoto',
          status: 'active',
          booth_type: 'analog',
          is_operational: true,
        });
      }

      // Pattern: Just location names in lists
      if (line.length > 5 && line.length < 100 && !line.includes('*') && currentCity) {
        const cleaned = cleanHtml(line);
        if (cleaned.length > 5) {
          booths.push({
            name: cleaned,
            address: cleaned, // Use name as address if no separate address
            city: currentCity,
            country: currentCountry || 'United Kingdom',
            source_url: sourceUrl,
            source_name: 'autofoto',
            status: 'active',
            booth_type: 'analog',
            is_operational: true,
          });
        }
      }
    }

    // HTML fallback: Look for structured divs
    if (booths.length === 0) {
      const locationRegex = /<div[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
      const matches = html.matchAll(locationRegex);

      for (const match of matches) {
        const content = match[1];
        const nameMatch = content.match(/<h[2-5][^>]*>([^<]+)<\/h[2-5]>/i);
        const addressMatch = content.match(/<p[^>]*>([^<]+)<\/p>/i);

        if (nameMatch) {
          booths.push({
            name: cleanHtml(nameMatch[1]),
            address: addressMatch ? cleanHtml(addressMatch[1]) : cleanHtml(nameMatch[1]),
            city: 'London',
            country: 'United Kingdom',
            source_url: sourceUrl,
            source_name: 'autofoto',
            status: 'active',
            booth_type: 'analog',
            is_operational: true,
          });
        }
      }
    }

  } catch (error) {
    errors.push(`Autofoto extraction error: ${error}`);
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
 * FOTOAUTOMAT.FR EXTRACTOR
 * https://www.fotoautomat.fr/
 * France & Czechia locations, multilingual
 */
export async function extractFotoautomatFr(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    const lines = markdown.split('\n');
    let currentCity: string | null = null;
    let currentCountry: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect French cities (Paris, Lyon, Marseille, etc.)
      if (line.match(/^(Paris|Lyon|Marseille|Toulouse|Bordeaux|Lille|Prague|Brno)$/i)) {
        currentCity = line;
        currentCountry = line.toLowerCase().match(/prague|brno/) ? 'Czechia' : 'France';
        continue;
      }

      // Pattern: Location - Address, Postal City
      const locationMatch = line.match(/^(.+?)\s*[-–—]\s*(.+?),?\s*(\d{5})?\s*(.+)?/);
      if (locationMatch && currentCity) {
        booths.push({
          name: locationMatch[1].trim(),
          address: locationMatch[2].trim(),
          postal_code: locationMatch[3]?.trim(),
          city: currentCity,
          country: currentCountry || 'France',
          source_url: sourceUrl,
          source_name: 'fotoautomat-fr',
          status: 'active',
          booth_type: 'analog',
          is_operational: true,
        });
      }

      // Pattern: French address format with arrondissement
      const frenchMatch = line.match(/^(.+?)\s*[-–—]\s*(.+?),\s*(\d{5})\s*(Paris|Lyon|Marseille)?/i);
      if (frenchMatch) {
        booths.push({
          name: frenchMatch[1].trim(),
          address: frenchMatch[2].trim(),
          postal_code: frenchMatch[3],
          city: frenchMatch[4] || currentCity || 'Paris',
          country: 'France',
          source_url: sourceUrl,
          source_name: 'fotoautomat-fr',
          status: 'active',
          booth_type: 'analog',
          is_operational: true,
        });
      }
    }

    // HTML fallback: Look for French/Czech location markers
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
                  city: item.location.addressLocality || 'Paris',
                  country: item.location.addressCountry || 'France',
                  latitude: item.location.geo?.latitude,
                  longitude: item.location.geo?.longitude,
                  source_url: sourceUrl,
                  source_name: 'fotoautomat-fr',
                  status: 'active',
                  booth_type: 'analog',
                });
              }
            }
          }
        } catch (e) {
          errors.push(`JSON-LD parsing failed: ${e}`);
        }
      }
    }

  } catch (error) {
    errors.push(`Fotoautomat.fr extraction error: ${error}`);
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
 * FOTOAUTOMAT WIEN EXTRACTOR
 * https://www.fotoautomatwien.com/
 * Austria (Vienna) locations
 */
export async function extractFotoautomatWien(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    const lines = markdown.split('\n');
    let currentBooth: Partial<BoothData> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Pattern: Bold location names
      const locationMatch = line.match(/^\*\*([^*]+)\*\*/);
      if (locationMatch) {
        if (currentBooth && currentBooth.name && currentBooth.address) {
          booths.push(finalizeBooth(currentBooth, sourceUrl, 'fotoautomat-wien'));
        }
        currentBooth = { name: locationMatch[1].trim(), city: 'Vienna', country: 'Austria' };
        continue;
      }

      if (currentBooth) {
        // Austrian address format: Street Number, Postal Vienna
        if (!currentBooth.address && line.length > 10 && !line.startsWith('*')) {
          const addressMatch = line.match(/^([^,]+),?\s*(\d{4})?\s*(Wien|Vienna)?/i);
          if (addressMatch) {
            currentBooth.address = addressMatch[1].trim();
            if (addressMatch[2]) currentBooth.postal_code = addressMatch[2];
          } else if (line.length < 150) {
            currentBooth.address = line;
          }
        }

        // Extract district (Wien has 23 districts)
        const districtMatch = line.match(/(\d{4})\s*(Wien|Vienna)/i);
        if (districtMatch) {
          currentBooth.postal_code = districtMatch[1];
          const district = parseInt(districtMatch[1].substring(2));
          if (district >= 1 && district <= 23) {
            currentBooth.description = `${district}. Bezirk (District ${district})`;
          }
        }
      }
    }

    // Add final booth
    if (currentBooth && currentBooth.name && currentBooth.address) {
      booths.push(finalizeBooth(currentBooth, sourceUrl, 'fotoautomat-wien'));
    }

    // HTML fallback
    if (booths.length === 0) {
      const listRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      const matches = html.matchAll(listRegex);

      for (const match of matches) {
        const content = cleanHtml(match[1]);
        const parts = content.split(/[-–—,]/).map(p => p.trim());

        if (parts.length >= 2 && parts[0].length > 2) {
          booths.push({
            name: parts[0],
            address: parts[1],
            city: 'Vienna',
            country: 'Austria',
            source_url: sourceUrl,
            source_name: 'fotoautomat-wien',
            status: 'active',
            booth_type: 'analog',
            is_operational: true,
          });
        }
      }
    }

  } catch (error) {
    errors.push(`Fotoautomat Wien extraction error: ${error}`);
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
 * FOTOAUTOMATICA EXTRACTOR
 * https://fotoautomatica.com/
 * Florence, Italy only (5 booths)
 */
export async function extractFotoautomatica(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    const lines = markdown.split('\n');
    let currentBooth: Partial<BoothData> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Pattern: Italian location names (often piazza, via, etc.)
      const locationMatch = line.match(/^\*\*([^*]+)\*\*/);
      if (locationMatch) {
        if (currentBooth && currentBooth.name && currentBooth.address) {
          booths.push(finalizeBooth(currentBooth, sourceUrl, 'fotoautomatica'));
        }
        currentBooth = { name: locationMatch[1].trim(), city: 'Florence', country: 'Italy' };
        continue;
      }

      if (currentBooth) {
        // Italian address format: Via/Piazza Name, Number, Postal City
        if (!currentBooth.address && line.length > 10 && !line.startsWith('*')) {
          const italianMatch = line.match(/^(Via|Piazza|Viale|Corso)\s+([^,]+),?\s*(\d+)?/i);
          if (italianMatch) {
            currentBooth.address = `${italianMatch[1]} ${italianMatch[2]}${italianMatch[3] ? ', ' + italianMatch[3] : ''}`.trim();
          } else if (line.length < 150) {
            currentBooth.address = line;
          }
        }

        // Extract postal code (Florence is 50xxx)
        const postalMatch = line.match(/50\d{3}/);
        if (postalMatch) {
          currentBooth.postal_code = postalMatch[0];
        }
      }
    }

    // Add final booth
    if (currentBooth && currentBooth.name && currentBooth.address) {
      booths.push(finalizeBooth(currentBooth, sourceUrl, 'fotoautomatica'));
    }

    // HTML fallback
    if (booths.length === 0) {
      const listRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      const matches = html.matchAll(listRegex);

      for (const match of matches) {
        const content = cleanHtml(match[1]);
        if (content.length > 5 && content.length < 200) {
          // Try to split into name and address
          const parts = content.split(/[-–—,]/).map(p => p.trim());

          booths.push({
            name: parts[0] || content,
            address: parts[1] || parts[0],
            city: 'Florence',
            country: 'Italy',
            source_url: sourceUrl,
            source_name: 'fotoautomatica',
            status: 'active',
            booth_type: 'analog',
            is_operational: true,
          });
        }
      }
    }

  } catch (error) {
    errors.push(`Fotoautomatica extraction error: ${error}`);
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
 * THE FLASH PACK EXTRACTOR
 * https://www.itstheflashpack.com/case-studies/
 * UK custom installations - case study page
 */
export async function extractFlashPack(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    const lines = markdown.split('\n');
    let currentProject: Partial<BoothData> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Pattern: Case study headers (often h2 or h3)
      const headerMatch = line.match(/^##\s*([^#]+)|^\*\*([^*]+)\*\*/);
      if (headerMatch) {
        if (currentProject && currentProject.name) {
          booths.push(finalizeBooth(currentProject, sourceUrl, 'flash-pack'));
        }
        currentProject = {
          name: (headerMatch[1] || headerMatch[2]).trim(),
          country: 'United Kingdom',
          booth_type: 'custom',
        };
        continue;
      }

      if (currentProject) {
        // Extract venue/location information
        if (line.match(/^(Venue|Location|Site):/i)) {
          const venue = lines[i + 1]?.trim();
          if (venue) {
            currentProject.address = venue;
            // Try to detect city from venue name
            const ukCities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Bristol', 'Newcastle'];
            for (const city of ukCities) {
              if (venue.toLowerCase().includes(city.toLowerCase())) {
                currentProject.city = city;
                break;
              }
            }
          }
        }

        // Extract description/details
        if (line.match(/^(About|Description|Details):/i)) {
          const desc = lines[i + 1]?.trim();
          if (desc && desc.length < 300) {
            currentProject.description = desc;
          }
        }

        // Default to London if no city found but has address
        if (currentProject.address && !currentProject.city) {
          currentProject.city = 'London';
        }
      }
    }

    // Add final project
    if (currentProject && currentProject.name) {
      booths.push(finalizeBooth(currentProject, sourceUrl, 'flash-pack'));
    }

    // HTML fallback: Look for case study cards
    if (booths.length === 0) {
      const caseStudyRegex = /<article[^>]*class="[^"]*case-study[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
      const matches = html.matchAll(caseStudyRegex);

      for (const match of matches) {
        const content = match[1];
        const titleMatch = content.match(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/i);
        const textMatch = content.match(/<p[^>]*>([^<]+)<\/p>/i);

        if (titleMatch) {
          booths.push({
            name: cleanHtml(titleMatch[1]),
            address: textMatch ? cleanHtml(textMatch[1]) : 'Custom Installation',
            city: 'London',
            country: 'United Kingdom',
            source_url: sourceUrl,
            source_name: 'flash-pack',
            status: 'active',
            booth_type: 'custom',
            is_operational: true,
          });
        }
      }
    }

  } catch (error) {
    errors.push(`Flash Pack extraction error: ${error}`);
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
 * METRO AUTO PHOTO EXTRACTOR
 * https://metroautophoto.com.au/locations/
 * Melbourne, Australia
 */
export async function extractMetroAutoPhoto(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    const lines = markdown.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Pattern: Location name - Address, Suburb
      const locationMatch = line.match(/^(.+?)\s*[-–—]\s*(.+?),\s*([A-Za-z\s]+)(?:\s+(VIC|NSW))?/);
      if (locationMatch && locationMatch[1].length > 2) {
        booths.push({
          name: locationMatch[1].trim(),
          address: locationMatch[2].trim(),
          city: locationMatch[3].trim(),
          state: locationMatch[4] || 'VIC', // Default to Victoria
          country: 'Australia',
          source_url: sourceUrl,
          source_name: 'metro-auto-photo',
          status: 'active',
          booth_type: 'analog',
          is_operational: true,
        });
      }

      // Pattern: Suburb-first format (common in Australian listings)
      const suburbMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[-–—]\s*(.+)/);
      if (suburbMatch && suburbMatch[1].length > 2) {
        booths.push({
          name: suburbMatch[2].trim(),
          address: suburbMatch[2].trim(),
          city: suburbMatch[1].trim(),
          state: 'VIC',
          country: 'Australia',
          source_url: sourceUrl,
          source_name: 'metro-auto-photo',
          status: 'active',
          booth_type: 'analog',
          is_operational: true,
        });
      }
    }

    // HTML fallback: Look for location divs or lists
    if (booths.length === 0) {
      const listRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      const matches = html.matchAll(listRegex);

      for (const match of matches) {
        const content = cleanHtml(match[1]);
        const parts = content.split(/[-–—,]/).map(p => p.trim());

        if (parts.length >= 2 && parts[0].length > 2) {
          booths.push({
            name: parts[0],
            address: parts[1],
            city: parts[2] || 'Melbourne',
            state: 'VIC',
            country: 'Australia',
            source_url: sourceUrl,
            source_name: 'metro-auto-photo',
            status: 'active',
            booth_type: 'analog',
            is_operational: true,
          });
        }
      }
    }

  } catch (error) {
    errors.push(`Metro Auto Photo extraction error: ${error}`);
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
 * UTILITY FUNCTIONS (duplicated for standalone module)
 */

function finalizeBooth(booth: Partial<BoothData>, sourceUrl: string, sourceName: string): BoothData {
  return {
    name: booth.name || 'Unknown',
    address: booth.address || '',
    city: booth.city,
    state: booth.state,
    country: booth.country || 'Unknown',
    postal_code: booth.postal_code,
    latitude: booth.latitude,
    longitude: booth.longitude,
    machine_model: booth.machine_model,
    machine_manufacturer: booth.machine_manufacturer,
    booth_type: booth.booth_type || 'analog',
    cost: booth.cost,
    accepts_cash: booth.accepts_cash,
    accepts_card: booth.accepts_card,
    hours: booth.hours,
    is_operational: booth.is_operational ?? true,
    status: booth.status || 'active',
    source_url: sourceUrl,
    source_name: sourceName,
    description: booth.description,
    website: booth.website,
    phone: booth.phone,
    photos: booth.photos,
  };
}

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
