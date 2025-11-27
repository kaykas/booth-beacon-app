/**
 * TIER 4: COMMUNITY SOURCES EXTRACTORS
 *
 * These extractors handle unstructured community content from Reddit,
 * blogs, and publications. They are used primarily for VALIDATION
 * rather than primary data collection.
 *
 * Priority: LOW (validation only)
 * Confidence: UNVERIFIED (requires cross-checking with operator data)
 */

import { BoothData, ExtractorResult } from "./extractors";

interface ValidationData {
  booth_name?: string;
  location?: string;
  address?: string;
  city?: string;
  country?: string;
  status_report?: string; // "still working", "closed", "removed"
  reported_date?: string; // When the user reported this
  user_report?: string; // Raw user comment
  confidence: "low" | "medium" | "high";
  requires_validation: boolean;
}

interface CommunityExtractorResult extends ExtractorResult {
  validation_data: ValidationData[];
  conflicts: ConflictReport[];
}

interface ConflictReport {
  booth_identifier: string; // Name or location
  conflict_type: "status_mismatch" | "location_discrepancy" | "duplicate_report";
  community_says: string;
  official_source_says?: string;
  confidence_score: number; // 0-100
  requires_manual_review: boolean;
}

/**
 * REDDIT R/ANALOG EXTRACTOR
 * Searches for photobooth location mentions in r/analog
 * Focus: Location validation and "still working?" reports
 */
export async function extractRedditAnalog(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<CommunityExtractorResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const validation_data: ValidationData[] = [];
  const conflicts: ConflictReport[] = [];
  const errors: string[] = [];

  try {
    const lines = markdown.split('\n');
    let currentThread: { title?: string; content: string[]; author?: string; date?: string } = {
      content: []
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Extract thread titles (potential booth mentions)
      if (line.startsWith('##') || line.startsWith('###')) {
        const title = line.replace(/^#+\s*/, '');

        // Look for location-related keywords
        if (
          /photobooth|photo booth|booth/i.test(title) &&
          /location|where|city|found|still working|closed/i.test(title)
        ) {
          currentThread.title = title;
        }
      }

      // Extract comments and posts
      if (line.length > 20 && currentThread.title) {
        currentThread.content.push(line);

        // Pattern: "Still working at [Location]"
        const stillWorkingMatch = line.match(/still\s+working\s+at\s+([^.!?]+)/i);
        if (stillWorkingMatch) {
          const location = stillWorkingMatch[1].trim();
          validation_data.push({
            location,
            status_report: "still working",
            user_report: line,
            confidence: "medium",
            requires_validation: true,
          });
        }

        // Pattern: "Closed" or "No longer there"
        const closedMatch = line.match(/(closed|removed|gone|demolished|no longer (?:there|working))/i);
        if (closedMatch) {
          const context = lines.slice(Math.max(0, i - 2), i + 3).join(' ');
          const locationMatch = context.match(/(?:at|in|on)\s+([A-Z][a-zA-Z\s]+(?:,\s*[A-Z]{2})?)/);

          if (locationMatch) {
            validation_data.push({
              location: locationMatch[1].trim(),
              status_report: "closed",
              user_report: line,
              confidence: "medium",
              requires_validation: true,
            });

            // Flag as potential conflict
            conflicts.push({
              booth_identifier: locationMatch[1].trim(),
              conflict_type: "status_mismatch",
              community_says: "closed/removed",
              confidence_score: 60,
              requires_manual_review: true,
            });
          }
        }

        // Pattern: Address mentions
        const addressMatch = line.match(/(\d+\s+[A-Z][a-zA-Z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)[^,]*,\s*[A-Z][a-zA-Z\s]+)/);
        if (addressMatch) {
          const address = addressMatch[1].trim();
          const parts = address.split(',').map(p => p.trim());

          validation_data.push({
            address,
            city: parts[1],
            user_report: line,
            confidence: "low",
            requires_validation: true,
          });
        }

        // Pattern: City mentions with booth references
        const cityBoothMatch = line.match(/booth\s+in\s+([A-Z][a-zA-Z\s]+(?:,\s*[A-Z]{2,})?)/i);
        if (cityBoothMatch) {
          const location = cityBoothMatch[1].trim();
          const parts = location.split(',').map(p => p.trim());

          validation_data.push({
            city: parts[0],
            country: parts[1] || "Unknown",
            user_report: line,
            confidence: "low",
            requires_validation: true,
          });
        }
      }
    }

    // Extract timestamps from Reddit metadata
    const timestampMatches = html.matchAll(/<time[^>]*datetime="([^"]+)"[^>]*>/g);
    for (const match of timestampMatches) {
      // Store for correlation with validation data
      const timestamp = match[1];
      if (validation_data.length > 0) {
        validation_data[validation_data.length - 1].reported_date = timestamp;
      }
    }

  } catch (error) {
    errors.push(`Reddit r/analog extraction error: ${error}`);
  }

  return {
    booths,
    validation_data,
    conflicts,
    errors,
    metadata: {
      pages_processed: 1,
      total_found: validation_data.length,
      extraction_time_ms: Date.now() - startTime,
    },
  };
}

