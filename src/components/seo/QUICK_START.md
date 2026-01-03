# References Component - Quick Start Guide

## 30-Second Integration

### 1. Import the component
```tsx
import { References, type Reference } from '@/components/seo/References';
```

### 2. Define your references
```tsx
const references: Reference[] = [
  {
    id: 'ref-1',
    type: 'web',
    title: 'Your Source Title',
    url: 'https://example.com',
    siteName: 'Website Name',
    publishDate: '2024-01-15',
  },
];
```

### 3. Add to your page
```tsx
<References references={references} />
```

**Done!** 🎉

---

## Quick Copy-Paste Templates

### Web Reference
```tsx
{
  id: 'ref-web',
  type: 'web',
  title: 'Page Title',
  url: 'https://example.com',
  author: 'Author Name', // optional
  siteName: 'Website Name',
  publishDate: '2024-01-15',
  accessDate: '2026-01-02', // optional
}
```

### Book Reference
```tsx
{
  id: 'ref-book',
  type: 'book',
  title: 'Book Title',
  author: 'Author Name',
  publisher: 'Publisher',
  publishDate: '2020-01-01',
  isbn: '978-1234567890', // optional
}
```

### Article Reference
```tsx
{
  id: 'ref-article',
  type: 'article',
  title: 'Article Title',
  author: 'Author Name',
  publication: 'Magazine/Newspaper',
  publishDate: '2024-06-15',
  url: 'https://example.com',
}
```

### Journal Reference
```tsx
{
  id: 'ref-journal',
  type: 'journal',
  title: 'Paper Title',
  authors: ['First Author', 'Second Author'],
  journal: 'Journal Name',
  volume: '45',
  issue: '3',
  pages: '234-256',
  publishDate: '2023-09-01',
  doi: '10.1234/example',
  url: 'https://doi.org/10.1234/example',
}
```

### Video Reference
```tsx
{
  id: 'ref-video',
  type: 'video',
  title: 'Video Title',
  creator: 'Channel Name',
  platform: 'YouTube',
  publishDate: '2024-12-05',
  duration: '24:35', // optional
  url: 'https://youtube.com/watch?v=...',
}
```

### Interview Reference
```tsx
{
  id: 'ref-interview',
  type: 'interview',
  title: 'Interview Title',
  interviewee: 'Person Interviewed',
  interviewer: 'Interviewer', // optional
  publishDate: '2025-07-20',
  url: 'https://example.com',
}
```

---

## Common Customizations

### Different Title
```tsx
<References
  references={references}
  title="Sources & Further Reading"
/>
```

### Show All (No Collapse)
```tsx
<References
  references={references}
  collapseThreshold={0}
/>
```

### Hide Type Badges
```tsx
<References
  references={references}
  showTypeBadges={false}
/>
```

### Custom Styling
```tsx
<References
  references={references}
  className="mt-12 mb-8"
/>
```

---

## Inline Citations

Add superscript citation links in your content:

```tsx
<article>
  <p>
    Your content here
    <sup>
      <a href="#references-heading" className="text-vintage-amber hover:underline">
        [1]
      </a>
    </sup>.
  </p>
</article>

<References references={references} />
```

---

## Troubleshooting

### "Module not found"
Make sure path alias is correct:
```tsx
import { References } from '@/components/seo/References';
```

### TypeScript errors
Ensure reference includes required fields:
- `id` (unique identifier)
- `type` (one of: web, book, article, journal, video, interview)
- `title`
- Type-specific required fields (see templates above)

### Styling issues
Component uses Tailwind CSS. Ensure:
- Tailwind is configured
- `globals.css` includes vintage color variables
- Parent has proper dark mode class if needed

---

## File Locations

- **Component**: `src/components/seo/References.tsx`
- **Full Docs**: `src/components/seo/References.README.md`
- **Examples**: `src/components/seo/References.example.tsx`
- **Test Page**: `src/app/test-references/page.tsx` → `/test-references`

---

## Need Help?

1. See full examples: `References.example.tsx`
2. Read complete docs: `References.README.md`
3. Check test page: `/test-references`
4. Review implementation summary: `REFERENCES_COMPONENT_SUMMARY.md`
