# ContentFreshness Component - Visual Reference

## Component Output Examples

### Recent Updates (≤30 days)
```
✓ Last Updated: 2 days ago
✓ Last Updated: 3 weeks ago
✓ Database Updated: 5 hours ago
✓ Listing Updated: just now
```

### Older Updates (>30 days)
```
✓ Last Updated: January 3, 2026
✓ Last Updated: December 15, 2025
✓ Content Reviewed: November 1, 2025
```

---

## Visual Styling

### Color Scheme (Vintage Theme)
- **Checkmark (✓):** Vintage amber (`hsl(35 90% 60%)`)
- **Label ("Last Updated:"):** Dark brown text (`hsl(30 30% 25%)`)
- **Date/Time Value:** Medium brown text (`hsl(30 20% 40%)`)

### Typography
- **Font Size:** Small (text-sm class, typically 14px)
- **Label Weight:** Semi-bold (font-semibold)
- **Layout:** Inline flex with 2px gap between icon and text

---

## HTML Output

### Example 1: Recent Update
```html
<div class="content-freshness inline-flex items-center gap-2 text-sm text-vintage-text-secondary" role="contentinfo" aria-label="Last Updated: 2 days ago">
  <span class="text-vintage-amber font-bold" aria-hidden="true">✓</span>
  <p class="m-0">
    <strong class="font-semibold text-vintage-text">Last Updated:</strong>
    <time 
      datetime="2026-01-01T10:00:00.000Z" 
      class="text-vintage-text-secondary"
      title="January 1, 2026 at 10:00 AM EST"
    >
      2 days ago
    </time>
  </p>
</div>
```

### Example 2: Older Update
```html
<div class="content-freshness inline-flex items-center gap-2 text-sm text-vintage-text-secondary text-xs" role="contentinfo" aria-label="Listing Updated: December 1, 2025">
  <span class="text-vintage-amber font-bold" aria-hidden="true">✓</span>
  <p class="m-0">
    <strong class="font-semibold text-vintage-text">Listing Updated:</strong>
    <time 
      datetime="2025-12-01T08:00:00.000Z" 
      class="text-vintage-text-secondary"
      title="December 1, 2025 at 8:00 AM EST"
    >
      December 1, 2025
    </time>
  </p>
</div>
```

---

## Placement Locations

### 1. Homepage (src/app/page.tsx)
**Location:** Below the stats section in the hero area

**Visual Context:**
```
┌─────────────────────────────────────┐
│          Photo Booths               │
│              912                    │
├─────────────────────────────────────┤
│          Countries                  │
│             15+                     │
├─────────────────────────────────────┤
│         Operational                 │
│             248                     │
└─────────────────────────────────────┘

   ✓ Database Updated: 2 days ago    ← ContentFreshness
```

**CSS Classes Applied:**
```tsx
className="text-xs opacity-75 hover:opacity-100 transition-opacity"
```

**Characteristics:**
- Smaller text (text-xs)
- Subtle opacity (75%) that increases on hover
- Smooth transition effect
- Centered alignment

---

### 2. Booth Detail Page (src/app/booth/[slug]/page.tsx)
**Location:** In the "Visit Info" section (right sidebar)

**Visual Context:**
```
┌────────────────────────────────────┐
│ Visit Info                         │
├────────────────────────────────────┤
│ 💵 Cost: $5.00                     │
│ 🕐 Hours: 9 AM - 5 PM              │
│ 💳 Payment: Cash, Card             │
├────────────────────────────────────┤ ← Border separator
│ ✓ Listing Updated: 5 days ago      │ ← ContentFreshness
└────────────────────────────────────┘
```

**CSS Classes Applied:**
```tsx
className="text-xs"
```

**Container Styling:**
```tsx
<div className="mt-4 pt-4 border-t border-neutral-200">
  <ContentFreshness ... />
</div>
```

