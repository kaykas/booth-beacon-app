'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { MapPin, Navigation } from 'lucide-react';

interface NearbyBooth {
  id: string;
  name: string;
  slug: string;
  city: string;
  state?: string;
  country: string;
  photo_exterior_url?: string;
  ai_preview_url?: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  status: string;
  booth_type?: string;
  machine_model?: string;
  cost?: string;
}

interface NearbyBoothsProps {
  boothId: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  limit?: number;
}

export function NearbyBooths({
  boothId,
  latitude,
  longitude,
  radiusKm = 25,
  limit = 6,
}: NearbyBoothsProps) {
  const [booths, setBooths] = useState<NearbyBooth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNearbyBooths() {
      try {
        setLoading(true);

        const { data, error: rpcError } = await supabase.rpc('get_nearby_booths', {
          p_latitude: latitude,
          p_longitude: longitude,
          p_radius_km: radiusKm,
          p_limit: limit,
          p_exclude_booth_id: boothId,
        });

        if (rpcError) {
          throw rpcError;
        }

        setBooths(data || []);
      } catch (err) {
        console.error('Error fetching nearby booths:', err);
        setError(err instanceof Error ? err.message : 'Failed to load nearby booths');
      } finally {
        setLoading(false);
      }
    }

    fetchNearbyBooths();
  }, [boothId, latitude, longitude, radiusKm, limit]);

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Nearby Booths</h3>
        <div className="text-sm text-neutral-500">Loading nearby booths...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Nearby Booths</h3>
        <div className="text-sm text-red-600">Failed to load nearby booths</div>
      </Card>
    );
  }

  if (booths.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Nearby Booths</h3>
        <div className="text-sm text-neutral-500">
          No other booths found within {radiusKm}km of this location.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          Nearby Booths ({booths.length})
        </h3>
        <span className="text-xs text-neutral-500">Within {radiusKm}km</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
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
                alt={booth.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                {booth.distance_km.toFixed(1)}km
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition">
                {booth.name}
              </h4>
              <p className="text-xs text-neutral-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {booth.city}
              </p>
              {booth.cost && (
                <p className="text-xs text-amber-700 font-medium">{booth.cost}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      <Button variant="outline" className="w-full" asChild>
        <Link href={`/map?center=${latitude},${longitude}&zoom=11`}>
          <MapPin className="w-4 h-4 mr-2" />
          View All on Map
        </Link>
      </Button>
    </Card>
  );
}
