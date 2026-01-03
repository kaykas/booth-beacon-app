# References Component

A production-ready React component for displaying citations and references with Schema.org markup, designed for SEO and AI-friendly content.

## Features

- **Multiple Citation Formats**: Web, Book, Article, Journal, Video, Interview
- **Numbered Citation List**: Clean, numbered reference list with proper formatting
- **Clickable Links**: All references with URLs are linked with external link indicators
- **Type Badges**: Optional visual badges to identify reference types
- **Collapse/Expand**: Automatically collapses long reference lists
- **Schema.org Markup**: Includes structured data for citations (CreativeWork, WebPage, Book, Article, etc.)
- **Accessibility**: Full ARIA labels, keyboard navigation, screen reader support
- **Vintage Styling**: Matches Booth Beacon's amber/orange aesthetic
- **Responsive Design**: Mobile-first design that scales beautifully

## Installation

The component is already installed at:
```
/Users/jkw/Projects/booth-beacon-app/src/components/seo/References.tsx
```

## Basic Usage

```tsx
import { References, type Reference } from '@/components/seo/References';

const references: Reference[] = [
  {
    id: 'ref-1',
    type: 'web',
    title: 'The History of Photo Booths',
    url: 'https://example.com/photo-booth-history',
    author: 'John Smith',
    siteName: 'Photo Booth Magazine',
    publishDate: '2023-05-15',
    accessDate: '2026-01-02',
  },
];

export default function MyPage() {
  return (
    <div>
      <article>
        {/* Your content here */}
      </article>

      <References references={references} />
    </div>
  );
}
```

## Reference Types

### Web Reference

```tsx
{
  id: 'web-ref',
  type: 'web',
  title: 'Page Title',
  url: 'https://example.com',
  author: 'Author Name',
  siteName: 'Website Name',
  publishDate: '2024-01-15',
  accessDate: '2026-01-02',
  description: 'Optional description of the source'
}
```

### Book Reference

```tsx
{
  id: 'book-ref',
  type: 'book',
  title: 'Book Title',
  author: 'Author Name',
  publisher: 'Publisher Name',
  publishDate: '2020-01-01',
  isbn: '978-1234567890',
  url: 'https://example.com/book' // Optional
}
```

### Article Reference

```tsx
{
  id: 'article-ref',
  type: 'article',
  title: 'Article Title',
  author: 'Author Name',
  publication: 'Publication Name',
  publishDate: '2024-06-15',
  url: 'https://example.com/article'
}
```

### Journal Reference

```tsx
{
  id: 'journal-ref',
  type: 'journal',
  title: 'Research Paper Title',
  authors: ['First Author', 'Second Author', 'Third Author'],
  journal: 'Journal Name',
  volume: '45',
  issue: '3',
  pages: '234-256',
  publishDate: '2023-09-01',
  doi: '10.1234/example.doi',
  url: 'https://doi.org/10.1234/example.doi'
}
```

### Video Reference

```tsx
{
  id: 'video-ref',
  type: 'video',
  title: 'Video Title',
  creator: 'Channel Name',
  platform: 'YouTube',
  publishDate: '2024-12-05',
  duration: '24:35',
  url: 'https://youtube.com/watch?v=example'
}
```

### Interview Reference

```tsx
{
  id: 'interview-ref',
  type: 'interview',
  title: 'Interview Title',
  interviewee: 'Person Interviewed',
  interviewer: 'Interviewer Name',
  publishDate: '2025-07-20',
  url: 'https://example.com/interview',
  description: 'Context about the interview'
}
```

## Props

### ReferencesProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `references` | `Reference[]` | **required** | Array of references to display |
| `title` | `string` | `"References"` | Title for the references section |
| `collapseThreshold` | `number` | `5` | Number of references to show before collapsing. Set to `0` to disable |
| `className` | `string` | `undefined` | Additional CSS classes for the container |
| `showTypeBadges` | `boolean` | `true` | Show reference type badges |
| `enableStructuredData` | `boolean` | `true` | Include Schema.org structured data |

## Advanced Usage

### Custom Title and Styling

```tsx
<References
  references={references}
  title="Sources & Further Reading"
  className="bg-vintage-amber/5 border-vintage-amber/30"
  showTypeBadges={true}
  collapseThreshold={3}
/>
```

