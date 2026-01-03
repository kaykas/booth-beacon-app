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
import { BoothImage } from '@/components/booth/BoothImage';
import { BoothMap } from '@/components/booth/BoothMap';
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
import { createPublicServerClient } from '@/lib/supabase';
import { normalizeBooth, RenderableBooth } from '@/lib/boothViewModel';
import { generateCombinedStructuredData } from '@/lib/seo/structuredDataOptimized';
import { boothDetailFAQs } from '@/lib/seo/faqData';
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

// Static generation with ISR - regenerate every hour
export const revalidate = 3600; // 1 hour
export const dynamicParams = true; // Allow dynamic params for new booths

// Generate static pages for all booths at build time
// Exclude closed/invalid booths from pre-rendering
export async function generateStaticParams() {
  try {
    const supabase = createPublicServerClient();
    const { data: booths, error } = await supabase
      .from('booths')
      .select('slug')
      .not('slug', 'is', null)
      .neq('status', 'closed') // Exclude closed/invalid booths
      .neq('name', 'N/A'); // Exclude invalid extraction failures

    if (error) {
      console.error('Error generating static params:', error);
      return [];
    }

    return (booths || []).map((booth) => ({
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
    };
  }

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

  // Generate combined structured data (single script tag for better performance)
  const combinedStructuredData = generateCombinedStructuredData(
    booth,
    breadcrumbItems,
    boothDetailFAQs
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
      <main id="main-content" role="main">
        {/* Breadcrumbs */}
        <div className="bg-white border-b border-neutral-200">
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
        <div className="bg-red-50 border-b-4 border-red-600">
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

      {/* Hero Section */}
      <div
        className="bg-white border-b border-neutral-200"
        data-ai-section="main-content"
        data-ai-type="entity-info"
        data-ai-importance="critical"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative h-64 sm:h-80 lg:h-[500px] bg-neutral-100">
              <BoothImage booth={booth} size="hero" showAiBadge={true} />
            </div>

            {/* Info */}
            <div className="p-6 lg:p-12">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
                    {booth.name}
                  </h1>
                  <div className="flex items-center gap-2 text-neutral-600 mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{locationString}</span>
                  </div>

                  {/* Verification Badge - Trust Signal */}
                  {booth.last_verified && isRecentlyVerified(booth.last_verified) && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border-2 border-green-600 rounded-lg mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-green-900 font-semibold text-sm">
                        Verified {formatDistanceToNow(new Date(booth.last_verified), { addSuffix: true })}
                      </span>
                    </div>
                  )}

                  {/* Hours Status & Distance */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <HoursStatus hours={booth.hours} />
                    {hasValidLocation && booth.latitude && booth.longitude && (
                      <DistanceDisplay boothLatitude={booth.latitude} boothLongitude={booth.longitude} />
                    )}
                  </div>

                  {/* Quick Stats Pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {booth.booth_type && (
                      <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded font-medium capitalize">
                        {booth.booth_type}
                      </span>
                    )}
                    {booth.machine_model && (
                      <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded font-medium">
                        {booth.machine_model}
                      </span>
                    )}
                    {booth.cost && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded font-medium">
                        {booth.cost}
                      </span>
                    )}
                  </div>

                  {/* Quick Info Pills Above the Fold */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* Show verification status badges */}
                    {isClosedOrInvalid && (
                      <span className="bg-red-600 text-white px-3 py-1.5 text-sm font-bold rounded-md flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Unverified - Use Caution
                      </span>
                    )}
                    {!isClosedOrInvalid && booth.status === 'active' && !booth.needs_verification && (
                      <span className="bg-green-500 text-white px-3 py-1.5 text-sm font-medium rounded-md">
                        ✓ Currently Operational
                      </span>
                    )}
                    {!isClosedOrInvalid && (booth.status === 'unverified' || booth.needs_verification) && (
                      <span className="bg-amber-500 text-white px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Needs Verification
                      </span>
                    )}
                    {booth.cost && (
                      <span className="bg-amber-500 text-white px-3 py-1.5 text-sm font-bold rounded-md">
                        {booth.cost} per strip
                      </span>
                    )}
                    {booth.hours && isOpenNow(booth.hours) && (
                      <span className="bg-blue-500 text-white px-3 py-1.5 text-sm font-medium rounded-md">
                        🕐 Open Now
                      </span>
                    )}
                    {booth.accepts_cash && !booth.accepts_card && (
                      <span className="bg-purple-500 text-white px-3 py-1.5 text-sm font-medium rounded-md">
                        💵 Cash Only
                      </span>
                    )}
                  </div>

                  {/* Google Rating */}
                  {booth.google_rating && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(booth.google_rating!)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-neutral-700">
                        {booth.google_rating.toFixed(1)}
                      </span>
                      {booth.google_user_ratings_total && (
                        <span className="text-sm text-neutral-500">
                          ({booth.google_user_ratings_total} reviews)
                        </span>
                      )}
                      <span className="text-xs text-neutral-400">· Google</span>
                    </div>
                  )}
                </div>
                <StatusBadge status={booth.status || 'active'} />
              </div>

              {/* Primary CTA - Hero Button with Vintage Amber Gradient */}
              {hasValidLocation && (
                <div className="mb-6">
                  <Button
                    size="xl"
                    className="w-full text-lg px-12 py-8 btn-vintage-amber shadow-2xl transform hover:scale-105 transition-all duration-200 font-bold text-white"
                    asChild
                  >
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${booth.latitude},${booth.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="w-6 h-6 mr-3" />
                      Get Directions Now
                    </a>
                  </Button>
                </div>
              )}

              {/* Secondary Actions */}
              <div className="flex flex-wrap gap-2 mb-8">
                <BookmarkButton boothId={booth.id} variant="default" />
                {hasValidLocation && (
                  <>
                    <Button variant="outline" asChild>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${booth.latitude},${booth.longitude}&query_place_id=${booth.google_place_id || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in Google Maps"
                      >
                        <Map className="w-4 h-4 mr-2" />
                        Google Maps
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a
                        href={`http://maps.apple.com/?q=${encodeURIComponent(booth.name)}&ll=${booth.latitude},${booth.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in Apple Maps"
                      >
                        <Map className="w-4 h-4 mr-2" />
                        Apple Maps
                      </a>
                    </Button>
                  </>
                )}
                <ShareButton
                  title={`${booth.name} - ${locationString}`}
                  text={`Check out this photo booth: ${booth.name}`}
                />
              </div>

              {/* Details */}
              {booth.description && (
                <div
                  className="mb-6"
                  data-ai-section="content"
                  data-ai-type="descriptive"
                  data-ai-importance="medium"
                >
                  <p className="text-neutral-700 leading-relaxed">{booth.description}</p>
                </div>
              )}

              {/* Machine Info */}
              {(booth.machine_model || booth.machine_manufacturer || booth.operator_name) && (
                <div className="space-y-2 mb-6">
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                    Machine Details
                  </h3>
                  {booth.machine_model && (
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Model</span>
                      <Link
                        href={`/machines/${booth.machine_model.toLowerCase().replace(/\s+/g, '-')}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {booth.machine_model}
                      </Link>
                    </div>
                  )}
                  {booth.machine_manufacturer && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Manufacturer</span>
                      <span className="font-medium">{booth.machine_manufacturer}</span>
                    </div>
                  )}
                  {booth.operator_name && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Operator</span>
                      <span className="font-medium">{booth.operator_name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Visit Info */}
              <div
                className="space-y-2"
                data-ai-section="practical-info"
                data-ai-type="actionable"
                data-ai-importance="high"
              >
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                  Visit Info
                </h3>
                {booth.cost && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Cost
                    </span>
                    <span className="font-medium">{booth.cost}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="text-neutral-700 font-semibold flex items-center mb-2">
                    <Clock className="w-4 h-4 mr-1" />
                    Hours
                  </div>
                  <StructuredHours hours={booth.hours} />
                </div>
                {(booth.accepts_cash || booth.accepts_card) && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Payment</span>
                    <div className="flex gap-2">
                      {booth.accepts_cash && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                          💵 Cash
                        </span>
                      )}
                      {booth.accepts_card && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                          💳 Card
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Last Updated Timestamp */}
                {booth.updated_at && (
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <div className="text-xs text-neutral-500">
                      <span className="font-medium">Last updated:</span>{' '}
                      <time dateTime={booth.updated_at}>
                        {formatLastUpdated(booth.updated_at)}
                      </time>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Add bottom padding on mobile for sticky bar */}
      <div className="max-w-7xl mx-auto p-4 lg:p-8 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Access Instructions */}
            {booth.access_instructions && (
              <Card className="p-6 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-1">Access Instructions</h3>
                    <p className="text-amber-800 text-sm">{booth.access_instructions}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Historical Notes */}
            {booth.historical_notes && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-3">Historical Notes</h2>
                <p className="text-neutral-700 leading-relaxed">{booth.historical_notes}</p>
              </Card>
            )}

            {/* Street View - Only show if we have a proper address, not just city name */}
            {hasValidLocation &&
             booth.latitude &&
             booth.longitude &&
             booth.address &&
             booth.address !== booth.city &&
             booth.address.length > 10 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Street View</h2>
                <StreetViewEmbed
                  latitude={booth.latitude}
                  longitude={booth.longitude}
                  boothName={booth.name}
                />
              </div>
            )}

            {/* Photos Section */}
            {(booth.photo_exterior_url || booth.photo_interior_url || booth.google_photos) ? (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Photos</h2>

                {/* Enhanced Photo Gallery with Lightbox */}
                <PhotoGallery
                  photos={[
                    ...(booth.photo_exterior_url ? [booth.photo_exterior_url] : []),
                    ...(booth.photo_interior_url ? [booth.photo_interior_url] : []),
                    ...(booth.google_photos || []),
                  ]}
                  boothName={booth.name}
                />
              </Card>
            ) : null}

            {/* Community Photo Upload */}
            <CommunityPhotoUpload boothId={booth.id} boothName={booth.name} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Info Card */}
            {(booth.phone || booth.website || booth.instagram) && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Contact</h3>
                <div className="space-y-3">
                  {booth.phone && (
                    <a
                      href={`tel:${booth.phone}`}
                      className="flex items-center gap-3 p-3 -m-3 rounded-lg hover:bg-primary/5 text-neutral-700 hover:text-primary transition group"
                    >
                      <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition">
                        <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-neutral-500 uppercase font-medium tracking-wide">Call Now</div>
                        <div className="text-sm font-semibold">{booth.phone}</div>
                      </div>
                    </a>
                  )}
                  {booth.website && (
                    <a
                      href={booth.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-neutral-700 hover:text-primary transition"
                    >
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">Website</span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  )}
                  {booth.instagram && (
                    <a
                      href={`https://instagram.com/${booth.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-neutral-700 hover:text-primary transition"
                    >
                      <Instagram className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">@{booth.instagram.replace('@', '')}</span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Location Card */}
            <Card
              className="p-6"
              data-ai-section="location-data"
              data-ai-type="factual"
              data-ai-importance="critical"
            >
              <h3 className="font-semibold text-lg mb-4">Location</h3>

              {/* Map */}
              {hasValidLocation && booth.latitude && booth.longitude && (
                <div className="mb-4 rounded-lg overflow-hidden h-48">
                  <BoothMap
                    booths={[booth]}
                    center={{ lat: booth.latitude, lng: booth.longitude }}
                    zoom={15}
                    showUserLocation={false}
                  />
                </div>
              )}

              {!hasValidLocation && (
                <div className="mb-4 rounded-lg overflow-hidden h-48 bg-neutral-100 flex items-center justify-center text-neutral-500 text-sm">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Location coordinates not available</p>
                  </div>
                </div>
              )}

              {/* Address */}
              <div className="space-y-3">
                <div className="text-sm space-y-1">
                  <div className="text-neutral-600 mb-1">Address</div>
                  <div className="text-neutral-900">{address}</div>
                  {booth.postal_code && (
                    <div className="text-neutral-900">{booth.postal_code}</div>
                  )}
                  <div className="text-neutral-900">
                    {city}{booth.state ? `, ${booth.state}` : ''}{country ? `, ${country}` : ''}
                  </div>
                </div>

                {hasValidLocation && booth.latitude && booth.longitude && (
                  <>
                    <CopyAddressButton address={address} />

                    <Button variant="default" size="sm" className="w-full" asChild>
                      <a
                        href={
                          booth.google_place_id
                            ? `https://www.google.com/maps/place/?q=place_id:${booth.google_place_id}`
                            : `https://www.google.com/maps/search/?api=1&query=${booth.latitude},${booth.longitude}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {booth.google_place_id ? 'View on Google Maps' : 'Open in Google Maps'}
                      </a>
                    </Button>
                  </>
                )}

                {!hasValidLocation && (
                  <div className="text-xs text-neutral-500 italic mt-2">
                    Precise coordinates not available for this booth.
                  </div>
                )}
              </div>
            </Card>

            {/* Social Proof */}
            <SocialProof
              favoriteCount={booth.favorite_count || 0}
              visitCount={booth.visit_count || 0}
            />

            {/* Community Stats */}
            <BoothStats boothId={booth.id} />

            {/* Visit Checklist */}
            <VisitChecklist
              boothName={booth.name}
              hasHours={!!booth.hours}
              acceptsCash={booth.accepts_cash || false}
              acceptsCard={booth.accepts_card || false}
              cost={booth.cost || undefined}
            />

            {/* Report Issue - Priority 3 Implementation */}
            <ReportIssueButton boothId={booth.id} boothName={booth.name} />
          </div>
        </div>

        {/* Discovery Section - City, Nearby & Similar Booths */}
        {hasValidLocation && booth.latitude && booth.longitude && (
          <div className="mt-12 space-y-8">
            <h2 className="text-2xl font-bold">Discover More Booths</h2>

            {/* City-Specific Booths */}
            <CityBooths
              boothId={booth.id}
              city={city}
              state={booth.state}
              country={country}
              limit={6}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Nearby Booths */}
              <NearbyBooths
                boothId={booth.id}
                latitude={booth.latitude}
                longitude={booth.longitude}
                radiusKm={25}
                limit={6}
              />

              {/* Similar Booths */}
              <SimilarBooths boothId={booth.id} limit={6} />
            </div>
          </div>
        )}

        {/* If no valid location, still show city and similar booths */}
        {!hasValidLocation && (
          <div className="mt-12 space-y-8">
            <h2 className="text-2xl font-bold">You Might Also Like</h2>

            {/* City-Specific Booths */}
            <CityBooths
              boothId={booth.id}
              city={city}
              state={booth.state}
              country={country}
              limit={6}
            />

            <SimilarBooths boothId={booth.id} limit={6} />
          </div>
        )}

        {/* Source Attribution Footer */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <div className="text-center text-sm text-neutral-500">
            <p>
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
      </main>
    </div>
  );
}
