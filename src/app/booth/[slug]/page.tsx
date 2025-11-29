import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Navigation,
  Share2,
  Copy,
  ExternalLink,
  Clock,
  DollarSign,
  Camera,
  Star,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/booth/StatusBadge';
import { BoothImage } from '@/components/booth/BoothImage';
import { BoothCard } from '@/components/booth/BoothCard';
import { BoothMap } from '@/components/booth/BoothMap';
import { BookmarkButton } from '@/components/BookmarkButton';
import { PhotoUpload } from '@/components/PhotoUpload';
import { ReviewsSection } from '@/components/ReviewsSection';
import { ShareButton } from '@/components/ShareButton';
import { supabase } from '@/lib/supabase';
import { Booth } from '@/types';

interface BoothDetailPageProps {
  params: {
    slug: string;
  };
}

// Fetch booth data
async function getBooth(slug: string): Promise<Booth | null> {
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Booth;
}

// Fetch nearby booths
async function getNearbyBooths(booth: Booth, radiusKm: number = 5): Promise<Booth[]> {
  if (!booth.latitude || !booth.longitude) return [];

  // Approximate degrees for radius (1 degree ≈ 111km)
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((booth.latitude * Math.PI) / 180));

  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .neq('id', booth.id)
    .gte('latitude', booth.latitude - latDelta)
    .lte('latitude', booth.latitude + latDelta)
    .gte('longitude', booth.longitude - lngDelta)
    .lte('longitude', booth.longitude + lngDelta)
    .eq('status', 'active')
    .limit(3);

  if (error) return [];
  return (data as Booth[]) || [];
}

// ISR: Revalidate booth pages every 5 minutes
export const revalidate = 300;

export async function generateMetadata({ params }: BoothDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const booth = await getBooth(slug);

  if (!booth) {
    return {
      title: 'Booth Not Found | Booth Beacon',
    };
  }

  const mainPhoto = booth.photo_exterior_url || booth.ai_preview_url;
  const description = booth.description || `Analog photo booth in ${booth.city}, ${booth.country}. ${booth.machine_model ? `Features a ${booth.machine_model}` : ''} ${booth.photo_type ? `${booth.photo_type} photo booth` : ''}`.trim();

  return {
    title: `${booth.name} - ${booth.city}, ${booth.country} | Booth Beacon`,
    description,
    keywords: [
      'photo booth',
      'analog photo booth',
      booth.city,
      booth.country,
      booth.machine_model,
      booth.machine_manufacturer,
      'photobooth',
      'instant photos',
    ].filter((k): k is string => typeof k === 'string' && k.length > 0),
    openGraph: {
      title: `${booth.name} - ${booth.city}, ${booth.country}`,
      description,
      type: 'website',
      url: `https://boothbeacon.org/booth/${booth.slug}`,
      images: mainPhoto ? [
        {
          url: mainPhoto,
          width: 1200,
          height: 630,
          alt: `${booth.name} in ${booth.city}`,
        }
      ] : [],
      siteName: 'Booth Beacon',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${booth.name} - ${booth.city}, ${booth.country}`,
      description,
      images: mainPhoto ? [mainPhoto] : [],
    },
    alternates: {
      canonical: `https://boothbeacon.org/booth/${booth.slug}`,
    },
  };
}

