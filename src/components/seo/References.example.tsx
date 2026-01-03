/**
 * References Component - Usage Examples
 *
 * This file demonstrates various ways to use the References component
 * with different types of citations.
 */

import { References, type Reference } from './References';

// ============================================
// Example 1: Simple Web References
// ============================================

export function SimpleWebReferencesExample() {
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
    {
      id: 'ref-2',
      type: 'web',
      title: 'How Analog Photo Booths Work',
      url: 'https://example.com/how-they-work',
      siteName: 'Tech Explained',
      publishDate: '2024-03-10',
      description: 'Technical deep-dive into the mechanics of photochemical photo booths',
    },
  ];

  return <References references={references} />;
}

// ============================================
// Example 2: Mixed Citation Types
// ============================================

export function MixedCitationTypesExample() {
  const references: Reference[] = [
    // Web reference
    {
      id: 'ref-web-1',
      type: 'web',
      title: 'Photo Booth Locations in Berlin',
      url: 'https://example.com/berlin-booths',
      author: 'Alexandra Schmidt',
      siteName: 'Berlin Photo Culture',
      publishDate: '2025-11-20',
      accessDate: '2026-01-02',
    },

    // Book reference
    {
      id: 'ref-book-1',
      type: 'book',
      title: 'Analog Photography: A Complete Guide',
      author: 'Jane Doe',
      publisher: 'Photo Press International',
      publishDate: '2020-08-01',
      isbn: '978-1234567890',
      url: 'https://example.com/books/analog-photography',
    },

    // Article reference
    {
      id: 'ref-article-1',
      type: 'article',
      title: 'The Renaissance of Photo Booths in Urban Culture',
      author: 'Michael Chen',
      publication: 'Photography Today',
      publishDate: '2024-06-15',
      url: 'https://example.com/articles/photo-booth-renaissance',
    },

    // Journal reference
    {
      id: 'ref-journal-1',
      type: 'journal',
      title: 'Chemical Processing in Analog Photography: A Technical Analysis',
      authors: ['Dr. Sarah Johnson', 'Prof. Robert Williams', 'Dr. Emily Zhang'],
      journal: 'Journal of Photographic Science',
      volume: '45',
      issue: '3',
      pages: '234-256',
      publishDate: '2023-09-01',
      doi: '10.1234/jps.2023.45.3.234',
      url: 'https://doi.org/10.1234/jps.2023.45.3.234',
    },

    // Video reference
    {
      id: 'ref-video-1',
      type: 'video',
      title: 'Inside a Classic Photo Booth: Complete Restoration',
      creator: 'Vintage Tech Restorations',
      platform: 'YouTube',
      publishDate: '2024-12-05',
      duration: '24:35',
      url: 'https://youtube.com/watch?v=example',
    },

    // Interview reference
    {
      id: 'ref-interview-1',
      type: 'interview',
      title: 'Preserving Analog Photo Booth Culture',
      interviewee: 'Thomas Anderson',
      interviewer: 'Lisa Park',
      publishDate: '2025-07-20',
      url: 'https://example.com/interviews/thomas-anderson',
      description: 'Owner of the last photo booth manufacturer in Europe',
    },
  ];

  return (
    <References
      references={references}
      title="Sources & Further Reading"
      showTypeBadges={true}
    />
  );
}

// ============================================
// Example 3: Long List with Collapsing
// ============================================

export function LongReferenceListExample() {
  const references: Reference[] = [
    {
      id: 'ref-1',
      type: 'web',
      title: 'Photo Booth History Timeline',
      url: 'https://example.com/timeline',
      siteName: 'Photo History Archive',
      publishDate: '2023-01-10',
    },
    {
      id: 'ref-2',
      type: 'book',
      title: 'The Photo Booth: A Cultural History',
      author: 'Nakki Goranin',
      publisher: 'Photo-Historica Press',
      publishDate: '2008-05-15',
    },
    {
      id: 'ref-3',
      type: 'article',
      title: 'Why Photo Booths Are Making a Comeback',
      author: 'Emma Thompson',
      publication: 'The Guardian',
      publishDate: '2024-08-22',
      url: 'https://example.com/articles/comeback',
    },
    {
      id: 'ref-4',
      type: 'web',
      title: 'Photo Booth Manufacturers Guide',
      url: 'https://example.com/manufacturers',
      siteName: 'Industry Directory',
      publishDate: '2025-03-05',
    },
    {
      id: 'ref-5',
      type: 'video',
      title: 'How Photo Booth Strips Are Developed',
      creator: 'Chemistry Explained',
      platform: 'YouTube',
      publishDate: '2024-11-10',
      duration: '12:45',
      url: 'https://youtube.com/watch?v=example2',
    },
    {
      id: 'ref-6',
      type: 'article',
      title: 'The Art of Photo Booth Photography',
      author: 'David Kim',
      publication: 'Photo Magazine',
      publishDate: '2025-05-18',
    },
    {
      id: 'ref-7',
      type: 'web',
      title: 'Global Photo Booth Map Project',
      url: 'https://example.com/global-map',
      siteName: 'Photo Booth Collective',
      publishDate: '2025-09-01',
    },
    {
      id: 'ref-8',
      type: 'book',
      title: 'Instant Images: Polaroid and Photo Booth Culture',
      author: 'Christopher Bonanos',
      publisher: 'Princeton Architectural Press',
      publishDate: '2012-03-20',
      isbn: '978-1616890858',
    },
  ];

  return (
    <References
      references={references}
      title="Research Sources"
      collapseThreshold={5}
      showTypeBadges={true}
    />
  );
}

