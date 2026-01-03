/**
 * Test page for References component
 * Visit /test-references to see the component in action
 */

import { References, type Reference } from '@/components/seo/References';

export default function TestReferencesPage() {
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
      type: 'book',
      title: 'Analog Photography: A Complete Guide',
      author: 'Jane Doe',
      publisher: 'Photo Press International',
      publishDate: '2020-08-01',
      isbn: '978-1234567890',
      url: 'https://example.com/books/analog-photography',
    },
    {
      id: 'ref-3',
      type: 'article',
      title: 'The Renaissance of Photo Booths in Urban Culture',
      author: 'Michael Chen',
      publication: 'Photography Today',
      publishDate: '2024-06-15',
      url: 'https://example.com/articles/photo-booth-renaissance',
    },
    {
      id: 'ref-4',
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
    {
      id: 'ref-5',
      type: 'video',
      title: 'Inside a Classic Photo Booth: Complete Restoration',
      creator: 'Vintage Tech Restorations',
      platform: 'YouTube',
      publishDate: '2024-12-05',
      duration: '24:35',
      url: 'https://youtube.com/watch?v=example',
    },
    {
      id: 'ref-6',
      type: 'interview',
      title: 'Preserving Analog Photo Booth Culture',
      interviewee: 'Thomas Anderson',
      interviewer: 'Lisa Park',
      publishDate: '2025-07-20',
      url: 'https://example.com/interviews/thomas-anderson',
      description: 'Owner of the last photo booth manufacturer in Europe',
    },
    {
      id: 'ref-7',
      type: 'web',
      title: 'Photo Booth Locations Worldwide',
      url: 'https://boothbeacon.org',
      siteName: 'Booth Beacon',
      publishDate: '2026-01-01',
    },
    {
      id: 'ref-8',
      type: 'book',
      title: 'The Photo Booth: A Cultural History',
      author: 'Nakki Goranin',
      publisher: 'Photo-Historica Press',
      publishDate: '2008-05-15',
    },
  ];

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-display font-bold text-foreground">
            References Component Test
          </h1>
          <p className="text-muted-foreground">
            Testing the References component with various citation types
          </p>
        </header>

        {/* Sample content with inline citations */}
        <article className="prose prose-invert max-w-none rounded-xl border border-border bg-card p-6 sm:p-8">
          <h2>About Photo Booths</h2>
          <p>
            Classic photo booths have a rich history dating back to the early 20th century
            <sup>
              <a
                href="#references-heading"
                className="text-vintage-amber hover:text-vintage-amber-dark no-underline hover:underline"
              >
                [1]
              </a>
            </sup>
            . The technology behind analog photography continues to fascinate enthusiasts
            <sup>
              <a
                href="#references-heading"
                className="text-vintage-amber hover:text-vintage-amber-dark no-underline hover:underline"
              >
                [2]
              </a>
            </sup>
            , and there has been a renaissance in photo booth culture in recent years
            <sup>
              <a
                href="#references-heading"
                className="text-vintage-amber hover:text-vintage-amber-dark no-underline hover:underline"
              >
                [3]
              </a>
            </sup>
            .
          </p>
          <p>
            The chemical processes involved in instant photo development have been extensively
            studied
            <sup>
              <a
                href="#references-heading"
                className="text-vintage-amber hover:text-vintage-amber-dark no-underline hover:underline"
              >
                [4]
              </a>
            </sup>
            , and modern restoration efforts help preserve these classic machines
            <sup>
              <a
                href="#references-heading"
                className="text-vintage-amber hover:text-vintage-amber-dark no-underline hover:underline"
              >
                [5]
              </a>
            </sup>
            .
          </p>
        </article>

        {/* References component */}
        <References references={references} />
      </div>
    </main>
  );
}
