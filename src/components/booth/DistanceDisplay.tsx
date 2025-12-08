'use client';

import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DistanceDisplayProps {
  boothLatitude: number;
  boothLongitude: number;
  className?: string;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function DistanceDisplay({ boothLatitude, boothLongitude, className = '' }: DistanceDisplayProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const dist = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            boothLatitude,
            boothLongitude
          );
          setDistance(dist);
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, [boothLatitude, boothLongitude]);

  if (loading || distance === null) {
    return null;
  }

  const distanceText = distance < 1
    ? `${Math.round(distance * 1000)}m away`
    : `${distance.toFixed(1)}km away`;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium ${className}`}>
      <MapPin className="w-3.5 h-3.5" />
      <span>{distanceText}</span>
    </div>
  );
}