export default async function BoothDetailPage({ params }: BoothDetailPageProps) {
  const { slug } = await params;
  const booth = await getBooth(slug);

  if (!booth) {
    notFound();
  }

  const nearbyBooths = await getNearbyBooths(booth);

  // Photo URLs
  const photos = [
    booth.photo_exterior_url,
    booth.photo_interior_url,
    ...(booth.photo_sample_strips || []),
  ].filter(Boolean);

  const hasPhotos = photos.length > 0;
  const mainPhoto = hasPhotos ? photos[0] : booth.ai_preview_url;

  // Generate enhanced structured data for SEO (LocalBusiness + Place)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://boothbeacon.org/booth/${booth.slug}`,
    name: booth.name,
    description: booth.description || `Analog photo booth in ${booth.city}, ${booth.country}. ${booth.machine_model ? `Features a ${booth.machine_model} machine` : ''} ${booth.photo_type ? `producing ${booth.photo_type} photos` : ''}`.trim(),
    url: `https://boothbeacon.org/booth/${booth.slug}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: booth.address,
      addressLocality: booth.city,
      addressRegion: booth.state,
      postalCode: booth.postal_code,
      addressCountry: booth.country,
    },
    geo: booth.latitude && booth.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: booth.latitude,
      longitude: booth.longitude,
    } : undefined,
    image: photos.length > 0 ? photos : (booth.ai_preview_url ? [booth.ai_preview_url] : []),
    priceRange: booth.cost || 'Varies',
    paymentAccepted: [
      booth.accepts_cash && 'Cash',
      booth.accepts_card && 'Credit Card',
    ].filter(Boolean),
    openingHours: booth.hours,
    telephone: booth.phone || undefined,
    additionalType: 'https://schema.org/TouristAttraction',
    amenityFeature: [
      booth.booth_type && {
        '@type': 'LocationFeatureSpecification',
        name: 'Booth Type',
        value: booth.booth_type,
      },
      booth.photo_type && {
        '@type': 'LocationFeatureSpecification',
        name: 'Photo Type',
        value: booth.photo_type === 'black-and-white' ? 'Black & White' : booth.photo_type,
      },
      booth.machine_model && {
        '@type': 'LocationFeatureSpecification',
        name: 'Machine Model',
        value: booth.machine_model,
      },
      booth.machine_manufacturer && {
        '@type': 'LocationFeatureSpecification',
        name: 'Manufacturer',
        value: booth.machine_manufacturer,
      },
    ].filter(Boolean),
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-neutral-600" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition">
              Home
            </Link>
            <span>/</span>
            <Link href="/map" className="hover:text-primary transition">
              Booths
            </Link>
            <span>/</span>
            <Link href={`/guides/${booth.city.toLowerCase()}`} className="hover:text-primary transition">
              {booth.city}
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">{booth.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Photo Gallery */}
            <div className="relative h-96 lg:h-[600px]">
              <div className="w-full h-full">
                <BoothImage
                  booth={booth}
                  size="hero"
                  showAiBadge={true}
                />
              </div>

              {/* Photo Badge */}
              {booth.ai_preview_url && !hasPhotos && (
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                    AI Preview
                  </Badge>
                </div>
              )}

              {/* Photo Count */}
              {hasPhotos && photos.length > 1 && (
                <div className="absolute bottom-4 right-4">
                  <Badge variant="secondary" className="bg-black/70 text-white backdrop-blur">
                    <Camera className="w-3 h-3 mr-1" />
                    {photos.length} photos
                  </Badge>
                </div>
              )}
            </div>

            {/* Booth Info */}
            <div className="p-8 lg:p-12">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="font-display text-4xl font-semibold text-neutral-900 mb-2">
                    {booth.name}
                  </h1>
                  <div className="flex items-center gap-2 text-neutral-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {booth.city}, {booth.country}
                    </span>
                  </div>
                </div>
                <StatusBadge status={booth.status} />
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mb-8">
                <BookmarkButton boothId={booth.id} variant="default" />
                <PhotoUpload boothId={booth.id} />
                <Button
                  variant="outline"
                  asChild
                  className="flex-1 sm:flex-none"
                >
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${booth.latitude},${booth.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Directions
                  </a>
                </Button>
                <ShareButton
                  title={`${booth.name} - ${booth.city}, ${booth.country}`}
                  text={`Check out this photo booth: ${booth.name}`}
                />
              </div>

              {/* Key Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-sm text-neutral-500 uppercase tracking-wide mb-3">
                    Machine Details
                  </h3>
                  <dl className="space-y-2">
                    {booth.machine_model && (
                      <div className="flex justify-between">
                        <dt className="text-neutral-600">Model</dt>
                        <dd className="font-medium text-neutral-900">{booth.machine_model}</dd>
                      </div>
                    )}
                    {booth.machine_manufacturer && (
                      <div className="flex justify-between">
                        <dt className="text-neutral-600">Manufacturer</dt>
                        <dd className="font-medium text-neutral-900">{booth.machine_manufacturer}</dd>
                      </div>
                    )}
                    {booth.machine_year && (
                      <div className="flex justify-between">
                        <dt className="text-neutral-600">Year</dt>
                        <dd className="font-medium text-neutral-900">c. {booth.machine_year}</dd>
                      </div>
                    )}
                    {booth.photo_type && (
                      <div className="flex justify-between">
                        <dt className="text-neutral-600">Photo Type</dt>
                        <dd className="font-medium text-neutral-900 capitalize">
                          {booth.photo_type === 'black-and-white' ? 'Black & White' : booth.photo_type}
                        </dd>
                      </div>
                    )}
                    {booth.booth_type && (
                      <div className="flex justify-between">
                        <dt className="text-neutral-600">Booth Type</dt>
                        <dd className="font-medium text-neutral-900 capitalize">{booth.booth_type}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="border-t border-neutral-200 pt-6">
                  <h3 className="font-semibold text-sm text-neutral-500 uppercase tracking-wide mb-3">
                    Visit Info
                  </h3>
                  <dl className="space-y-2">
                    {booth.cost && (
                      <div className="flex justify-between">
                        <dt className="text-neutral-600 flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          Cost
                        </dt>
                        <dd className="font-medium text-neutral-900">{booth.cost}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-neutral-600">Payment</dt>
                      <dd className="font-medium text-neutral-900">
                        {booth.accepts_cash && booth.accepts_card
                          ? 'Cash & Card'
                          : booth.accepts_cash
                          ? 'Cash only'
                          : booth.accepts_card
                          ? 'Card only'
                          : 'Unknown'}
                      </dd>
                    </div>
                    {booth.hours && (
                      <div className="flex justify-between">
                        <dt className="text-neutral-600 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Hours
                        </dt>
                        <dd className="font-medium text-neutral-900">{booth.hours}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {(booth.description || booth.historical_notes) && (
              <Card className="p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">About This Booth</h2>
                {booth.description && (
                  <p className="text-neutral-700 mb-4 leading-relaxed">{booth.description}</p>
                )}
                {booth.historical_notes && (
                  <div className="bg-secondary p-4 rounded-lg">
                    <h3 className="font-semibold text-sm text-neutral-600 mb-2">Historical Notes</h3>
                    <p className="text-neutral-700 text-sm leading-relaxed">{booth.historical_notes}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Access Instructions */}
            {booth.access_instructions && (
              <Card className="p-6 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-1">Access Instructions</h3>
                    <p className="text-amber-800 text-sm">{booth.access_instructions}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Photo Gallery Tabs */}
            <Card className="p-6">
              <Tabs defaultValue="booth">
                <TabsList>
                  <TabsTrigger value="booth">Booth Photos</TabsTrigger>
                  <TabsTrigger value="strips">Sample Strips</TabsTrigger>
                  <TabsTrigger value="community">Community</TabsTrigger>
                </TabsList>

                <TabsContent value="booth" className="mt-6">
                  {booth.photo_exterior_url || booth.photo_interior_url ? (
                    <div className="grid grid-cols-2 gap-4">
                      {booth.photo_exterior_url && (
                        <div className="relative aspect-square bg-neutral-200 rounded-lg overflow-hidden">
                          <Image
                            src={booth.photo_exterior_url}
                            alt={`${booth.name} exterior photo`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                            loading="lazy"
                          />
                        </div>
                      )}
                      {booth.photo_interior_url && (
                        <div className="relative aspect-square bg-neutral-200 rounded-lg overflow-hidden">
                          <Image
                            src={booth.photo_interior_url}
                            alt={`${booth.name} interior photo`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Camera className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-600 mb-4">No booth photos yet</p>
                      <Button variant="outline">Add Photos</Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="strips" className="mt-6">
                  {booth.photo_sample_strips && booth.photo_sample_strips.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {booth.photo_sample_strips.map((url, index) => (
                        <div key={index} className="relative aspect-[3/4] bg-neutral-200 rounded-lg overflow-hidden">
                          <Image
                            src={url}
                            alt={`${booth.name} sample strip ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 33vw, 25vw"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Camera className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-600 mb-4">No sample strips yet</p>
                      <Button variant="outline">Add Sample Strip</Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="community" className="mt-6">
                  <div className="text-center py-12">
                    <Camera className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-600 mb-4">No community photos yet</p>
                    <Button variant="outline">Be the first to share!</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Reviews & Tips */}
            <ReviewsSection boothId={booth.id} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Location & Map */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Location</h3>

              {/* Map */}
              {booth.latitude && booth.longitude && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <BoothMap
                    booths={[booth]}
                    center={{ lat: booth.latitude, lng: booth.longitude }}
                    zoom={15}
                    showUserLocation={false}
                  />
                </div>
              )}

              {/* Address */}
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-neutral-600 mb-1">Address</div>
                  <div className="text-neutral-900">{booth.address}</div>
                  {booth.postal_code && (
                    <div className="text-neutral-900">{booth.postal_code}</div>
                  )}
                  <div className="text-neutral-900">
                    {booth.city}, {booth.state ? `${booth.state}, ` : ''}{booth.country}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(booth.address);
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Address
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${booth.latitude},${booth.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in Google Maps
                  </a>
                </Button>
              </div>
            </Card>

            {/* Operator Info */}
            {booth.operator_name && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Operator</h3>
                <div className="text-neutral-900 font-medium mb-2">{booth.operator_name}</div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/operators/${booth.operator_id}`}>
                    View all {booth.operator_name} booths
                  </Link>
                </Button>
              </Card>
            )}

            {/* Nearby Booths */}
            {nearbyBooths.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Nearby Booths</h3>
                <div className="space-y-4">
                  {nearbyBooths.map((nearby) => (
                    <Link
                      key={nearby.id}
                      href={`/booth/${nearby.slug}`}
                      className="block group"
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <BoothImage booth={nearby} size="thumbnail" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-neutral-900 group-hover:text-primary transition truncate">
                            {nearby.name}
                          </div>
                          <div className="text-sm text-neutral-600 truncate">
                            {nearby.city}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                  <Link href="/map">View All on Map</Link>
                </Button>
              </Card>
            )}

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
      </div>
    </div>
  );
}
