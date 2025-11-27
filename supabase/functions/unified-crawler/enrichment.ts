// =====================================================
// BOOTH ENRICHMENT MODULE v5.0
// Contextual Data Mining for Enhanced User Experience
// =====================================================

interface MicroLocation {
  floor?: string;
  landmark?: string;
  accessibility_note?: string;
}

interface AccessProfile {
  payment_methods: string[];
  price_string?: string;
  change_machine_available?: boolean;
  venue_entry_barrier: string;
}

interface SampleArtifact {
  url: string;
  date_taken?: string;
  chemistry_notes?: string;
  source?: string;
  verified: boolean;
}

interface EnrichmentResult {
  micro_location: MicroLocation;
  access_profile: AccessProfile;
  vibe_tags: string[];
  sample_artifacts: SampleArtifact[];
  record_strength: 'weak' | 'moderate' | 'strong' | 'comprehensive';
}

// =====================================================
// 1. WAYFINDING ALGORITHM (Micro-Location Extraction)
// =====================================================

/**
 * Extracts exact location within venue from review text
 * Scans for positional triggers within 50 characters of "booth"
 */
export function extractMicroLocation(text: string): MicroLocation {
  const microLocation: MicroLocation = {};
  const lowerText = text.toLowerCase();

  // Positional triggers
  const triggers = [
    'back', 'basement', 'upstairs', 'downstairs', 'foyer', 'lobby',
    'corner', 'bathroom', 'restroom', 'hidden', 'corridor', 'entrance',
    'hallway', 'near', 'beside', 'behind', 'front', 'left', 'right'
  ];

  // Find all occurrences of "booth" and check nearby text
  const boothMatches = [...lowerText.matchAll(/\b(booth|photobooth|photo booth)\b/gi)];

  for (const match of boothMatches) {
    const index = match.index!;
    const contextStart = Math.max(0, index - 50);
    const contextEnd = Math.min(lowerText.length, index + match[0].length + 50);
    const context = lowerText.slice(contextStart, contextEnd);
    const originalContext = text.slice(contextStart, contextEnd);

    // Floor detection
    if (context.includes('basement') || context.includes('downstairs')) {
      microLocation.floor = 'Basement';
    } else if (context.includes('upstairs') || context.includes('second floor') || context.includes('2nd floor')) {
      microLocation.floor = 'Second Floor';
    } else if (context.includes('lobby') || context.includes('foyer') || context.includes('entrance')) {
      microLocation.floor = 'Ground Floor';
    }

    // Landmark detection
    const landmarkPatterns = [
      /(?:near|beside|by|next to|behind|in front of)\s+(?:the\s+)?([^,.!?]+)/i,
      /(?:in|at)\s+(?:the\s+)?([^,.!?]+)/i
    ];

    for (const pattern of landmarkPatterns) {
      const landmarkMatch = originalContext.match(pattern);
      if (landmarkMatch && landmarkMatch[1]) {
        const landmark = landmarkMatch[1].trim();
        // Filter out generic phrases
        if (landmark.length > 5 && landmark.length < 50 &&
            !landmark.toLowerCase().includes('booth') &&
            !landmark.toLowerCase().includes('machine')) {
          microLocation.landmark = landmark;
          break;
        }
      }
    }

    // Accessibility detection
    if (context.includes('stair') && !context.includes('no stairs') && !context.includes('elevator')) {
      microLocation.accessibility_note = 'Requires stairs';
    } else if (context.includes('wheelchair') || context.includes('accessible') || context.includes('elevator')) {
      microLocation.accessibility_note = 'Wheelchair accessible';
    } else if (context.includes('hidden') || context.includes('hard to find')) {
      microLocation.accessibility_note = 'May be difficult to locate';
    }
  }

  return microLocation;
}

// =====================================================
// 2. FRICTION ANALYZER (Payment & Access)
// =====================================================

