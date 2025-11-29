# 🎯 Booth Beacon Implementation Roadmap

## Vision
**Become the definitive global resource for analog photo booths by building on photobooth.net's index with superior UX, booking capabilities, and community features.**

---

## 📊 Data Strategy

### **Primary Data Source: photobooth.net**
**Authority:** Brian Meacham & Tim Garrett, 20 years, 26 new 2025 locations
**Status:** Gold standard community-sourced directory
**Strategy:** This is your index - scrape and maintain synchronization

### **Prioritized Operators (Tier 1)**

**United States:**
- Classic Photo Booth (your primary reference)
- Photomatica (model for product pages)
- Auto Photo (Chicago)
- Old Friend
- AUTOPHOTO

**Canada:**
- Phototronic

**Europe:**
- AUTOFOTO (London/Barcelona)
- Fotoautomat France
- Fotoautomatica (Florence)

**International:**
- The Fotoautomat (Sweden)
- Singapore operators
- Melbourne operators

---

## 🗺️ Phase 1: Enhanced Data Harvesting (Weeks 1-3)

### **1.1 Photobooth.net Integration**
**Priority:** Critical
**Goal:** Establish photobooth.net as the authoritative index

```typescript
// Database: Add source tracking
ALTER TABLE booths ADD COLUMN source_primary TEXT DEFAULT 'photobooth_net';
ALTER TABLE booths ADD COLUMN source_verified_date TIMESTAMP;
ALTER TABLE booths ADD COLUMN source_last_sync TIMESTAMP;
ALTER TABLE booths ADD COLUMN photobooth_net_id TEXT UNIQUE;
```

**Scraper Enhancement:**
```typescript
// supabase/functions/scrape-booths/photobooth-net-scraper.ts
export async function scrapePhotoboothNet() {
  const firecrawl = new FirecrawlLLMClient();

  // Crawl photobooth.net directory pages
  const results = await firecrawl.crawlUrl('https://photobooth.net/locations/', {
    limit: 500,
    extractionPrompt: `
      Extract ALL photo booth locations from photobooth.net.
      For each location:
      - Name of booth/business
      - Full street address
      - City, state/province, country
      - Operator name (if listed)
      - Machine model (if mentioned)
      - Notes about features/history

      This is the gold standard directory - accuracy is critical.
    `,
  });

  // Store with source attribution
  for (const booth of results) {
    await supabase.from('booths').upsert({
      ...booth,
      source_primary: 'photobooth_net',
      source_verified_date: new Date().toISOString(),
      status: 'active', // photobooth.net = trusted
    });
  }
}
```

### **1.2 Cross-Reference with Classic Photo Booth**
**Priority:** High
**Goal:** Validate addresses, add missing locations

```typescript
// supabase/functions/scrape-booths/classic-photobooth-crossref.ts
export async function crossReferenceClassicPhotoBooth() {
  const cpbLocations = await scrapeClassicPhotoBoothLocations();
  const existingBooths = await getAllBooths();

  for (const cpbLocation of cpbLocations) {
    const match = findMatchByAddress(existingBooths, cpbLocation);

    if (match) {
      // Update existing booth with CPB details
      await supabase.from('booths').update({
        operator: 'Classic Photo Booth',
        source_secondary: 'classic_photobooth',
        cpb_verified: true,
      }).eq('id', match.id);
    } else {
      // Add new booth not in photobooth.net
      await supabase.from('booths').insert({
        ...cpbLocation,
        source_primary: 'classic_photobooth',
        operator: 'Classic Photo Booth',
        status: 'active',
      });
    }
  }
}
```

### **1.3 Operator-Specific Scrapers**
**Priority:** High
**Goal:** Comprehensive coverage of top operators

**Order of Implementation:**
1. Photomatica (reference for product pages)
2. AUTOFOTO (London/Barcelona)
3. Fotoautomat France
4. Phototronic (Canada)
5. Auto Photo (Chicago)
6. Old Friend
7. AUTOPHOTO (US)
8. Fotoautomatica (Florence)
9. The Fotoautomat (Sweden)

