'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Sparkles, MapPin } from 'lucide-react';

function generateBoothAltText(booth: { name: string; city?: string; country?: string; machine_model?: string }) {
  const location = [booth.city, booth.country].filter(Boolean).join(', ');
  const model = booth.machine_model || 'Classic analog';
  return `${booth.name} - ${model} photo booth${location ? ` in ${location}` : ''}. Vintage photochemical booth for instant photo strips.`;
}

interface SimilarBooth {
  id: string;
  name: string;
  slug: string;
  city?: string;
  state?: string;
  country?: string;
  machine_model?: string;
  machine_manufacturer?: string;
  booth_type?: string;
  photo_type?: string;
  cost?: string;
  photo_exterior_url?: string;
  ai_preview_url?: string;
  similarity_score: number;
}

interface SimilarBoothsProps {
  boothId: string;
  limit?: number;
}

export function SimilarBooths({ boothId, limit = 6 }: SimilarBoothsProps) {
  const [booths, setBooths] = useState<SimilarBooth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSimilarBooths() {
      try {
        setLoading(true);

        const response = await fetch(`/api/booths/${boothId}/similar?limit=${limit}`);

        if (!response.ok) {
          throw new Error('Failed to fetch similar booths');
        }

        const data = await response.json();
        setBooths(data);
      } catch (err) {
        console.error('Error fetching similar booths:', err);
        setError(err instanceof Error ? err.message : 'Failed to load similar booths');
      } finally {
        setLoading(false);
      }
    }

    fetchSimilarBooths();
  }, [boothId, limit]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Similar Booths</h3>
        </div>
        <div className="text-sm text-neutral-500">Loading recommendations...</div>
      </Card>
    );
  }

  if (error || booths.length === 0) {
    return null; // Don't show the section if there's an error or no results
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">You Might Also Like</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {booths.map((booth) => (
          <Link
            key={booth.id}
            href={`/booth/${booth.slug}`}
            className="group block"
          >
            <div className="relative aspect-square bg-neutral-200 rounded-lg overflow-hidden mb-2">
              <Image
                src={
                  booth.photo_exterior_url ||
                  booth.ai_preview_url ||
                  '/placeholder-booth.svg'
                }
                alt={generateBoothAltText(booth)}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              {booth.machine_model && (
                <div className="absolute top-2 right-2 bg-primary/90 text-white text-xs px-2 py-1 rounded">
                  {booth.machine_model}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition">
                {booth.name}
              </h4>
              <p className="text-xs text-neutral-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {[booth.city, booth.country].filter(Boolean).join(', ')}
              </p>
              <div className="flex flex-wrap gap-1">
                {booth.booth_type && (
                  <span className="text-xs px-1.5 py-0.5 bg-neutral-100 text-neutral-700 rounded capitalize">
                    {booth.booth_type}
                  </span>
                )}
                {booth.cost && (
                  <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium">
                    {booth.cost}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-xs text-neutral-500 mt-4 text-center">
        Based on machine type, location, and features
      </p>
    </Card>
  );
}
