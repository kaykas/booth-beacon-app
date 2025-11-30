import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Navigation,
  Copy,
  ExternalLink,
  Clock,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/booth/StatusBadge';
import { BoothImage } from '@/components/booth/BoothImage';
import { BoothMap } from '@/components/booth/BoothMap';
import { BookmarkButton } from '@/components/BookmarkButton';
import { ShareButton } from '@/components/ShareButton';
import { createServerClient } from '@/lib/supabase';
import { Booth } from '@/types';

interface BoothDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Fetch booth with proper error handling
async function getBooth(slug: string): Promise<Booth | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('booths')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      console.error(`Booth not found: "${slug}"`, error?.message);
      return null;
    }

    return data as Booth;
  } catch (error) {
    console.error(`Error fetching booth "${slug}":`, error);
    return null;
  }
}

// ISR: Revalidate every 5 minutes
export const revalidate = 300;

export async function generateMetadata({ params }: BoothDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const booth = await getBooth(slug);

  if (!booth) {
    return { title: 'Booth Not Found | Booth Beacon' };
  }

  const city = booth.city || 'Unknown Location';
  const country = booth.country || '';
  const title = `${booth.name} - ${city}${country ? `, ${country}` : ''} | Booth Beacon`;
  const description = booth.description || `Analog photo booth in ${city}${country ? `, ${country}` : ''}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://boothbeacon.org/booth/${booth.slug}`,
      siteName: 'Booth Beacon',
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
  const city = booth.city || 'Location Unknown';
  const country = booth.country || '';
  const locationString = `${city}${country ? `, ${country}` : ''}`;
  const address = booth.address || 'Address not available';
  const hasValidLocation = booth.latitude && booth.longitude;

  return (
    <div className="min-h-screen bg-neutral-50">
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
            <div className="relative h-64 sm:h-80 lg:h-[500px]">
              <BoothImage booth={booth} size="hero" showAiBadge={true} />
            </div>

            {/* Info */}
            <div className="p-6 lg:p-12">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
                    {booth.name}
                  </h1>
                  <div className="flex items-center gap-2 text-neutral-600 mb-4">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{locationString}</span>
                  </div>
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
              {(booth.machine_model || booth.machine_manufacturer) && (
                <div className="space-y-2 mb-6">
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                    Machine Details
                  </h3>
                  {booth.machine_model && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Model</span>
                      <span className="font-medium">{booth.machine_model}</span>
                    </div>
                  )}
                  {booth.machine_manufacturer && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Manufacturer</span>
                      <span className="font-medium">{booth.machine_manufacturer}</span>
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
                {booth.hours && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Hours
                    </span>
                    <span className="font-medium">{booth.hours}</span>
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
            {(booth.photo_exterior_url || booth.photo_interior_url) && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Photos</h2>
                <div className="grid grid-cols-2 gap-4">
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
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Location Card */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Location</h3>

              {/* Map */}
              {hasValidLocation && (
                <div className="mb-4 rounded-lg overflow-hidden h-48">
                  <BoothMap
                    booths={[booth]}
                    center={{ lat: booth.latitude!, lng: booth.longitude! }}
                    zoom={15}
                    showUserLocation={false}
                  />
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

                {hasValidLocation && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigator.clipboard.writeText(address)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Address
                    </Button>

                    <Button variant="default" size="sm" className="w-full" asChild>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${booth.latitude},${booth.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in Google Maps
                      </a>
                    </Button>
                  </>
                )}
              </div>
            </Card>

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
