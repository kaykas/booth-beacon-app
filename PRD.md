# Booth Beacon — Complete Product Requirements Document

**Version:** 3.0
**Date:** November 26, 2025
**Authors:** Jascha Kaykas-Wolff, Alexandra Roberts
**Status:** Ready for Build

---

## Purpose

Build the world's definitive analog photo booth discovery platform—**Booth Beacon**—as the ultimate resource for finding, saving, and experiencing authentic photo booths worldwide. The site serves enthusiasts, travelers, collectors, and operators who share a passion for preserving analog photography culture.

---

## Brand Foundation

### Name

**BOOTH BEACON**

A guiding light to analog moments. The name evokes discovery, warmth, and the flash of a photo booth bulb.

### Positioning

Booth Beacon is the compass for analog photography seekers—where every booth has a story, every visit becomes a memory, and a global community preserves the magic of four-frame strips.

### Personality

**Nostalgic • Warm • Authentic • Curious • Community-Driven • Playful with Purpose**

We celebrate imperfection. The slight grain. The unexpected expression. The tangible strip you hold in your hand.

### Aesthetic System

#### Color Palette

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--primary` | Booth Red | `#C73E3A` | CTAs, active states, map markers |
| `--primary-dark` | Darkroom Red | `#9A2E2B` | Hover states, emphasis |
| `--secondary` | Film Cream | `#F5F0E8` | Backgrounds, cards |
| `--secondary-dark` | Aged Paper | `#E8E0D4` | Alternate backgrounds |
| `--accent` | Flash Gold | `#D4A853` | Highlights, badges, premium features |
| `--neutral-900` | Darkroom Black | `#1A1A1A` | Primary text |
| `--neutral-700` | Charcoal | `#404040` | Secondary text |
| `--neutral-500` | Silver Halide | `#737373` | Muted text, borders |
| `--neutral-300` | Light Gray | `#D4D4D4` | Dividers, disabled states |
| `--neutral-100` | Off White | `#FAFAFA` | Backgrounds |
| `--success` | Operational Green | `#22C55E` | Active booth status |
| `--warning` | Unverified Amber | `#F59E0B` | Unverified status |
| `--error` | Closed Red | `#EF4444` | Inactive/closed status |

#### Materials & Textures

- Subtle film grain overlay on hero images
- Photo strip borders with rounded corners and slight shadows
- Vintage paper textures for content cards
- Soft vignette effects on booth photography
- Matte finishes, never glossy

#### Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| Display (Hero) | **Fraunces** | 600 | 48-72px | 1.1 |
| Headlines (H1-H2) | **Fraunces** | 500 | 32-40px | 1.2 |
| Subheadings (H3-H4) | **Inter** | 600 | 20-24px | 1.3 |
| Body | **Inter** | 400 | 16px | 1.6 |
| Body Small | **Inter** | 400 | 14px | 1.5 |
| Caption | **Inter** | 500 | 12px | 1.4 |
| Mono (Technical) | **JetBrains Mono** | 400 | 14px | 1.5 |

**Font Loading:**
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
```

#### Iconography

- **Style:** Outlined, 1.5px stroke weight
- **Library:** Lucide React (consistent with shadcn/ui)
- **Custom Icons:** Photo strip, booth silhouette, film reel, flash bulb
- **Size Scale:** 16px (inline), 20px (buttons), 24px (navigation), 32px (features)

#### Spacing System

Based on 4px grid:
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px
- `3xl`: 64px
- `4xl`: 96px

#### Border Radius

- `sm`: 4px (buttons, inputs)
- `md`: 8px (cards, modals)
- `lg`: 12px (feature cards)
- `xl`: 16px (hero elements)
- `full`: 9999px (pills, avatars)

#### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
--shadow-photo: 0 4px 20px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
```

### Voice & Tone

**Warm. Curious. Knowledgeable. Never pretentious.**

We speak like a friend who happens to know where all the best booths are hidden.

#### Writing Examples

| Context | Example |
|---------|---------|
| Hero Tagline | "Find your next four frames." |
| Empty State | "No booths here yet. Be the first to discover one." |
| Success Toast | "Saved to your collection. Happy hunting!" |
| Error Message | "Couldn't load this booth. Let's try that again." |
| CTA Button | "Explore the Map" / "Save to Google Maps" / "Add Your Photo" |
| Booth Description | "Tucked in the back of a Berlin dive bar, this Model 9 has been capturing moments since 1987." |

