import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { Wrench, Calendar, MapPin, Book, Factory, Globe, Camera, ArrowRight, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BoothCard } from '@/components/booth/BoothCard';
import { BoothMap } from '@/components/booth/BoothMap';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { createPublicServerClient } from '@/lib/supabase';
import { Booth } from '@/types';
import {
  getMachineDataBySlug,
  getMachineDataByName,
  getAllMachineModelSlugs,
  normalizeMachineModel,
  MachineModelData,
} from '@/lib/machineData';
import { generateBreadcrumbSchema, serializeSchema } from '@/lib/schema-utils';

interface MachineModelPageProps {
  params: Promise<{
    model: string;
  }>;
}

// Generate static params for known machine models
export async function generateStaticParams() {
  const slugs = getAllMachineModelSlugs();
  return slugs.map((model) => ({ model }));
}

// ISR: Revalidate every 30 minutes
export const revalidate = 1800;

async function getBoothsWithModel(modelSlug: string): Promise<Booth[]> {
  const supabase = createPublicServerClient();

  // Get all active booths and filter by machine model
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('status', 'active')
    .not('machine_model', 'is', null);

  if (error) {
    console.error('Error fetching booths:', error);
    return [];
  }

  // Filter booths that match this model
  const matchingBooths = (data as Booth[]).filter((booth) => {
    const normalizedModel = normalizeMachineModel(booth.machine_model);
    return normalizedModel === modelSlug;
  });

  return matchingBooths;
}

async function getMachineData(modelSlug: string): Promise<{
  machineData: MachineModelData | null;
  booths: Booth[];
}> {
  // Get machine data from our content library
  let machineData = getMachineDataBySlug(modelSlug);

  // Get booths with this machine model
  const booths = await getBoothsWithModel(modelSlug);

  // If no machine data found, try to find it by name from the database
  if (!machineData && booths.length > 0) {
    const firstBoothModel = booths[0].machine_model;
    if (firstBoothModel) {
      machineData = getMachineDataByName(firstBoothModel);
    }
  }

  return { machineData, booths };
}

export async function generateMetadata({ params }: MachineModelPageProps): Promise<Metadata> {
  const { model } = await params;
  const { machineData, booths } = await getMachineData(model);

  if (!machineData && booths.length === 0) {
    return { title: 'Machine Not Found | Booth Beacon' };
  }

  const machineName = machineData?.name || model.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const manufacturer = machineData?.manufacturer || 'Unknown Manufacturer';
  const description = machineData?.description ||
    `Discover ${machineName} photo booths. Find ${booths.length} locations with this classic analog machine model.`;

  return {
    title: `${machineName} Photo Booths | Booth Beacon`,
    description,
    keywords: [
      machineName,
      manufacturer,
      'photo booth',
      'analog photo booth',
      'vintage photo booth',
      `${machineName} locations`,
      'photo booth machine',
    ],
    openGraph: {
      title: `${machineName} Photo Booths | Booth Beacon`,
      description,
      type: 'website',
      url: `https://boothbeacon.org/machines/${model}`,
    },
  };
}