/**
 * Identifies payment methods and venue access barriers
 * Helps users arrive prepared with correct payment/entry requirements
 */
export function analyzeFriction(text: string): AccessProfile {
  const lowerText = text.toLowerCase();

  const accessProfile: AccessProfile = {
    payment_methods: [],
    venue_entry_barrier: 'NONE'
  };

  // Payment method detection
  if (lowerText.match(/\b(cash only|cash-only|only cash|only takes cash)\b/i)) {
    accessProfile.payment_methods.push('CASH');
  } else {
    if (lowerText.match(/\b(cash|bills|coins|dollar|pound|euro|£|€|\$)\b/i)) {
      accessProfile.payment_methods.push('CASH');
    }
    if (lowerText.match(/\b(card|credit card|debit card|contactless|tap|chip)\b/i)) {
      accessProfile.payment_methods.push('CARD');
    }
  }

  if (lowerText.match(/\b(token|tokens|requires tokens|need tokens)\b/i)) {
    accessProfile.payment_methods.push('TOKEN');
  }

  // Price extraction
  const pricePatterns = [
    /(\$|£|€)\s*(\d+(?:\.\d{2})?)/,
    /(\d+)\s*(dollars|pounds|euros|gbp|usd|eur)/i,
    /(\d+)\s*for\s*\d+\s*photos/i
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1] && match[2]) {
        accessProfile.price_string = `${match[1]}${match[2]}`;
      } else if (match[1]) {
        accessProfile.price_string = match[0];
      }
      break;
    }
  }

  // Change machine detection
  if (lowerText.match(/\b(change machine|machine to change|change at the bar|can get change)\b/i)) {
    accessProfile.change_machine_available = true;
  } else if (lowerText.match(/\b(no change|bring change|exact change)\b/i)) {
    accessProfile.change_machine_available = false;
  }

  // Venue entry barriers
  if (lowerText.match(/\b(cover charge|cover fee|entry fee|door charge|\$\d+ cover)\b/i)) {
    accessProfile.venue_entry_barrier = 'COVER_CHARGE';
  } else if (lowerText.match(/\b(21\+|21 and over|21 plus|over 21|must be 21|age restriction|18\+)\b/i)) {
    accessProfile.venue_entry_barrier = 'AGE_RESTRICTION';
  } else if (lowerText.match(/\b(hotel guests only|guests only|members only|reservation required)\b/i)) {
    accessProfile.venue_entry_barrier = 'HOTEL_GUESTS_ONLY';
  } else if (lowerText.match(/\b(bouncer|doorman|guest list|line|queue to get in)\b/i)) {
    accessProfile.venue_entry_barrier = 'DOOR_CONTROL';
  }

  return accessProfile;
}

// =====================================================
// 3. VIBE CHECK (Atmosphere Tagging)
// =====================================================

/**
 * Performs sentiment analysis on venue descriptions and reviews
 * Tags venue atmosphere to help users decide if it's right for them
 */