#### Tone by Context

| Context | Tone |
|---------|------|
| Discovery/Browsing | Enthusiastic, inviting |
| Booth Details | Informative, storytelling |
| Community/Comments | Friendly, encouraging |
| Errors/Issues | Helpful, reassuring |
| Admin/Technical | Clear, professional |

### Signature Narrative

> Booth Beacon exists because some moments deserve to be held—not scrolled past. We map the world's analog photo booths: the vintage machines in hotel lobbies, the chemical booths in dive bars, the classic cabinets in train stations. Each one a portal to presence. Four frames. No filters. No retakes. Just you, the flash, and whatever happens next.

---

## Objectives

### Primary

1. **Become the definitive global directory** for analog photo booths
2. **Enable seamless discovery** through a map-first, mobile-friendly experience
3. **Build a passionate community** of collectors, enthusiasts, and operators

### Secondary

1. Preserve the history and culture of analog photo booths
2. Connect operators with their audience
3. Generate rich, SEO-optimized content that ranks for photo booth queries
4. Create the foundation for future monetization (operator subscriptions, premium features)

---

## Target Users

### Primary Personas

| Persona | Description | Primary Need |
|---------|-------------|--------------|
| **The Traveler** | Plans booth visits around trips, saves locations to Google Maps | Quick discovery, save functionality |
| **The Enthusiast** | Seeks authentic analog experiences, avoids digital booths | Machine details, photo type filters |
| **The Collector** | Documents visits, collects strips, tracks machine models | Photo upload, visit history, model info |
| **The Curious Local** | Spontaneous "photo booth near me" searcher | Fast mobile experience, directions |

### Secondary Personas

| Persona | Description | Primary Need |
|---------|-------------|--------------|
| **The Operator** | Owns/maintains booths, wants visibility | Claiming listings, analytics, updates |
| **The Historian** | Researches photo booth history and preservation | Machine guides, historical content |

---

## Product Scope

### A. Core Site Experience

#### Home Page (`/`)

**Purpose:** Immersive entry point with immediate access to the map.

**Hero Section:**
- Full-viewport hero with background image (rotating booth photography)
- Headline: "Find your next four frames."
- Subheadline: "The world's most comprehensive analog photo booth directory."
- Primary CTA: "Explore the Map" → scrolls to map or navigates to `/map`
- Secondary CTA: "How It Works" → scrolls to explanation section
- Search bar with location autocomplete

**Stats Bar:**
- "700+ booths" | "40+ countries" | "Preserved since 2024"

**Map Preview Section:**
- Interactive map showing clustered booth markers
- "View Full Map" button
- Filter chips: "Near Me" | "Berlin" | "NYC" | "London"

**Featured Booths:**
- 3-4 curated booth cards with high-quality photos
- "Editor's Pick" badge
- Horizontal scroll on mobile

**How It Works:**
- 3-step visual: Discover → Save → Visit
- Icons with brief descriptions

**City Guides Preview:**
- Grid of 4-6 city guide cards
- "Berlin Photo Booth Tour" / "NYC Booth Walk" etc.

**Community Section:**
- Recent user-submitted photos (if available)
- "Join the Community" CTA

**Footer:**
- Navigation links
- Newsletter signup
- Social links (Instagram, Twitter)
- "Made with ♥ for analog photography"

---

#### Map Page (`/map`)

**Purpose:** Full-screen map as the primary discovery interface.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  [Search Bar                    ] [Filters] [List]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                    FULL-SCREEN MAP                          │
│                                                             │
│                    [Booth Markers with Clustering]          │
│                                                             │
│                                                             │
│  ┌──────────────────────┐                                   │
│  │ Filter Panel         │              [+ / -] [📍 Near Me] │
│  │ (collapsible)        │                                   │
│  └──────────────────────┘                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Map Features:**
- Google Maps with custom styling (warm, muted tones)
- Marker clustering at low zoom levels
- Custom booth markers (color-coded by status)
  - Green: Active/Verified
  - Amber: Unverified
  - Gray: Inactive/Closed
- Click marker → InfoWindow popup with booth preview
- "Near Me" button with geolocation

**Filter Panel (Floating, Left Side):**
- **Location:** City search, "Near Me" toggle
- **Photo Type:** Black & White, Color, Both
- **Machine Model:** Dropdown (Photo-Me Model 9, Model 11, etc.)
- **Operator:** Dropdown (Classic Photo Booth, Photomatica, etc.)
- **Status:** Active, Unverified, All
- **Payment:** Cash, Card, Both
- "Clear Filters" button