export default async function MachineModelPage({ params }: MachineModelPageProps) {
  const { model } = await params;
  const { machineData, booths } = await getMachineData(model);

  // Show 404 if no machine data and no booths
  if (!machineData && booths.length === 0) {
    notFound();
  }

  // Calculate map center from booths with coordinates
  const boothsWithCoords = booths.filter(b => b.latitude && b.longitude);
  const mapCenter = boothsWithCoords.length > 0
    ? {
      lat: boothsWithCoords.reduce((sum, b) => sum + (b.latitude || 0), 0) / boothsWithCoords.length,
      lng: boothsWithCoords.reduce((sum, b) => sum + (b.longitude || 0), 0) / boothsWithCoords.length,
    }
    : undefined;

  // Get unique countries and cities
  const countries = [...new Set(booths.map(b => b.country).filter(Boolean))];
  const cities = [...new Set(booths.map(b => b.city).filter(Boolean))];

  const machineName = machineData?.name || model.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://boothbeacon.org' },
    { name: 'Machines', url: 'https://boothbeacon.org/machines' },
    { name: machineName, url: `https://boothbeacon.org/machines/${model}` },
  ]);

  // Product schema for the machine model
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://boothbeacon.org/machines/${model}#product`,
    name: `${machineName} Photo Booth`,
    description: machineData?.description || `${machineName} analog photo booth machine`,
    category: 'Photo Booth Machine',
    brand: {
      '@type': 'Brand',
      name: machineData?.manufacturer || 'Unknown',
    },
    manufacturer: {
      '@type': 'Organization',
      name: machineData?.manufacturer || 'Unknown',
      ...(machineData?.countryOfOrigin && {
        address: {
          '@type': 'PostalAddress',
          addressCountry: machineData.countryOfOrigin,
        },
      }),
    },
    ...(machineData?.yearsProduced && {
      productionDate: machineData.yearsProduced,
    }),
    ...(machineData?.specifications && {
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Photo Type',
          value: machineData.specifications.photoType === 'black-and-white' ? 'Black & White' :
            machineData.specifications.photoType === 'color' ? 'Color' : 'Black & White and Color',
        },
        {
          '@type': 'PropertyValue',
          name: 'Photo Format',
          value: machineData.specifications.photoFormat,
        },
        ...(machineData.specifications.technology ? [{
          '@type': 'PropertyValue',
          name: 'Technology',
          value: machineData.specifications.technology,
        }] : []),
      ],
    }),
    ...(machineData?.officialWebsite && {
      url: machineData.officialWebsite,
    }),
    isRelatedTo: booths.slice(0, 5).map(booth => ({
      '@type': 'Place',
      name: booth.name,
      url: `https://boothbeacon.org/booth/${booth.slug}`,
    })),
  };

  // Collection page schema for the booth list
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${machineName} Photo Booth Locations`,
    description: `Find all ${booths.length} ${machineName} photo booth locations worldwide`,
    url: `https://boothbeacon.org/machines/${model}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: booths.length,
      itemListElement: booths.slice(0, 20).map((booth, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Place',
          name: booth.name,
          address: {
            '@type': 'PostalAddress',
            addressLocality: booth.city,
            addressCountry: booth.country,
          },
          url: `https://boothbeacon.org/booth/${booth.slug}`,
        },
      })),
    },
  };

  return (
    <>
      <Header />
      <Script
        id="machine-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchema(breadcrumbSchema) }}
      />
      <Script
        id="machine-product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Script
        id="machine-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <main className="min-h-screen bg-neutral-50">
        {/* Hero Section */}
        <div
          className="bg-gradient-to-br from-neutral-900 to-neutral-700 text-white"
          data-ai-section="hero"
          data-ai-content-type="machine-model"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <Badge variant="secondary" className="bg-white/20 text-white mb-4">
              <Wrench className="w-3 h-3 mr-1" />
              Machine Model
            </Badge>
            <h1
              className="font-display text-5xl font-semibold mb-4"
              data-ai-heading="main"
              data-ai-machine-name={machineName}
            >
              {machineName}
            </h1>
            {machineData?.manufacturer && (
              <p
                className="text-xl text-white/90 flex items-center gap-2 mb-4"
                data-ai-manufacturer={machineData.manufacturer}
              >
                <Factory className="w-5 h-5" />
                by {machineData.manufacturer}
              </p>
            )}
            <div className="flex flex-wrap gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span data-ai-stat="booth-count">{booths.length} booths</span>
              </div>
              {countries.length > 0 && (
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  <span data-ai-stat="country-count">{countries.length} {countries.length === 1 ? 'country' : 'countries'}</span>
                </div>
              )}
              {machineData?.yearsProduced && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span data-ai-production-years={machineData.yearsProduced}>{machineData.yearsProduced}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map Section */}
              {mapCenter && boothsWithCoords.length > 0 && (
                <Card className="p-6" data-ai-section="map">
                  <h2 className="font-display text-2xl font-semibold mb-4">
                    Where to Find {machineName} Booths
                  </h2>
                  <div className="h-96 rounded-lg overflow-hidden">
                    <BoothMap
                      booths={boothsWithCoords}
                      center={mapCenter}
                      zoom={3}
                      showUserLocation={true}
                    />
                  </div>
                  <p className="text-sm text-neutral-500 mt-3">
                    Showing {boothsWithCoords.length} {machineName} booths across {cities.length} cities
                  </p>
                </Card>
              )}

              {/* About Section */}
              {machineData?.description && (
                <Card className="p-6" data-ai-section="about">
                  <h2
                    className="font-display text-2xl font-semibold mb-4"
                    data-ai-heading="section"
                  >
                    About {machineName}
                  </h2>
                  <p
                    className="text-neutral-700 leading-relaxed"
                    data-ai-content="description"
                  >
                    {machineData.description}
                  </p>
                </Card>
              )}

              {/* History Section */}
              {machineData?.history && (
                <Card className="p-6" data-ai-section="history">
                  <h2
                    className="font-display text-2xl font-semibold mb-4"
                    data-ai-heading="section"
                  >
                    History
                  </h2>
                  <div
                    className="text-neutral-700 leading-relaxed whitespace-pre-line"
                    data-ai-content="history"
                  >
                    {machineData.history}
                  </div>
                </Card>
              )}

              {/* Typical Features */}
              {machineData?.typicalFeatures && machineData.typicalFeatures.length > 0 && (
                <Card className="p-6" data-ai-section="features">
                  <h2
                    className="font-display text-2xl font-semibold mb-4"
                    data-ai-heading="section"
                  >
                    Typical Features
                  </h2>
                  <ul className="space-y-2" data-ai-content="features-list">
                    {machineData.typicalFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-1">*</span>
                        <span className="text-neutral-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Fun Facts */}
              {machineData?.funFacts && machineData.funFacts.length > 0 && (
                <Card className="p-6 bg-amber-50 border-amber-200" data-ai-section="fun-facts">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-amber-600" />
                    Fun Facts
                  </h3>
                  <ul className="space-y-3" data-ai-content="fun-facts-list">
                    {machineData.funFacts.map((fact, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">-</span>
                        <span className="text-neutral-700">{fact}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Collector Notes */}
              {machineData?.collectorNotes && (
                <Card className="p-6 bg-blue-50 border-blue-200" data-ai-section="collector-notes">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Book className="w-5 h-5 text-blue-600" />
                    Collector Notes
                  </h3>
                  <p
                    className="text-neutral-700 leading-relaxed"
                    data-ai-content="collector-notes"
                  >
                    {machineData.collectorNotes}
                  </p>
                </Card>
              )}

              {/* Booth Listings */}
              <div data-ai-section="booth-listings">
                <h2
                  className="font-display text-2xl font-semibold mb-6"
                  data-ai-heading="section"
                >
                  {machineName} Booth Locations ({booths.length})
                </h2>
                {booths.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Camera className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-600 mb-4">No booths found with this model</p>
                    <Link href="/submit">
                      <Button variant="outline">
                        Submit a {machineName} Booth
                      </Button>
                    </Link>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {booths.slice(0, 12).map((booth) => (
                      <BoothCard key={booth.id} booth={booth} />
                    ))}
                  </div>
                )}

                {booths.length > 12 && (
                  <div className="text-center mt-8">
                    <Link href={`/search?machine_model=${encodeURIComponent(machineName)}`}>
                      <Button variant="outline" size="lg">
                        View All {booths.length} {machineName} Booths
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Specifications Card */}
              <Card className="p-6" data-ai-section="specifications">
                <h3 className="font-semibold text-lg mb-4">Specifications</h3>
                <dl className="space-y-3">
                  {machineData?.manufacturer && (
                    <div>
                      <dt className="text-sm text-neutral-600">Manufacturer</dt>
                      <dd className="font-medium" data-ai-spec="manufacturer">{machineData.manufacturer}</dd>
                    </div>
                  )}
                  {machineData?.countryOfOrigin && (
                    <div>
                      <dt className="text-sm text-neutral-600">Country of Origin</dt>
                      <dd className="font-medium" data-ai-spec="country">{machineData.countryOfOrigin}</dd>
                    </div>
                  )}
                  {machineData?.yearsProduced && (
                    <div>
                      <dt className="text-sm text-neutral-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Years Produced
                      </dt>
                      <dd className="font-medium" data-ai-spec="years">{machineData.yearsProduced}</dd>
                    </div>
                  )}
                  {machineData?.specifications?.photoType && (
                    <div>
                      <dt className="text-sm text-neutral-600">Photo Type</dt>
                      <dd className="font-medium" data-ai-spec="photo-type">
                        {machineData.specifications.photoType === 'black-and-white' ? 'Black & White' :
                          machineData.specifications.photoType === 'color' ? 'Color' : 'Black & White and Color'}
                      </dd>
                    </div>
                  )}
                  {machineData?.specifications?.photoFormat && (
                    <div>
                      <dt className="text-sm text-neutral-600">Photo Format</dt>
                      <dd className="font-medium" data-ai-spec="format">{machineData.specifications.photoFormat}</dd>
                    </div>
                  )}
                  {machineData?.specifications?.processingTime && (
                    <div>
                      <dt className="text-sm text-neutral-600">Processing Time</dt>
                      <dd className="font-medium" data-ai-spec="processing-time">{machineData.specifications.processingTime}</dd>
                    </div>
                  )}
                  {machineData?.specifications?.technology && (
                    <div>
                      <dt className="text-sm text-neutral-600">Technology</dt>
                      <dd className="font-medium" data-ai-spec="technology">{machineData.specifications.technology}</dd>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <dt className="text-sm text-neutral-600">Active Locations</dt>
                    <dd className="font-medium text-lg text-primary" data-ai-spec="locations">{booths.length} booths</dd>
                  </div>
                </dl>
              </Card>

              {/* Location Summary */}
              {(countries.length > 0 || cities.length > 0) && (
                <Card className="p-6" data-ai-section="location-summary">
                  <h3 className="font-semibold text-lg mb-4">Where to Find</h3>
                  {countries.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-neutral-600 mb-2">Countries</p>
                      <div className="flex flex-wrap gap-1">
                        {countries.slice(0, 10).map((country) => (
                          <Badge key={country} variant="secondary" className="text-xs">
                            {country}
                          </Badge>
                        ))}
                        {countries.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{countries.length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {cities.length > 0 && (
                    <div>
                      <p className="text-sm text-neutral-600 mb-2">Top Cities</p>
                      <div className="flex flex-wrap gap-1">
                        {cities.slice(0, 8).map((city) => (
                          <Badge key={city} variant="outline" className="text-xs">
                            {city}
                          </Badge>
                        ))}
                        {cities.length > 8 && (
                          <Badge variant="outline" className="text-xs">
                            +{cities.length - 8} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Related Models */}
              {machineData?.relatedModels && machineData.relatedModels.length > 0 && (
                <Card className="p-6" data-ai-section="related-models">
                  <h3 className="font-semibold text-lg mb-4">Related Models</h3>
                  <div className="space-y-2">
                    {machineData.relatedModels.map((relatedSlug) => (
                      <Link
                        key={relatedSlug}
                        href={`/machines/${relatedSlug}`}
                        className="flex items-center gap-2 text-neutral-700 hover:text-primary transition"
                      >
                        <Camera className="w-4 h-4" />
                        <span className="capitalize">{relatedSlug.replace(/-/g, ' ')}</span>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              {/* Official Website */}
              {machineData?.officialWebsite && (
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Official Website</h3>
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href={machineData.officialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                </Card>
              )}

              {/* CTA Card */}
              <Card className="p-6 bg-primary text-white">
                <h3 className="font-semibold text-lg mb-3">Know a {machineName} Booth?</h3>
                <p className="text-white/90 mb-4 text-sm">
                  Help us expand our directory by submitting new booth locations.
                </p>
                <Link href="/submit">
                  <Button variant="secondary" className="w-full">
                    Submit a Booth
                  </Button>
                </Link>
              </Card>

              {/* Back to Machines */}
              <Link href="/machines">
                <Button variant="ghost" className="w-full">
                  <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                  All Machine Models
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
