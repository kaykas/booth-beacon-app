import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Wrench, Calendar, MapPin, Book } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BoothCard } from '@/components/booth/BoothCard';
import { createServerClient } from '@/lib/supabase';
import { MachineModel, Booth } from '@/types';

interface MachineModelPageProps {
  params: Promise<{
    model: string;
  }>;
}

async function getMachineModel(slug: string): Promise<MachineModel | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('machine_models')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as MachineModel;
}

async function getBoothsWithModel(modelName: string): Promise<Booth[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .ilike('machine_model', `%${modelName}%`)
    .eq('status', 'active')
    .limit(12);

  if (error) return [];
  return (data as Booth[]) || [];
}

export async function generateMetadata({ params }: MachineModelPageProps): Promise<Metadata> {
  const { model } = await params;
  const machineModel = await getMachineModel(model);
  if (!machineModel) return { title: 'Machine Not Found | Booth Beacon' };

  return {
    title: `${machineModel.model_name} | Booth Beacon`,
    description: machineModel.description || `Information about the ${machineModel.model_name} photo booth`,
  };
}

export default async function MachineModelPage({ params }: MachineModelPageProps) {
  const { model } = await params;
  const machineModel = await getMachineModel(model);
  if (!machineModel) notFound();

  const booths = await getBoothsWithModel(machineModel.model_name);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Badge variant="secondary" className="bg-white/20 text-white mb-4">
            <Wrench className="w-3 h-3 mr-1" />
            Machine Model
          </Badge>
          <h1 className="font-display text-5xl font-semibold mb-4">{machineModel.model_name}</h1>
          {machineModel.manufacturer && (
            <p className="text-xl text-white/90">by {machineModel.manufacturer}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {machineModel.description && (
              <Card className="p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">About This Model</h2>
                <p className="text-neutral-700 leading-relaxed">{machineModel.description}</p>
              </Card>
            )}

            {machineModel.notable_features && machineModel.notable_features.length > 0 && (
              <Card className="p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">Notable Features</h2>
                <ul className="space-y-2">
                  {machineModel.notable_features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {machineModel.collector_notes && (
              <Card className="p-6 bg-amber-50 border-amber-200">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Book className="w-5 h-5 text-amber-600" />
                  Collector Notes
                </h3>
                <p className="text-neutral-700 leading-relaxed">{machineModel.collector_notes}</p>
              </Card>
            )}

            <div>
              <h2 className="font-display text-2xl font-semibold mb-6">
                Where to Find This Model
              </h2>
              {booths.length === 0 ? (
                <Card className="p-12 text-center">
                  <MapPin className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600">No active booths found with this model</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {booths.map((booth) => (
                    <BoothCard key={booth.id} booth={booth} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Specifications</h3>
              <dl className="space-y-3">
                {machineModel.manufacturer && (
                  <div>
                    <dt className="text-sm text-neutral-600">Manufacturer</dt>
                    <dd className="font-medium">{machineModel.manufacturer}</dd>
                  </div>
                )}
                {machineModel.years_produced && (
                  <div>
                    <dt className="text-sm text-neutral-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Years Produced
                    </dt>
                    <dd className="font-medium">{machineModel.years_produced}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-neutral-600">Active Locations</dt>
                  <dd className="font-medium">{booths.length} booths</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
