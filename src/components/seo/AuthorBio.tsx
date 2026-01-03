'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Github, ExternalLink } from 'lucide-react';
import Script from 'next/script';

/**
 * AuthorBio Component - Phase 3 E-E-A-T Implementation
 *
 * Showcases author expertise and experience to establish E-E-A-T signals
 * (Experience, Expertise, Authoritativeness, Trustworthiness)
 *
 * Features:
 * - Author photo with fallback
 * - Bio and credentials
 * - Expertise badges
 * - Social proof (social links)
 * - Schema.org Person markup for knowledge graph
 *
 * Usage:
 * - About page (full profile)
 * - Guide pages (condensed version)
 * - Content pages where author attribution matters
 *
 * @see docs/AI_SEO_IMPLEMENTATION_PLAN.md Phase 3, Task 3.1
 */

export interface AuthorBioProps {
  /**
   * Display variant
   * - full: Complete bio with all details (About page)
   * - compact: Condensed version for guides and content pages
   * - minimal: Name, photo, and single expertise line
   */
  variant?: 'full' | 'compact' | 'minimal';

  /**
   * Author information
   */
  author?: {
    name: string;
    title: string;
    bio: string;
    photo?: string;
    expertise: string[];
    socialLinks?: {
      instagram?: string;
      github?: string;
      website?: string;
    };
  };

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show Schema.org Person markup
   * Default: true
   */
  showSchema?: boolean;
}

/**
 * Default author data for Jascha Kaykas-Wolff (Booth Beacon founder)
 */
const DEFAULT_AUTHOR = {
  name: 'Jascha Kaykas-Wolff',
  title: 'Founder & Curator',
  bio: 'Jascha is a passionate advocate for analog photography and the creator of Booth Beacon. With expertise in photo booth curation, geographic directories, and community building, he has assembled the world\'s most comprehensive directory of classic analog photo booths, helping photographers and enthusiasts discover authentic photochemical machines worldwide.',
  photo: '/images/author/jascha-kaykas-wolff.jpg', // Placeholder - replace with actual photo
  expertise: [
    'Photo Booth Curation',
    'Analog Photography',
    'Geographic Directories',
    'UX Design',
    'Community Building',
  ],
  socialLinks: {
    instagram: 'https://www.instagram.com/boothbeacon',
    github: 'https://github.com/boothbeacon',
  },
};