**Characteristics:**
- Small text (text-xs)
- Top margin and padding (mt-4 pt-4)
- Border separator above (border-t)
- Left-aligned

---

## Responsive Behavior

### Mobile (< 640px)
- Component stacks inline naturally
- Text wraps if needed
- Icon stays aligned with first line

### Tablet (640px - 1024px)
- Same as mobile
- More breathing room

### Desktop (> 1024px)
- Full inline layout
- Maximum readability

---

## Interaction States

### Default State
```
✓ Last Updated: 2 days ago
```
- Normal opacity (or 75% on homepage)
- Standard color scheme

### Hover State (Homepage only)
```
✓ Database Updated: 2 days ago  ← Opacity increases to 100%
```
- Smooth transition (300ms default)
- Full opacity reveals prominence

### Focus State (Keyboard Navigation)
- Outline visible on time element
- Accessible via tab key

---

## Browser Rendering

### Modern Browsers (Chrome, Firefox, Safari, Edge)
- Full support for semantic HTML
- Native date formatting
- Proper tooltip display

### Screen Readers
- Reads: "content info, Last Updated: 2 days ago"
- Checkmark hidden from announcement (aria-hidden="true")
- Time element provides machine-readable date

### Print Styling
- Renders as plain text
- Date remains visible
- Icon may not print depending on font

---

## Dark Mode Considerations

The vintage theme colors are designed to work on both light and dark backgrounds:

### On Light Background (Homepage Hero)
- Amber checkmark stands out
- Dark brown text readable
- Good contrast ratio (WCAG AA compliant)

### On White Background (Booth Detail)
- Maximum contrast
- All elements clearly visible
- Professional appearance

---

## Accessibility Details

### ARIA Attributes
```html
role="contentinfo"
aria-label="Last Updated: 2 days ago"
aria-hidden="true" (on icon only)
```

### Keyboard Navigation
- Not focusable by default (informational only)
- Time element can receive focus in some browsers

### Screen Reader Experience
1. Announces: "content info"
2. Reads label: "Last Updated:"
3. Reads time: "2 days ago"
4. Skips checkmark (aria-hidden)

---

## Testing Tips

### Visual Testing
1. Check amber checkmark color (#E9A73B approximately)
2. Verify text contrast ratios
3. Test on different screen sizes
4. Verify hover effects (homepage)

### Functional Testing
1. Test with various date ranges:
   - Today: "just now"
   - Yesterday: "1 day ago"
   - Last week: "7 days ago"
   - 30 days: "30 days ago" (boundary)
   - 31 days: "January 1, 2026" (switches to absolute)
   - Last year: "December 1, 2024"

2. Test edge cases:
   - Invalid dates (should return null)
   - Future dates (shows "in X days")
   - Very old dates (proper formatting)

### Browser Testing
```bash
# Inspect element to verify:
- <time> element present
- dateTime attribute correct
- ISO 8601 format used
- title attribute shows full timestamp
```

---

## Common Issues & Solutions

### Issue: Date shows as "Invalid Date"
**Cause:** Malformed date string passed to component
**Solution:** Component handles this gracefully and returns null

### Issue: Checkmark not visible
**Cause:** Font doesn't support Unicode ✓ character
**Solution:** Use emoji or SVG icon as fallback

### Issue: Wrong color scheme
**Cause:** Tailwind classes not matching CSS variables
**Solution:** Use correct token names from globals.css

---

## Performance Notes

### Bundle Size Impact
- Component: ~1KB minified
- Dependencies: date-fns already included
- Total impact: Negligible

### Render Performance
- Client-side component ('use client')
- Fast date calculations (<1ms)
- No API calls or heavy operations

### Caching Behavior
- Rendered with page via ISR
- Revalidates every 3600 seconds (1 hour)
- No real-time updates needed

---

**Last Updated:** January 2, 2026
**Component Version:** 1.0.0
**Design System:** Booth Beacon Vintage Theme
