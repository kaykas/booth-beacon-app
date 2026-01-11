import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Clock,
  DollarSign,
  AlertCircle,
  Star,
  Phone,
  Globe,
  Instagram,
  Map,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/booth/StatusBadge';
import { StatusBar } from '@/components/booth/StatusBar';
import { BoothImage } from '@/components/booth/BoothImage';
import { FullWidthHero } from '@/components/booth/FullWidthHero';
import { BoothMap } from '@/components/booth/BoothMap';
import { LocationTabs } from '@/components/booth/LocationTabs';
import { CopyAddressButton } from '@/components/booth/CopyAddressButton';
import { BookmarkButton } from '@/components/BookmarkButton';
import { ShareButton } from '@/components/ShareButton';
import { BoothStats } from '@/components/BoothStats';
import { NearbyBooths } from '@/components/booth/NearbyBooths';
import { SimilarBooths } from '@/components/booth/SimilarBooths';
import { CityBooths } from '@/components/booth/CityBooths';
import { HoursStatus } from '@/components/booth/HoursStatus';
import { DistanceDisplay } from '@/components/booth/DistanceDisplay';
import { StickyActionBar } from '@/components/booth/StickyActionBar';
import { PhotoGallery } from '@/components/booth/PhotoGallery';
import { VisitChecklist } from '@/components/booth/VisitChecklist';
import { SocialProof } from '@/components/booth/SocialProof';
import { StreetViewEmbed } from '@/components/booth/StreetViewEmbed';
import { CommunityPhotoUpload } from '@/components/booth/CommunityPhotoUpload';
import { StructuredHours } from '@/components/booth/StructuredHours';
import { ReportIssueButton } from '@/components/booth/ReportIssueButton';
import { ReviewForm } from '@/components/booth/ReviewForm';
import { ReviewList } from '@/components/booth/ReviewList';
import { ContentFreshness } from '@/components/seo/ContentFreshness';
import { createPublicServerClient } from '@/lib/supabase';
import { normalizeBooth, RenderableBooth } from '@/lib/boothViewModel';
import { generateCombinedStructuredData, ReviewStats } from '@/lib/seo/structuredDataOptimized';
import { generateComprehensiveBoothFAQs } from '@/lib/seo/faqData';
import { formatLastUpdated } from '@/lib/dateUtils';
import { generateAIMetaTags, generateContentFreshnessSignals } from '@/lib/ai-meta-tags';
import { generateBoothPageSchemas, injectStructuredData as injectKnowledgeGraph } from '@/lib/knowledge-graph-schemas';

interface BoothDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Helper function to check if booth was recently verified (within last 30 days)
function isRecentlyVerified(lastVerified: string | null | undefined): boolean {
  if (!lastVerified) return false;

  try {
    const verifiedDate = new Date(lastVerified);
    const now = new Date();
    const daysSinceVerification = (now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceVerification <= 30;
  } catch (_error) {
    return false;
  }
}

// Helper function to determine if booth is currently open
function isOpenNow(hours: string | null | undefined): boolean {
  if (!hours) return false;

  try {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

    // Parse hours string (expected format: "Monday: 9:00 AM - 5:00 PM" per line)
    const lines = hours.split('\n');

    for (const line of lines) {
      // Check if this line is for today
      if (line.toLowerCase().includes(currentDay.toLowerCase())) {
        // Check if closed
        if (line.toLowerCase().includes('closed')) {
          return false;
        }

        // Try to extract time range (e.g., "9:00 AM - 5:00 PM" or "09:00 - 17:00")
        const timeMatch = line.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

        if (timeMatch) {
          let openHour = parseInt(timeMatch[1]);
          const openMin = parseInt(timeMatch[2]);
          const openPeriod = timeMatch[3]?.toUpperCase();

          let closeHour = parseInt(timeMatch[4]);
          const closeMin = parseInt(timeMatch[5]);
          const closePeriod = timeMatch[6]?.toUpperCase();

          // Convert to 24-hour format if AM/PM provided
          if (openPeriod === 'PM' && openHour !== 12) openHour += 12;
          if (openPeriod === 'AM' && openHour === 12) openHour = 0;
          if (closePeriod === 'PM' && closeHour !== 12) closeHour += 12;
          if (closePeriod === 'AM' && closeHour === 12) closeHour = 0;

          const openTime = openHour * 60 + openMin;
          const closeTime = closeHour * 60 + closeMin;

          // Handle overnight hours (e.g., 10 PM - 2 AM)
          if (closeTime < openTime) {
            return currentTime >= openTime || currentTime <= closeTime;
          }

          return currentTime >= openTime && currentTime <= closeTime;
        }
      }
    }

    // If we have hours but couldn't parse them, assume open during business hours (9 AM - 6 PM)
    return currentTime >= 540 && currentTime <= 1080;
  } catch (error) {
    console.error('Error parsing hours:', error);
    return false;
  }
}

// Fetch booth with proper error handling
async function getBooth(slug: string): Promise<RenderableBooth | null> {
  try {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from('booths')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      console.error(`Booth not found: "${slug}"`, error?.message);
      return null;
    }

    const booth = normalizeBooth(data);

    if (!booth) {
      console.warn(`Booth data invalid for slug "${slug}"`, data);
      return null;
    }

    return booth;
  } catch (error) {
    console.error(`Error fetching booth "${slug}":`, error);
    return null;
  }
}

