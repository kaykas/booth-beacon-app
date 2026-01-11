/**
 * Machine Model Content Data
 *
 * Comprehensive data about photo booth machine manufacturers and models.
 * Used for machine model pages with SEO-optimized content.
 */

export interface MachineModelData {
  slug: string;
  name: string;
  manufacturer: string;
  alternateNames?: string[];
  yearsProduced?: string;
  countryOfOrigin: string;
  description: string;
  history: string;
  specifications: {
    photoType: 'black-and-white' | 'color' | 'both';
    photoFormat: string;
    processingTime?: string;
    dimensions?: string;
    weight?: string;
    technology?: string;
  };
  typicalFeatures: string[];
  collectorNotes?: string;
  funFacts?: string[];
  relatedModels?: string[];
  imageUrl?: string;
  officialWebsite?: string;
}

/**
 * Comprehensive database of photo booth machine models
 */
export const machineModels: Record<string, MachineModelData> = {
  'photomaton': {
    slug: 'photomaton',
    name: 'Photomaton',
    manufacturer: 'Photomaton (Parisot Group)',
    alternateNames: ['Photomaton Classic', 'Photomaton ID'],
    yearsProduced: '1928 - Present',
    countryOfOrigin: 'France',
    description: 'Photomaton is one of the oldest and most recognized photo booth brands in the world. Founded in France in 1928, these machines are ubiquitous across European train stations, shopping centers, and public spaces. Known for their reliability and consistent photo quality.',
    history: `Photomaton was founded in Paris in 1928, making it one of the pioneering companies in automated photography. The brand quickly became synonymous with photo booths across France and Europe.

During the mid-20th century, Photomaton expanded rapidly, placing their distinctive machines in railway stations, post offices, and public buildings throughout Europe. The company pioneered many innovations in instant photography, including color processing and digital integration while maintaining analog options.

Today, Photomaton operates over 12,000 photo booths across Europe, with a strong presence in France, Belgium, Spain, and Portugal. While many modern Photomaton machines are digital, the company has maintained a commitment to offering chemical-process analog options in select locations, particularly valued by photography enthusiasts and collectors of authentic photo strips.`,
    specifications: {
      photoType: 'both',
      photoFormat: '4 photos per strip (35x45mm each)',
      processingTime: '3-5 minutes for analog',
      dimensions: '200cm x 120cm x 100cm (typical)',
      technology: 'Chemical wet process (analog) / Digital printing (modern)',
    },
    typicalFeatures: [
      'Privacy curtain',
      'Adjustable seat height',
      'Mirror for positioning',
      'Multiple pose countdown',
      'Biometric ID photo capability',
      'Touch screen interface (modern models)',
      'Payment via coins or card',
    ],
    collectorNotes: 'Vintage Photomaton machines from the 1960s-1980s are highly sought after by collectors. Look for models with the classic red and white exterior. Original chemical processors are rare but produce exceptional black and white prints.',
    funFacts: [
      'The first Photomaton booth was installed at the Gare Saint-Lazare in Paris in 1928',
      'The brand name has become a common noun in French, with "photomaton" meaning any photo booth',
      'Photomaton produced special commemorative strips for major events like the 1998 FIFA World Cup in France',
    ],
    relatedModels: ['photo-me', 'fotoautomat'],
    officialWebsite: 'https://www.photomaton.fr',
  },

  'photo-me': {
    slug: 'photo-me',
    name: 'Photo-Me',
    manufacturer: 'Photo-Me International plc',
    alternateNames: ['Photo-Me Classic', 'Photo-Me Kiosk', 'KIS'],
    yearsProduced: '1964 - Present',
    countryOfOrigin: 'United Kingdom',
    description: 'Photo-Me is a British multinational company and one of the largest photo booth operators in the world. Their machines are found across Europe, Asia, and North America, known for their modern design and diverse service offerings including ID photos, printing, and laundry services.',
    history: `Photo-Me was founded in the United Kingdom in 1964 by Japanese entrepreneur Shotaro Tateisi. The company grew rapidly during the 1970s and 1980s, becoming one of the leading photo booth operators globally.

The company went public on the London Stock Exchange in 1962 and has since expanded to operate over 47,000 vending units worldwide, including photo booths, printing kiosks, and laundry machines.

While Photo-Me has embraced digital technology, they continue to maintain a network of analog photo booths, particularly in locations where traditional chemical-process photography is preferred. Their analog machines are recognizable by their distinctive blue and white branding and are prized by analog photography enthusiasts.`,
    specifications: {
      photoType: 'both',
      photoFormat: '4-8 photos per session',
      processingTime: '4-5 minutes for analog, instant for digital',
      dimensions: 'Variable by model',
      technology: 'Chemical process (analog) / Dye-sublimation (digital)',
    },
    typicalFeatures: [
      'Multiple photo formats available',
      'ID photo compliance for various countries',
      'Privacy booth with curtain',
      'LED lighting system',
      'Touch screen interface',
      'Multi-language support',
      'Card and cash payment options',
    ],
    collectorNotes: 'Photo-Me analog machines from the 1970s-1990s produce excellent black and white photographs. Look for the older "KIS" branded machines which often have better optics than newer models.',
    funFacts: [
      'Photo-Me operates the largest photo booth network in the world',
      'The company also manufactures and operates laundry machines under the Revolution brand',
      'Photo-Me machines have been featured in numerous films and TV shows as iconic urban fixtures',
    ],
    relatedModels: ['photomaton', 'fotoautomat'],
    officialWebsite: 'https://www.photo-me.co.uk',
  },

  'fotoautomat': {
    slug: 'fotoautomat',
    name: 'Fotoautomat',
    manufacturer: 'Fotoautomat',
    alternateNames: ['Fotoautomat Berlin', 'Vintage Fotoautomat'],
    yearsProduced: '2004 - Present',
    countryOfOrigin: 'Germany',
    description: 'Fotoautomat is a Berlin-based company dedicated to preserving and operating vintage analog photo booths. They restore and maintain classic machines from the 1960s-1970s, providing an authentic vintage photo booth experience with traditional chemical processing.',
    history: `Fotoautomat was founded in Berlin in 2004 by a group of analog photography enthusiasts who wanted to preserve the experience of classic photo booth photography in an increasingly digital world.

The company sources vintage photo booth machines from across Europe, carefully restoring them while maintaining their original chemical processing systems. Each machine is a piece of history, often dating from the 1960s and 1970s.

Fotoautomat has played a key role in the revival of analog photo booth culture, particularly in Berlin where their distinctive orange machines have become cultural landmarks. They have expanded to other European cities and have inspired a global movement to preserve analog photo booth heritage.`,
    specifications: {
      photoType: 'black-and-white',
      photoFormat: '4 photos per strip (classic format)',
      processingTime: '4-5 minutes',
      dimensions: 'Varies by vintage model',
      technology: 'Traditional silver gelatin chemical process',
    },
    typicalFeatures: [
      'Authentic vintage machines from 1960s-1970s',
      'Traditional chemical black and white processing',
      'Classic photo strip format',
      'Coin-operated mechanism',
      'Original vintage aesthetics',
      'Located in culturally significant spots',
    ],
    collectorNotes: 'Fotoautomat machines produce some of the most authentic vintage photo booth experiences available today. The black and white photos have a distinctive quality that cannot be replicated digitally. Each strip is a unique piece of analog art.',
    funFacts: [
      'The distinctive orange color of Fotoautomat machines has become an Instagram favorite in Berlin',
      'Each Fotoautomat machine has its own personality due to the unique characteristics of vintage equipment',
      'Fotoautomat has been credited with sparking the global revival of interest in analog photo booths',
    ],
    relatedModels: ['photomaton', 'photoautomat'],
    officialWebsite: 'https://www.fotoautomat.de',
  },

  'photoautomat': {
    slug: 'photoautomat',
    name: 'Photoautomat',
    manufacturer: 'Various (Vintage restored)',
    alternateNames: ['Photo Automat', 'Photoautomat Vienna'],
    yearsProduced: '1950s - 1980s (Original production)',
    countryOfOrigin: 'Germany/Austria',
    description: 'Photoautomat refers to vintage German and Austrian photo booth machines, many of which have been restored and are now operated by independent collectors and enthusiasts. These machines offer an authentic mid-century photo booth experience.',
    history: `The term "Photoautomat" was commonly used in German-speaking countries to describe automated photo booths throughout the mid-20th century. Various manufacturers produced these machines, including German companies that have since ceased operation.

Many original Photoautomat machines were decommissioned in the 1990s and 2000s as digital photography became prevalent. However, a dedicated community of collectors and restorers has worked to preserve these machines.

Today, restored Photoautomat machines can be found in vintage shops, cultural centers, and hipster neighborhoods across Germany, Austria, and beyond. Each machine is unique, with its own history and characteristics.`,
    specifications: {
      photoType: 'black-and-white',
      photoFormat: '4 photos per strip',
      processingTime: '3-4 minutes',
      technology: 'Silver halide chemical process',
    },
    typicalFeatures: [
      'Vintage 1950s-1980s design',
      'Traditional chemical processing',
      'Mechanical coin mechanism',
      'Classic curtain enclosure',
      'Adjustable stool',
      'Analog timer display',
    ],
    collectorNotes: 'Original Photoautomat machines in working condition are increasingly rare. Machines with original chemical processors intact are especially valuable. Look for machines with their original exterior panels and signage.',
    funFacts: [
      'Many Photoautomat machines were manufactured in East Germany during the Cold War era',
      'The machines were popular fixtures at train stations and department stores throughout Central Europe',
      'Some restored machines still use original chemical formulations developed decades ago',
    ],
    relatedModels: ['fotoautomat', 'photomaton'],
  },

  'auto-photo': {
    slug: 'auto-photo',
    name: 'Auto-Photo',
    manufacturer: 'Auto-Photo Company',
    alternateNames: ['Auto Photo', 'Automat Photo'],
    yearsProduced: '1926 - 1990s',
    countryOfOrigin: 'United States',
    description: 'Auto-Photo was a pioneering American photo booth manufacturer that helped popularize automatic photography in the United States. Their machines were fixtures in American arcades, department stores, and transportation hubs throughout the 20th century.',
    history: `The Auto-Photo Company was founded in New York in 1926, during the early days of automated photography. The company quickly became one of the leading photo booth manufacturers in the United States.

Auto-Photo machines became iconic fixtures of American culture, appearing in countless films and photographs. They were particularly popular at Woolworths stores, bus stations, and amusement parks.

The company faced challenges in the 1990s as digital photography began to dominate, and production eventually ceased. Today, vintage Auto-Photo machines are highly sought after by collectors and are occasionally found in museums and specialty venues.`,
    specifications: {
      photoType: 'black-and-white',
      photoFormat: '4 photos per strip',
      processingTime: '3-4 minutes',
      dimensions: 'Standard arcade cabinet size',
      technology: 'Chemical wet process',
    },
    typicalFeatures: [
      'Art Deco styling (earlier models)',
      'Distinctive American design',
      'Traditional chemical processing',
      'Mechanical coin mechanism',
      'Classic curtain or partial enclosure',
      'Period-appropriate signage',
    ],
    collectorNotes: 'Auto-Photo machines are rare finds outside of the United States. Art Deco era machines (1930s-1940s) are the most valuable. Working chemical processors are extremely rare and valuable.',
    funFacts: [
      'Auto-Photo machines appeared in the opening credits of the TV show "Happy Days"',
      'The company produced special machines for military bases during World War II',
      'An Auto-Photo strip was famously used as a plot device in the film "Amelie"',
    ],
    relatedModels: ['photomaton', 'photomatic'],
  },

  'photomatic': {
    slug: 'photomatic',
    name: 'Photomatic',
    manufacturer: 'Photomatic Inc.',
    alternateNames: ['Photo-Matic', 'Photo Matic'],
    yearsProduced: '1940s - 1980s',
    countryOfOrigin: 'United States',
    description: 'Photomatic was an American photo booth manufacturer known for producing durable, high-quality machines throughout the mid-20th century. Their booths were particularly popular in the American Midwest and are now collector\'s items.',
    history: `Photomatic Inc. was established in the 1940s and became known for producing reliable, well-built photo booth machines. The company competed with Auto-Photo and other manufacturers for placement in American retail and entertainment venues.

Photomatic machines were known for their sturdy construction and consistent photo quality. They were popular choices for bus stations, shopping malls, and entertainment venues throughout the post-war era.

Like many analog photo booth manufacturers, Photomatic faced challenges with the rise of digital photography and eventually ceased production. However, their machines remain popular among collectors and vintage photography enthusiasts.`,
    specifications: {
      photoType: 'black-and-white',
      photoFormat: '4 photos per strip',
      processingTime: '3-5 minutes',
      technology: 'Silver halide chemical process',
    },
    typicalFeatures: [
      'Robust American construction',
      'Traditional chemical processing',
      'Coin-operated mechanism',
      'Full privacy curtain',
      'Illuminated instruction panel',
    ],
    collectorNotes: 'Photomatic machines are less common than Auto-Photo but are prized for their build quality. Machines with original signage and interior components are especially valuable.',
    relatedModels: ['auto-photo', 'photomaton'],
  },

  'dedem': {
    slug: 'dedem',
    name: 'Dedem',
    manufacturer: 'Dedem',
    alternateNames: ['Dedem Photo Booth'],
    yearsProduced: '1960s - Present',
    countryOfOrigin: 'Italy',
    description: 'Dedem is an Italian photo booth manufacturer known for producing high-quality machines with distinctive European styling. Their machines are commonly found in Italy and throughout Southern Europe.',
    history: `Dedem was founded in Italy and has been producing photo booth machines since the 1960s. The company has maintained a focus on quality and has adapted to changing technologies while preserving traditional photo booth experiences.

Dedem machines are known for their elegant design and reliable performance. They have been a fixture in Italian train stations, shopping centers, and public spaces for decades.

The company continues to produce both analog and digital photo booth solutions, catering to different market needs while maintaining their reputation for quality.`,
    specifications: {
      photoType: 'both',
      photoFormat: 'Multiple formats available',
      processingTime: 'Variable by model',
      technology: 'Chemical and digital options',
    },
    typicalFeatures: [
      'Italian design aesthetics',
      'High-quality optics',
      'Privacy booth with curtain',
      'ID photo compliance',
      'Multiple payment options',
    ],
    collectorNotes: 'Vintage Dedem machines from the 1970s-1980s are sought after for their distinctive Italian styling and excellent photo quality.',
    relatedModels: ['photomaton', 'photo-me'],
  },

  'unknown': {
    slug: 'unknown',
    name: 'Unknown / Unidentified',
    manufacturer: 'Various / Unknown',
    yearsProduced: 'Various',
    countryOfOrigin: 'Various',
    description: 'Many photo booths have unknown or unidentified manufacturers, particularly vintage machines that have been modified or had their branding removed over the years. These machines often have unique characteristics and histories.',
    history: `Throughout the history of photo booths, numerous manufacturers have come and gone, leaving behind machines that are difficult to identify definitively. Some machines were produced by small regional manufacturers, while others have been modified or rebranded over the years.

These unidentified machines often hold their own charm and historical value. Many were custom-built or modified by operators to suit specific locations or purposes.

Collectors and enthusiasts work to identify and document these mysterious machines, preserving their history for future generations.`,
    specifications: {
      photoType: 'both',
      photoFormat: 'Variable',
      technology: 'Various',
    },
    typicalFeatures: [
      'Characteristics vary by machine',
      'May have unique modifications',
      'Often vintage in origin',
      'Potentially rare or one-of-a-kind',
    ],
    collectorNotes: 'Unidentified machines can be hidden treasures. Document any unique characteristics, markings, or serial numbers that might help identify the manufacturer.',
    relatedModels: ['auto-photo', 'photomatic', 'photomaton'],
  },
};