**List View Toggle:**
- Button to switch between map and list view
- List view: Scrollable booth cards with infinite scroll

**Booth Preview Card (InfoWindow):**
```
┌─────────────────────────────────────┐
│ [Photo]                             │
│                                     │
│ Ace Hotel Lobby                     │
│ Portland, OR, USA                   │
│ ────────────────────                │
│ Photo-Me Model 9 • B&W              │
│ ⭐ 4.8 (12 reviews)                 │
│                                     │
│ [View Details]  [📍 Directions]     │
└─────────────────────────────────────┘
```

---

#### Booth Detail Page (`/booth/:id`)

**Purpose:** Comprehensive booth profile with all details, photos, and community content.

**Hero Section:**
- Large photo gallery (carousel if multiple images)
- AI-generated preview if no photos (with "AI Preview" badge)
- Booth name as H1
- Location (city, country)
- Status badge (Active/Unverified/Closed)
- Quick actions: Save | Directions | Share

**Key Info Card:**
```
┌─────────────────────────────────────────────────────────────┐
│ MACHINE DETAILS                                             │
│ ─────────────────                                           │
│ Model          Photo-Me Model 9                             │
│ Manufacturer   Photo-Me International                       │
│ Year           c. 1982                                      │
│ Photo Type     Black & White (chemical)                     │
│ ─────────────────                                           │
│ VISIT INFO                                                  │
│ ─────────────────                                           │
│ Cost           $4 for 4 photos                              │
│ Payment        Cash only (quarters accepted)                │
│ Hours          24/7 (venue hours may vary)                  │
└─────────────────────────────────────────────────────────────┘
```

**Location & Directions:**
- Embedded map showing booth location
- Full address with copy button
- "Get Directions" button (opens Google Maps)
- "Save to Google Maps" button
- Nearby booths list (within 5km)

**Operator Section (if known):**
- Operator name and logo
- Brief bio
- "View all [Operator] booths" link

**Description & History:**
- Rich text description
- Historical notes (if available)
- Installation date, restoration status

**Photo Gallery:**
- Tabs: "Booth Photos" | "Sample Strips" | "Community"
- Grid layout with lightbox on click
- "Add Your Photo" CTA

**Reviews & Tips:**
- Star rating summary
- Individual reviews with dates
- "Write a Review" CTA

**Share & Save Actions:**
- Save to collection
- Share via link, Twitter, WhatsApp
- Report incorrect info

---

#### City Guides (`/guides/:city`)

**Purpose:** Curated walking tours for photo booth enthusiasts.

**Hero:**
- City skyline or iconic image
- "The Berlin Photo Booth Tour"
- "12 booths • 4 neighborhoods • 5 hours"

**Route Map:**
- Interactive map with numbered markers
- Suggested walking route (polyline)
- "Open in Google Maps" button
- "Download GPX" button

**Booth Stops:**
- Numbered list of booths in recommended order
- Mini booth cards with photos
- Walking time between stops
- Insider tips ("Visit on Sundays for the flea market")

**Practical Info:**
- Best time to visit
- Payment tips (coins, etc.)
- Nearby attractions

---

#### Machine Model Pages (`/machines/:model`)

**Purpose:** Collector's guides for specific photo booth models.

**Content:**
- Model name, manufacturer, years produced
- Reference photo
- Technical specifications
- Historical significance
- Notable features
- Collector's notes (rarity, value)
- Map of all booths with this model
- List of locations

---

#### Operator Profiles (`/operators/:slug`)

**Purpose:** Tell the stories of the people preserving photo booths.

**Content:**
- Operator name and logo
- Founding story
- Mission/philosophy
- Statistics (booth count, cities, countries)
- Map of all their locations
- Featured booths
- Contact/website link

---

#### User Pages

**My Bookmarks (`/bookmarks`):**
- Saved booths in collections
- Create/edit collections
- Mark as visited
- Export to Google Maps / KML

**My Profile (`/profile`):**
- Account settings
- Uploaded photos
- Reviews written
- Visit history

**Submit a Booth (`/submit`):**
- Form to submit new booth location
- Photo upload
- Basic details (name, address, machine type)
- Moderation queue for admin

---

#### Admin Dashboard (`/admin`)

