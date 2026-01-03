/**
 * AuthorBio Component - Usage Examples
 *
 * This file demonstrates how to use the AuthorBio component in different contexts.
 * Copy these examples into your pages as needed.
 */

import { AuthorBio } from './AuthorBio';

// ============================================================================
// Example 1: Full Bio on About Page
// ============================================================================
export function AboutPageExample() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-display font-bold mb-8">About Booth Beacon</h1>

      <div className="prose prose-lg mb-12">
        <p>
          Booth Beacon is the world's ultimate directory of classic analog photo booths.
          Our mission is to help photography enthusiasts discover authentic photochemical
          machines worldwide.
        </p>
      </div>

      {/* Full author bio with all details */}
      <AuthorBio variant="full" />
    </div>
  );
}

// ============================================================================
// Example 2: Compact Bio on Guide Pages
// ============================================================================
export function CityGuideExample() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-display font-bold mb-8">
        Photo Booth Guide: Berlin
      </h1>

      <div className="prose prose-lg mb-8">
        <p>
          Berlin has one of the highest concentrations of analog photo booths in Europe...
        </p>
      </div>

      {/* Compact author bio for attribution */}
      <AuthorBio variant="compact" className="mb-12" />

      <div className="prose prose-lg">
        <h2>Best Photo Booths in Berlin</h2>
        {/* Guide content continues... */}
      </div>
    </article>
  );
}

// ============================================================================
// Example 3: Minimal Bio in Article Byline
// ============================================================================
export function BlogPostExample() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-4">
          The History of Photo Booth Technology
        </h1>

        {/* Minimal author bio in byline */}
        <div className="flex items-center justify-between border-b border-primary/10 pb-4">
          <AuthorBio variant="minimal" />
          <time className="text-sm text-muted-foreground">
            January 3, 2026
          </time>
        </div>
      </header>

      <div className="prose prose-lg">
        <p>Photo booths have evolved significantly since their invention...</p>
      </div>
    </article>
  );
}

// ============================================================================
// Example 4: Custom Author (Multiple Contributors)
// ============================================================================
export function MultiAuthorExample() {
  const guestAuthor = {
    name: 'Alexandra Schmidt',
    title: 'Photo Booth Historian',
    bio: 'Alexandra is a Berlin-based photographer and photo booth enthusiast who has documented vintage machines across 30 countries. Her work focuses on preserving analog photography heritage.',
    photo: '/images/authors/alexandra.jpg',
    expertise: [
      'Analog Photography',
      'Photo Booth History',
      'Cultural Documentation',
    ],
    socialLinks: {
      instagram: 'https://www.instagram.com/alexandra_photobooths',
      website: 'https://alexandrabooths.com',
    },
  };

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-display font-bold mb-8">
        Rare Photo Booth Machines of Eastern Europe
      </h1>

      {/* Guest contributor bio */}
      <AuthorBio
        variant="compact"
        author={guestAuthor}
        className="mb-12"
      />

      <div className="prose prose-lg">
        <p>Eastern Europe is home to some of the rarest photo booth machines...</p>
      </div>
    </article>
  );
}

// ============================================================================
// Example 5: Multiple Authors on Same Page
// ============================================================================
export function CollaborativeGuideExample() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-display font-bold mb-8">
        The Ultimate Photo Booth Travel Guide
      </h1>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* Primary author */}
        <AuthorBio variant="compact" />

        {/* Contributing editor */}
        <AuthorBio
          variant="compact"
          author={{
            name: 'Marcus Chen',
            title: 'Contributing Editor',
            bio: 'Marcus specializes in technical documentation and equipment reviews.',
            photo: '/images/authors/marcus.jpg',
            expertise: ['Technical Writing', 'Equipment Testing'],
            socialLinks: {
              github: 'https://github.com/mchen',
            },
          }}
        />
      </div>

      <div className="prose prose-lg">
        <p>This comprehensive guide combines expertise from multiple contributors...</p>
      </div>
    </article>
  );
}

// ============================================================================
// Example 6: Without Schema (When Already Present on Page)
// ============================================================================
export function NoSchemaExample() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-display font-bold mb-8">
        Photo Booth Maintenance Tips
      </h1>

      {/* Disable schema when page already has Person schema */}
      <AuthorBio
        variant="compact"
        showSchema={false}
        className="mb-8"
      />

      <div className="prose prose-lg">
        <p>Regular maintenance is crucial for analog photo booths...</p>
      </div>
    </article>
  );
}

/**
 * Integration Notes:
 *
 * 1. The component is fully typed and will show TypeScript errors if used incorrectly
 * 2. Default author is Jascha Kaykas-Wolff (project founder)
 * 3. Schema.org Person markup is automatically included (can be disabled with showSchema={false})
 * 4. All variants are responsive and match the site's vintage aesthetic
 * 5. Social links are optional and render only if provided
 * 6. The component uses the existing design system (card-vintage, badge-retro, etc.)
 *
 * Where to Use:
 * - About page: variant="full"
 * - City guides: variant="compact"
 * - Blog posts: variant="minimal" in header, variant="compact" at end
 * - Technical docs: variant="compact" with custom author
 * - Landing pages: variant="full" in team section
 */
