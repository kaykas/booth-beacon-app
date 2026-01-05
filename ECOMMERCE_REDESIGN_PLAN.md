# E-Commerce Product Page Redesign - Booth Detail Pages

**Date:** January 4, 2026
**Inspiration:** Squarespace Altaloma template + professional e-commerce sites
**Goal:** Make booth pages feel like premium product detail pages

---

## 🎯 Core E-Commerce Principles to Apply

### 1. **Hero = Product Showcase**
E-commerce sites put the product front and center with:
- Large, high-quality images (often 50-60% of viewport)
- Product name immediately visible
- Price/key info at a glance
- Primary CTA ("Add to Cart") prominently placed
- Trust badges (ratings, reviews) visible

**For Booth Pages:**
- Full-width hero image (booth exterior photo or Street View)
- Booth name in large, elegant typography
- Status badges (Verified, Operational) prominent
- Primary CTA ("Get Directions") large and unmissable
- Location + hours visible immediately

### 2. **Clean Information Hierarchy**
E-commerce sites organize info in predictable sections:
- Above fold: Image + Name + Price + CTA
- Below: Description → Specifications → Reviews → Related
- Everything scannable with clear headings

**For Booth Pages:**
- **Above fold:** Photo + Name + Status + CTA
- **Section 1:** Description (story about the booth)
- **Section 2:** Details (machine type, cost, payment, hours)
- **Section 3:** Location & Directions
- **Section 4:** Community (photos, reviews)
- **Section 5:** More Booths (like "Related Products")

### 3. **Trust & Social Proof**
E-commerce sites build trust with:
- Customer reviews (5-star ratings)
- Number of reviews/purchases
- "Verified Purchase" badges
- Community photos
- Trust seals (secure checkout, etc.)

**For Booth Pages:**
- ⭐ Google rating + review count
- ✓ "Verified {X days} ago" badge
- Community photos with count
- User bookmarks/saves count
- Recent visitor activity

### 4. **Generous Whitespace**
E-commerce sites use whitespace to:
- Create breathing room
- Emphasize key elements
- Look premium and professional
- Improve readability

**For Booth Pages:**
- Increase padding between sections
- Use max-width containers (not edge-to-edge)
- Add subtle dividers between sections
- Use cards with shadows sparingly

### 5. **Mobile-First Responsive**
E-commerce sites ensure:
- Images scale beautifully
- CTAs remain accessible
- Content reflows logically
- Touch targets are large enough

**For Booth Pages:**
- Single-column layout on mobile
- Fixed CTA button at bottom (like "Add to Cart" sticky)
- Collapsible sections for details
- Swipeable image gallery

---

## 🎨 Specific Design Changes

### HERO SECTION REDESIGN

**Current Issues:**
- Split-screen layout feels cramped
- Too much competing information
- Image is only 50% width
- StatusBar is cluttered

**E-Commerce Approach:**
```
┌────────────────────────────────────┐
│                                    │
│     FULL-WIDTH IMAGE (60%)         │
│     (with subtle gradient overlay) │
│                                    │
└────────────────────────────────────┘
┌────────────────────────────────────┐
│  📍 San Francisco, CA              │
│                                    │
│  THE PARKSIDE                      │
│  (Large, elegant serif heading)    │
│                                    │
│  ⭐⭐⭐⭐☆ 4.2 (127 reviews)      │
│                                    │
│  ✓ Verified 3 days ago             │
│  🟢 Currently Open                 │
│  💵 $5 per strip • Cash Only       │
│                                    │
│  [Get Directions →] (Large CTA)    │
│  [Bookmark] [Share]                │
│                                    │
└────────────────────────────────────┘
```

### DETAILS SECTION

**E-Commerce Style:**
```
┌────────────────────────────────────┐
│  About This Booth                  │
│  ─────────────────                 │
│  Classic analog photo booth        │
│  tucked in the back corner...      │
│                                    │
│  Machine Details                   │
│  ─────────────────                 │
│  Type        Classic 4-strip       │
│  Machine     Photobooth 2000       │
│  Cost        $5 per strip          │
│  Payment     Cash only             │
│                                    │
│  Hours                             │
│  ─────────────────                 │
│  Mon-Thu  5PM - 12AM               │
│  Fri-Sat  5PM - 2AM                │
│  Sunday   Closed                   │
│                                    │
└────────────────────────────────────┘
```

### LOCATION SECTION

**E-Commerce Style (like "Store Location"):**
```
┌────────────────────────────────────┐
│  Location & Directions             │
│  ─────────────────────             │
│  ┌──────────────────┐              │
│  │                  │              │
│  │    MAP HERE      │              │
│  │                  │              │
│  └──────────────────┘              │
│                                    │
│  1415 18th Street                  │
│  San Francisco, CA 94107           │
│                                    │
│  📍 0.3 miles from you             │
│                                    │
│  [View in Google Maps →]           │
│  [Copy Address]                    │
│                                    │
└────────────────────────────────────┘
```

### COMMUNITY SECTION