### Disable Collapsing

```tsx
<References
  references={references}
  collapseThreshold={0}  // Show all references
/>
```

### Hide Type Badges

```tsx
<References
  references={references}
  showTypeBadges={false}  // Clean academic style
/>
```

### Disable Structured Data

```tsx
<References
  references={references}
  enableStructuredData={false}  // Skip Schema.org markup
/>
```

## Inline Citations

Link to references using anchor links:

```tsx
<article>
  <p>
    Classic photo booths use photochemical processes
    <sup>
      <a href="#references-heading" className="text-vintage-amber hover:underline">
        [1]
      </a>
    </sup>
    .
  </p>
</article>

<References references={references} />
```

The `references-heading` ID is automatically added to the section heading.

## Schema.org Structured Data

The component automatically generates Schema.org structured data for all references. The structured data includes:

- **CreativeWork**: Base type for all citations
- **WebPage**: For web references
- **Book**: For book references
- **Article**: For article references
- **ScholarlyArticle**: For journal references
- **VideoObject**: For video references

This helps search engines and AI systems understand your citations and improves SEO.

## Accessibility Features

- **ARIA Labels**: All interactive elements have descriptive labels
- **Semantic HTML**: Uses proper `<ol>` list structure
- **Keyboard Navigation**: Full keyboard support for expand/collapse
- **Screen Reader Support**: Announces reference numbers and types
- **Focus Indicators**: Clear focus states for keyboard users

## Styling Customization

The component uses Tailwind CSS classes and inherits from the site's vintage amber/orange theme. Key design tokens:

- **Primary Color**: `text-vintage-amber`, `bg-vintage-amber/10`
- **Borders**: `border-vintage-amber/20`
- **Hover States**: `hover:text-vintage-amber-dark`
- **Card Style**: `bg-card`, `border-border`

### Custom Styling Example

```tsx
<References
  references={references}
  className="my-custom-class bg-primary/5"
/>
```

## SEO Benefits

1. **Structured Citations**: Schema.org markup helps AI systems understand your sources
2. **E-E-A-T Signals**: Demonstrates expertise and trustworthiness
3. **Link Equity**: Proper attribution and outbound links to quality sources
4. **Content Authority**: Shows research depth and credibility
5. **Featured Snippets**: Well-formatted citations improve snippet capture chances

## Performance

- **Lazy Rendering**: Only renders visible references when collapsed
- **Optimized Schema**: Generates Schema.org data once on mount
- **No External Dependencies**: Uses only React, Next.js, and lucide-react icons

## Browser Support

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support
- **Edge**: ✅ Full support
- **Mobile**: ✅ Responsive design, touch-friendly

## Testing

Visit the test page to see the component in action:
```
/test-references
```

Or run locally:
```bash
npm run dev
# Visit http://localhost:3000/test-references
```

## Examples

See comprehensive examples in:
```
/Users/jkw/Projects/booth-beacon-app/src/components/seo/References.example.tsx
```

Examples include:
1. Simple web references
2. Mixed citation types
3. Long reference lists with collapsing
4. Guide page integration
5. Minimal configuration
6. Custom styling
7. Academic paper style
8. Inline citations

## Integration with AI/SEO Plan

This component is **Phase 3, Task 3.2** of the AI/SEO Implementation Plan:

- ✅ E-E-A-T Signal: Demonstrates expertise and authority
- ✅ Schema.org Markup: CreativeWork and Citation schemas
- ✅ AI-Friendly: Structured data helps AI systems cite sources
- ✅ Accessibility: Full ARIA support for screen readers
- ✅ Vintage Aesthetic: Matches site theme with amber/orange colors

## Future Enhancements

Possible future improvements:
- [ ] Export to BibTeX/RIS format
- [ ] Automatic DOI lookup and validation
- [ ] Citation style switcher (APA, MLA, Chicago)
- [ ] Duplicate detection
- [ ] Citation count badges
- [ ] Integration with citation management tools

## License

Part of the Booth Beacon project. See project LICENSE for details.

## Credits

- **Component Author**: Claude Code (Anthropic)
- **Project**: Booth Beacon
- **Date**: January 2026
- **Reference**: AI/SEO Implementation Plan Phase 3