**Purpose:** Crawler monitoring, data quality, moderation.

**Tabs:**
- **Dashboard:** Key metrics, recent activity
- **Health:** Source health scores, crawler status
- **Queue:** Crawl job queue, active/pending
- **Logs:** Real-time log viewer with filtering
- **Moderation:** User submissions, photos, reviews
- **Settings:** Crawler configuration

---

### B. Component Specifications

#### BoothCard

```tsx
interface BoothCardProps {
  booth: Booth;
  variant: 'default' | 'compact' | 'featured';
  showDistance?: boolean;
  onSave?: () => void;
  onDirections?: () => void;
}
```

**Visual:**
- Photo (or AI preview with badge)
- Name
- Location (city, country)
- Machine model (if known)
- Status badge
- Rating (if available)
- Action buttons: Save, Directions

---

#### BoothMap

```tsx
interface BoothMapProps {
  booths: Booth[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onBoothClick?: (booth: Booth) => void;
  showClustering?: boolean;
  showUserLocation?: boolean;
}
```

**Features:**
- Google Maps integration
- Custom markers with status colors
- MarkerClusterer for dense areas
- InfoWindow on marker click
- Geolocation for "Near Me"

---

#### BookmarkButton

```tsx
interface BookmarkButtonProps {
  boothId: string;
  initialSaved?: boolean;
  onSave?: () => void;
  variant: 'icon' | 'full';
}
```

**States:**
- Not saved: Outline bookmark icon
- Saved: Filled bookmark icon with animation
- Saving: Loading spinner

---

#### SaveToMapsButton

```tsx
interface SaveToMapsButtonProps {
  booth: Booth;
  variant: 'primary' | 'secondary';
}
```

**Behavior:**
- Opens Google Maps with booth location pre-filled
- Deep link format: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${placeId}`

---

#### BoothImage

```tsx
interface BoothImageProps {
  booth: Booth;
  size: 'thumbnail' | 'card' | 'hero';
  showAiBadge?: boolean;
  onAddPhoto?: () => void;
}
```

**Behavior:**
- Shows real photo if available
- Falls back to AI-generated preview with "AI Preview" badge
- "Add Real Photo" overlay CTA
- Lazy loading with blur placeholder

---

#### StatusBadge

```tsx
interface StatusBadgeProps {
  status: 'active' | 'unverified' | 'inactive' | 'closed';
}
```

**Colors:**
- Active: Green
- Unverified: Amber
- Inactive/Closed: Gray/Red

---

#### FilterPanel

```tsx
interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClear: () => void;
  isCollapsed?: boolean;
}
```

**Filters:**
- Photo Type (multi-select)
- Machine Model (dropdown)
- Operator (dropdown)
- Status (multi-select)
- Payment (multi-select)
- Distance (slider)

---

### C. Page-by-Page Specifications

#### Home Page

| Section | Component | Data Source |
|---------|-----------|-------------|
| Hero | Custom | Static + dynamic stats |
| Stats Bar | StatsBar | `useBoothStats()` hook |
| Map Preview | BoothMap | `useBooths()` with limit |
| Featured Booths | BoothCard (featured) | Curated list from DB |
| How It Works | Static | Markdown content |
| City Guides | GuideCard | `useCityGuides()` |
| Footer | Footer | Static |

#### Map Page

| Section | Component | Data Source |
|---------|-----------|-------------|
| Header | MapHeader | - |
| Map | BoothMap | `useBooths()` with filters |
| Filter Panel | FilterPanel | Local state |
| List View | BoothList | Same as map |
| Booth Preview | BoothPreviewCard | Selected booth |

#### Booth Detail Page

| Section | Component | Data Source |
|---------|-----------|-------------|
| Hero Gallery | PhotoGallery | `booth.photos` |
| Key Info | BoothInfoCard | `booth` object |
| Map | BoothDetailMap | `booth.coordinates` |
| Operator | OperatorCard | `booth.operator` |
| Description | RichText | `booth.description` |
| Photos | PhotoGallery | `useBoothPhotos()` |
| Reviews | ReviewList | `useBoothReviews()` |
| Nearby | NearbyBooths | `useNearbyBooths()` |

---

### D. Interaction Patterns

#### Save to Google Maps Flow

```
User clicks "Save to Google Maps"
    │
    ▼
Open Google Maps deep link with coordinates
    │
    ▼
