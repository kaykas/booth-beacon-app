# TIER 3B: City Guide Extractors - Working Examples

## Quick Reference Examples

This document provides real-world examples of how each TIER 3B extractor processes content.

---

## 1. PARIS: Solo Sophie Extractor

### Input Markdown
```markdown
# Vintage Photo Booths in Paris

## Le Comptoir Général
Located in the heart of the 10th arrondissement, this hidden gem features a vintage photo booth.

Address: 80 Rue des Récollets, 75010
Metro: Gare de l'Est (M4, M5, M7)
Cost: €4 for 4 photos

The booth sits in a quirky bar filled with tropical plants...

## Café de la Poste
A cozy neighborhood café with character.

Address: 123 Rue du Temple, 75003
Cost: €5
Metro: République

Vintage analog booth near the entrance...
```

### Extracted Output
```json
[
  {
    "name": "Le Comptoir Général",
    "address": "80 Rue des Récollets, 75010",
    "city": "Paris",
    "country": "France",
    "postal_code": "75010",
    "booth_type": "analog",
    "cost": "€4",
    "description": "Metro: Gare de l'Est (M4, M5, M7)",
    "source_url": "https://www.solosophie.com/vintage-photo-booth-paris/",
    "source_name": "Solo Sophie",
    "status": "unverified"
  },
  {
    "name": "Café de la Poste",
    "address": "123 Rue du Temple, 75003",
    "city": "Paris",
    "country": "France",
    "postal_code": "75003",
    "booth_type": "analog",
    "cost": "€5",
    "description": "Metro: République",
    "source_url": "https://www.solosophie.com/vintage-photo-booth-paris/",
    "source_name": "Solo Sophie",
    "status": "unverified"
  }
]
```

---

## 2. PARIS: Misadventures with Andi Extractor

### Input Markdown
```markdown
# Complete Guide to Foto Automat in Paris

Here are all the locations I've found:

1. **Foto Automat - Marais**
   The original and most famous location in Paris.

   Address:
   15 Rue du Temple, 75004

   Nearest Metro: Hôtel de Ville (Line 1, 11)

   Coordinates: 48.8566, 2.3522

   Cost: €4 for 4 strips

2. **Foto Automat - Bastille**

   Address: 5 Rue Saint-Antoine, 75004
   Metro: Bastille
   Cost: €4
```

### Extracted Output
```json
[
  {
    "name": "Foto Automat - Marais",
    "address": "15 Rue du Temple, 75004",
    "city": "Paris",
    "country": "France",
    "postal_code": "75004",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "booth_type": "analog",
    "cost": "€4",
    "description": "Metro: Hôtel de Ville (Line 1, 11)",
    "source_name": "Misadventures with Andi",
    "status": "unverified"
  },
  {
    "name": "Foto Automat - Bastille",
    "address": "5 Rue Saint-Antoine, 75004",
    "city": "Paris",
    "country": "France",
    "postal_code": "75004",
    "booth_type": "analog",
    "cost": "€4",
    "description": "Metro: Bastille",
    "source_name": "Misadventures with Andi",
    "status": "unverified"
  }
]
```

---

## 3. VIENNA: No Camera Bag Extractor

### Input Markdown
```markdown
# Best Photo Spots in Vienna

## Naschmarkt
Vienna's most famous market is a photographer's dream.

Address: Wienzeile 38, 1060
District: 6. Bezirk

You'll find a vintage photo booth near the main entrance, perfect for capturing memories after browsing the stalls.

## Hofburg Palace
The imperial palace complex...
```

### Extracted Output
```json
[
  {
    "name": "Naschmarkt",
    "address": "Wienzeile 38, 1060",
    "city": "Vienna",
    "postal_code": "1060",
    "country": "Austria",
    "booth_type": "analog",
    "description": "You'll find a vintage photo booth near the main entrance, perfect for capturing memories after browsing the stalls.",
    "source_name": "No Camera Bag",
    "status": "unverified"
  }
]
```

---

## 4. FLORENCE: Accidentally Wes Anderson Extractor

