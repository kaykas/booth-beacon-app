'use client';

import { useState } from 'react';
import { Map, MapPin } from 'lucide-react';
import { Booth } from '@/types';
import { BoothMap } from './BoothMap';
import { StreetViewEmbed } from './StreetViewEmbed';

interface LocationTabsProps {
  booth: Booth;
  hasStreetView: boolean;
}

export function LocationTabs({ booth, hasStreetView }: LocationTabsProps) {
  const [activeTab, setActiveTab] = useState<'map' | 'streetview'>('map');

  if (!hasStreetView) {
    return (
      <div className="mb-6 rounded-xl overflow-hidden h-96">
        <BoothMap
          booths={[booth]}
          center={{ lat: booth.latitude!, lng: booth.longitude! }}
          zoom={15}
          showUserLocation={false}
        />
      </div>
    );
  }

  const tabButtonClass = (isActive: boolean) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
      isActive
        ? 'bg-primary text-white shadow-md'
        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
    }`;

  return (
    <div className="mb-6">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('map')}
          className={tabButtonClass(activeTab === 'map')}
          aria-pressed={activeTab === 'map'}
        >
          <Map className="w-4 h-4" aria-hidden="true" />
          Map View
        </button>
        <button
          onClick={() => setActiveTab('streetview')}
          className={tabButtonClass(activeTab === 'streetview')}
          aria-pressed={activeTab === 'streetview'}
        >
          <MapPin className="w-4 h-4" aria-hidden="true" />
          Street View
        </button>
      </div>

      <div className="rounded-xl overflow-hidden h-96">
        {activeTab === 'map' ? (
          <BoothMap
            booths={[booth]}
            center={{ lat: booth.latitude!, lng: booth.longitude! }}
            zoom={15}
            showUserLocation={false}
          />
        ) : (
          <StreetViewEmbed booth={booth} className="w-full h-full" />
        )}
      </div>
    </div>
  );
}