import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Building2, MapPin, Globe, Instagram } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BoothCard } from '@/components/booth/BoothCard';
import { supabase } from '@/lib/supabase';
import { Operator, Booth } from '@/types';

interface OperatorPageProps {
  params: {
    slug: string;
  };
}

async function getOperator(slug: string): Promise<Operator | null> {
  const { data, error } = await supabase
    .from('operators')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as Operator;
}

async function getOperatorBooths(operatorId: string): Promise<Booth[]> {
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('operator_id', operatorId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data as Booth[]) || [];
}

export async function generateMetadata({ params }: OperatorPageProps): Promise<Metadata> {
  const operator = await getOperator(params.slug);
  if (!operator) return { title: 'Operator Not Found | Booth Beacon' };
  
  return {
    title: `${operator.name} | Booth Beacon`,
    description: operator.story || `Photo booth operator based in ${operator.city}, ${operator.country}`,
  };
}

export default async function OperatorPage({ params }: OperatorPageProps) {
  const operator = await getOperator(params.slug);
  if (!operator) notFound();

  const booths = await getOperatorBooths(operator.id);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-gradient-to-br from-primary to-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Badge variant="secondary" className="bg-white/20 text-white mb-4">
            <Building2 className="w-3 h-3 mr-1" />
            Operator
          </Badge>
          <h1 className="font-display text-5xl font-semibold mb-4">{operator.name}</h1>
          {operator.city && operator.country && (
            <p className="text-xl text-white/90 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {operator.city}, {operator.country}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {operator.story && (
              <Card className="p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">Their Story</h2>
                <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                  {operator.story}
                </p>
              </Card>
            )}

            <div>
              <h2 className="font-display text-2xl font-semibold mb-6">
                Their Booths ({booths.length})
              </h2>
              {booths.length === 0 ? (
                <Card className="p-12 text-center">
                  <MapPin className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600">No active booths found</p>
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
              <h3 className="font-semibold text-lg mb-4">About</h3>
              <dl className="space-y-3">
                {operator.founded_year && (
                  <div>
                    <dt className="text-sm text-neutral-600">Founded</dt>
                    <dd className="font-medium">{operator.founded_year}</dd>
                  </div>
                )}
                {operator.city && operator.country && (
                  <div>
                    <dt className="text-sm text-neutral-600">Location</dt>
                    <dd className="font-medium">{operator.city}, {operator.country}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-neutral-600">Active Booths</dt>
                  <dd className="font-medium">{booths.length}</dd>
                </div>
              </dl>
            </Card>

            {(operator.website || operator.instagram) && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Connect</h3>
                <div className="space-y-2">
                  {operator.website && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href={operator.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-4 h-4 mr-2" />
                        Visit Website
                      </a>
                    </Button>
                  )}
                  {operator.instagram && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href={`https://instagram.com/${operator.instagram}`} target="_blank" rel="noopener noreferrer">
                        <Instagram className="w-4 h-4 mr-2" />
                        @{operator.instagram}
                      </a>
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
