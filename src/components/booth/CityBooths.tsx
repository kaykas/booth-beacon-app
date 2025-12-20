'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { MapPin, ArrowRight } from 'lucide-react';

interface CityBooth {
  id: string;
  name: string;
  slug: string;
  city: string;
  state?: string;
  country: string;
  neighborhood?: string;
  photo_exterior_url?: string;
  photo_interior_url?: string;
  ai_preview_url?: string;
  ai_generated_image_url?: string;
  status: string;
  booth_type?: string;
  machine_model?: string;
  cost?: string;
}

interface CityBoothsProps {
  boothId: string;
  city: string;
  state?: string;
  country: string;
  limit?: number;
}

export function CityBooths({
  boothId,
  city,
  state,
  country,
  limit = 6,
}: CityBoothsProps) {
  const [booths, setBooths] = useState<CityBooth[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCityBooths() {
      try {
        setLoading(true);

        // Build query to get booths in the same city
        let query = supabase
          .from('booths')
          .select('id, name, slug, city, state, country, neighborhood, photo_exterior_url, photo_interior_url, ai_preview_url, ai_generated_image_url, status, booth_type, machine_model, cost', { count: 'exact' })
          .eq('city', city)
          .eq('country', country)
          .eq('status', 'active')
          .eq('is_operational', true)
          .neq('id', boothId)
          .order('updated_at', { ascending: false })
          .limit(limit);

        // Add state filter if provided (for US, Canada, etc.)
        if (state) {
          query = query.eq('state', state);
        }

        const { data, error: queryError, count } = await query;

        if (queryError) {
          throw queryError;
        }

        setBooths(data || []);
        setTotalCount(count || 0);
      } catch (err) {
        console.error('Error fetching city booths:', err);
        setError(err instanceof Error ? err.message : 'Failed to load city booths');
      } finally {
        setLoading(false);
      }
    }

    fetchCityBooths();
  }, [boothId, city, state, country, limit]);

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">More Booths in {city}</h3>
        <div className="text-sm text-neutral-500">Loading booths...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">More Booths in {city}</h3>
        <div className="text-sm text-red-600">Failed to load booths from {city}</div>
      </Card>
    );
  }

  if (booths.length === 0) {
    return null; // Don't show the section if there are no other booths in the city
  }

  // Generate city URL slug
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const countrySlug = country.toLowerCase().replace(/\s+/g, '-');
  const stateSlug = state ? state.toLowerCase().replace(/\s+/g, '-') : null;

  const cityUrl = stateSlug
    ? `/locations/${countrySlug}/${stateSlug}/${citySlug}`
    : `/locations/${countrySlug}/${citySlug}`;

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-xl mb-2">
          More Booths in {city}
        </h3>
        <p className="text-sm text-neutral-600">
          Planning a photo booth crawl? Explore all {totalCount > limit ? totalCount : booths.length} booth{totalCount === 1 ? '' : 's'} in {city}!
        </p>
      </div>

      <div className="overflow-x-auto -mx-6 px-6 pb-4">
        <div className="flex gap-4 min-w-min">
          {booths.map((booth) => {
            // Check if AI preview URL is the broken Unsplash Source API
            const isBrokenUnsplashUrl = booth.ai_preview_url?.includes('source.unsplash.com');

            // Priority: photo_exterior_url > photo_interior_url > ai_generated_image_url > ai_preview_url (if not broken)
            const imageUrl = booth.photo_exterior_url
              || booth.photo_interior_url
              || booth.ai_generated_image_url
              || (!isBrokenUnsplashUrl ? booth.ai_preview_url : null)
              || '/placeholder-booth.svg';

            return (
              <Link
                key={booth.id}
                href={`/booth/${booth.slug}`}
                className="group block flex-shrink-0 w-48"
              >
                <div className="relative aspect-[3/4] bg-neutral-200 rounded-lg overflow-hidden mb-2 shadow-md hover:shadow-lg transition-shadow">
                  <Image
                    src={imageUrl}
                    alt={booth.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="192px"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition">
                    {booth.name}
                  </h4>
                  {booth.neighborhood && (
                    <p className="text-xs text-neutral-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {booth.neighborhood}
                    </p>
                  )}
                  {booth.machine_model && (
                    <p className="text-xs text-neutral-500">{booth.machine_model}</p>
                  )}
                  {booth.cost && (
                    <Badge variant="secondary" className="text-xs">
                      {booth.cost}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {totalCount > limit && (
        <Button variant="outline" className="w-full mt-4" asChild>
          <Link href={cityUrl}>
            View All {totalCount} Booths in {city}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      )}
    </Card>
  );
}
