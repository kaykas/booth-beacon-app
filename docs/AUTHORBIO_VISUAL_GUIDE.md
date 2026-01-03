# AuthorBio Component - Visual Guide

Visual reference for the AuthorBio component variants and styling.

---

## Variant Comparison

### Full Variant (`variant="full"`)

**Dimensions:** Full width container, 128px photo
**Use Case:** About page, team pages

```
╔═══════════════════════════════════════════════════════════════════════╗
║                      CARD-VINTAGE BACKGROUND                          ║
║  ╭─────────────╮  ┌─────────────────────────────────────────────┐   ║
║  │             │  │ Jascha Kaykas-Wolff                         │   ║
║  │   Photo     │  │ Founder & Curator                           │   ║
║  │   128x128   │  │                                             │   ║
║  │             │  │ Jascha is a passionate advocate for analog  │   ║
║  │   [Image]   │  │ photography and the creator of Booth Beacon.│   ║
║  │             │  │ With expertise in photo booth curation,     │   ║
║  │   Ring:     │  │ geographic directories, and community       │   ║
║  │   Primary   │  │ building, he has assembled the world's most │   ║
║  ╰─────────────╯  │ comprehensive directory...                  │   ║
║                    │                                             │   ║
║                    │ AREAS OF EXPERTISE                          │   ║
║                    │ [Photo Booth Curation] [Analog Photography] │   ║
║                    │ [Geographic Directories] [UX Design]        │   ║
║                    │ [Community Building]                        │   ║
║                    │                                             │   ║
║                    │ [📷 Instagram] [💻 GitHub] [🌐 Website]   │   ║
║                    │                                             │   ║
║                    │ ─────────────────────────────────────────── │   ║
║                    │ Creator of Booth Beacon, the world's most   │   ║
║                    │ comprehensive directory with 1000+ locations│   ║
║                    └─────────────────────────────────────────────┘   ║
╚═══════════════════════════════════════════════════════════════════════╝
```

**Colors:**
- Background: Card Vintage (dark with pink border)
- Text: Foreground (cream white)
- Name: Text-2xl, Font-Display, Bold
- Title: Text-Primary (pink-purple)
- Badges: Badge-Retro (pink with glow)
- Links: Hover effect to primary color

---

### Compact Variant (`variant="compact"`)

**Dimensions:** Full width container, 64px photo
**Use Case:** Guide pages, blog posts

```
╔═════════════════════════════════════════════════════════════╗
║           CARD-VINTAGE BACKGROUND (COMPACT)                 ║
║  ╭────────╮  ┌──────────────────────────────────────────┐  ║
║  │        │  │ Jascha Kaykas-Wolff                      │  ║
║  │ Photo  │  │ Founder & Curator                        │  ║
║  │ 64x64  │  │                                          │  ║
║  │[Image] │  │ Jascha is a passionate advocate for      │  ║
║  ╰────────╯  │ analog photography... (2 lines max)      │  ║
║              │                                          │  ║
║              │ [📷] [💻] [🌐]                          │  ║
║              └──────────────────────────────────────────┘  ║
╚═════════════════════════════════════════════════════════════╝
```

**Features:**
- Horizontal layout (photo left, content right)
- Bio truncated to 2 lines (`line-clamp-2`)
- Icon-only social links (no labels)
- No expertise badges (space-saving)

---

### Minimal Variant (`variant="minimal"`)

**Dimensions:** Inline, 48px photo
**Use Case:** Article bylines, comments

```
┌─────────────────────────────────────┐
│ ╭────╮  Jascha Kaykas-Wolff        │
│ │[📷]│  Photo Booth Curation        │
│ ╰────╯                              │
└─────────────────────────────────────┘
```

**Features:**
- Inline horizontal layout
- 48px circular photo
- Name + single expertise line
- No social links
- Minimal spacing

---

## Color Palette

### From globals.css