export function analyzeVibe(text: string, venueDescription?: string): string[] {
  const lowerText = (text + ' ' + (venueDescription || '')).toLowerCase();
  const vibeTags: Set<string> = new Set();

  // ROMANTIC detection
  const romanticKeywords = [
    'date', 'romantic', 'cozy', 'intimate', 'quiet', 'candlelit', 'dimly lit',
    'couples', 'anniversary', 'special occasion', 'ambiance', 'atmosphere'
  ];
  if (romanticKeywords.some(kw => lowerText.includes(kw))) {
    vibeTags.add('ROMANTIC');
  }

  // PARTY detection
  const partyKeywords = [
    'loud', 'crowded', 'club', 'dancing', 'dance floor', 'dj', 'line', 'packed',
    'nightclub', 'party', 'weekend night', 'late night', 'energetic', 'busy'
  ];
  if (partyKeywords.some(kw => lowerText.includes(kw))) {
    vibeTags.add('PARTY');
  }

  // DIVE detection
  const diveKeywords = [
    'dive', 'dive bar', 'grungy', 'grunge', 'sticker', 'stickers', 'graffiti',
    'cheap drinks', 'no frills', 'cash only', 'unpretentious', 'hole in the wall',
    'authentic', 'local haunt'
  ];
  if (diveKeywords.some(kw => lowerText.includes(kw))) {
    vibeTags.add('DIVE');
  }

  // FAMILY_FRIENDLY detection
  const familyKeywords = [
    'family', 'kids', 'children', 'family-friendly', 'all ages', 'kid-friendly'
  ];
  if (familyKeywords.some(kw => lowerText.includes(kw))) {
    vibeTags.add('FAMILY_FRIENDLY');
  }

  // TOURISTY detection
  const touristyKeywords = [
    'tourist', 'touristy', 'attraction', 'landmark', 'famous', 'popular',
    'must-see', 'bucket list', 'instagram', 'instagrammable'
  ];
  if (touristyKeywords.some(kw => lowerText.includes(kw))) {
    vibeTags.add('TOURISTY');
  }

  // LOCAL detection
  const localKeywords = [
    'local', 'locals', 'neighborhood', 'neighbourhood', 'hidden gem',
    'off the beaten path', 'local favorite', 'regulars'
  ];
  if (localKeywords.some(kw => lowerText.includes(kw))) {
    vibeTags.add('LOCAL');
  }

  // HIPSTER detection
  const hipsterKeywords = [
    'hipster', 'trendy', 'hip', 'cool', 'craft beer', 'craft cocktails',
    'artisanal', 'vintage decor', 'eclectic', 'indie'
  ];
  if (hipsterKeywords.some(kw => lowerText.includes(kw))) {
    vibeTags.add('HIPSTER');
  }

  // VINTAGE detection
  const vintageKeywords = [
    'vintage', 'retro', 'old-school', 'classic', 'nostalgic', 'throwback',
    'authentic', 'original', 'since 19', 'historic'
  ];
  if (vintageKeywords.some(kw => lowerText.includes(kw))) {
    vibeTags.add('VINTAGE');
  }

  // MODERN detection
  const modernKeywords = [
    'modern', 'contemporary', 'sleek', 'minimalist', 'new', 'recently opened',
    'renovated', 'updated', 'chic'
  ];
  if (modernKeywords.some(kw => lowerText.includes(kw))) {
    vibeTags.add('MODERN');
  }

  return Array.from(vibeTags);
}

// =====================================================
// 4. ARTIFACT LINKER (Photo Sample Extraction)
// =====================================================

/**
 * Extracts photo strip samples from image URLs and captions
 * Analyzes chemistry characteristics from captions
 */
