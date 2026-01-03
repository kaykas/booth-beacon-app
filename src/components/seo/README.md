# SEO Components

This directory contains components specifically designed for SEO, AI discoverability, and trust building.

## TrustSignals Component

The `TrustSignals` component displays trust indicators and verification badges to build user confidence and establish credibility. It's designed to be used in footers, about pages, and other key user-facing pages.

### Features

- **Data Verification Badges**: Shows 1,200+ verified booths count
- **Community-Driven Badge**: Highlights user contributions
- **Data Sources Transparency**: Displays 46 data sources
- **Worldwide Coverage Badge**: Emphasizes global reach
- **Privacy & Legal Links**: Links to privacy policy, terms, and data sources
- **User Content Disclaimer**: Clear disclosure about data collection methods
- **AI Extraction Notice**: Transparency about AI-powered data enhancement
- **Vintage Aesthetic**: Matches site's amber/orange color scheme with hover effects

### Usage

#### Full Version (Footer)

```tsx
import { TrustSignals } from '@/components/seo/TrustSignals';

<TrustSignals variant="full" />
```

#### Compact Version (Inline)

```tsx
<TrustSignals variant="compact" inline />
```

#### Custom Configuration

```tsx
<TrustSignals
  variant="full"
  boothCount={1250}
  sourceCount={48}
  className="mt-8"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'full' \| 'compact'` | `'full'` | Display variant |
| `boothCount` | `number` | `1200` | Number of verified booths |
| `sourceCount` | `number` | `46` | Number of data sources |
| `inline` | `boolean` | `false` | Show as inline badges |
| `className` | `string` | `''` | Additional CSS classes |

### Exports

#### `TrustSignals`

Main component for displaying trust signals with badges and legal links.

#### `TrustBadge`

Compact inline badge for use in content areas:

```tsx
import { TrustBadge } from '@/components/seo/TrustSignals';

<TrustBadge label="1,200+ Verified Booths" />
<TrustBadge icon={Shield} label="Community-Driven" />
```

#### `VerifiedMetric`

Data verification indicator for specific metrics:

```tsx
import { VerifiedMetric } from '@/components/seo/TrustSignals';

<VerifiedMetric value="1,200+" label="verified photo booths" />
```

### Examples

See `TrustSignals.examples.tsx` for complete usage examples including:

1. Footer with trust signals
2. About page with compact signals
3. Homepage hero with badges
4. Statistics section with verified metrics
5. Booth detail page footer
6. User contribution form
7. Map page layout
8. Search results page
9. API documentation page
10. Mobile-optimized footer

### Design System

The component uses the vintage amber/orange aesthetic defined in `globals.css`:

- **Primary Gradient**: `from-vintage-amber to-vintage-orange`
- **Hover Effects**: Amber glow on hover with border transitions
- **Icons**: Lucide React icons with consistent sizing
- **Typography**: Matches site's font hierarchy
- **Spacing**: Consistent with existing components

### Integration

The component has been integrated into:

- **Footer** (`/src/components/layout/Footer.tsx`): Full variant
- More integrations can be added as needed

### Legal Page Requirements

The component links to the following pages that should be created:

- `/privacy` - Privacy policy page
- `/terms` - Terms of service page
- `/data-sources` - Data sources transparency page

These routes should be created to ensure all links function properly.

### Accessibility

- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- Proper color contrast ratios
- Screen reader friendly text

### SEO Benefits

1. **Trust Building**: Verification badges build user confidence
2. **Transparency**: Clear disclosure of data sources and methods
3. **Legal Compliance**: Easy access to privacy and terms pages
4. **AI Discoverability**: Structured data about verification and sources
5. **User Engagement**: Professional appearance increases trust

### Customization

To customize the component:

1. **Colors**: Modify vintage-amber/orange colors in `globals.css`
2. **Icons**: Replace Lucide icons with custom SVGs
3. **Copy**: Update text directly in the component
4. **Layout**: Adjust grid columns and spacing via className prop
5. **Badges**: Add new badges by extending the component

### Performance

- Client-side component (`'use client'`)
- Minimal bundle size (uses tree-shaken Lucide icons)
- No external dependencies beyond React and Next.js
- CSS classes utilize existing Tailwind utilities

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Progressive enhancement for older browsers
- Mobile responsive design
- Touch-friendly tap targets

---

## StructuredData Component

See `StructuredData.tsx` for JSON-LD structured data components that help search engines and AI assistants understand booth information.

### Available Components

- `BoothStructuredData`: Booth-specific structured data
- `MapStructuredData`: Map page structured data
- `OrganizationStructuredData`: Organization/brand information
- `BreadcrumbStructuredData`: Navigation breadcrumbs

---

## Future Enhancements

Potential improvements for this directory:

1. **Dynamic Booth Count**: Fetch live booth count from database
2. **Real-time Data Sources**: Show active vs total sources
3. **Verification Level Badges**: Different badge styles for verification levels
4. **User Trust Score**: Display community reputation metrics
5. **Multi-language Support**: Internationalization for global users
6. **A/B Testing**: Test different trust signal layouts
7. **Animation Effects**: Subtle animations for badge appearances
8. **Rich Tooltips**: Detailed info on hover for each badge