```css
/* Primary Colors */
--primary: 320 65% 58%;          /* Pink-purple #D961B8 */
--primary-dark: 320 65% 48%;     /* Darker pink #C43FA0 */

/* Background */
--background: 0 0% 7%;            /* Deep charcoal #121212 */
--card: 0 0% 10%;                 /* Card background #1A1A1A */

/* Text */
--foreground: 40 15% 92%;         /* Cream white #EEEBE7 */
--muted-foreground: 40 8% 65%;    /* Muted text #A39D97 */

/* Effects */
--shadow-glow: 0 0 30px hsl(320 65% 58% / 0.4);  /* Pink glow */
```

### Applied to AuthorBio

- **Card Background:** `card-vintage` class
  - Base: `hsl(0 0% 10%)`
  - Border: `1px solid hsl(320 65% 58% / 0.1)`
  - Subtle gradient overlay with pink tint

- **Photo Ring:** `ring-2 ring-primary/30`
  - Pink-purple ring at 30% opacity

- **Name Text:** `text-foreground`
  - Cream white for high contrast

- **Title Text:** `text-primary`
  - Pink-purple brand color

- **Badges:** `badge-retro` class
  - Background: `hsl(320 65% 58% / 0.15)`
  - Border: `1px solid hsl(320 65% 58% / 0.3)`
  - Text: `hsl(320 65% 68%)`
  - Box shadow with pink glow

---

## Typography

### Font Families (from globals.css)

```css
--font-sans: "Inter", system-ui, sans-serif;     /* Body text */
--font-display: "Fraunces", serif;               /* Headings */
--font-mono: "JetBrains Mono", monospace;        /* Code */
```

### Applied in AuthorBio

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Name (Full) | Fraunces | 2xl-3xl | Bold | Foreground |
| Name (Compact) | Inter | lg | Semibold | Foreground |
| Name (Minimal) | Inter | sm | Semibold | Foreground |
| Title | Inter | lg/sm/xs | Medium | Primary |
| Bio | Inter | base/sm | Normal | Muted |
| Badges | Inter | sm | Medium | Primary-light |
| Links | Inter | sm | Normal | Foreground |

---

## Spacing & Layout

### Full Variant
```
Padding: 32px (p-8)
Gap: 24px (gap-6)
Photo: 128x128px, rounded-2xl
Name margin-bottom: 8px (mb-2)
Bio margin-bottom: 24px (mb-6)
Expertise margin-bottom: 24px (mb-6)
Badge gap: 8px (gap-2)
Link gap: 16px (gap-4)
```

### Compact Variant
```
Padding: 24px (p-6)
Gap: 16px (gap-4)
Photo: 64x64px, rounded-full
Name margin-bottom: 4px (mb-1)
Bio margin-bottom: 8px (mb-2)
Link gap: 12px (gap-3)
```

### Minimal Variant
```
Padding: None (inline)
Gap: 12px (gap-3)
Photo: 48x48px, rounded-full
No margins (compact inline)
```

---

## Responsive Behavior

### Breakpoints

```css
/* Mobile (default) */
< 768px: Stack vertically, center photo

/* Tablet (md) */
>= 768px: Side-by-side layout, photo left

/* Desktop (lg) */
>= 1024px: Optimized spacing, larger text
```

### Full Variant Responsive

**Mobile:**
```
┌─────────────────────┐
│   ╭─────────────╮   │
│   │   [Photo]   │   │
│   ╰─────────────╯   │
│                     │
│  Jascha Kaykas-W.   │
│  Founder & Curator  │
│  [Bio...]           │
│  [Badges...]        │
│  [Links...]         │
└─────────────────────┘
```

**Desktop:**
```
┌───────────────────────────────────────┐
│ ╭─────╮  Jascha Kaykas-Wolff         │
│ │Photo│  Founder & Curator            │
│ ╰─────╯  [Bio...]                     │
│          [Badges...] [Links...]       │
└───────────────────────────────────────┘
```

---

## Schema.org Markup Location

The Schema.org Person structured data is injected via Next.js `<Script>` component:

```tsx
<Script
  id="author-schema-full"  // or "compact" / "minimal"
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
/>
```

**Placement:** End of component (invisible to users)
**Format:** JSON-LD in script tag
**Validation:** Use Google Rich Results Test

---

## Data-AI Attributes

### Full Variant
```html
<div
  data-ai-section="author-info"
  data-ai-type="credentials"
  data-ai-importance="high"
>
```