// Fetch approved community photos for a booth
async function getCommunityPhotos(boothId: string): Promise<string[]> {
  try {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from('booth_user_photos')
      .select('photo_url')
      .eq('booth_id', boothId)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching community photos:', error);
      return [];
    }

    return data?.map((photo) => photo.photo_url) || [];
  } catch (error) {
    console.error('Error fetching community photos:', error);
    return [];
  }
}

// Fetch review statistics for a booth (for structured data)
async function getReviewStats(boothId: string): Promise<ReviewStats | null> {
  try {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from('booth_reviews')
      .select('rating')
      .eq('booth_id', boothId)
      .eq('status', 'approved');

    if (error) {
      console.error('Error fetching review stats:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const totalRating = data.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((totalRating / data.length) * 10) / 10;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach((r) => {
      distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
    });

    return {
      average_rating: avgRating,
      total_reviews: data.length,
      rating_distribution: distribution,
    };
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return null;
  }
}

// Static generation with ISR - regenerate every hour
export const revalidate = 3600; // 1 hour
export const dynamicParams = true; // Allow dynamic params for new booths

// UUID regex pattern to filter out auto-generated slugs
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Check if a booth has sufficient content for indexing
function hasValidContent(booth: { name?: string; city?: string; latitude?: number | null }): boolean {
  if (!booth.name || booth.name === 'N/A' || booth.name.trim().length < 3) return false;
  if (!booth.city && !booth.latitude) return false;
  return true;
}