/**
 * Get machine data by slug
 */
export function getMachineDataBySlug(slug: string): MachineModelData | null {
  const normalizedSlug = slug.toLowerCase().replace(/\s+/g, '-');
  return machineModels[normalizedSlug] || null;
}

/**
 * Get machine data by name (fuzzy match)
 */
export function getMachineDataByName(name: string): MachineModelData | null {
  const normalizedName = name.toLowerCase().trim();

  // Direct slug match
  if (machineModels[normalizedName.replace(/\s+/g, '-')]) {
    return machineModels[normalizedName.replace(/\s+/g, '-')];
  }

  // Search by name and alternate names
  for (const model of Object.values(machineModels)) {
    if (model.name.toLowerCase() === normalizedName) {
      return model;
    }
    if (model.alternateNames?.some(alt => alt.toLowerCase() === normalizedName)) {
      return model;
    }
    // Partial match
    if (normalizedName.includes(model.slug) || model.slug.includes(normalizedName.replace(/\s+/g, '-'))) {
      return model;
    }
  }

  return null;
}

/**
 * Get all machine model slugs for static generation
 */
export function getAllMachineModelSlugs(): string[] {
  return Object.keys(machineModels);
}

/**
 * Get all machine models as array
 */
export function getAllMachineModels(): MachineModelData[] {
  return Object.values(machineModels);
}

/**
 * Normalize machine model name from database to match our data
 */
export function normalizeMachineModel(dbModelName: string | null | undefined): string {
  if (!dbModelName) return 'unknown';

  const normalized = dbModelName.toLowerCase().trim();

  // Check for known model patterns
  if (normalized.includes('photomaton')) return 'photomaton';
  if (normalized.includes('photo-me') || normalized.includes('photome')) return 'photo-me';
  if (normalized.includes('fotoautomat')) return 'fotoautomat';
  if (normalized.includes('photoautomat')) return 'photoautomat';
  if (normalized.includes('auto-photo') || normalized.includes('autophoto')) return 'auto-photo';
  if (normalized.includes('photomatic')) return 'photomatic';
  if (normalized.includes('dedem')) return 'dedem';

  // Return slug-ified version for unknown models
  return normalized.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
