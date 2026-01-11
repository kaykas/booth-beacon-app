import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Camera, Clock, Star, Building2, ArrowRight, HelpCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BoothCard } from '@/components/booth/BoothCard';
import { BoothMap } from '@/components/booth/BoothMap';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createPublicServerClient } from '@/lib/supabase';
import { normalizeBooth, RenderableBooth } from '@/lib/boothViewModel';
import { Booth } from '@/types';
import { generateAIMetaTags, generateContentFreshnessSignals } from '@/lib/ai-meta-tags';

interface CityPageProps {
  params: Promise<{
    city: string;
  }>;
}

// City data for enhanced content
interface CityData {
  name: string;
  slug: string;
  country: string;
  state?: string;
  description: string;
  neighborhoods: string[];
  photographyCulture: string;
  localTips: string[];
}

// Helper to format city slug to display name
function formatCityName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper to create city slug
function createCitySlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Fetch booths for a city
async function getCityBooths(citySlug: string): Promise<{ booths: RenderableBooth[]; cityData: CityData | null }> {
  try {
    const supabase = createPublicServerClient();
    const cityName = formatCityName(citySlug);

    // Fetch booths matching city name (case-insensitive)
    const { data, error } = await supabase
      .from('booths')
      .select('*')
      .ilike('city', cityName)
      .neq('status', 'closed')
      .order('status', { ascending: true }) // Active first
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching city booths:', error);
      return { booths: [], cityData: null };
    }

    const booths = (data || [])
      .map(booth => normalizeBooth(booth))
      .filter((booth): booth is RenderableBooth => booth !== null);

    // Extract city data from first booth
    const firstBooth = booths[0];
    const cityData: CityData | null = firstBooth ? {
      name: firstBooth.city || cityName,
      slug: citySlug,
      country: firstBooth.country || '',
      state: firstBooth.state,
      description: generateCityDescription(firstBooth.city || cityName, firstBooth.country || '', booths.length),
      neighborhoods: extractNeighborhoods(booths),
      photographyCulture: generatePhotographyCulture(firstBooth.city || cityName, firstBooth.country || ''),
      localTips: generateLocalTips(firstBooth.city || cityName),
    } : null;

    return { booths, cityData };
  } catch (error) {
    console.error('Error in getCityBooths:', error);
    return { booths: [], cityData: null };
  }
}