// Generate static pages for all booths at build time
// Exclude closed/invalid booths and UUID slugs from pre-rendering
export async function generateStaticParams() {
  try {
    const supabase = createPublicServerClient();
    const { data: booths, error } = await supabase
      .from('booths')
      .select('slug, name, city, latitude')
      .not('slug', 'is', null)
      .neq('status', 'closed') // Exclude closed/invalid booths
      .neq('name', 'N/A'); // Exclude invalid extraction failures

    if (error) {
      console.error('Error generating static params:', error);
      return [];
    }

    // Filter out UUID-based slugs and thin content
    const validBooths = (booths || []).filter((booth) => {
      if (uuidPattern.test(booth.slug)) return false;
      return hasValidContent(booth);
    });

    return validBooths.map((booth) => ({
      slug: booth.slug,
    }));
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}

export async function generateMetadata({ params }: BoothDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const booth = await getBooth(slug);

  if (!booth) {
    return {
      title: 'Booth Not Found',
      description: 'The photo booth you are looking for could not be found.',
      robots: { index: false, follow: false },
    };
  }

  // Check if this is a thin content page that should not be indexed
  const isUuidSlug = uuidPattern.test(slug);
  const isThinContent = !hasValidContent({ name: booth.name, city: booth.city, latitude: booth.latitude });
  const isClosedOrInvalid = booth.status === 'closed' || booth.name === 'N/A' || booth.data_source_type === 'invalid_extraction';
  const shouldNoIndex = isUuidSlug || isThinContent || isClosedOrInvalid;

  const city = booth.city || 'Unknown Location';
  const country = booth.country || '';

  // Generate SEO-optimized title: location-first with target keyword
  // Format: "[City] Analog Photo Booth - [Booth Name]"
  // Keeps titles under 60 chars for optimal Google display
  const shortLocation = city.length > 15 ? city.substring(0, 15) : city;
  const shortName = booth.name.length > 20 ? booth.name.substring(0, 17) + '...' : booth.name;
  const title = `${shortLocation} Analog Photo Booth - ${shortName}`;

  const description =
    booth.description || `Analog photo booth in ${booth.locationLabel || city}${country ? `, ${country}` : ''}. Find authentic photochemical photo booths with real film processing.`;

  // Use AI-generated image or exterior photo for OG image if available
  const ogImage = booth.photo_exterior_url || booth.ai_generated_image_url || booth.ai_preview_url;

  // Generate AI meta tags for this booth
  const aiTags = generateAIMetaTags({
    summary: `${booth.name} is an analog photo booth located in ${city}${country ? `, ${country}` : ''}. Authentic photochemical photography with film processing and instant photo strips.`,
    keyConcepts: [
      'analog photo booth',
      booth.name,
      city,
      country || '',
      'photochemical photography',
      'film processing',
      'instant photos',
      'photo strips',
      booth.machine_model || 'classic booth',
    ].filter(Boolean),
    contentStructure: 'reference',
    expertiseLevel: 'beginner',
    perspective: 'commercial',
    authority: 'industry-expert',
  });

  const freshnessTags = generateContentFreshnessSignals({
    publishedDate: booth.created_at || '2025-11-01T08:00:00Z',
    modifiedDate: booth.updated_at || new Date().toISOString(),
    revisedDate: new Date(booth.updated_at || new Date()).toISOString().split('T')[0],
  });

  return {
    title,
    description,
    // Canonical URL to prevent duplicate content
    alternates: {
      canonical: `https://boothbeacon.org/booth/${booth.slug}`,
    },
    // Prevent indexing of thin content, UUID slugs, or closed booths
    ...(shouldNoIndex && {
      robots: { index: false, follow: true },
    }),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://boothbeacon.org/booth/${booth.slug}`,
      siteName: 'Booth Beacon',
      ...(ogImage && {
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: booth.name,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
    other: {
      ...aiTags,
      ...freshnessTags,
    },
  };
}

export default async function BoothDetailPage({ params }: BoothDetailPageProps) {
  const { slug } = await params;
  const booth = await getBooth(slug);

  if (!booth) {
    notFound();
  }

  // Fetch approved community photos and review stats for this booth in parallel
  const [communityPhotos, reviewStats] = await Promise.all([
    getCommunityPhotos(booth.id),
    getReviewStats(booth.id),
  ]);

  // Check if booth is closed/invalid
  const isClosedOrInvalid = booth.status === 'closed' || booth.name === 'N/A' || booth.data_source_type === 'invalid_extraction';

  // Safe field access with defaults
  const locationString = booth.locationLabel;
  const address = booth.addressDisplay;
  const hasValidLocation = booth.hasValidLocation;
  const city = booth.city || 'Location Unknown';
  const country = booth.country || '';

  // Build location-based breadcrumb structure
  const breadcrumbItems = [
    { name: 'Home', url: 'https://boothbeacon.org' },
  ];

  // Add country
  if (country) {
    const countrySlug = country.toLowerCase().replace(/\s+/g, '-');
    breadcrumbItems.push({
      name: country,
      url: `https://boothbeacon.org/locations/${countrySlug}`,
    });
  }

  // Add state if present (US, Canada, Australia, etc.)
  if (booth.state) {
    const countrySlug = country.toLowerCase().replace(/\s+/g, '-');
    const stateSlug = booth.state.toLowerCase().replace(/\s+/g, '-');
    breadcrumbItems.push({
      name: booth.state,
      url: `https://boothbeacon.org/locations/${countrySlug}/${stateSlug}`,
    });
  }

  // Add city
  if (city && city !== 'Location Unknown') {
    const countrySlug = country.toLowerCase().replace(/\s+/g, '-');
    const stateSlug = booth.state ? booth.state.toLowerCase().replace(/\s+/g, '-') : null;
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const cityUrl = stateSlug
      ? `https://boothbeacon.org/locations/${countrySlug}/${stateSlug}/${citySlug}`
      : `https://boothbeacon.org/locations/${countrySlug}/${citySlug}`;
    breadcrumbItems.push({
      name: city,
      url: cityUrl,
    });
  }

  // Add booth name as final breadcrumb
  breadcrumbItems.push({
    name: booth.name,
    url: `https://boothbeacon.org/booth/${booth.slug}`,
  });

  // Generate booth-specific FAQs with natural language content for AI extraction
  const boothFAQs = generateComprehensiveBoothFAQs(booth);

  // Generate combined structured data (single script tag for better performance)
  // Include review stats for AggregateRating schema
  const combinedStructuredData = generateCombinedStructuredData(
    booth,
    breadcrumbItems,
    boothFAQs,
    reviewStats
  );

  // Generate knowledge graph schemas for this booth
  const knowledgeGraphSchemas = generateBoothPageSchemas(booth);

  return (
    <div className="min-h-screen bg-vintage-cream">
      {/* Sticky Action Bar */}
      {hasValidLocation && booth.latitude && booth.longitude && (
        <StickyActionBar
          boothId={booth.id}
          boothName={booth.name}
          latitude={booth.latitude}
          longitude={booth.longitude}
          hasValidLocation={hasValidLocation}
          locationString={locationString}
        />
      )}

      {/* Combined Structured Data - All schemas in one script tag for optimal FCP */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: combinedStructuredData }}
      />

      {/* Knowledge Graph - Place and TouristAttraction Schemas */}
      {knowledgeGraphSchemas.map((schema, index) => (
        <script
          key={`knowledge-graph-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: injectKnowledgeGraph(schema) }}
        />
      ))}

      {/* Main content wrapper for accessibility */}
      <main id="main-content" role="main" data-ai-page-type="local-business" data-ai-entity-type="photo-booth">
        {/* Speakable Content Sections for Voice Search - Optimized for TTS */}
        <div className="sr-only" aria-hidden="false">
          {/* Booth Summary - Primary speakable content */}
          <section id="speakable-booth-summary">
            <p>
              {booth.name} is an analog photo booth located in {city}{booth.state ? `, ${booth.state}` : ''}{country ? `, ${country}` : ''}.
              {booth.description ? ` ${booth.description}` : ' This classic photo booth uses photochemical film processing to create authentic instant photo strips.'}
            </p>
          </section>

          {/* Hours Information */}
          {booth.hours && (
            <section id="speakable-booth-hours">
              <p>
                Opening hours for {booth.name}: {booth.hours.replace(/\n/g, '. ')}.
              </p>
            </section>
          )}

          {/* Cost Information */}
          {booth.cost && (
            <section id="speakable-booth-cost">
              <p>
                The cost to use {booth.name} is {booth.cost} per photo strip.
                {booth.accepts_cash && booth.accepts_card ? ' Both cash and card payments are accepted.' :
                 booth.accepts_cash ? ' This booth accepts cash only.' :
                 booth.accepts_card ? ' This booth accepts card payments.' : ''}
              </p>
            </section>
          )}

          {/* Directions Summary */}
          {hasValidLocation && address && (
            <section id="speakable-booth-directions">
              <p>
                {booth.name} is located at {address}{city !== 'Location Unknown' ? `, ${city}` : ''}{country ? `, ${country}` : ''}.
                {booth.access_instructions ? ` ${booth.access_instructions}` : ''}
                {booth.latitude && booth.longitude ? ' You can get directions using the map on this page.' : ''}
              </p>
            </section>
          )}
        </div>
        {/* Breadcrumbs */}
        <div className="bg-white border-b border-neutral-200" data-ai-section="breadcrumbs">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-neutral-600 overflow-x-auto">
            {breadcrumbItems.map((crumb, index) => (
              <div key={crumb.url} className="flex items-center gap-2 flex-shrink-0">
                {index > 0 && <span>/</span>}
                {index === breadcrumbItems.length - 1 ? (
                  <span className="text-neutral-900 font-medium truncate max-w-[200px]">
                    {crumb.name}
                  </span>
                ) : (
                  <Link href={crumb.url} className="hover:text-primary transition whitespace-nowrap">
                    {crumb.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Closed/Invalid Booth Warning */}
      {isClosedOrInvalid && (
        <div className="bg-red-50 border-b-4 border-red-600" data-ai-section="warning" data-ai-status="unverified">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-red-900 mb-2">
                  Unverified Booth Information
                </h2>
                <div className="text-red-800 space-y-2">
                  <p>
                    This booth listing has not been verified and may contain incomplete or incorrect information.
                    The data shown may not represent an actual photo booth location.
                  </p>
                  <p className="font-semibold">
                    ⚠️ We recommend not visiting this location without additional verification.
                  </p>
                  <div className="mt-4 pt-4 border-t border-red-200">
                    <p className="text-sm">
                      <strong>Why is this unverified?</strong> This listing has not been confirmed by first-party sources or community verification.
                      It will be reviewed and either verified or removed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* E-Commerce Style Full-Width Hero */}
      <FullWidthHero booth={booth} locationString={locationString} hasValidLocation={hasValidLocation} />

      {/* Main Content - Single Column E-Commerce Layout */}
      <div className="bg-white pb-24 lg:pb-16 mt-8">
        <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">

          {/* About Section */}
          {booth.description && (
            <section data-ai-section="description" data-ai-content="primary-description">
              <h2 className="text-3xl font-bold text-neutral-900 mb-6">About This Booth</h2>
              <p className="text-lg text-neutral-700 leading-relaxed" data-ai-summary="booth-overview">{booth.description}</p>
            </section>
          )}

          {/* Details Section */}
          <section data-ai-section="details" data-ai-content="specifications">
            <h2 className="text-3xl font-bold text-neutral-900 mb-6">Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-lg" data-ai-content="booth-specifications">
              {/* Machine Details */}
              {booth.machine_model && (
                <div className="flex justify-between py-3 border-b border-neutral-200">
                  <span className="text-neutral-600">Machine</span>
                  <span className="font-semibold text-neutral-900">{booth.machine_model}</span>
                </div>
              )}
              {booth.booth_type && (
                <div className="flex justify-between py-3 border-b border-neutral-200">
                  <span className="text-neutral-600">Type</span>
                  <span className="font-semibold text-neutral-900 capitalize">{booth.booth_type}</span>
                </div>
              )}
              {booth.cost && (
                <div className="flex justify-between py-3 border-b border-neutral-200">
                  <span className="text-neutral-600">Cost</span>
                  <span className="font-semibold text-neutral-900">{booth.cost}</span>
                </div>
              )}
              {(booth.accepts_cash || booth.accepts_card) && (
                <div className="flex justify-between py-3 border-b border-neutral-200">
                  <span className="text-neutral-600">Payment</span>
                  <span className="font-semibold text-neutral-900">
                    {booth.accepts_cash && booth.accepts_card ? 'Cash & Card' :
                     booth.accepts_cash ? 'Cash Only' : 'Card Only'}
                  </span>
                </div>
              )}
            </div>

            {/* Hours */}
            {booth.hours && (
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">Hours</h3>
                <StructuredHours hours={booth.hours} />
              </div>
            )}
          </section>

          {/* Access Instructions */}
          {booth.access_instructions && (
            <section data-ai-section="access" data-ai-content="visitor-instructions">
              <Card className="p-8 bg-amber-50 border-2 border-amber-200">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-amber-900 mb-2">Access Instructions</h3>
                    <p className="text-lg text-amber-800 leading-relaxed" data-ai-content="how-to-access">{booth.access_instructions}</p>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* Location Section */}
          <section data-ai-section="location" data-ai-content="address-and-directions">
            <h2 className="text-3xl font-bold text-neutral-900 mb-6">Location & Directions</h2>

            {hasValidLocation && booth.latitude && booth.longitude && (
              <LocationTabs
                booth={booth}
                hasStreetView={booth.street_view_available === true}
              />
            )}

            <div className="space-y-4 text-lg" data-ai-content="address">
              <div itemScope itemType="https://schema.org/PostalAddress">
                <p className="font-semibold text-neutral-900" itemProp="streetAddress">{address}</p>
                {booth.postal_code && <p className="text-neutral-700" itemProp="postalCode">{booth.postal_code}</p>}
                <p className="text-neutral-700">
                  <span itemProp="addressLocality">{city}</span>{booth.state ? <>, <span itemProp="addressRegion">{booth.state}</span></> : ''}{country ? <>, <span itemProp="addressCountry">{country}</span></> : ''}
                </p>
              </div>

              {hasValidLocation && booth.latitude && booth.longitude && (
                <div className="flex flex-wrap gap-3 mt-6">
                  <CopyAddressButton address={address} />
                  <Button variant="outline" size="lg" asChild>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${booth.latitude},${booth.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Google Maps
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Historical Notes */}
          {booth.historical_notes && (
            <section data-ai-section="history" data-ai-content="historical-context">
              <h2 className="text-3xl font-bold text-neutral-900 mb-6">History</h2>
              <p className="text-lg text-neutral-700 leading-relaxed" data-ai-content="historical-notes">{booth.historical_notes}</p>
            </section>
          )}

          {/* Community Photos */}
          {(booth.photo_exterior_url || booth.photo_interior_url || booth.google_photos || communityPhotos.length > 0) && (
            <section data-ai-section="gallery" data-ai-content="visual-content">
              <h2 className="text-3xl font-bold text-neutral-900 mb-6">Community Photos</h2>
              <PhotoGallery
                photos={[
                  ...(booth.photo_exterior_url ? [booth.photo_exterior_url] : []),
                  ...(booth.photo_interior_url ? [booth.photo_interior_url] : []),
                  ...(booth.google_photos || []),
                  ...communityPhotos,
                ]}
                boothName={booth.name}
                communityPhotosCount={communityPhotos.length}
              />
              <div className="mt-6">
                <CommunityPhotoUpload boothId={booth.id} boothName={booth.name} />
              </div>
            </section>
          )}

          {/* Reviews Section */}
          <section data-ai-section="reviews" data-ai-content="user-reviews" id="reviews">
            <h2 className="text-3xl font-bold text-neutral-900 mb-6">Reviews</h2>
            <div className="space-y-8">
              {/* Review List */}
              <ReviewList boothId={booth.id} boothName={booth.name} />

              {/* Review Form */}
              <ReviewForm boothId={booth.id} boothName={booth.name} />
            </div>
          </section>

        </div>
      </div>

      {/* Discovery Section - More Booths */}
      <div className="bg-neutral-50 py-16" data-ai-section="related-content" data-ai-content="discovery">
        <div className="max-w-7xl mx-auto px-4">
        {hasValidLocation && booth.latitude && booth.longitude && (
          <div className="mt-12 space-y-8" data-ai-content="nearby-booths">
            <h2 className="text-3xl font-bold text-neutral-900 mb-6">
              More Photo Booths in {city}
            </h2>

            {/* City-Specific Booths */}
            <CityBooths
              boothId={booth.id}
              city={city}
              state={booth.state}
              country={country}
              limit={6}
            />

            {/* Nearby Booths only (removed Similar to reduce duplication) */}
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">Nearby</h3>
              <NearbyBooths
                boothId={booth.id}
                latitude={booth.latitude}
                longitude={booth.longitude}
                radiusKm={25}
                limit={6}
              />
            </div>
          </div>
        )}

        {/* If no valid location, still show city and similar booths */}
        {!hasValidLocation && (
          <div className="mt-12 space-y-8">
            <h2 className="text-3xl font-bold text-neutral-900 mb-6">
              More Photo Booths in {city}
            </h2>

            {/* City-Specific Booths */}
            <CityBooths
              boothId={booth.id}
              city={city}
              state={booth.state}
              country={country}
              limit={6}
            />
          </div>
        )}

        {/* Source Attribution Footer */}
        <div className="mt-8 pt-6 border-t border-neutral-200" data-ai-section="attribution" data-ai-content="source-verification">
          <div className="text-center text-sm text-neutral-500">
            <p data-ai-content="data-source">
              Data from {booth.source_primary || 'community sources'}
              {booth.last_verified && ` · Last verified ${new Date(booth.last_verified).toLocaleDateString()}`}
            </p>
            {booth.source_urls && booth.source_urls.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {booth.source_urls.map((url: string, index: number) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Source {booth.source_urls!.length > 1 ? index + 1 : ''}
                  </a>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs">
              Help us keep this information accurate by reporting any changes or errors
            </p>
          </div>
        </div>
      </div>
      </div>
      </main>
    </div>
  );
}