/**
 * REDDIT R/PHOTOBOOTH EXTRACTOR
 * Dedicated photobooth subreddit - higher quality data
 * Focus: User discoveries, location threads, status updates
 */
export async function extractRedditPhotobooth(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<CommunityExtractorResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const validation_data: ValidationData[] = [];
  const conflicts: ConflictReport[] = [];
  const errors: string[] = [];

  try {
    const lines = markdown.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Pattern: "[Location] Found this booth at..."
      const foundBoothMatch = line.match(/found\s+(?:this|a|an)?\s*(?:booth|photobooth)\s+(?:at|in)\s+([^.!?\n]+)/i);
      if (foundBoothMatch) {
        const location = foundBoothMatch[1].trim();
        const context = lines.slice(i, Math.min(i + 5, lines.length)).join(' ');

        // Try to extract more details from context
        const addressMatch = context.match(/(\d+\s+[A-Z][a-zA-Z\s]+(?:Street|St|Avenue|Ave|Road|Rd))/);
        const cityMatch = context.match(/(?:in|at)\s+([A-Z][a-zA-Z\s]+),\s*([A-Z]{2})/);

        validation_data.push({
          location,
          address: addressMatch ? addressMatch[1] : undefined,
          city: cityMatch ? cityMatch[1] : undefined,
          country: cityMatch ? (cityMatch[2] === 'US' ? 'United States' : cityMatch[2]) : undefined,
          user_report: line,
          confidence: "medium",
          requires_validation: true,
        });
      }

      // Pattern: "[City] Photobooth Map/List/Guide"
      const cityListMatch = line.match(/([A-Z][a-zA-Z\s]+)\s+(?:photobooth|photo booth)\s+(?:map|list|guide|locations)/i);
      if (cityListMatch) {
        const city = cityListMatch[1].trim();

        // Look ahead for booth listings
        const nextLines = lines.slice(i + 1, Math.min(i + 20, lines.length));
        for (const nextLine of nextLines) {
          // Pattern: "- Name @ Address"
          const listingMatch = nextLine.match(/^[-*]\s*([^@]+)@\s*(.+)/);
          if (listingMatch) {
            validation_data.push({
              booth_name: listingMatch[1].trim(),
              address: listingMatch[2].trim(),
              city,
              user_report: nextLine,
              confidence: "high",
              requires_validation: true,
            });
          }
        }
      }

      // Pattern: Status updates "Just visited [booth], still working!"
      const visitedMatch = line.match(/(?:just\s+)?visited\s+(?:the\s+)?(?:booth\s+at\s+)?([^,]+),?\s*(?:still|not)?\s*(working|operational|closed|broken)/i);
      if (visitedMatch) {
        const location = visitedMatch[1].trim();
        const status = visitedMatch[2].toLowerCase();
        const isWorking = !line.match(/not|no longer|doesn't|broken|closed/i);

        validation_data.push({
          location,
          status_report: isWorking ? "operational" : "closed",
          user_report: line,
          confidence: "high",
          requires_validation: true,
        });

        if (!isWorking) {
          conflicts.push({
            booth_identifier: location,
            conflict_type: "status_mismatch",
            community_says: "not operational",
            confidence_score: 70,
            requires_manual_review: true,
          });
        }
      }

      // Pattern: "Does anyone know if [booth] is still there?"
      const questionMatch = line.match(/(?:does anyone know|anyone know)\s+if\s+(?:the\s+)?(?:booth\s+at\s+)?([^?]+)\s+is\s+still/i);
      if (questionMatch) {
        const location = questionMatch[1].trim();

        validation_data.push({
          location,
          status_report: "uncertain",
          user_report: line,
          confidence: "low",
          requires_validation: true,
        });
      }
    }

  } catch (error) {
    errors.push(`Reddit r/photobooth extraction error: ${error}`);
  }

  return {
    booths,
    validation_data,
    conflicts,
    errors,
    metadata: {
      pages_processed: 1,
      total_found: validation_data.length,
      extraction_time_ms: Date.now() - startTime,
    },
  };
}