**E-Commerce Style (like "Customer Reviews"):**
```
┌────────────────────────────────────┐
│  Community Photos                  │
│  ─────────────────────             │
│  [Photo] [Photo] [Photo] [+12]     │
│                                    │
│  Share your visit:                 │
│  [Upload Photo]                    │
│                                    │
└────────────────────────────────────┘
```

### RELATED BOOTHS

**E-Commerce Style (like "You Might Also Like"):**
```
┌────────────────────────────────────┐
│  More Booths in San Francisco      │
│  ───────────────────────────       │
│  ┌───┐  ┌───┐  ┌───┐  ┌───┐       │
│  │ A │  │ B │  │ C │  │ D │       │
│  └───┘  └───┘  └───┘  └───┘       │
│  Name   Name   Name   Name         │
│  $5     $8     $6     $5           │
│  ⭐4.2  ⭐4.5  ⭐4.0  ⭐3.8         │
│                                    │
└────────────────────────────────────┘
```

---

## 📋 Implementation Priority

### Phase 1: Hero Redesign (Highest Impact)
1. Change to full-width image hero
2. Add gradient overlay for text readability
3. Simplify status badges (just 2-3 key indicators)
4. Make "Get Directions" button MUCH larger
5. Add Google rating prominently

### Phase 2: Clean Layout
6. Remove sidebar completely (single column)
7. Organize into clear sections with headings
8. Add generous padding (py-16 between sections)
9. Use max-w-4xl container for content

### Phase 3: Typography & Spacing
10. Use larger, serif heading for booth name
11. Increase body text size (text-lg)
12. Add more whitespace everywhere
13. Use subtle divider lines between sections

### Phase 4: Mobile Optimization
14. Stack everything single-column
15. Make CTA sticky at bottom on mobile
16. Ensure images are full-width on mobile
17. Collapsible sections for dense info

---

## 🎨 Visual Design Guidelines

### Typography Scale (E-Commerce Style)
- **H1 (Booth Name):** 48px, Serif, Bold
- **H2 (Section Headers):** 32px, Sans, Semibold
- **H3 (Subsections):** 24px, Sans, Semibold
- **Body:** 18px, Sans, Regular
- **Small:** 14px, Sans, Regular

### Color Palette
- **Primary CTA:** Amber/Orange gradient (warm, inviting)
- **Text Primary:** #171717 (near black)
- **Text Secondary:** #525252 (mid gray)
- **Borders:** #E5E5E5 (light gray)
- **Backgrounds:** #FFFFFF (white), #FAFAFA (off-white)

### Spacing Scale
- **Section padding:** py-16 (64px vertical)
- **Card padding:** p-8 (32px all sides)
- **Element spacing:** space-y-6 (24px between)
- **Max width:** max-w-4xl (896px)

### Component Styles
- **Cards:** Minimal shadow, subtle border, rounded-xl
- **Buttons:** Large (px-8 py-4), rounded-lg, bold text
- **Images:** Aspect-ratio maintained, rounded corners
- **Icons:** 24px size, consistent stroke width

---

## 🧪 Before/After Comparison

| Element | Current | E-Commerce Style |
|---------|---------|------------------|
| Hero | Split-screen 50/50 | Full-width 70/30 |
| Booth name | 32px | 48px serif |
| CTA button | Medium, mixed with others | XL, isolated, prominent |
| Layout | 2-column sidebar | Single column, sectioned |
| Spacing | Inconsistent | Generous, systematic |
| Trust signals | Scattered | Prominent in hero |
| Related booths | Small cards | Large product cards |
| Mobile CTA | Hidden in header | Sticky at bottom |

---

## 📐 Technical Implementation

### New Component Structure
```
BoothDetailPage
├── FullWidthHero
│   ├── HeroImage (with gradient overlay)
│   ├── HeroContent (centered, max-w-4xl)
│   │   ├── Breadcrumb (location)
│   │   ├── BoothName (h1, serif)
│   │   ├── TrustBadges (rating, verified, status)
│   │   ├── KeyDetails (price, payment)
│   │   ├── PrimaryCTA (Get Directions)
│   │   └── SecondaryActions (Bookmark, Share)
│
├── ContentSections (max-w-4xl, mx-auto, space-y-16)
│   ├── AboutSection
│   ├── DetailsSection (machine, cost, hours)
│   ├── LocationSection (map, address, directions)
│   ├── CommunitySection (photos, reviews)
│   └── RelatedSection (nearby booths)
│
└── MobileStickyCTA (fixed bottom on mobile)
```

---

## ✅ Success Metrics

After implementing e-commerce redesign:
- [ ] Booth name is 1.5x larger (48px vs 32px)
- [ ] "Get Directions" CTA is 2x more prominent
- [ ] Hero image takes 60%+ of viewport on desktop
- [ ] Single-column layout reduces cognitive load
- [ ] Sections have 64px vertical padding (py-16)
- [ ] Google rating visible in hero
- [ ] Mobile CTA is sticky at bottom
- [ ] Overall design feels premium and trustworthy

---

**Next Steps:**
1. Create new FullWidthHero component
2. Refactor page.tsx to use single-column layout
3. Redesign related booths section to feel like product cards
4. Test on actual booth pages