```typescript
// supabase/functions/scrape-booths/operator-scrapers/photomatica.ts
export const PHOTOMATICA_CONFIG: SourceConfig = {
  scraper_type: 'photomatica',
  extraction_strategy: 'machine-catalog',
  base_url: 'https://photomatica.org',
  llm_extraction_prompt: `
    Extract photo booth data from Photomatica's machine catalog.

    For each booth, extract:
    1. Machine Details:
       - Model name (e.g., "Photo-Me Model 9")
       - Year manufactured
       - Serial number (if visible)

    2. Location:
       - Venue name
       - Full street address
       - City, state, country

    3. Photos:
       - URL to booth exterior photo
       - URL to sample strips
       - URL to booth interior (if available)

    4. Context:
       - Historical notes
       - Restoration status
       - Operator info
       - Hours/pricing/contact

    Photomatica is the MODEL for how we want to present booth data.
  `,
  features: ['black-and-white', 'chemical', 'vintage-machines'],
  trusted: true,
};
```

### **1.4 Instagram Geotag Harvesting**
**Priority:** Medium
**Goal:** Supplement with community-discovered locations

```typescript
// supabase/functions/scrape-booths/instagram-geotags.ts
const ANALOG_PHOTOBOOTH_ACCOUNTS = [
  'analogphotoboothcommunity',
  'photoboothpreservation',
  'classicphotoboothbeacon',
  // Add more accounts
];

export async function harvestInstagramGeotags() {
  // Use Instagram API or Apify to scrape geotagged posts
  // Extract location data from posts about analog photo booths
  // Cross-reference with existing database
  // Flag for manual review (not auto-trusted)
}
```

---

## 🎨 Phase 2: Product Page Redesign (Weeks 4-6)

### **2.1 Database Schema Expansion**
**Priority:** Critical

```sql
-- Machine details (inspired by Photomatica)
ALTER TABLE booths ADD COLUMN machine_model TEXT;
ALTER TABLE booths ADD COLUMN machine_year INTEGER;
ALTER TABLE booths ADD COLUMN machine_serial TEXT;
ALTER TABLE booths ADD COLUMN machine_manufacturer TEXT;

-- Operator information
ALTER TABLE booths ADD COLUMN operator TEXT;
ALTER TABLE booths ADD COLUMN operator_website TEXT;
ALTER TABLE booths ADD COLUMN operator_contact TEXT;
ALTER TABLE booths ADD COLUMN operator_bio TEXT;

-- Photos
ALTER TABLE booths ADD COLUMN photo_exterior_url TEXT;
ALTER TABLE booths ADD COLUMN photo_interior_url TEXT;
ALTER TABLE booths ADD COLUMN photo_sample_strips TEXT[]; -- Array of URLs

-- Operational details
ALTER TABLE booths ADD COLUMN hours_of_operation TEXT;
ALTER TABLE booths ADD COLUMN pricing_info TEXT;
ALTER TABLE booths ADD COLUMN accepts_cash BOOLEAN DEFAULT true;
ALTER TABLE booths ADD COLUMN accepts_card BOOLEAN DEFAULT false;

-- Historical/contextual
ALTER TABLE booths ADD COLUMN historical_notes TEXT;
ALTER TABLE booths ADD COLUMN restoration_status TEXT;
ALTER TABLE booths ADD COLUMN installation_date DATE;
ALTER TABLE booths ADD COLUMN last_verified_operational DATE;

-- Community features
CREATE TABLE booth_user_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booth_id UUID REFERENCES booths(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  moderation_status TEXT DEFAULT 'pending', -- pending, approved, rejected
  strip_date DATE, -- When the strip was taken
  CONSTRAINT unique_user_photo UNIQUE (user_id, photo_url)
);

CREATE INDEX idx_booth_user_photos_booth_id ON booth_user_photos(booth_id);
CREATE INDEX idx_booth_user_photos_moderation ON booth_user_photos(moderation_status);

-- Machine types reference table
CREATE TABLE machine_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT UNIQUE NOT NULL,
  manufacturer TEXT,
  years_produced TEXT, -- e.g., "1968-1985"
  description TEXT,
  notable_features TEXT[],
  photo_url TEXT,
  collector_notes TEXT
);

-- Booth tourism / city guides
CREATE TABLE city_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  title TEXT, -- e.g., "The Ultimate Berlin Photobooth Tour"
  description TEXT,
  recommended_route TEXT, -- Ordered list of booth IDs
  estimated_time TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  published BOOLEAN DEFAULT false
);
```

