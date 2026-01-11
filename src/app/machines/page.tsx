import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { Camera, MapPin, ArrowRight, Wrench, Factory, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { createPublicServerClient } from '@/lib/supabase';
import { getAllMachineModels, normalizeMachineModel } from '@/lib/machineData';
import { generateBreadcrumbSchema, serializeSchema } from '@/lib/schema-utils';

export const metadata: Metadata = {
  title: 'Photo Booth Machine Models | Booth Beacon',
  description: 'Explore different photo booth machine models and manufacturers. Learn about Photomaton, Photo-Me, Fotoautomat, and other classic analog photo booth machines.',
  keywords: [
    'photo booth machines',
    'photo booth models',
    'Photomaton',
    'Photo-Me',
    'Fotoautomat',
    'analog photo booth',
    'vintage photo booth',
    'photo booth manufacturers',
  ],
  openGraph: {
    title: 'Photo Booth Machine Models | Booth Beacon',
    description: 'Explore different photo booth machine models and manufacturers worldwide.',
    type: 'website',
    url: 'https://boothbeacon.org/machines',
  },
};

// ISR: Revalidate every hour
export const revalidate = 3600;

interface MachineCount {
  model: string;
  slug: string;
  count: number;
  manufacturer?: string;
  photoType?: string;
}

async function getMachineModelCounts(): Promise<MachineCount[]> {
  const supabase = createPublicServerClient();

  // Get all unique machine_model values with counts
  const { data: booths, error } = await supabase
    .from('booths')
    .select('machine_model')
    .eq('status', 'active')
    .not('machine_model', 'is', null);

  if (error || !booths) {
    console.error('Error fetching machine counts:', error);
    return [];
  }

  // Cast booths to proper type for TypeScript
  const typedBooths = booths as { machine_model: string | null }[];

  // Count booths by machine model
  const modelCounts = typedBooths.reduce((acc, booth) => {
    const model = booth.machine_model;
    if (model) {
      const normalizedSlug = normalizeMachineModel(model);
      const key = normalizedSlug;
      if (!acc[key]) {
        acc[key] = { model, slug: normalizedSlug, count: 0 };
      }
      acc[key].count += 1;
    }
    return acc;
  }, {} as Record<string, MachineCount>);

  // Merge with our machine data for additional info
  const machineData = getAllMachineModels();
  const result = Object.values(modelCounts).map(item => {
    const data = machineData.find(m => m.slug === item.slug);
    return {
      ...item,
      manufacturer: data?.manufacturer,
      photoType: data?.specifications.photoType,
    };
  });

  // Sort by count descending
  return result.sort((a, b) => b.count - a.count);
}

export default async function MachinesPage() {
  const machineCounts = await getMachineModelCounts();
  const machineData = getAllMachineModels();

  // Calculate total booths with machine info
  const totalMachineBooths = machineCounts.reduce((sum, m) => sum + m.count, 0);

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://boothbeacon.org' },
    { name: 'Machines', url: 'https://boothbeacon.org/machines' },
  ]);

  // ItemList schema for machine models
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Photo Booth Machine Models',
    description: 'Directory of analog photo booth machine manufacturers and models',
    numberOfItems: machineData.length,
    itemListElement: machineData.map((machine, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        '@id': `https://boothbeacon.org/machines/${machine.slug}`,
        name: machine.name,
        description: machine.description,
        manufacturer: {
          '@type': 'Organization',
          name: machine.manufacturer,
        },
        category: 'Photo Booth Machine',
        url: `https://boothbeacon.org/machines/${machine.slug}`,
      },
    })),
  };

  return (
    <>
      <Header />
      <Script
        id="machines-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchema(breadcrumbSchema) }}
      />
      <Script
        id="machines-itemlist-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <main className="min-h-screen bg-neutral-50">
        {/* Hero Section */}
        <div
          className="bg-gradient-to-br from-neutral-900 to-neutral-700 text-white"
          data-ai-section="hero"
          data-ai-content-type="page-introduction"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-3xl">
              <Badge variant="secondary" className="bg-white/20 text-white mb-4">
                <Wrench className="w-3 h-3 mr-1" />
                Machine Directory
              </Badge>
              <h1
                className="font-display text-5xl font-semibold mb-4"
                data-ai-heading="main"
              >
                Photo Booth Machines
              </h1>
              <p
                className="text-xl text-white/90 mb-6"
                data-ai-description="primary"
              >
                Explore the different types of analog photo booth machines found around the world.
                From classic Photomaton booths to vintage Fotoautomat machines, discover the
                history and characteristics of each model.
              </p>
              <div className="flex flex-wrap gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  <span data-ai-stat="machine-count">{machineData.length} Machine Types</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span data-ai-stat="booth-count">{totalMachineBooths} Booths Catalogued</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Active Machine Models (with booths in database) */}
          {machineCounts.length > 0 && (
            <section className="mb-16" data-ai-section="active-machines">
              <h2
                className="font-display text-2xl font-semibold mb-6"
                data-ai-heading="section"
              >
                Machines in Our Directory
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {machineCounts.map((machine) => {
                  const data = machineData.find(m => m.slug === machine.slug);
                  return (
                    <Link
                      key={machine.slug}
                      href={`/machines/${machine.slug}`}
                      className="group"
                    >
                      <Card
                        className="p-6 h-full hover:shadow-lg transition-shadow"
                        data-ai-item="machine-model"
                        data-ai-machine-slug={machine.slug}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition">
                            <Camera className="w-6 h-6 text-primary" />
                          </div>
                          <Badge variant="secondary">
                            {machine.count} {machine.count === 1 ? 'booth' : 'booths'}
                          </Badge>
                        </div>

                        <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition">
                          {data?.name || machine.model}
                        </h3>

                        {machine.manufacturer && (
                          <p className="text-sm text-neutral-600 flex items-center gap-1 mb-2">
                            <Factory className="w-4 h-4" />
                            {machine.manufacturer}
                          </p>
                        )}

                        {data?.countryOfOrigin && (
                          <p className="text-sm text-neutral-500 mb-3">
                            Origin: {data.countryOfOrigin}
                          </p>
                        )}

                        {data?.description && (
                          <p className="text-sm text-neutral-600 line-clamp-2 mb-4">
                            {data.description}
                          </p>
                        )}

                        <div className="flex items-center text-primary text-sm font-medium mt-auto">
                          View Details
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* All Known Machine Models */}
          <section data-ai-section="all-machines">
            <h2
              className="font-display text-2xl font-semibold mb-6"
              data-ai-heading="section"
            >
              All Machine Types
            </h2>
            <p className="text-neutral-600 mb-8">
              A comprehensive guide to photo booth machine manufacturers and models,
              including historical information and technical specifications.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {machineData.map((machine) => {
                const count = machineCounts.find(m => m.slug === machine.slug);
                return (
                  <Link
                    key={machine.slug}
                    href={`/machines/${machine.slug}`}
                    className="group"
                  >
                    <Card
                      className="p-6 h-full hover:shadow-lg transition-shadow flex flex-col"
                      data-ai-item="machine-model-full"
                      data-ai-machine-slug={machine.slug}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-neutral-100 rounded-lg group-hover:bg-primary/10 transition flex-shrink-0">
                          <Camera className="w-8 h-8 text-neutral-600 group-hover:text-primary transition" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display text-xl font-semibold group-hover:text-primary transition">
                            {machine.name}
                          </h3>
                          <p className="text-sm text-neutral-500">
                            {machine.manufacturer}
                          </p>
                        </div>
                        {count && (
                          <Badge variant="outline" className="flex-shrink-0">
                            {count.count} {count.count === 1 ? 'booth' : 'booths'}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {machine.countryOfOrigin && (
                          <Badge variant="secondary" className="text-xs">
                            {machine.countryOfOrigin}
                          </Badge>
                        )}
                        {machine.yearsProduced && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {machine.yearsProduced}
                          </Badge>
                        )}
                        {machine.specifications.photoType && (
                          <Badge variant="secondary" className="text-xs">
                            {machine.specifications.photoType === 'black-and-white' ? 'B&W' :
                              machine.specifications.photoType === 'color' ? 'Color' : 'B&W & Color'}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-neutral-600 line-clamp-3 mb-4 flex-1">
                        {machine.description}
                      </p>

                      <div className="flex items-center text-primary text-sm font-medium">
                        Learn More
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Info Section */}
          <section className="mt-16" data-ai-section="about-machines">
            <Card className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <h2
                className="font-display text-2xl font-semibold mb-4"
                data-ai-heading="section"
              >
                About Photo Booth Machines
              </h2>
              <div className="prose prose-neutral max-w-none">
                <p data-ai-content="informational">
                  Analog photo booths have been capturing moments since the 1920s. These remarkable machines
                  use traditional chemical processing to develop photographs on-site, creating authentic
                  photo strips that cannot be replicated digitally.
                </p>
                <p data-ai-content="informational">
                  Each manufacturer has developed unique approaches to photo booth design, from the elegant
                  European styling of Photomaton to the robust American construction of Auto-Photo machines.
                  Understanding these differences helps enthusiasts appreciate the craftsmanship behind
                  each photo strip.
                </p>
                <p data-ai-content="informational">
                  At Booth Beacon, we document and preserve information about these machines to help
                  analog photography enthusiasts find and experience authentic photo booth photography
                  around the world.
                </p>
              </div>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
