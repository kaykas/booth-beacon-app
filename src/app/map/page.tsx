import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { MapClient } from '@/components/map/MapClient';

interface MapPageProps {
  searchParams: {
    nearme?: string;
    city?: string;
  };
}

export default function MapPage({ searchParams }: MapPageProps) {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      }
    >
      <MapClient nearme={searchParams.nearme} city={searchParams.city} />
    </Suspense>
  );
}