### **2.2 Product Page Component (Photomatica-Inspired)**

**File:** `/src/pages/BoothDetail.tsx` (major enhancement)

```tsx
// Key sections to add:

// 1. Machine Details Card (prominent placement)
<Card className="mb-6">
  <CardHeader>
    <h2>Machine Details</h2>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Model</Label>
        <p className="font-semibold">{booth.machine_model || 'Unknown'}</p>
      </div>
      <div>
        <Label>Year</Label>
        <p className="font-semibold">{booth.machine_year || 'Unknown'}</p>
      </div>
      {booth.machine_serial && (
        <div>
          <Label>Serial Number</Label>
          <p className="font-mono text-sm">{booth.machine_serial}</p>
        </div>
      )}
    </div>
  </CardContent>
</Card>

// 2. Photo Gallery (exterior, interior, samples)
<Card className="mb-6">
  <CardHeader>
    <h2>Photos</h2>
  </CardHeader>
  <CardContent>
    <Tabs defaultValue="exterior">
      <TabsList>
        <TabsTrigger value="exterior">Booth</TabsTrigger>
        <TabsTrigger value="samples">Sample Strips</TabsTrigger>
        <TabsTrigger value="community">Community Photos ({userPhotos.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="exterior">
        {booth.photo_exterior_url ? (
          <img src={booth.photo_exterior_url} alt="Booth exterior" />
        ) : (
          <EmptyState message="No photos yet - contribute one!" />
        )}
      </TabsContent>

      <TabsContent value="samples">
        <div className="grid grid-cols-3 gap-4">
          {booth.photo_sample_strips?.map((url, i) => (
            <img key={i} src={url} alt={`Sample strip ${i + 1}`} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="community">
        <UserPhotoGallery boothId={booth.id} photos={userPhotos} />
        <Button onClick={() => setUploadDialogOpen(true)}>
          Upload Your Strip
        </Button>
      </TabsContent>
    </Tabs>
  </CardContent>
</Card>

// 3. Operator Info Card
{booth.operator && (
  <Card className="mb-6">
    <CardHeader>
      <h2>Operated By</h2>
    </CardHeader>
    <CardContent>
      <div className="flex items-start gap-4">
        <Avatar src={getOperatorLogo(booth.operator)} size="lg" />
        <div>
          <h3 className="font-semibold">{booth.operator}</h3>
          {booth.operator_bio && <p className="text-sm text-muted-foreground">{booth.operator_bio}</p>}
          {booth.operator_website && (
            <a href={booth.operator_website} className="text-primary hover:underline">
              Visit Website →
            </a>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
)}

// 4. Historical Notes (if available)
{booth.historical_notes && (
  <Card className="mb-6">
    <CardHeader>
      <h2>History & Context</h2>
    </CardHeader>
    <CardContent>
      <p className="text-sm">{booth.historical_notes}</p>
      {booth.installation_date && (
        <p className="text-xs text-muted-foreground mt-2">
          Installed: {new Date(booth.installation_date).toLocaleDateString()}
        </p>
      )}
    </CardContent>
  </Card>
)}

// 5. Practical Info (hours, pricing, contact)
<Card className="mb-6">
  <CardHeader>
    <h2>Visit This Booth</h2>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {booth.hours_of_operation && (
        <div>
          <Label>Hours</Label>
          <p>{booth.hours_of_operation}</p>
        </div>
      )}
      {booth.pricing_info && (
        <div>
          <Label>Pricing</Label>
          <p>{booth.pricing_info}</p>
        </div>
      )}
      <div>
        <Label>Payment Methods</Label>
        <div className="flex gap-2 mt-1">
          {booth.accepts_cash && <Badge variant="secondary">Cash</Badge>}
          {booth.accepts_card && <Badge variant="secondary">Card</Badge>}
        </div>
      </div>
      {booth.operator_contact && (
        <div>
          <Label>Contact</Label>
          <p>{booth.operator_contact}</p>
        </div>
      )}
    </div>
  </CardContent>
</Card>
```