export function AuthorBio({
  variant = 'full',
  author = DEFAULT_AUTHOR,
  className = '',
  showSchema = true,
}: AuthorBioProps) {
  // Generate Schema.org Person structured data
  const personSchema = showSchema
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: author.name,
        jobTitle: author.title,
        description: author.bio,
        image: author.photo,
        url: 'https://boothbeacon.org/about',
        sameAs: [
          author.socialLinks?.instagram,
          author.socialLinks?.github,
          author.socialLinks?.website,
        ].filter(Boolean),
        knowsAbout: author.expertise,
        worksFor: {
          '@type': 'Organization',
          name: 'Booth Beacon',
          url: 'https://boothbeacon.org',
        },
      }
    : null;

  // Minimal variant - just name and photo
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/20">
          <Image
            src={author.photo || '/images/placeholder-author.jpg'}
            alt={`${author.name} - ${author.title}`}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{author.name}</p>
          <p className="text-xs text-muted-foreground">{author.expertise[0]}</p>
        </div>
        {personSchema && (
          <Script
            id="author-schema-minimal"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
          />
        )}
      </div>
    );
  }

  // Compact variant - for guide pages
  if (variant === 'compact') {
    return (
      <div
        className={`card-vintage rounded-xl p-6 ${className}`}
        data-ai-section="author-info"
        data-ai-type="credentials"
        data-ai-importance="medium"
      >
        <div className="flex gap-4">
          {/* Author Photo */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/30 flex-shrink-0">
            <Image
              src={author.photo || '/images/placeholder-author.jpg'}
              alt={`${author.name} - ${author.title}`}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>

          {/* Author Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {author.name}
            </h3>
            <p className="text-sm text-primary mb-2">{author.title}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {author.bio}
            </p>

            {/* Social Links */}
            {author.socialLinks && (
              <div className="flex gap-3 mt-3">
                {author.socialLinks.instagram && (
                  <a
                    href={author.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition"
                    aria-label={`${author.name} on Instagram`}
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {author.socialLinks.github && (
                  <a
                    href={author.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition"
                    aria-label={`${author.name} on GitHub`}
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {author.socialLinks.website && (
                  <a
                    href={author.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition"
                    aria-label={`${author.name}'s website`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {personSchema && (
          <Script
            id="author-schema-compact"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
          />
        )}
      </div>
    );
  }

  // Full variant - for About page
  return (
    <div
      className={`card-vintage rounded-xl p-8 ${className}`}
      data-ai-section="author-info"
      data-ai-type="credentials"
      data-ai-importance="high"
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* Author Photo */}
        <div className="relative w-32 h-32 rounded-2xl overflow-hidden ring-2 ring-primary/30 flex-shrink-0 mx-auto md:mx-0">
          <Image
            src={author.photo || '/images/placeholder-author.jpg'}
            alt={`${author.name} - ${author.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 128px, 128px"
            priority
          />
        </div>

        {/* Author Details */}
        <div className="flex-1 min-w-0">
          {/* Name and Title */}
          <div className="mb-4">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              {author.name}
            </h2>
            <p className="text-lg text-primary font-medium">{author.title}</p>
          </div>

          {/* Bio */}
          <p className="text-muted-foreground leading-relaxed mb-6">
            {author.bio}
          </p>

          {/* Expertise Badges */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
              Areas of Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {author.expertise.map((skill) => (
                <span
                  key={skill}
                  className="badge-retro px-3 py-1.5 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Social Links */}
          {author.socialLinks && (
            <div className="flex gap-4">
              {author.socialLinks.instagram && (
                <a
                  href={author.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-primary/20 hover:border-primary/40 rounded-lg text-sm text-foreground hover:text-primary transition group"
                  aria-label={`${author.name} on Instagram`}
                >
                  <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Instagram</span>
                </a>
              )}
              {author.socialLinks.github && (
                <a
                  href={author.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-primary/20 hover:border-primary/40 rounded-lg text-sm text-foreground hover:text-primary transition group"
                  aria-label={`${author.name} on GitHub`}
                >
                  <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>GitHub</span>
                </a>
              )}
              {author.socialLinks.website && (
                <a
                  href={author.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-primary/20 hover:border-primary/40 rounded-lg text-sm text-foreground hover:text-primary transition group"
                  aria-label={`${author.name}'s website`}
                >
                  <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Website</span>
                </a>
              )}
            </div>
          )}

          {/* Trust Signal */}
          <div className="mt-6 pt-6 border-t border-primary/10">
            <p className="text-xs text-muted-foreground italic">
              Creator of Booth Beacon, the world&apos;s most comprehensive directory of analog photo booths with 1000+ verified locations worldwide.
            </p>
          </div>
        </div>
      </div>

      {/* Schema.org Person Markup */}
      {personSchema && (
        <Script
          id="author-schema-full"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      )}
    </div>
  );
}

/**
 * Usage Examples:
 *
 * // Full bio on About page
 * <AuthorBio variant="full" />
 *
 * // Compact bio on guide pages
 * <AuthorBio variant="compact" />
 *
 * // Minimal bio in article byline
 * <AuthorBio variant="minimal" />
 *
 * // Custom author
 * <AuthorBio
 *   variant="full"
 *   author={{
 *     name: "Jane Doe",
 *     title: "Contributing Writer",
 *     bio: "Jane is a photographer...",
 *     photo: "/images/jane.jpg",
 *     expertise: ["Photography", "Travel"],
 *     socialLinks: { instagram: "https://..." }
 *   }}
 * />
 */