// ============================================
// Example 4: Guide Page with Citations
// ============================================

export function GuidePageWithReferencesExample() {
  const references: Reference[] = [
    {
      id: 'berlin-guide-1',
      type: 'web',
      title: 'Berlin Photo Booth Locations 2025',
      url: 'https://example.com/berlin-locations',
      author: 'Berlin Tourism Board',
      siteName: 'Visit Berlin',
      publishDate: '2025-12-01',
      accessDate: '2026-01-02',
    },
    {
      id: 'berlin-guide-2',
      type: 'article',
      title: 'The Last Analog Photo Booths in Berlin',
      author: 'Klaus Mueller',
      publication: 'Berliner Zeitung',
      publishDate: '2024-09-15',
      url: 'https://example.com/last-booths-berlin',
    },
    {
      id: 'berlin-guide-3',
      type: 'interview',
      title: 'Keeping Berlin\'s Photo Booth Culture Alive',
      interviewee: 'Petra Wagner',
      interviewer: 'Alex Morgan',
      publishDate: '2025-06-20',
      url: 'https://example.com/interviews/petra-wagner',
      description: 'Owner of a historic photo booth in Kreuzberg',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Guide content here */}
      <article className="prose prose-invert max-w-none">
        <h1>Berlin Photo Booth Guide</h1>
        <p>
          Berlin has a rich history of analog photo booths dating back to the 1920s.
          This guide covers the best locations to find classic photo booths in the city.
        </p>
        {/* ... more content ... */}
      </article>

      {/* References section at the end */}
      <References
        references={references}
        title="Sources"
        collapseThreshold={0}
        showTypeBadges={false}
      />
    </div>
  );
}

// ============================================
// Example 5: Minimal Configuration
// ============================================

export function MinimalReferencesExample() {
  const references: Reference[] = [
    {
      id: 'min-ref-1',
      type: 'web',
      title: 'Photo Booth Basics',
      url: 'https://example.com/basics',
      siteName: 'Photo Guide',
      publishDate: '2025-01-01',
    },
  ];

  return <References references={references} />;
}

// ============================================
// Example 6: Custom Styling
// ============================================

export function CustomStyledReferencesExample() {
  const references: Reference[] = [
    {
      id: 'custom-1',
      type: 'book',
      title: 'Photography Through the Ages',
      author: 'Historical Society',
      publisher: 'Academic Press',
      publishDate: '2019-01-01',
    },
  ];

  return (
    <References
      references={references}
      title="Bibliography"
      className="bg-vintage-amber/5 border-vintage-amber/30"
      showTypeBadges={true}
      collapseThreshold={3}
    />
  );
}

// ============================================
// Example 7: Academic Paper Style
// ============================================

export function AcademicReferencesExample() {
  const references: Reference[] = [
    {
      id: 'academic-1',
      type: 'journal',
      title: 'The Evolution of Instant Photography: From Daguerreotype to Photo Booths',
      authors: ['Dr. Margaret Foster', 'Prof. James Chen', 'Dr. Sarah Martinez'],
      journal: 'History of Photography',
      volume: '42',
      issue: '2',
      pages: '145-178',
      publishDate: '2022-04-15',
      doi: '10.1080/03087298.2022.1234567',
      url: 'https://doi.org/10.1080/03087298.2022.1234567',
    },
    {
      id: 'academic-2',
      type: 'journal',
      title: 'Chemical Processes in Analog Photo Development',
      authors: ['Dr. Robert Thompson'],
      journal: 'Journal of Photographic Science',
      volume: '38',
      issue: '4',
      pages: '301-315',
      publishDate: '2021-12-01',
      doi: '10.1234/jps.2021.38.4.301',
    },
    {
      id: 'academic-3',
      type: 'book',
      title: 'The Science of Photography',
      author: 'Sidney F. Ray',
      publisher: 'Focal Press',
      publishDate: '2002-01-01',
      isbn: '978-0240515373',
    },
  ];

  return (
    <References
      references={references}
      title="References"
      showTypeBadges={false}
      collapseThreshold={0}
      enableStructuredData={true}
    />
  );
}

// ============================================
// Example 8: In-line Citation Reference
// ============================================

/**
 * Example showing how to create in-line citations that link to the references section
 */
export function InlineCitationExample() {
  const references: Reference[] = [
    {
      id: 'inline-ref-1',
      type: 'web',
      title: 'The Mechanics of Photo Booths',
      url: 'https://example.com/mechanics',
      author: 'Tech Writers Inc.',
      siteName: 'Photo Tech',
      publishDate: '2024-01-15',
    },
    {
      id: 'inline-ref-2',
      type: 'article',
      title: 'Photo Chemistry Explained',
      author: 'Dr. Chemistry',
      publication: 'Science Monthly',
      publishDate: '2023-06-01',
      url: 'https://example.com/chemistry',
    },
  ];

  return (
    <div className="space-y-8">
      <article className="prose prose-invert max-w-none">
        <h2>About Photo Booths</h2>
        <p>
          Classic photo booths use photochemical processes to develop images
          <sup>
            <a
              href="#references-heading"
              className="text-vintage-amber hover:text-vintage-amber-dark no-underline hover:underline"
            >
              [1]
            </a>
          </sup>
          . The chemistry behind instant development is fascinating
          <sup>
            <a
              href="#references-heading"
              className="text-vintage-amber hover:text-vintage-amber-dark no-underline hover:underline"
            >
              [2]
            </a>
          </sup>
          .
        </p>
      </article>

      <References
        references={references}
        title="References"
        showTypeBadges={true}
      />
    </div>
  );
}