### Input Markdown
```markdown
# Fotoautomatica

Located in the heart of Florence, this iconic photo booth has been featured in films and beloved by locals and tourists alike.

**Address:** Via Nazionale 82r, Florence

**Hours:** Daily 10:00-20:00

**Cost:** €4 for 4 photos

**Coordinates:** 43.7772, 11.2560

The booth's distinctive yellow and blue color scheme makes it instantly recognizable and perfectly captures the Wes Anderson aesthetic...
```

### Extracted Output
```json
[
  {
    "name": "Fotoautomatica",
    "address": "Via Nazionale 82r",
    "city": "Florence",
    "country": "Italy",
    "latitude": 43.7772,
    "longitude": 11.2560,
    "booth_type": "analog",
    "cost": "€4",
    "hours": "Daily 10:00-20:00",
    "description": "Iconic vintage photo booth featured on Accidentally Wes Anderson for its distinctive aesthetic",
    "source_name": "Accidentally Wes Anderson",
    "status": "unverified"
  }
]
```

---

## 5. SAN FRANCISCO: DoTheBay Extractor

### Input Markdown
```markdown
# Photo Booths in the Bay Area

Here are my favorite spots:

1. **The Alley**
   A vintage arcade bar in Oakland's Grand Lake district.

   Address: 3325 Grand Ave, Oakland, CA 94610

   Neighborhood: Grand Lake District

   Price: $4

2. **Mission Bowling Club**

   3176 17th Street, San Francisco

   Located in: Mission District

   Cost: $5 per session
```

### Extracted Output
```json
[
  {
    "name": "The Alley",
    "address": "3325 Grand Ave, Oakland",
    "city": "Oakland",
    "state": "CA",
    "postal_code": "94610",
    "country": "United States",
    "booth_type": "analog",
    "cost": "$4",
    "description": "Located in Grand Lake District",
    "source_name": "DoTheBay",
    "status": "unverified"
  },
  {
    "name": "Mission Bowling Club",
    "address": "3176 17th Street, San Francisco",
    "city": "San Francisco",
    "state": "CA",
    "country": "United States",
    "booth_type": "analog",
    "cost": "$5",
    "description": "Located in Mission District",
    "source_name": "DoTheBay",
    "status": "unverified"
  }
]
```

---

## 6. MELBOURNE: Concrete Playground Extractor

### Input Markdown
```markdown
# Best Bars in Melbourne

## Bar Americano
A retro-style bar inspired by American diners from the 1950s.

Located at 20 Presgrave Pl, Fitzroy

The bar features a vintage photo booth that perfectly complements the throwback aesthetic. Great cocktails and even better vibes.

## The Toff in Town
Upstairs venue in the CBD...
```

### Extracted Output
```json
[
  {
    "name": "Bar Americano",
    "address": "20 Presgrave Pl, Fitzroy",
    "city": "Fitzroy",
    "state": "VIC",
    "country": "Australia",
    "booth_type": "analog",
    "description": "The bar features a vintage photo booth that perfectly complements the throwback aesthetic. Great cocktails and even better vibes.",
    "source_name": "Concrete Playground",
    "status": "unverified"
  }
]
```

---

## 7. TOKYO: Japan Experience Extractor

### Input Markdown
```markdown
# Purikura Photo Booths in Tokyo

## Purikura no Mecca

The ultimate destination for Purikura in Shibuya.

Location: Shibuya-ku
Nearest Station: Shibuya Station (JR Yamanote Line)
Inside: Shibuya 109 Building, 3rd Floor

Cost: ¥400 per session

Features the latest digital photo booths with extensive editing options, stickers, and filters.

## Harajuku Purikura Center

Location: Harajuku
Station: Harajuku Station
Cost: ¥500
```

### Extracted Output
```json
[
  {
    "name": "Purikura no Mecca",
    "address": "Shibuya-ku",
    "city": "Tokyo",
    "country": "Japan",
    "booth_type": "digital",
    "cost": "¥400",
    "description": "Near Shibuya Station (JR Yamanote Line) - Located in Shibuya 109 Building, 3rd Floor",
    "source_name": "Japan Experience",
    "status": "unverified"
  },
  {
    "name": "Harajuku Purikura Center",
    "address": "Harajuku",
    "city": "Tokyo",
    "country": "Japan",
    "booth_type": "digital",
    "cost": "¥500",
    "description": "Near Harajuku Station",
    "source_name": "Japan Experience",
    "status": "unverified"
  }
]
```