Google Maps opens with booth location
    │
    ▼
User saves to their Google Maps list
    │
    ▼
Track save event in analytics
```

#### Add Photo Flow

```
User clicks "Add Your Photo"
    │
    ▼
Login required? → Redirect to auth
    │
    ▼
Open photo upload dialog
    │
    ▼
Select/capture photo
    │
    ▼
Add caption (optional)
    │
    ▼
Submit → moderation queue
    │
    ▼
Show success toast
```

#### Search Flow

```
User types in search bar
    │
    ▼
Debounced API call (300ms)
    │
    ▼
Show autocomplete results:
  - Cities
  - Booth names
  - Addresses
    │
    ▼
User selects result
    │
    ▼
Map centers on location / navigates to booth
```

---

### E. Mobile Specifications

#### Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Single column, bottom sheet |
| Tablet | 768-1024px | Two column, side panel |
| Desktop | > 1024px | Full layout, floating panels |

#### Mobile Map Experience

- Full-screen map by default
- Bottom sheet for booth details (drag up/down)
- Floating action buttons: Filter, Near Me, List
- Touch-optimized markers (larger hit area)

#### Mobile Navigation

- Bottom tab bar: Map, Search, Saved, Profile
- Hamburger menu for secondary pages

---

### F. AI Image Generation (Nano Banana)

#### When to Generate

- Booth has no `photo_exterior_url`
- Booth was created/updated in last 24h
- Admin manually triggers regeneration

#### Prompt Template

```typescript
function generateBoothPrompt(booth: Booth): string {
  return `A vintage analog photo booth in ${booth.city}, ${booth.country}.
${booth.machine_model ? `${booth.machine_model} model.` : 'Classic photo booth design.'}
Located at ${booth.name || 'a local venue'}.
${booth.type === 'black-and-white' ? 'Black and white chemical photo booth.' : 'Color photo booth.'}
Photorealistic style, warm ambient lighting, inviting atmosphere.
The booth has a classic curtain entrance, vintage aesthetic, photo strip dispenser visible.
Shot as if photographed by a visitor, natural composition.`;
}
```

#### Image Specifications

- Size: 1024x1024 (stored)
- Formats: WebP (display), JPEG (fallback)
- Sizes generated: 256, 512, 1024
- Storage: Supabase Storage bucket `booth-previews`

#### UI Treatment

- "AI Preview" badge (bottom-right, semi-transparent)
- Slight opacity reduction (0.95)
- "Add Real Photo" overlay button
- Tooltip: "This is an AI-generated preview. Help us by adding a real photo!"

---

## Technical Architecture

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14+ | React framework with App Router |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | Latest | Component library |
| TanStack Query | 5.x | Server state management |
| Zustand | 4.x | Client state management |
| Google Maps JS API | 3.x | Map rendering |
| Framer Motion | 10.x | Animations |

### Backend Stack

| Technology | Purpose |
|------------|---------|
| Supabase | Database, Auth, Storage, Edge Functions |
| PostgreSQL | Primary database |
| PostGIS | Geospatial queries |
| Supabase Edge Functions | Serverless compute (Deno) |
| Vercel | Hosting, CDN, Edge Functions |

### External APIs

| API | Purpose | Auth |
|-----|---------|------|
| Google Maps Platform | Maps, Places, Geocoding | API Key |
| Google Imagen (Nano Banana) | AI image generation | API Key |
| Firecrawl | Web scraping | API Key |
| Anthropic Claude | AI extraction | API Key |
| Supabase | Backend services | API Key + JWT |

### Database Schema

```sql
-- Core tables
booths (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  coordinates GEOGRAPHY(POINT),

  -- Machine details
  machine_model TEXT,
  machine_year INTEGER,
  machine_manufacturer TEXT,
  machine_serial TEXT,
  booth_type TEXT, -- 'analog', 'chemical', 'digital', 'instant'
  photo_type TEXT, -- 'black-and-white', 'color', 'both'

  -- Operator
  operator_id UUID REFERENCES operators(id),
  operator_name TEXT,

  -- Photos
  photo_exterior_url TEXT,
  photo_interior_url TEXT,
  photo_sample_strips TEXT[],
  ai_preview_url TEXT,
  ai_preview_generated_at TIMESTAMP,

  -- Operational
  status TEXT DEFAULT 'unverified', -- 'active', 'unverified', 'inactive', 'closed'
  is_operational BOOLEAN DEFAULT true,
  hours TEXT,
  cost TEXT,
  accepts_cash BOOLEAN DEFAULT true,
  accepts_card BOOLEAN DEFAULT false,

  -- Content
  description TEXT,
  historical_notes TEXT,
  access_instructions TEXT,
  features TEXT[],

  -- Source tracking
  source_primary TEXT,
  source_urls TEXT[],
  source_verified_date TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_verified TIMESTAMP
);