### Compact Variant
```html
<div
  data-ai-section="author-info"
  data-ai-type="credentials"
  data-ai-importance="medium"
>
```

### Minimal Variant
```html
<div>  <!-- No data-AI attributes for minimal -->
```

---

## Interactive States

### Social Links

**Default:**
- Color: `text-muted-foreground` (#A39D97)
- Border: `border-primary/20` (subtle pink)
- Background: `bg-card`

**Hover:**
- Color: `text-primary` (pink-purple)
- Border: `border-primary/40` (stronger pink)
- Icon scale: 110% (`group-hover:scale-110`)
- Transition: 150ms ease

**Focus:**
- Outline ring: `focus:ring-2 focus:ring-primary`
- Keyboard accessible

### Expertise Badges

**Default:**
- Background: `badge-retro` (pink tint)
- Glow: Subtle pink shadow

**No hover state** (non-interactive)

---

## Image Handling

### Next.js Image Configuration

```tsx
<Image
  src={author.photo || '/images/placeholder-author.jpg'}
  alt={`${author.name} - ${author.title}`}
  fill  // Responsive fill
  className="object-cover"
  sizes="(max-width: 768px) 128px, 128px"  // Optimize loading
  priority  // LCP optimization for full variant
/>
```

### Fallback Strategy

1. Use provided `author.photo`
2. Fallback to `/images/placeholder-author.jpg`
3. Alt text always includes name and title
4. Images use object-cover for consistent framing

---

## Accessibility Features

### ARIA Labels

All social links have descriptive ARIA labels:

```tsx
<a
  href={author.socialLinks.instagram}
  aria-label={`${author.name} on Instagram`}
>
  <Instagram />
</a>
```

### Semantic HTML

```html
<div>  <!-- Container -->
  <h2>Name</h2>  <!-- Proper heading hierarchy -->
  <p>Title</p>
  <p>Bio</p>
  <h3>Areas of Expertise</h3>
  <div>Badges</div>
  <div>Social links</div>
</div>
```

### Keyboard Navigation

- All links are keyboard accessible (Tab key)
- Focus indicators visible on all interactive elements
- Skip link compatible (component doesn't trap focus)

---

## Print Styles (Future Enhancement)

Consider adding print-specific styles:

```css
@media print {
  .author-bio {
    page-break-inside: avoid;  /* Keep together */
  }

  .author-bio a::after {
    content: " (" attr(href) ")";  /* Print URLs */
  }

  .badge-retro {
    border: 1px solid #000;  /* Visible in B&W */
  }
}
```

---

## Performance Considerations

### Image Optimization
- Use Next.js Image component (automatic WebP)
- Specify `sizes` attribute for responsive loading
- Use `priority` on above-the-fold instances
- Lazy load below-the-fold instances

### Schema.org Script
- Next.js Script component handles optimal loading
- JSON-LD doesn't block rendering
- No external API calls

### CSS
- Uses Tailwind JIT (no unused CSS)
- Custom classes are pre-compiled
- No runtime CSS generation

---

## Testing Viewport Sizes

| Device | Width | Expected Layout |
|--------|-------|-----------------|
| iPhone SE | 375px | Stacked, centered photo |
| iPhone 12 | 390px | Stacked, centered photo |
| iPad Mini | 768px | Side-by-side (compact only) |
| iPad Pro | 1024px | Side-by-side, larger spacing |
| Desktop | 1440px | Full width, optimal spacing |

---

## Common Issues & Solutions

### Issue: Photo Not Loading
**Solution:** Verify path exists, check Next.js Image configuration in `next.config.mjs`

### Issue: Schema Not Appearing
**Solution:** View page source (not inspect element), search for "application/ld+json"

### Issue: Badges Overflowing
**Solution:** Ensure `flex-wrap` is applied, adjust `gap-2` if needed

### Issue: Dark Theme Not Working
**Solution:** Verify globals.css is imported in root layout

### Issue: Social Icons Too Small on Mobile
**Solution:** Use `w-5 h-5` (20px) minimum for touch targets

---

**Last Updated:** January 2, 2026
**Component Version:** 1.0.0