### **2.3 User Photo Upload Component**

**File:** `/src/components/UserPhotoUpload.tsx` (NEW)

```tsx
export function UserPhotoUpload({ boothId }: { boothId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [stripDate, setStripDate] = useState<Date | null>(null);

  async function handleUpload() {
    if (!file) return;

    // 1. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('booth-photos')
      .upload(`user-submissions/${boothId}/${Date.now()}-${file.name}`, file);

    if (uploadError) throw uploadError;

    // 2. Create database entry (pending moderation)
    const { error: dbError } = await supabase.from('booth_user_photos').insert({
      booth_id: boothId,
      photo_url: uploadData.path,
      caption,
      strip_date: stripDate,
      moderation_status: 'pending',
    });

    if (dbError) throw dbError;

    // 3. Show success message
    toast.success('Photo submitted! It will appear after review.');
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Upload Your Photo Strip</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Your Photo Strip</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Photo Strip</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <Label>Caption (optional)</Label>
            <Textarea
              placeholder="Tell us about your visit..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
          <div>
            <Label>When did you take this? (optional)</Label>
            <DatePicker
              selected={stripDate}
              onChange={setStripDate}
              maxDate={new Date()}
            />
          </div>
          <Button onClick={handleUpload} disabled={!file}>
            Submit Photo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🚀 Phase 3: Differentiation Features (Weeks 7-10)

### **3.1 Map-First UX** (What photobooth.net can't do)
**Priority:** Critical
**Goal:** Make the map the primary discovery interface

**Landing Page Redesign:**
```tsx
// src/pages/Index.tsx - major redesign

export default function Index() {
  return (
    <div className="h-screen flex flex-col">
      {/* Minimal header */}
      <header className="h-16 border-b">
        <Logo />
        <SearchBar />
        <UserMenu />
      </header>

      {/* FULL-SCREEN MAP */}
      <div className="flex-1 relative">
        <MapView
          initialCenter={{ lat: 40.7128, lng: -74.0060 }}
          initialZoom={11}
          booths={allBooths}
          clusteringEnabled
        />

        {/* Floating controls */}
        <div className="absolute top-4 left-4 z-10">
          <Card className="w-80">
            <FilterPanel />
          </Card>
        </div>

        {/* List view toggle */}
        <Button
          className="absolute bottom-4 right-4 z-10"
          onClick={() => setShowList(!showList)}
        >
          {showList ? 'Show Map' : 'Show List'}
        </Button>

        {/* Sliding list panel */}
        {showList && (
          <div className="absolute inset-y-0 right-0 w-96 bg-background border-l overflow-y-auto">
            <BoothList booths={filteredBooths} />
          </div>
        )}
      </div>
    </div>
  );
}
```

**Enhanced Map Features:**
- Custom booth icons (different colors for operators)
- Clustering for dense areas
- Click to preview booth (popup)
- "Near me" button
- Filter by machine model
- Filter by operator
- "Open now" filter (if hours available)

### **3.2 Booking & Reminder System**
**Priority:** High
**Goal:** Help users plan visits and remember booths

**Database:**
```sql
CREATE TABLE booth_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booth_id UUID REFERENCES booths(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  visited BOOLEAN DEFAULT false,
  visited_at TIMESTAMP,
  CONSTRAINT unique_bookmark UNIQUE (user_id, booth_id)
);