---

## 8. HISTORICAL: Smithsonian Magazine Extractor

### Input Markdown
```markdown
# The History of the Photo Booth

The first photo booth was invented by Anatol Josepho in 1925. The original machine was installed in New York City and became an instant sensation.

Today, several museums preserve these historical artifacts. The Smithsonian National Museum of American History in Washington, D.C. houses an original 1920s photomaton in its permanent collection.

The Henry Ford Museum in Dearborn, Michigan also features a restored photo booth from 1928, demonstrating the early technology...
```

### Extracted Output
```json
[
  {
    "name": "Smithsonian National Museum of American History - Historic Photo Booth",
    "address": "Washington, D.C.",
    "city": "Washington",
    "state": "DC",
    "country": "United States",
    "booth_type": "analog",
    "is_operational": false,
    "description": "Historical booth mentioned in Smithsonian Magazine (circa 1925): houses an original 1920s photomaton in its permanent collection",
    "source_name": "Smithsonian Magazine",
    "status": "unverified"
  },
  {
    "name": "Henry Ford Museum - Historic Photo Booth",
    "address": "Dearborn, Michigan",
    "city": "Dearborn",
    "state": "MI",
    "country": "United States",
    "booth_type": "analog",
    "is_operational": false,
    "description": "Historical booth mentioned in Smithsonian Magazine (circa 1928): features a restored photo booth from 1928, demonstrating the early technology",
    "source_name": "Smithsonian Magazine",
    "status": "unverified"
  }
]
```

---

## Address Normalization Examples

### Paris
```typescript
// Before normalization
"80 rue des récollets, 75010"
"123 AVENUE DES CHAMPS-ÉLYSÉES"

// After normalization
"80 Rue des Récollets, 75010"
"123 Avenue des Champs-Élysées"
```

### Vienna
```typescript
// Before normalization
"wienzeile 38"
"MARIAHILFER STRASSE 123"

// After normalization
"Wienzeile 38"
"Mariahilfer Straße 123"

// District conversion
"6. Bezirk" → postal_code: "1060"
"1. Bezirk" → postal_code: "1010"
```

### Florence
```typescript
// Before normalization
"via nazionale 82r"
"PIAZZA DELLA REPUBBLICA"

// After normalization
"Via Nazionale 82r"
"Piazza della Repubblica"
```

---

## Deduplication Example

### Input (Girl in Florence - Search Results)
```json
[
  {
    "name": "Fotoautomatica Florence",
    "address": "Via Nazionale 82r",
    "city": "Florence"
  },
  {
    "name": "Fotoautomatica Florence",
    "address": "Via Nazionale 82r",
    "city": "Florence"
  },
  {
    "name": "Fotoautomatica Florence",
    "address": "Via Nazionale, Florence",
    "city": "Florence"
  }
]
```

### After Deduplication
```json
[
  {
    "name": "Fotoautomatica Florence",
    "address": "Via Nazionale 82r",
    "city": "Florence",
    "country": "Italy"
  }
]
```

**Deduplication Key:** `${name.toLowerCase()}_${city}_${country}`
- "fotoautomatica florence_Florence_Italy" (matches first two)
- Third entry has different address format but same logical location

---

## Error Handling Examples

### Scenario 1: Partial Data
```typescript
// Input with missing address
{
  "name": "Cool Bar",
  "city": "Paris",
  "country": "France"
  // Missing: address
}

// Result: Skipped (validateBooth returns false)
// Error logged: "Skipping invalid booth: Cool Bar"
```

### Scenario 2: HTML in Content
```typescript
// Input with HTML tags
{
  "name": "<strong>Le Café</strong>",
  "address": "<p>123 Rue du Temple</p>"
}

// Result: Rejected by validateBooth
// Reason: HTML pattern detected
```

