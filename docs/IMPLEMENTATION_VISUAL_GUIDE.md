# Priority 3 Implementation - Visual Guide

## Photo Quality Indicators

### Badge Styles

#### 1. Community Photo Badge (Real Photos)
```
┌────────────────────────────────────┐
│                                    │
│      [Booth Photo Image]           │
│                                    │
│                ┌──────────────────┐│
│                │📸 Community Photo││ ← Green bg-green-600/90
│                └──────────────────┘│
└────────────────────────────────────┘
```

#### 2. AI Generated Badge
```
┌────────────────────────────────────┐
│                                    │
│    [AI-Generated Image]            │
│                                    │
│                ┌─────────────────┐ │
│                │🤖 AI Generated  │ │ ← Purple bg-purple-600/90
│                └─────────────────┘ │
└────────────────────────────────────┘
```

#### 3. AI Preview Badge
```
┌────────────────────────────────────┐
│                                    │
│      [AI Preview Image]            │
│                                    │
│                ┌────────────────┐  │
│                │  AI Preview    │  │ ← Black bg-black/70
│                └────────────────┘  │
└────────────────────────────────────┘
```

### Badge Properties
- **Position:** Bottom-right corner (absolute bottom-2 right-2)
- **Typography:** Extra small text (text-xs)
- **Background:** Semi-transparent with backdrop blur
- **Shadow:** Subtle shadow for depth
- **Z-index:** 10 (above image)
- **Padding:** px-2 py-1
- **Border radius:** rounded

---

## Report Issue Dialog

### Closed State (Before Click)
```
┌─────────────────────────────────────┐
│  🚩 Report an Issue                 │
│                                     │
│  Help us keep information accurate. │
│  Report closed booths, incorrect    │
│  details, or inappropriate content. │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Report Issue           │   │ ← Button
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Open State (Dialog)
```
┌──────────────────────────────────────────────┐
│  Report an Issue                         [×] │
│  ─────────────────────────────────────────── │
│  Help us keep information about "Booth       │
│  Name" accurate and up-to-date.              │
│                                              │
│  What's the issue?                           │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 🚫 Booth is Closed/Removed         ✓  │ │ ← Selected
│  │ This booth no longer exists...         │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ ⚠️  Information is Incorrect            │ │
│  │ Hours, address, cost, or other...      │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 📷 Photo is Inappropriate               │ │
│  │ Photo is offensive, incorrect...       │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 🚩 Other Issue                          │ │
│  │ Something else needs attention         │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Additional details (optional)               │
│  ┌────────────────────────────────────────┐ │
│  │ Provide any additional info...         │ │
│  │                                        │ │
│  │                                        │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ─────────────────────────────────────────── │
│                    [Cancel] [Submit Report] │
└──────────────────────────────────────────────┘
```

### Success State
```
┌──────────────────────────────────────────────┐
│                                          [×] │
│                                              │
│              ┌────────────┐                  │
│              │     ✓      │ ← Green circle   │
│              └────────────┘                  │
│                                              │
│          Report Submitted!                   │
│                                              │
│  Thank you for helping us keep Booth         │
│  Beacon accurate. We'll review your          │
│  report soon.                                │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Layout Integration

### Booth Detail Page - Sidebar
```
┌────────────────────────────────────┐
│  Contact Information               │
│  ├─ Phone                           │
│  ├─ Website                         │
│  └─ Instagram                       │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Location                          │
│  [Map]                             │
│  Address details...                │
│  [Copy Address] [Google Maps]      │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Social Proof                      │
│  ❤️  42 favorites                  │
│  👁️  1,234 views                   │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Visit Checklist                   │
│  ✓ Bring $5 in cash               │
│  ⚠️ Call ahead if traveling far    │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  🚩 Report an Issue           ← NEW │
│                                    │
│  Help us keep information...       │
│                                    │
│  [Report Issue]                    │
└────────────────────────────────────┘
```

---

## Color Scheme

### Photo Quality Badges
| Badge Type | Background | Text | Emoji |
|-----------|-----------|------|-------|
| Community Photo | bg-green-600/90 | White | 📸 |
| AI Generated | bg-purple-600/90 | White | 🤖 |
| AI Preview | bg-black/70 | White | None |

### Issue Type Icons
| Issue Type | Icon | Color |
|-----------|------|-------|
| Closed/Removed | 🚫 | text-red-600 |
| Incorrect Info | ⚠️ | text-orange-600 |
| Inappropriate Photo | 📷 | text-purple-600 |
| Other | 🚩 | text-neutral-600 |

### States
| State | Background | Border |
|-------|-----------|--------|
| Unselected | border-neutral-200 | hover:border-neutral-300 |
| Selected | border-primary bg-primary/5 | shadow-sm |
| Loading | opacity-50 | cursor-not-allowed |

---

## Responsive Behavior

### Mobile (< 640px)
- Badges maintain size and position
- Dialog takes full width with margin
- Issue type buttons stack vertically
- Single column layout

### Tablet (640px - 1024px)
- Badges same as mobile
- Dialog max-width: 28rem (sm:max-w-lg)
- Grid layout for issue buttons possible
- Sidebar below main content

### Desktop (> 1024px)
- Badges same as mobile
- Dialog centered with max-width
- Grid layout for issue buttons (could be 2 columns)
- Sidebar right of main content

