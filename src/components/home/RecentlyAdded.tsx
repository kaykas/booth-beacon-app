'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { MapPin, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface RecentBooth {
  id: string;
  name: string;
  slug: string;
  city: string;
  state?: string;
  country: string;
  photo_exterior_url?: string;
  photo_interior_url?: string;
  ai_preview_url?: string;
  ai_generated_image_url?: string;
  status: string;
  machine_model?: string;
  cost?: string;
  created_at: string;
}

export function RecentlyAdded() {
  const [booths, setBooths] = useState<RecentBooth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecentBooths() {
      try {
        setLoading(true);

        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

        const { data, error: queryError } = await supabase
          .from('booths')
          .select('id, name, slug, city, state, country, photo_exterior_url, photo_interior_url, ai_preview_url, ai_generated_image_url, status, machine_model, cost, created_at')
          .eq('status', 'active')
          .eq('is_operational', true)
          .gte('created_at', thirtyDaysAgoISO)
          .order('created_at', { ascending: false })
          .limit(12);

        if (queryError) {
          throw queryError;
        }

        setBooths(data || []);
      } catch (err) {
        console.error('Error fetching recent booths:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recent booths');
      } finally {
        setLoading(false);
      }
    }

    fetchRecentBooths();
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-green-50 to-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-green-600" />
            Recently Added
          </h2>
          <p className="text-neutral-600 mb-6">
            Loading new booths...
          </p>
        </div>
      </section>
    );
  }

  if (error || booths.length === 0) {
    return null; // Don't show the section if there's an error or no recent booths
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-green-50 to-background">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-green-600" />
            Recently Added
          </h2>
          <p className="text-neutral-600">
            {booths.length} new booth{booths.length !== 1 ? 's' : ''} discovered in the last 30 days
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {booths.map((booth) => {
            // Check if AI preview URL is the broken Unsplash Source API
            const isBrokenUnsplashUrl = booth.ai_preview_url?.includes('source.unsplash.com');

            // Priority: photo_exterior_url > photo_interior_url > ai_generated_image_url > ai_preview_url (if not broken)
            const imageUrl = booth.photo_exterior_url
              || booth.photo_interior_url
              || booth.ai_generated_image_url
              || (!isBrokenUnsplashUrl ? booth.ai_preview_url : null)
              || '/placeholder-booth.svg';

            // Calculate days ago
            const daysAgo = Math.floor(
              (Date.now() - new Date(booth.created_at).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <Link
                key={booth.id}
                href={`/booth/${booth.slug}`}
                className="group relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden"
              >
                {/* NEW Badge Overlay */}
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-green-600 text-white font-bold shadow-lg">
                    NEW
                  </Badge>
                </div>

                {/* Days ago badge */}
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="secondary" className="bg-black/70 text-white text-xs backdrop-blur">
                    {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
                  </Badge>
                </div>

                {/* Image */}
                <div className="aspect-[4/3] relative bg-neutral-100">
                  <Image
                    src={imageUrl}
                    alt={booth.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition">
                    {booth.name}
                  </h3>

                  <p className="text-sm text-neutral-600 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {booth.city}, {booth.country}
                  </p>

                  {booth.machine_model && (
                    <p className="text-xs text-neutral-500 truncate">
                      {booth.machine_model}
                    </p>
                  )}

                  {booth.cost && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {booth.cost}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