// Get top 20 cities by booth count for static generation
async function getTopCities(): Promise<{ city: string; count: number }[]> {
  try {
    const supabase = createPublicServerClient();

    // Get city counts using raw query
    const { data, error } = await supabase
      .from('booths')
      .select('city')
      .neq('status', 'closed')
      .not('city', 'is', null);

    if (error) {
      console.error('Error fetching cities:', error);
      return [];
    }

    // Count booths per city
    const cityCounts = ((data || []) as { city: string | null }[]).reduce((acc, booth) => {
      const city = booth.city;
      if (city) {
        acc[city] = (acc[city] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Sort by count and take top 20
    return Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  } catch (error) {
    console.error('Error in getTopCities:', error);
    return [];
  }
}

// Generate city description
function generateCityDescription(city: string, country: string, boothCount: number): string {
  const descriptions: Record<string, string> = {
    'Berlin': `Berlin is the undisputed capital of analog photo booth culture. With ${boothCount} photo booths scattered across the city, from trendy Kreuzberg to historic Mitte, Berlin offers photographers a unique blend of vintage technology and urban exploration.`,
    'New York': `New York City's photo booth scene spans all five boroughs, with ${boothCount} analog machines preserving moments in this city that never sleeps. From Times Square to Brooklyn's hip neighborhoods, NYC delivers classic photo booth experiences.`,
    'London': `London's rich photographic heritage includes ${boothCount} analog photo booths, from the classic Tube station machines to hidden gems in Soho and Shoreditch. The city offers a quintessentially British photo booth experience.`,
    'Paris': `Paris, the city of light, hosts ${boothCount} analog photo booths in its romantic arrondissements. From the Latin Quarter to Montmartre, capture your Parisian moments in authentic photochemical style.`,
    'Tokyo': `Tokyo blends tradition with technology, featuring ${boothCount} analog photo booths alongside its famous purikura. Discover vintage machines in Shibuya, Shinjuku, and beyond.`,
    'San Francisco': `San Francisco's photo booth culture reflects its creative spirit, with ${boothCount} analog machines in neighborhoods from the Mission to North Beach. Bay Area photographers treasure these vintage gems.`,
  };

  return descriptions[city] ||
    `Discover ${boothCount} analog photo booth${boothCount !== 1 ? 's' : ''} in ${city}${country ? `, ${country}` : ''}. Find authentic photochemical machines for classic photo strip experiences.`;
}

// Generate photography culture content
function generatePhotographyCulture(city: string, country: string): string {
  const cultures: Record<string, string> = {
    'Berlin': 'Berlin has been at the forefront of analog photography revival since the early 2000s. The city\'s thriving underground scene, combined with a strong appreciation for vintage aesthetics, has made photo booths a beloved cultural institution. Many booths here date back to the Cold War era, adding historical significance to every photo strip.',
    'New York': 'New York\'s photo booth legacy stretches back to the early 20th century when Times Square was dotted with penny arcades. Today\'s analog machines carry forward this tradition, beloved by locals and tourists alike who appreciate the instant, tactile nature of real photochemical prints.',
    'London': 'British photo booth culture is deeply intertwined with the Underground, where iconic black-and-white machines have served commuters for decades. London\'s booths have captured everything from passport photos to punk rock album covers, making them an integral part of the city\'s visual history.',
    'Paris': 'French "photomatons" have been a staple of Parisian life since the 1920s. The booths are beloved for their role in creating souvenir photos, artistic self-portraits, and the classic French ID photo. The city\'s analog machines carry a certain romantic nostalgia.',
    'Tokyo': 'While Japan is famous for digital purikura, Tokyo also maintains a proud tradition of analog photo booths. These vintage machines offer a counterpoint to the high-tech alternatives, appealing to those who appreciate the authentic, unfiltered aesthetic of chemical photography.',
    'San Francisco': 'The Bay Area\'s photo booth scene reflects its countercultural roots. From beatnik-era machines to modern vintage installations, San Francisco\'s booths have documented decades of artistic expression and social change.',
  };

  return cultures[city] ||
    `${city}${country ? `, ${country}` : ''} has a growing appreciation for analog photography. Local photo booths offer an authentic alternative to digital photography, producing genuine photochemical prints with unique character.`;
}

// Extract neighborhoods from booth addresses
function extractNeighborhoods(booths: RenderableBooth[]): string[] {
  const neighborhoods = new Set<string>();

  booths.forEach(booth => {
    // Try to extract neighborhood from address
    const address = booth.address || '';
    const parts = address.split(',').map(p => p.trim());
    if (parts.length > 1) {
      neighborhoods.add(parts[0]);
    }
  });

  return Array.from(neighborhoods).slice(0, 6);
}

// Generate local tips
function generateLocalTips(city: string): string[] {
  const tips: Record<string, string[]> = {
    'Berlin': [
      'Many Berlin booths accept only coins - bring 2-euro pieces',
      'Visit during weekday afternoons for shorter waits',
      'Check if the booth is inside a bar - some are only accessible during evening hours',
      'The S-Bahn station booths often have the oldest, most authentic machines',
    ],
    'New York': [
      'Grand Central and Penn Station have some of the city\'s best-maintained machines',
      'Avoid peak tourist hours at Times Square booths',
      'Brooklyn bars often have hidden vintage booths - ask the bartender',
      'Some NYC booths take credit cards, but always have cash backup',
    ],
    'London': [
      'Tube station booths are maintained by Photo-Me and are very reliable',
      'Many booths offer both color and black & white options',
      'Weekday morning visits avoid the pub crowds at bar installations',
      'Some historic booths in Soho require small change - 50p and 1-pound coins',
    ],
  };

  return tips[city] || [
    'Bring coins or small bills - many analog booths don\'t accept cards',
    'Visit during off-peak hours for the best experience',
    'Check booth status before visiting - some may be temporarily out of service',
    'Allow 2-3 minutes for your photos to develop after the session',
  ];
}

// Generate city-specific FAQs
function generateCityFAQs(city: string, boothCount: number): { question: string; answer: string }[] {
  return [
    {
      question: `How many analog photo booths are there in ${city}?`,
      answer: `There are currently ${boothCount} verified analog photo booth${boothCount !== 1 ? 's' : ''} in ${city} listed in our directory. We continuously update our database as new booths are discovered or existing ones change status.`,
    },
    {
      question: `Where can I find photo booths in ${city}?`,
      answer: `Photo booths in ${city} are typically located in shopping centers, transit stations, bars, arcades, and entertainment venues. Use our interactive map above to find the exact locations and get directions.`,
    },
    {
      question: `How much do photo booths cost in ${city}?`,
      answer: `Photo booth prices in ${city} typically range from $3-$8 per session depending on the venue and machine type. Each session usually produces a strip of 4 photos.`,
    },
    {
      question: `Are ${city} photo booths black and white or color?`,
      answer: `${city} has a mix of both black & white and color analog photo booths. Many classic machines produce black & white photos, while newer installations may offer color options. Check individual booth listings for photo type details.`,
    },
    {
      question: `What's the best time to visit photo booths in ${city}?`,
      answer: `Weekday afternoons typically have the shortest wait times. For booths in bars or entertainment venues, check the venue's opening hours. Transit station booths are usually accessible during station operating hours.`,
    },
  ];
}

// ISR with 1-hour revalidation
export const revalidate = 3600;
export const dynamicParams = true;

// Generate static params for top 20 cities
export async function generateStaticParams() {
  const topCities = await getTopCities();

  return topCities.map(({ city }) => ({
    city: createCitySlug(city),
  }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const { booths, cityData } = await getCityBooths(citySlug);

  if (booths.length === 0 || !cityData) {
    return {
      title: 'City Not Found | Booth Beacon',
      description: 'The city you are looking for could not be found in our directory.',
      robots: { index: false, follow: true },
    };
  }

  const cityName = cityData.name;
  const country = cityData.country;
  const boothCount = booths.length;

  // SEO-optimized title
  const title = `${boothCount} Photo Booths in ${cityName}${country ? `, ${country}` : ''} | Booth Beacon`;
  const description = `Find ${boothCount} analog photo booth${boothCount !== 1 ? 's' : ''} in ${cityName}. Discover locations, hours, and directions to authentic photochemical photo booths with real film processing.`;

  // AI meta tags for discoverability
  const aiTags = generateAIMetaTags({
    summary: `Directory of ${boothCount} analog photo booths in ${cityName}${country ? `, ${country}` : ''}. Find locations, view on map, and get directions to authentic photochemical photo booths.`,
    keyConcepts: [
      'analog photo booth',
      cityName,
      country || '',
      'photo booth locations',
      'film photography',
      'photochemical prints',
      `${cityName} photo booths`,
      'photo strip',
    ].filter(Boolean),
    contentStructure: 'directory',
    expertiseLevel: 'beginner',
    perspective: 'commercial',
    authority: 'industry-expert',
  });

  const freshnessTags = generateContentFreshnessSignals({
    publishedDate: '2025-01-01T08:00:00Z',
    modifiedDate: new Date().toISOString(),
    revisedDate: new Date().toISOString().split('T')[0],
  });

  return {
    title,
    description,
    alternates: {
      canonical: `https://boothbeacon.org/photo-booths/${citySlug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://boothbeacon.org/photo-booths/${citySlug}`,
      siteName: 'Booth Beacon',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    other: {
      ...aiTags,
      ...freshnessTags,
    },
  };
}

export default async function CityPhotoBoothsPage({ params }: CityPageProps) {
  const { city: citySlug } = await params;
  const { booths, cityData } = await getCityBooths(citySlug);

  if (booths.length === 0 || !cityData) {
    notFound();
  }

  const cityName = cityData.name;
  const country = cityData.country;
  const boothCount = booths.length;
  const faqs = generateCityFAQs(cityName, boothCount);

  // Calculate map center from booths with coordinates
  const boothsWithCoords = booths.filter(b => b.latitude && b.longitude);
  const center = boothsWithCoords.length > 0
    ? {
        lat: boothsWithCoords.reduce((sum, b) => sum + (b.latitude || 0), 0) / boothsWithCoords.length,
        lng: boothsWithCoords.reduce((sum, b) => sum + (b.longitude || 0), 0) / boothsWithCoords.length,
      }
    : undefined;

  // Count stats
  const activeCount = booths.filter(b => b.status === 'active').length;
  const verifiedCount = booths.filter(b => b.status !== 'unverified').length;

  // Breadcrumb data
  const breadcrumbs = [
    { name: 'Home', url: 'https://boothbeacon.org' },
    { name: 'Photo Booths', url: 'https://boothbeacon.org/locations' },
    ...(country ? [{ name: country, url: `https://boothbeacon.org/locations/${country.toLowerCase().replace(/\s+/g, '-')}` }] : []),
    { name: cityName, url: `https://boothbeacon.org/photo-booths/${citySlug}` },
  ];

  // Generate LocalBusiness aggregate schema
  const localBusinessAggregateSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `https://boothbeacon.org/photo-booths/${citySlug}#booth-list`,
    name: `Photo Booths in ${cityName}`,
    description: `Directory of ${boothCount} analog photo booths in ${cityName}${country ? `, ${country}` : ''}`,
    numberOfItems: boothCount,
    itemListElement: booths.slice(0, 10).map((booth, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        '@id': `https://boothbeacon.org/booth/${booth.slug}`,
        name: booth.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: booth.address,
          addressLocality: booth.city,
          ...(booth.state && { addressRegion: booth.state }),
          addressCountry: booth.country,
        },
        ...(booth.latitude && booth.longitude && {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: booth.latitude,
            longitude: booth.longitude,
          },
        }),
        url: `https://boothbeacon.org/booth/${booth.slug}`,
      },
    })),
  };

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };

  // FAQ schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  // Combined schema
  const combinedSchema = {
    '@context': 'https://schema.org',
    '@graph': [localBusinessAggregateSchema, breadcrumbSchema, faqSchema],
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedSchema) }}
        />

        {/* Main Content */}
        <main
          id="main-content"
          role="main"
          data-ai-page-type="city-directory"
          data-ai-entity-type="photo-booth-collection"
          data-ai-city={cityName}
          data-ai-country={country}
          data-ai-booth-count={boothCount}
        >
          {/* Breadcrumbs */}
          <div className="bg-card border-b border-primary/10" data-ai-section="breadcrumbs">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto">
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.url} className="flex items-center gap-2 flex-shrink-0">
                    {index > 0 && <span>/</span>}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="text-foreground font-medium">{crumb.name}</span>
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

          {/* Hero Section */}
          <section
            className="bg-gradient-to-br from-primary to-amber-600 text-white py-16"
            data-ai-section="hero"
            data-ai-content="primary-heading"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl">
                <Badge variant="secondary" className="bg-white/20 text-white mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  City Guide
                </Badge>
                <h1
                  className="font-display text-4xl md:text-5xl font-semibold mb-4"
                  data-ai-heading="h1"
                >
                  Photo Booths in {cityName}
                </h1>
                <p
                  className="text-xl text-white/90 mb-6"
                  data-ai-summary="page-description"
                >
                  Discover {boothCount} analog photo booth{boothCount !== 1 ? 's' : ''} in {cityName}{country ? `, ${country}` : ''}.
                  Find authentic photochemical machines with real film processing.
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    <span>{boothCount} Booths</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    <span>{activeCount} Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    <span>{verifiedCount} Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Bar */}
          <section className="bg-card border-b border-primary/10 py-6" data-ai-section="statistics">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg border border-primary/10">
                  <div className="text-3xl font-bold text-foreground">{boothCount}</div>
                  <div className="text-sm text-muted-foreground">Total Booths</div>
                </div>
                <div className="text-center p-4 rounded-lg border border-primary/10">
                  <div className="text-3xl font-bold text-green-600">{activeCount}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div className="text-center p-4 rounded-lg border border-primary/10">
                  <div className="text-3xl font-bold text-foreground">{boothsWithCoords.length}</div>
                  <div className="text-sm text-muted-foreground">On Map</div>
                </div>
                <div className="text-center p-4 rounded-lg border border-primary/10">
                  <div className="text-3xl font-bold text-foreground">{cityData.neighborhoods.length}</div>
                  <div className="text-sm text-muted-foreground">Areas</div>
                </div>
              </div>
            </div>
          </section>

          {/* Map Section */}
          {center && boothsWithCoords.length > 0 && (
            <section
              className="py-12 bg-background"
              data-ai-section="interactive-map"
              data-ai-content="booth-locations"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="font-display text-2xl font-semibold mb-6 text-foreground">
                  Photo Booth Map
                </h2>
                <div className="h-[500px] rounded-lg overflow-hidden border border-primary/10">
                  <BoothMap
                    booths={booths as Booth[]}
                    center={center}
                    zoom={12}
                    showUserLocation={true}
                    showClustering={true}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Click on markers to view booth details. Use the map controls to zoom and explore different areas of {cityName}.
                </p>
              </div>
            </section>
          )}

          {/* Booth Grid */}
          <section
            className="py-12 bg-card"
            data-ai-section="booth-listings"
            data-ai-content="photo-booth-directory"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  All Photo Booths in {cityName}
                </h2>
                <Badge variant="outline">{boothCount} booths</Badge>
              </div>

              {booths.length > 0 ? (
                <div
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  data-ai-content="booth-cards"
                >
                  {booths.map((booth) => (
                    <BoothCard
                      key={booth.id}
                      booth={booth as Booth}
                      variant="default"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-foreground">No booths found</p>
                  <p className="text-muted-foreground">Check back soon as we add more booths</p>
                </div>
              )}
            </div>
          </section>

          {/* Local Content Section */}
          <section
            className="py-12 bg-background"
            data-ai-section="local-content"
            data-ai-content="city-guide"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* City Description */}
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-4 text-foreground">
                    About Photo Booths in {cityName}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-6" data-ai-content="city-description">
                    {cityData.description}
                  </p>

                  {/* Neighborhoods */}
                  {cityData.neighborhoods.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-lg mb-3 text-foreground">
                        Neighborhoods with Photo Booths
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {cityData.neighborhoods.map((neighborhood) => (
                          <Badge key={neighborhood} variant="secondary">
                            {neighborhood}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Photography Culture */}
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-4 text-foreground">
                    {cityName}&apos;s Photography Culture
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-6" data-ai-content="photography-culture">
                    {cityData.photographyCulture}
                  </p>

                  {/* Local Tips */}
                  <Card className="p-6 bg-amber-50 border-amber-200">
                    <h3 className="font-semibold text-lg mb-3 text-amber-900 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Local Tips
                    </h3>
                    <ul className="space-y-2">
                      {cityData.localTips.map((tip, index) => (
                        <li key={index} className="text-amber-800 text-sm flex items-start gap-2">
                          <span className="text-amber-600 mt-1">-</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section
            className="py-12 bg-card"
            data-ai-section="faq"
            data-ai-content="frequently-asked-questions"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-display text-2xl font-semibold mb-8 text-center text-foreground flex items-center justify-center gap-2">
                <HelpCircle className="w-6 h-6" />
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <Card key={index} className="p-6" data-ai-faq={`q${index + 1}`}>
                    <h3 className="font-semibold text-lg mb-3 text-foreground">
                      {faq.question}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-12 bg-primary text-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="font-display text-2xl font-semibold mb-4">
                Explore More Photo Booths
              </h2>
              <p className="text-white/90 mb-6">
                Discover analog photo booths in other cities and countries around the world.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/map">
                  <Button variant="secondary" size="lg">
                    <MapPin className="w-4 h-4 mr-2" />
                    View Full Map
                  </Button>
                </Link>
                <Link href="/locations">
                  <Button variant="outline" size="lg" className="bg-white/10 hover:bg-white/20 border-white/30 text-white">
                    Browse All Locations
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
