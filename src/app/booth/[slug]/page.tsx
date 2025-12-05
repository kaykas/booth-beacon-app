import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  Camera,
} from 'lucide-react';
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
import { createPublicServerClient } from '@/lib/supabase';
import { normalizeBooth, RenderableBooth } from '@/lib/boothViewModel';
import {
  generateLocalBusinessSchema,
  generateBreadcrumbSchema,
  injectStructuredData,
} from '@/lib/seo/structuredData';

interface BoothDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
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
export async function generateStaticParams() {
  try {
    const supabase = createPublicServerClient();
    const { data: booths, error } = await supabase
      .from('booths')
      .select('slug')
      .not('slug', 'is', null);

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
      title: 'Booth Not Found | Booth Beacon',
      description: 'The photo booth you are looking for could not be found.',
    };
  }

  const city = booth.city || 'Unknown Location';
  const country = booth.country || '';
  const title = `${booth.name} - ${booth.locationLabel || city}${country ? `, ${country}` : ''} | Booth Beacon`;
  const description =
    booth.description || `Analog photo booth in ${booth.locationLabel || city}${country ? `, ${country}` : ''}.`;

  // Use AI-generated image or exterior photo for OG image if available
  const ogImage = booth.photo_exterior_url || booth.ai_generated_image_url || booth.ai_preview_url;

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
  };
}

export default async function BoothDetailPage({ params }: BoothDetailPageProps) {
  const { slug } = await params;
  const booth = await getBooth(slug);

  if (!booth) {
    notFound();
  }

  // Safe field access with defaults
  const locationString = booth.locationLabel;
  const address = booth.addressDisplay;
  const hasValidLocation = booth.hasValidLocation;
  const city = booth.city || 'Location Unknown';
  const country = booth.country || '';

  // Generate structured data
  const localBusinessSchema = generateLocalBusinessSchema(booth);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://boothbeacon.org' },
    { name: 'Booths', url: 'https://boothbeacon.org/map' },
    { name: booth.name, url: `https://boothbeacon.org/booth/${booth.slug}` },
  ]);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Structured Data - LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: injectStructuredData(localBusinessSchema) }}
      />

      {/* Structured Data - Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: injectStructuredData(breadcrumbSchema) }}
      />

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-neutral-600">
            <Link href="/" className="hover:text-primary transition">Home</Link>
            <span>/</span>
            <Link href="/map" className="hover:text-primary transition">Booths</Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium truncate max-w-[200px]">
              {booth.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white border-b border-neutral-200">
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

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mb-8">
                <BookmarkButton boothId={booth.id} variant="default" />
                {hasValidLocation && (
                  <Button variant="outline" asChild>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${booth.latitude},${booth.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Directions
                    </a>
                  </Button>
                )}
                <ShareButton
                  title={`${booth.name} - ${locationString}`}
                  text={`Check out this photo booth: ${booth.name}`}
                />
              </div>

              {/* Details */}
              {booth.description && (
                <div className="mb-6">
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
              <div className="space-y-2">
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
                {booth.hours ? (
                  <div className="space-y-2">
                    <div className="text-neutral-700 font-semibold flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Hours
                    </div>
                    <div className="text-sm text-neutral-900 space-y-0.5 pl-5">
                      {booth.hours.split('\n').map((line, i) => (
                        <div key={i} className="leading-relaxed">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500 italic py-2">
                    Hours not listed - check venue hours before visiting
                  </div>
                )}
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
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

            {/* Photos Section */}
            {(booth.photo_exterior_url || booth.photo_interior_url || booth.google_photos) ? (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Photos</h2>

                {/* Primary Photos */}
                {(booth.photo_exterior_url || booth.photo_interior_url) && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {booth.photo_exterior_url && (
                      <div className="relative aspect-square bg-neutral-200 rounded-lg overflow-hidden">
                        <Image
                          src={booth.photo_exterior_url}
                          alt={`${booth.name} exterior`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    {booth.photo_interior_url && (
                      <div className="relative aspect-square bg-neutral-200 rounded-lg overflow-hidden">
                        <Image
                          src={booth.photo_interior_url}
                          alt={`${booth.name} interior`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Google Photos Gallery */}
                {booth.google_photos && booth.google_photos.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 text-sm text-neutral-500">Photos from Google</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {booth.google_photos.slice(0, 6).map((url, i) => (
                        <div key={i} className="relative aspect-square bg-neutral-200 rounded-lg overflow-hidden">
                          <Image
                            src={url}
                            alt={`${booth.name} photo ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-8 bg-gradient-to-br from-neutral-100 to-neutral-200 text-center">
                <Camera className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                <h3 className="font-semibold text-neutral-700 mb-2 text-lg">
                  This booth needs photos!
                </h3>
                <p className="text-neutral-600 text-sm mb-4">
                  Help others discover this booth by sharing photos of its exterior or interior
                </p>
                <Button variant="outline" size="sm" disabled className="cursor-not-allowed">
                  Upload Photos (Coming Soon)
                </Button>
              </Card>
            )}
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
                      className="flex items-center gap-3 text-neutral-700 hover:text-primary transition"
                    >
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{booth.phone}</span>
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
            <Card className="p-6">
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

            {/* Community Stats */}
            <BoothStats boothId={booth.id} />

            {/* Report Issue */}
            <Card className="p-6 bg-neutral-50">
              <h3 className="font-semibold text-sm mb-2">Report an Issue</h3>
              <p className="text-sm text-neutral-600 mb-3">
                Found incorrect information? Let us know.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Report Issue
              </Button>
            </Card>
          </div>
        </div>

        {/* Discovery Section - Nearby & Similar Booths */}
        {hasValidLocation && booth.latitude && booth.longitude && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Discover More Booths</h2>
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

        {/* If no valid location, still show similar booths */}
        {!hasValidLocation && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
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
    </div>
  );
}