-- Indexes
CREATE INDEX idx_booths_coordinates ON booths USING GIST(coordinates);
CREATE INDEX idx_booths_city ON booths(city);
CREATE INDEX idx_booths_country ON booths(country);
CREATE INDEX idx_booths_status ON booths(status);
CREATE INDEX idx_booths_operator ON booths(operator_id);

-- Operators
operators (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  story TEXT,
  founded_year INTEGER,
  city TEXT,
  country TEXT,
  instagram TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Machine models
machine_models (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  model_name TEXT NOT NULL,
  manufacturer TEXT,
  years_produced TEXT,
  description TEXT,
  notable_features TEXT[],
  photo_url TEXT,
  collector_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- City guides
city_guides (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  hero_image_url TEXT,
  estimated_time TEXT,
  booth_ids UUID[],
  route_polyline TEXT,
  tips TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User interactions
booth_bookmarks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  booth_id UUID REFERENCES booths(id),
  collection_id UUID REFERENCES collections(id),
  notes TEXT,
  visited BOOLEAN DEFAULT false,
  visited_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, booth_id)
);

booth_comments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  booth_id UUID REFERENCES booths(id),
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT NOW()
);

booth_user_photos (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  booth_id UUID REFERENCES booths(id),
  photo_url TEXT NOT NULL,
  caption TEXT,
  moderation_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

collections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crawler infrastructure
crawl_logs (
  id UUID PRIMARY KEY,
  source_id UUID,
  source_name TEXT,
  crawl_session_id UUID,
  operation_type TEXT,
  operation_status TEXT,
  pages_crawled INTEGER,
  booths_extracted INTEGER,
  booths_validated INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

page_cache (
  id UUID PRIMARY KEY,
  source_name TEXT,
  page_url TEXT,
  content_hash TEXT,
  html_content TEXT,
  markdown_content TEXT,
  crawled_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/booths` | GET | List booths with filters |
| `/api/booths/:id` | GET | Get booth details |
| `/api/booths/nearby` | GET | Get nearby booths |
| `/api/booths/search` | GET | Search booths |
| `/api/guides` | GET | List city guides |
| `/api/guides/:slug` | GET | Get guide details |
| `/api/operators` | GET | List operators |
| `/api/operators/:slug` | GET | Get operator details |
| `/api/user/bookmarks` | GET/POST/DELETE | Manage bookmarks |
| `/api/user/photos` | POST | Upload photo |
| `/api/admin/crawl` | POST | Trigger crawl |

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_IMAGEN_API_KEY=

# APIs
FIRECRAWL_API_KEY=
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://boothbeacon.org
```

---

## Success Metrics

### North Star Metric

**Monthly Active Users finding and saving booths**

### Key Performance Indicators

| Metric | Current | 3-Month | 12-Month |
|--------|---------|---------|----------|
| Monthly Active Users | ~100 | 1,000 | 10,000 |
| Booths in database | 700+ | 1,200 | 2,500 |
| Photo coverage | 40% | 70% | 90% |
| Google Maps saves | 0 | 500 | 5,000 |
| User-submitted photos | 0 | 100 | 1,000 |
| City guides published | 0 | 5 | 25 |
| Avg. session duration | - | 3 min | 5 min |
| Return visitor rate | - | 20% | 40% |

### SEO Goals

| Query | Goal |
|-------|------|
| "photo booth near me" | Top 10 |
| "analog photo booth [city]" | Top 5 |
| "vintage photo booth" | Top 10 |
| "[machine model] photo booth" | Top 3 |

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- [ ] Next.js project setup with App Router
- [ ] Supabase integration
- [ ] Design system implementation (Tailwind config, components)
- [ ] Google Maps integration
- [ ] Core pages: Home, Map, Booth Detail
- [ ] Basic booth listing and filtering

### Phase 2: Core Features (Weeks 3-4)

- [ ] Search with autocomplete
- [ ] Filter panel
- [ ] Booth detail page with all sections
- [ ] Save to Google Maps
- [ ] Mobile responsive layout

### Phase 3: AI & Images (Weeks 5-6)

- [ ] Nano Banana integration
- [ ] AI image generation pipeline
- [ ] Image optimization and CDN
- [ ] Photo gallery component

### Phase 4: Community (Weeks 7-8)

- [ ] User authentication
- [ ] Bookmarks and collections
- [ ] Photo upload
- [ ] Comments and ratings

### Phase 5: Content (Weeks 9-10)

- [ ] City guide pages
- [ ] Operator profiles
- [ ] Machine model guides
- [ ] SEO optimization

### Phase 6: Polish (Weeks 11-12)

- [ ] Performance optimization
- [ ] Analytics integration
- [ ] Error tracking
- [ ] Launch preparation

---

## Appendix

### A. Figma Design Tokens

```json
{
  "colors": {
    "primary": { "value": "#C73E3A" },
    "primary-dark": { "value": "#9A2E2B" },
    "secondary": { "value": "#F5F0E8" },
    "secondary-dark": { "value": "#E8E0D4" },
    "accent": { "value": "#D4A853" },
    "neutral": {
      "900": { "value": "#1A1A1A" },
      "700": { "value": "#404040" },
      "500": { "value": "#737373" },
      "300": { "value": "#D4D4D4" },
      "100": { "value": "#FAFAFA" }
    }
  },
  "typography": {
    "display": { "fontFamily": "Fraunces", "fontWeight": 600, "fontSize": 72 },
    "h1": { "fontFamily": "Fraunces", "fontWeight": 500, "fontSize": 40 },
    "h2": { "fontFamily": "Fraunces", "fontWeight": 500, "fontSize": 32 },
    "h3": { "fontFamily": "Inter", "fontWeight": 600, "fontSize": 24 },
    "body": { "fontFamily": "Inter", "fontWeight": 400, "fontSize": 16 }
  },
  "spacing": {
    "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32, "2xl": 48
  },
  "borderRadius": {
    "sm": 4, "md": 8, "lg": 12, "xl": 16, "full": 9999
  }
}
```

### B. Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C73E3A',
          dark: '#9A2E2B',
        },
        secondary: {
          DEFAULT: '#F5F0E8',
          dark: '#E8E0D4',
        },
        accent: '#D4A853',
        booth: {
          active: '#22C55E',
          unverified: '#F59E0B',
          inactive: '#EF4444',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        photo: '0 4px 20px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### C. Example Component Code

```tsx
// components/BoothCard.tsx
import { Booth } from '@/types';
import { MapPin, Camera, Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BoothCardProps {
  booth: Booth;
  onSave?: () => void;
}

export function BoothCard({ booth, onSave }: BoothCardProps) {
  const statusColors = {
    active: 'bg-booth-active',
    unverified: 'bg-booth-unverified',
    inactive: 'bg-booth-inactive',
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-photo overflow-hidden transition-transform hover:scale-[1.02]">
      {/* Image */}
      <div className="aspect-[4/3] relative">
        <img
          src={booth.photo_exterior_url || booth.ai_preview_url || '/placeholder-booth.jpg'}
          alt={booth.name}
          className="w-full h-full object-cover"
        />
        {booth.ai_preview_url && !booth.photo_exterior_url && (
          <Badge className="absolute bottom-2 right-2 bg-black/60">
            AI Preview
          </Badge>
        )}
        <Badge className={`absolute top-2 left-2 ${statusColors[booth.status]}`}>
          {booth.status}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display text-lg font-medium text-neutral-900 truncate">
          {booth.name}
        </h3>
        <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
          <MapPin className="w-4 h-4" />
          {booth.city}, {booth.country}
        </p>
        {booth.machine_model && (
          <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
            <Camera className="w-4 h-4" />
            {booth.machine_model}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button variant="default" size="sm" className="flex-1">
            View Details
          </Button>
          <Button variant="outline" size="icon" onClick={onSave}>
            <Bookmark className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

**Document History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-23 | Jascha | Initial roadmap |
| 2.0 | 2025-11-26 | Claude | Comprehensive PRD |
| 3.0 | 2025-11-26 | Claude | Complete rebuild spec with brand foundation |

---

*This document is designed to be a complete specification for rebuilding Booth Beacon from scratch. It can be provided to Vercel AI, Cursor, or any development team as a comprehensive blueprint.*