### Scenario 3: Unreasonable Length
```typescript
// Input with excessive length
{
  "name": "A".repeat(250),  // 250 characters
  "address": "Valid address"
}

// Result: Rejected by validateBooth
// Reason: name length > 200 characters
```

---

## Integration with Existing System

### Database Upsert Flow
```typescript
// 1. Extract booths from source
const result = await extractSoloSophie(html, markdown, sourceUrl);

// 2. For each booth
for (const booth of result.booths) {
  // 3. Validate
  if (!validateBooth(booth)) continue;

  // 4. Check for existing booth
  const normalized = normalizeName(booth.name);
  const existing = await supabase
    .from("booths")
    .select("id, source_names, source_urls")
    .eq("country", booth.country)
    .ilike("name", `%${normalized}%`)
    .maybeSingle();

  if (existing) {
    // 5a. Update existing booth
    await supabase.from("booths").update({
      ...booth,
      source_names: [...existing.source_names, booth.source_name],
      source_urls: [...existing.source_urls, booth.source_url],
      updated_at: new Date().toISOString()
    }).eq("id", existing.id);
  } else {
    // 5b. Insert new booth
    await supabase.from("booths").insert({
      ...booth,
      source_names: [booth.source_name],
      source_urls: [booth.source_url]
    });
  }
}
```

---

## Testing Quick Start

### Test Individual Extractor
```typescript
import { extractSoloSophie } from './city-guide-extractors.ts';

const sampleMarkdown = `
## Le Comptoir Général
Address: 80 Rue des Récollets, 75010
Metro: Gare de l'Est
Cost: €4
`;

const result = await extractSoloSophie(
  '', // html
  sampleMarkdown,
  'https://www.solosophie.com/vintage-photo-booth-paris/'
);

console.log('Booths found:', result.booths.length);
console.log('Errors:', result.errors);
console.log('Extraction time:', result.metadata.extraction_time_ms, 'ms');
```

### Test Address Normalization
```typescript
import { normalizeParisAddress } from './city-guide-extractors.ts';

console.log(normalizeParisAddress('80 rue des récollets, 75010'));
// Output: "80 Rue des Récollets, 75010"

console.log(normalizeParisAddress('123 AVENUE DES CHAMPS-ÉLYSÉES'));
// Output: "123 Avenue des Champs-Élysées"
```

---

## Common Patterns Across Extractors

### Pattern 1: Header-Based Location Detection
```typescript
// Most extractors use this pattern
const headingMatch = line.match(/^#{2,3}\s+(.+)/);
if (headingMatch) {
  currentBooth = {
    name: headingMatch[1].trim(),
    city: 'City Name',
    country: 'Country'
  };
}
```

### Pattern 2: Address Extraction
```typescript
// Direct label
const addressMatch = line.match(/(?:Address|Location):\s*(.+)/i);

// Or pattern matching
const streetMatch = line.match(/(\d+\s+[A-Z][a-z]+(?:\s+Street|St|Avenue|Ave))/i);
```

### Pattern 3: Cost Extraction
```typescript
// Universal cost pattern
const costMatch = line.match(/(?:cost|price|€|\$|¥)\s*:?\s*([\d.]+)/i);
if (costMatch) {
  booth.cost = `€${costMatch[1]}`; // or $ or ¥ depending on location
}
```

### Pattern 4: Coordinate Extraction
```typescript
// Decimal coordinates
const coordMatch = line.match(/(\d{2}\.\d+),\s*(\d+\.\d+)/);
if (coordMatch) {
  booth.latitude = parseFloat(coordMatch[1]);
  booth.longitude = parseFloat(coordMatch[2]);
}
```

---

## Edge Cases Handled

1. **Multiple mentions of same booth** (Girl in Florence) → Deduplication
2. **Missing address** → Default to "City, Country"
3. **HTML content** → Rejected by validation
4. **Mixed languages** → UTF-8 support
5. **Search-based sources** → Contextual extraction
6. **Historical/closed booths** → `is_operational: false`
7. **Digital vs Analog** → Explicit booth_type classification

---

This examples document provides practical reference for understanding and testing TIER 3B extractors.