CREATE TABLE booth_visit_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booth_id UUID REFERENCES booths(id) ON DELETE CASCADE,
  remind_at TIMESTAMP NOT NULL,
  reminder_sent BOOLEAN DEFAULT false,
  email TEXT,
  phone TEXT, -- for SMS reminders (future)
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Component:**
```tsx
// src/components/BoothBookmark.tsx (NEW)
export function BoothBookmark({ boothId }: { boothId: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [notes, setNotes] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | null>(null);

  async function handleBookmark() {
    await supabase.from('booth_bookmarks').upsert({
      booth_id: boothId,
      notes,
    });

    if (reminderDate) {
      await supabase.from('booth_visit_reminders').insert({
        booth_id: boothId,
        remind_at: reminderDate.toISOString(),
      });
    }

    setBookmarked(true);
    toast.success('Booth bookmarked! We\'ll remind you to visit.');
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Bookmark className={bookmarked ? 'fill-current' : ''} />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-4">
          <h3 className="font-semibold">Bookmark This Booth</h3>
          <Textarea
            placeholder="Add notes (e.g., 'Visit during NYC trip')"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div>
            <Label>Remind me to visit on:</Label>
            <DatePicker
              selected={reminderDate}
              onChange={setReminderDate}
              minDate={new Date()}
            />
          </div>
          <Button onClick={handleBookmark} className="w-full">
            Save Bookmark
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### **3.3 Machine Type Deep-Dives**
**Priority:** Medium
**Goal:** Collector's guides for each machine model

**File:** `/src/pages/MachineModel.tsx` (NEW)

```tsx
export default function MachineModel() {
  const { modelName } = useParams();
  const model = useMachineModel(modelName);
  const booths = useBoothsByModel(modelName);

  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>{model.model_name} Photo Booth Guide</title>
        <meta name="description" content={`Complete guide to ${model.model_name} photo booths: history, locations, collector's notes.`} />
      </Helmet>

      {/* Hero section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{model.model_name}</h1>
        <p className="text-xl text-muted-foreground">{model.manufacturer}</p>
        <Badge variant="secondary">Produced: {model.years_produced}</Badge>
      </div>

      {/* Model photo */}
      {model.photo_url && (
        <img
          src={model.photo_url}
          alt={model.model_name}
          className="w-full max-w-2xl mb-8 rounded-lg"
        />
      )}

      {/* Description */}
      <Card className="mb-8">
        <CardHeader>
          <h2>About This Model</h2>
        </CardHeader>
        <CardContent>
          <p>{model.description}</p>
          {model.notable_features && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Notable Features:</h3>
              <ul className="list-disc list-inside">
                {model.notable_features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collector's notes */}
      {model.collector_notes && (
        <Card className="mb-8 border-primary">
          <CardHeader>
            <h2>Collector's Notes</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm italic">{model.collector_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Where to find this model */}
      <Card className="mb-8">
        <CardHeader>
          <h2>Where to Find {model.model_name} Booths</h2>
          <p className="text-sm text-muted-foreground">
            {booths.length} active locations worldwide
          </p>
        </CardHeader>
        <CardContent>
          {/* Map of all booths with this model */}
          <MapView
            booths={booths}
            height="400px"
            clusteringEnabled
          />

          {/* List of locations */}
          <div className="mt-4 space-y-2">
            {booths.map((booth) => (
              <BoothListItem key={booth.id} booth={booth} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Example Machine Model Pages:**
- `/machines/photo-me-model-9` - "The Model 9 Collector's Guide"
- `/machines/photo-me-model-11` - "Model 11: The Color Revolution"
- `/machines/photo-me-star` - "Photo-Me Star: The Modern Classic"
- `/machines/anatol` - "Anatol Josepho's Original Design"

### **3.4 Operator Profiles**
**Priority:** Medium
**Goal:** Tell the stories behind the booths

**File:** `/src/pages/OperatorProfile.tsx` (NEW)

```tsx
export default function OperatorProfile() {
  const { operatorSlug } = useParams();
  const operator = useOperator(operatorSlug);
  const booths = useBoothsByOperator(operatorSlug);

  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>{operator.name} - Photo Booth Operator Profile</title>
      </Helmet>

      {/* Hero */}
      <div className="flex items-start gap-8 mb-8">
        <Avatar src={operator.logo_url} size="2xl" />
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{operator.name}</h1>
          <p className="text-xl text-muted-foreground mb-4">
            {operator.city}, {operator.country}
          </p>
          {operator.website && (
            <Button asChild variant="outline">
              <a href={operator.website} target="_blank" rel="noopener">
                Visit Website →
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Story */}
      {operator.story && (
        <Card className="mb-8">
          <CardHeader>
            <h2>Their Story</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{operator.story}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{booths.length}</p>
            <p className="text-sm text-muted-foreground">Active Booths</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{operator.cities_count}</p>
            <p className="text-sm text-muted-foreground">Cities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{operator.founded_year}</p>
            <p className="text-sm text-muted-foreground">Founded</p>
          </CardContent>
        </Card>
      </div>

      {/* Their booths */}
      <Card>
        <CardHeader>
          <h2>{operator.name} Booth Locations</h2>
        </CardHeader>
        <CardContent>
          <MapView booths={booths} height="500px" />
          <div className="mt-4 space-y-2">
            {booths.map((booth) => (
              <BoothListItem key={booth.id} booth={booth} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Example Operator Profiles:**
- `/operators/classic-photo-booth` - Your reference
- `/operators/photomatica` - Matteo Sani's preservation work
- `/operators/autofoto` - Bre Conley-Saxon's London/Barcelona story
- `/operators/fotoautomat-france` - French analog revival

**Database:**
```sql
CREATE TABLE operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  website TEXT,
  logo_url TEXT,
  story TEXT, -- Long-form narrative
  founded_year INTEGER,
  contact_email TEXT,
  instagram TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE booths ADD COLUMN operator_id UUID REFERENCES operators(id);
```

### **3.5 Booth Tourism Guides**
**Priority:** Medium
**Goal:** City-specific guides for photo booth enthusiasts

**File:** `/src/pages/CityGuide.tsx` (NEW)

```tsx
export default function CityGuide() {
  const { city } = useParams();
  const guide = useCityGuide(city);
  const booths = useBoothsByCity(city);

  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>{guide.title || `${city} Photo Booth Guide`}</title>
        <meta name="description" content={guide.description} />
      </Helmet>

      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{guide.title}</h1>
        <p className="text-xl text-muted-foreground">{guide.description}</p>
        {guide.estimated_time && (
          <Badge variant="secondary" className="mt-2">
            Estimated time: {guide.estimated_time}
          </Badge>
        )}
      </div>

      {/* Recommended route map */}
      {guide.recommended_route && (
        <Card className="mb-8">
          <CardHeader>
            <h2>Recommended Route</h2>
          </CardHeader>
          <CardContent>
            <MapView
              booths={getBoothsInOrder(guide.recommended_route)}
              showRoute
              height="500px"
            />
            <Button className="mt-4" asChild>
              <a href={getGoogleMapsDirectionsUrl(guide.recommended_route)}>
                Open in Google Maps →
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* All booths in city */}
      <Card>
        <CardHeader>
          <h2>All Photo Booths in {city}</h2>
          <p className="text-sm text-muted-foreground">
            {booths.length} locations
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {booths.map((booth, index) => (
              <BoothCard key={booth.id} booth={booth} index={index + 1} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Example City Guides:**
- `/guides/berlin` - "The Ultimate Berlin Photobooth Tour"
- `/guides/paris` - "Analog Photo Booth Map of Paris"
- `/guides/london` - "AUTOFOTO & Friends: London's Booth Scene"
- `/guides/new-york` - "Classic Photo Booth's NYC Network"
- `/guides/chicago` - "Auto Photo's Chicago Legacy"

---

## 📈 Phase 4: Analytics & Community Features (Weeks 11-12)

### **4.1 User Accounts & Profiles**
- User profile pages
- "My Bookmarks" page
- "My Visited Booths" (with photo strips)
- User contributions count (photos submitted, guides created)

### **4.2 Community Features**
- Comment system on booth pages
- User ratings (5-star system)
- "Recently visited" feed (community activity)
- Photo strip of the week

### **4.3 Admin Dashboard**
- Photo moderation queue
- Data quality monitoring
- Source sync status
- Top contributors leaderboard

---

## 🔧 Technical Implementation Priority

### **Immediate (Week 1):**
1. ✅ Database schema changes (machine details, operator info, user photos)
2. ✅ Photobooth.net scraper enhancement
3. ✅ Classic Photo Booth cross-reference
4. Map-first UI redesign

### **Next (Weeks 2-3):**
1. Operator-specific scrapers (Photomatica, AUTOFOTO, etc.)
2. Product page redesign with Photomatica-inspired layout
3. User photo upload system

### **Then (Weeks 4-6):**
1. Booking/reminder system
2. Machine model deep-dive pages
3. Operator profile pages

### **Finally (Weeks 7-8):**
1. City tourism guides
2. Community features (comments, ratings)
3. Admin moderation dashboard

---

## 💡 Key Differentiators Summary

**What photobooth.net has:**
- Comprehensive directory (20 years, gold standard)
- Community-sourced data
- Brian & Tim's curation

**What YOU will have that they don't:**
1. **Map-first UX** - Full-screen interactive map (they have text list)
2. **Booking & Reminders** - Help users plan visits
3. **Machine Deep-Dives** - Collector's guides for each model
4. **Operator Profiles** - Tell the stories (Matteo, Bre, etc.)
5. **City Tourism Guides** - Curated booth tours
6. **Beautiful Product Pages** - Photomatica-inspired educational content
7. **Community Photos** - User-submitted photo strips
8. **Modern Tech Stack** - Fast, mobile-first, search-optimized

**Strategy:**
- Use photobooth.net as your DATA source (with attribution)
- Build the EXPERIENCE they can't as a static site
- Become the go-to resource for booth enthusiasts worldwide

---

## 📊 Success Metrics

### **Data Coverage (Month 1-3):**
- [ ] 100% of photobooth.net index imported
- [ ] 100% of Classic Photo Booth locations verified
- [ ] 80% of top 10 operators' booths mapped
- [ ] 50 user-submitted photos moderated & published

### **User Engagement (Month 3-6):**
- [ ] 1,000 unique visitors/month
- [ ] 100 user accounts created
- [ ] 500 booth bookmarks
- [ ] 50 email reminders sent
- [ ] 20 city guides published

### **SEO Performance (Month 6-12):**
- [ ] Rank #1 for "analog photo booth near me"
- [ ] Rank top 3 for city queries ("berlin photo booth")
- [ ] Rank top 5 for machine model queries ("Photo-Me Model 9")
- [ ] Featured snippet for "what is an analog photo booth"

### **Community Growth (Year 1):**
- [ ] 10,000 visitors/month
- [ ] 1,000 user accounts
- [ ] 500 user-submitted photos
- [ ] 100 city guides
- [ ] Partnerships with 3+ major operators

---

## 🚀 Next Steps

1. **Review & Approve Roadmap** - Does this align with your vision?
2. **Prioritize Features** - What's most important for launch?
3. **Set Timeline** - How fast do you want to move?
4. **Deploy Cloudflare** - Immediate 2-3x performance boost
5. **Start Phase 1** - Enhanced data harvesting

**Ready to start building?** Let me know what you'd like to tackle first!