---

## Accessibility

### Photo Quality Badges
- ✓ Color contrast meets WCAG AA (white on dark backgrounds)
- ✓ Text labels in addition to emoji icons
- ✓ Z-index ensures visibility
- ⚠️ Could add aria-label for screen readers (future)

### Report Issue Dialog
- ✓ Keyboard navigable (Tab, Enter, Escape)
- ✓ Focus management (auto-focus on open)
- ✓ Screen reader friendly headings
- ✓ Button states clear (disabled, loading)
- ✓ Error messages announced
- ✓ Success confirmation

### Best Practices Applied
- Semantic HTML
- ARIA labels where needed
- Focus trap in dialog
- Keyboard shortcuts (Escape to close)
- Loading states prevent double submission
- Clear error messages

---

## Animation & Transitions

### Photo Quality Badges
- **Appear:** Fade in with image load
- **No animation** on hover (static)
- **Z-index:** Always on top of image

### Report Issue Dialog
- **Open:** Zoom in + fade in (200ms)
- **Close:** Zoom out + fade out (200ms)
- **Button hover:** Subtle scale (hover:scale-102)
- **Selection:** Border color transition (150ms)
- **Success:** Fade in checkmark with scale

### Loading States
- **Spinner:** Rotate animation (animate-spin)
- **Button:** Disabled opacity (opacity-50)
- **Cursor:** Not-allowed cursor

---

## Database Visualization

### booth_issues Table Relationships
```
┌─────────────────┐
│     booths      │
│─────────────────│
│  id (PK)        │◄────────┐
│  name           │         │
│  slug           │         │
│  ...            │         │
└─────────────────┘         │
                            │
                            │ booth_id (FK)
                            │
┌─────────────────────────────────────┐
│         booth_issues                │
│─────────────────────────────────────│
│  id (PK)                            │
│  booth_id (FK) ─────────────────────┘
│  user_id (FK) ──────────────┐
│  issue_type                 │
│  description                │
│  status                     │
│  created_at                 │
│  updated_at                 │
│  resolved_at                │
│  admin_notes                │
│  resolved_by (FK)           │
└─────────────────────────────┘
         │                │
         │                └─────────┐
         │                          │
         │                          │
         │                          ▼
┌────────▼──────────┐    ┌──────────────────┐
│   auth.users      │    │   auth.users     │
│───────────────────│    │──────────────────│
│  id (PK)          │    │  id (PK)         │
│  email            │    │  (Admin user)    │
│  ...              │    │                  │
└───────────────────┘    └──────────────────┘
     Reporter                Resolver
```

### Issue Type Distribution (Example)
```
Closed/Removed:       ████████░░ (42%)
Incorrect Info:       ██████░░░░ (31%)
Inappropriate Photo:  ███░░░░░░░ (15%)
Other:                ██░░░░░░░░ (12%)
```

### Status Flow
```
pending → reviewed → resolved
   │                    │
   └─────────► dismissed
```

---

## Testing Scenarios

### Photo Quality Indicators Test Cases
1. ✓ Booth with real photo shows green badge
2. ✓ Booth with AI image shows purple badge
3. ✓ Booth with AI preview shows black badge
4. ✓ Booth with no image shows placeholder (no badge)
5. ✓ Badge visible on hero images
6. ✓ Badge visible on card images
7. ✓ Badge visible on thumbnail images

### Report Issue Test Cases
1. ✓ Anonymous user can open dialog
2. ✓ Authenticated user can open dialog
3. ✓ All issue types selectable
4. ✓ Submit disabled without selection
5. ✓ Submit enabled with selection
6. ✓ Description optional
7. ✓ Loading state during submission
8. ✓ Success message after submission
9. ✓ Dialog closes automatically
10. ✓ Toast notification shown
11. ✓ Database record created
12. ✓ user_id null for anonymous
13. ✓ user_id set for authenticated
14. ✓ Validation prevents empty type

---

## Performance Considerations

### Photo Quality Badges
- **Bundle size:** Minimal (inline components)
- **Render cost:** Low (conditional rendering)
- **No external dependencies:** Pure CSS + inline SVG emoji
- **No network requests:** All static

### Report Issue System
- **Bundle size:** ~8KB (Dialog + Button + dependencies)
- **Code splitting:** Client component (not in initial bundle)
- **Database impact:** Single INSERT per submission
- **Network:** One API call per submission
- **Caching:** No caching needed (transactional)

### Optimization Opportunities
- Lazy load dialog component (done via 'use client')
- Debounce textarea input (not critical)
- Batch analytics (track submission rates)
- Index optimization (already included in migration)

---

## Monitoring & Analytics

### Metrics to Track
1. **Photo Quality Badges**
   - Badge impression rate per image type
   - User confusion reports (should decrease)

2. **Report Issue System**
   - Submissions per day/week
   - Issue type distribution
   - Resolution time by type
   - Anonymous vs authenticated ratio
   - Booths with multiple reports

### Success Criteria
- ✓ Badge visibility > 95%
- ✓ Report submission rate > 0.5% of booth views
- ✓ Valid report rate > 80%
- ✓ Average resolution time < 7 days
- ✓ User satisfaction with transparency

---

**Visual Guide Last Updated:** December 20, 2025
**For:** Priority 3 Implementation
**Version:** 1.0