/**
 * ANALOG.CAFE EXTRACTOR
 * Blog posts and articles about photobooths
 * Focus: Artistic/cultural context, venue names, cities
 */
export async function extractAnalogCafe(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<CommunityExtractorResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const validation_data: ValidationData[] = [];
  const conflicts: ConflictReport[] = [];
  const errors: string[] = [];

  try {
    const lines = markdown.split('\n');
    let currentArticle: { title?: string; content: string[]; date?: string } = {
      content: []
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Extract article titles
      if (line.startsWith('#') && /photobooth|photo booth/i.test(line)) {
        currentArticle.title = line.replace(/^#+\s*/, '');
      }

      // Look for location mentions in article context
      if (line.length > 30 && currentArticle.title) {
        currentArticle.content.push(line);

        // Pattern: "booth at [Venue Name] in [City]"
        const venueMatch = line.match(/booth\s+at\s+([A-Z][a-zA-Z\s&'.-]+)\s+in\s+([A-Z][a-zA-Z\s]+)/i);
        if (venueMatch) {
          const venueName = venueMatch[1].trim();
          const city = venueMatch[2].trim();

          validation_data.push({
            booth_name: venueName,
            city,
            user_report: line,
            confidence: "medium",
            requires_validation: true,
          });
        }

        // Pattern: Full address mentions in articles
        const articleAddressMatch = line.match(/(\d+\s+[A-Z][a-zA-Z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)[^,]*,\s*[A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/);
        if (articleAddressMatch) {
          const fullAddress = articleAddressMatch[1].trim();
          const parts = fullAddress.split(',').map(p => p.trim());

          validation_data.push({
            address: parts[0],
            city: parts[1],
            country: parts[2] === 'US' ? 'United States' : parts[2],
            user_report: line,
            confidence: "high",
            requires_validation: true,
          });
        }

        // Pattern: "[City]'s iconic photobooth"
        const iconicMatch = line.match(/([A-Z][a-zA-Z\s]+)(?:'s|'s)\s+(?:iconic|famous|beloved|historic)\s+photobooth/i);
        if (iconicMatch) {
          const city = iconicMatch[1].trim();

          validation_data.push({
            city,
            user_report: line,
            confidence: "medium",
            requires_validation: true,
          });
        }

        // Pattern: Historical references with dates
        const historicalMatch = line.match(/since\s+(\d{4})|installed\s+in\s+(\d{4})|dating\s+back\s+to\s+(\d{4})/i);
        if (historicalMatch && /booth/i.test(line)) {
          const year = historicalMatch[1] || historicalMatch[2] || historicalMatch[3];

          // Look for location in surrounding context
          const context = lines.slice(Math.max(0, i - 2), i + 3).join(' ');
          const locationMatch = context.match(/(?:at|in)\s+([A-Z][a-zA-Z\s]+(?:,\s*[A-Z]{2})?)/);

          if (locationMatch) {
            validation_data.push({
              location: locationMatch[1].trim(),
              user_report: context.slice(0, 200),
              confidence: "low",
              requires_validation: true,
            });
          }
        }
      }
    }

    // Extract publication dates from article metadata
    const dateMatches = html.matchAll(/<time[^>]*datetime="([^"]+)"[^>]*>|<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/g);
    for (const match of dateMatches) {
      const date = match[1] || match[2];
      if (date && validation_data.length > 0) {
        validation_data[validation_data.length - 1].reported_date = date;
      }
    }

  } catch (error) {
    errors.push(`Analog.Cafe extraction error: ${error}`);
  }

  return {
    booths,
    validation_data,
    conflicts,
    errors,
    metadata: {
      pages_processed: 1,
      total_found: validation_data.length,
      extraction_time_ms: Date.now() - startTime,
    },
  };
}

/**
 * SMITHSONIAN MAGAZINE EXTRACTOR
 * Historical context and iconic booth references
 * Focus: Cultural significance, preservation status
 */
export async function extractSmithsonian(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<CommunityExtractorResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const validation_data: ValidationData[] = [];
  const conflicts: ConflictReport[] = [];
  const errors: string[] = [];

  try {
    const lines = markdown.split('\n');
    let currentArticle: { title?: string; content: string[] } = {
      content: []
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Extract article titles about photo booths
      if (line.startsWith('#') && /photo.?booth/i.test(line)) {
        currentArticle.title = line.replace(/^#+\s*/, '');
      }

      if (line.length > 40 && /booth/i.test(line)) {
        currentArticle.content.push(line);

        // Pattern: Historical references to specific locations
        const historicalLocationMatch = line.match(/(?:historic|iconic|famous|original)\s+photo.?booth\s+(?:at|in)\s+([A-Z][a-zA-Z\s,]+)/i);
        if (historicalLocationMatch) {
          const location = historicalLocationMatch[1].trim();
          const parts = location.split(',').map(p => p.trim());

          validation_data.push({
            location,
            city: parts.length > 1 ? parts[0] : undefined,
            country: parts.length > 1 ? parts[parts.length - 1] : undefined,
            user_report: line,
            confidence: "high",
            requires_validation: true,
          });
        }

        // Pattern: Museum or collection references
        const museumMatch = line.match(/(?:museum|collection|exhibit)\s+in\s+([A-Z][a-zA-Z\s]+)/i);
        if (museumMatch && /booth/i.test(line)) {
          const location = museumMatch[1].trim();

          validation_data.push({
            city: location,
            status_report: "preserved/museum",
            user_report: line,
            confidence: "high",
            requires_validation: false, // Museums are verified sources
          });
        }

        // Pattern: "One of the last remaining..."
        const lastRemainingMatch = line.match(/(?:one of the (?:last|few) remaining|last surviving)\s+(?:original\s+)?photo.?booth(?:s)?\s+(?:in|at)\s+([A-Z][a-zA-Z\s,]+)/i);
        if (lastRemainingMatch) {
          const location = lastRemainingMatch[1].trim();

          validation_data.push({
            location,
            status_report: "rare/historic",
            user_report: line,
            confidence: "high",
            requires_validation: true,
          });
        }

        // Pattern: Inventor mentions (Anatol Josepho, etc.)
        const inventorMatch = line.match(/(?:Anatol Josepho|inventor|patent)\s+.*?(?:at|in)\s+([A-Z][a-zA-Z\s]+)/i);
        if (inventorMatch && /booth/i.test(line)) {
          const location = inventorMatch[1].trim();

          validation_data.push({
            location,
            status_report: "historical significance",
            user_report: line,
            confidence: "high",
            requires_validation: false,
          });
        }

        // Pattern: Year mentions with location context
        const yearLocationMatch = line.match(/(\d{4})\s+.*?(?:booth|photobooth)\s+(?:at|in)\s+([A-Z][a-zA-Z\s,]+)/i);
        if (yearLocationMatch) {
          const year = yearLocationMatch[1];
          const location = yearLocationMatch[2].trim();

          // Only include if reasonably recent (post-1920)
          if (parseInt(year) >= 1920) {
            validation_data.push({
              location,
              user_report: line,
              confidence: "medium",
              requires_validation: true,
            });
          }
        }

        // Pattern: "Still operates at..." or "Restored and operating at..."
        const stillOperatesMatch = line.match(/(?:still operates|continues to operate|restored and operating)\s+(?:at|in)\s+([A-Z][a-zA-Z\s,]+)/i);
        if (stillOperatesMatch && /booth/i.test(line)) {
          const location = stillOperatesMatch[1].trim();

          validation_data.push({
            location,
            status_report: "operational",
            user_report: line,
            confidence: "high",
            requires_validation: true,
          });
        }
      }
    }

    // Extract article metadata
    const metaMatches = html.matchAll(/<meta[^>]*name="description"[^>]*content="([^"]+)"|<meta[^>]*property="og:description"[^>]*content="([^"]+)"/g);
    for (const match of metaMatches) {
      const description = match[1] || match[2];
      if (description && /booth/i.test(description)) {
        // Additional context from meta descriptions
        const locationMatch = description.match(/(?:in|at)\s+([A-Z][a-zA-Z\s]+)/);
        if (locationMatch) {
          validation_data.push({
            location: locationMatch[1].trim(),
            user_report: description.slice(0, 200),
            confidence: "medium",
            requires_validation: true,
          });
        }
      }
    }

  } catch (error) {
    errors.push(`Smithsonian extraction error: ${error}`);
  }

  return {
    booths,
    validation_data,
    conflicts,
    errors,
    metadata: {
      pages_processed: 1,
      total_found: validation_data.length,
      extraction_time_ms: Date.now() - startTime,
    },
  };
}

/**
 * UTILITY: Merge community validation data with existing booth data
 * Returns conflicts that need manual review
 */
export function mergeCommunityData(
  existingBooth: BoothData,
  communityData: ValidationData[]
): {
  updatedBooth: BoothData;
  conflicts: ConflictReport[];
  confidence_boost: number;
} {
  const conflicts: ConflictReport[] = [];
  let confidence_boost = 0;

  // If multiple community sources agree, boost confidence
  const statusReports = communityData
    .filter(d => d.status_report)
    .map(d => d.status_report);

  if (statusReports.length >= 2) {
    const operationalCount = statusReports.filter(s =>
      s === "operational" || s === "still working"
    ).length;

    const closedCount = statusReports.filter(s =>
      s === "closed" || s === "removed"
    ).length;

    // Check for conflicts with existing data
    if (existingBooth.is_operational && closedCount >= 2) {
      conflicts.push({
        booth_identifier: existingBooth.name,
        conflict_type: "status_mismatch",
        community_says: "closed (multiple reports)",
        official_source_says: "operational",
        confidence_score: 80,
        requires_manual_review: true,
      });
    } else if (!existingBooth.is_operational && operationalCount >= 2) {
      conflicts.push({
        booth_identifier: existingBooth.name,
        conflict_type: "status_mismatch",
        community_says: "operational (multiple reports)",
        official_source_says: "closed",
        confidence_score: 70,
        requires_manual_review: true,
      });
    } else {
      // Community data agrees with official source
      confidence_boost = 10;
    }
  }

  return {
    updatedBooth: existingBooth,
    conflicts,
    confidence_boost,
  };
}