export function extractArtifacts(html: string, markdown: string): SampleArtifact[] {
  const artifacts: SampleArtifact[] = [];

  // Extract image URLs from markdown
  const markdownImagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const markdownMatches = [...markdown.matchAll(markdownImagePattern)];

  for (const match of markdownMatches) {
    const altText = match[1].toLowerCase();
    const url = match[2];

    // Identify photo strips (tall aspect ratio, 4 frames)
    const isPhotoStrip =
      altText.includes('strip') ||
      altText.includes('photo booth') ||
      altText.includes('photobooth') ||
      altText.includes('4 photos') ||
      altText.includes('four photos') ||
      url.includes('strip') ||
      url.includes('photobooth');

    if (isPhotoStrip) {
      const artifact: SampleArtifact = {
        url,
        verified: false
      };

      // Extract date if present
      const dateMatch = url.match(/(\d{4})[-_](\d{2})[-_](\d{2})/);
      if (dateMatch) {
        artifact.date_taken = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      }

      // Chemistry keyword detection in alt text
      const chemistryKeywords = [
        'contrast', 'sepia', 'washed out', 'crisp', 'developing', 'chemical',
        'black and white', 'b&w', 'grainy', 'vintage', 'authentic',
        'high contrast', 'low contrast', 'faded', 'sharp', 'soft'
      ];

      const foundKeywords = chemistryKeywords.filter(kw => altText.includes(kw));
      if (foundKeywords.length > 0) {
        artifact.chemistry_notes = `Observed characteristics: ${foundKeywords.join(', ')}`;
        artifact.verified = true;
      }

      // Determine source
      if (url.includes('instagram.com') || url.includes('cdninstagram')) {
        artifact.source = 'instagram';
      } else if (url.includes('flickr.com') || url.includes('staticflickr')) {
        artifact.source = 'flickr';
      } else if (url.includes('pinterest.com') || url.includes('pinimg')) {
        artifact.source = 'pinterest';
      }

      artifacts.push(artifact);
    }
  }

  // Also extract from HTML img tags
  const htmlImagePattern = /<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi;
  const htmlMatches = [...html.matchAll(htmlImagePattern)];

  for (const match of htmlMatches) {
    const url = match[1];
    const altText = match[2].toLowerCase();

    // Check if already added from markdown
    if (artifacts.some(a => a.url === url)) continue;

    const isPhotoStrip =
      altText.includes('strip') ||
      altText.includes('photo booth') ||
      altText.includes('photobooth') ||
      url.includes('strip') ||
      url.includes('photobooth');

    if (isPhotoStrip) {
      const artifact: SampleArtifact = {
        url,
        verified: false
      };

      // Extract date
      const dateMatch = url.match(/(\d{4})[-_](\d{2})[-_](\d{2})/);
      if (dateMatch) {
        artifact.date_taken = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      }

      // Chemistry analysis
      const chemistryKeywords = [
        'contrast', 'sepia', 'washed out', 'crisp', 'developing', 'chemical',
        'black and white', 'b&w', 'grainy', 'vintage', 'authentic'
      ];

      const foundKeywords = chemistryKeywords.filter(kw => altText.includes(kw));
      if (foundKeywords.length > 0) {
        artifact.chemistry_notes = `Observed characteristics: ${foundKeywords.join(', ')}`;
        artifact.verified = true;
      }

      artifacts.push(artifact);
    }
  }

  return artifacts;
}

// =====================================================
// 5. MASTER ENRICHMENT FUNCTION
// =====================================================

/**
 * Runs all enrichment algorithms on extracted content
 * Returns comprehensive enrichment data for a booth
 */
export function enrichBoothData(
  html: string,
  markdown: string,
  venueDescription?: string
): EnrichmentResult {
  const combinedText = markdown + '\n\n' + (venueDescription || '');

  // Run all enrichment algorithms
  const microLocation = extractMicroLocation(combinedText);
  const accessProfile = analyzeFriction(combinedText);
  const vibeTags = analyzeVibe(combinedText, venueDescription);
  const sampleArtifacts = extractArtifacts(html, markdown);

  // Calculate record strength
  let score = 0;

  if (microLocation.floor || microLocation.landmark) score += 2;
  if (microLocation.accessibility_note) score += 1;
  if (accessProfile.payment_methods.length > 0) score += 2;
  if (accessProfile.price_string) score += 1;
  if (accessProfile.change_machine_available !== undefined) score += 1;
  if (accessProfile.venue_entry_barrier !== 'NONE') score += 1;
  if (vibeTags.length > 0) score += 2;
  if (sampleArtifacts.length > 0) score += 2;

  let recordStrength: 'weak' | 'moderate' | 'strong' | 'comprehensive';
  if (score >= 10) recordStrength = 'comprehensive';
  else if (score >= 6) recordStrength = 'strong';
  else if (score >= 3) recordStrength = 'moderate';
  else recordStrength = 'weak';

  return {
    micro_location: microLocation,
    access_profile: accessProfile,
    vibe_tags: vibeTags,
    sample_artifacts: sampleArtifacts,
    record_strength: recordStrength
  };
}
