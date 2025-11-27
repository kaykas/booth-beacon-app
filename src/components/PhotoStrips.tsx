'use client';

import { useState } from 'react';
import { Camera, Heart } from 'lucide-react';
import Image from 'next/image';

interface PhotoStrip {
  id: string;
  imageUrl: string;
  location: string;
  date: string;
  user?: string;
}

// Sample photo strips - in production these would come from Supabase
const sampleStrips: PhotoStrip[] = [
  {
    id: '1',
    imageUrl: '/photostrip-1.jpg',
    location: 'Berlin, Germany',
    date: '2024',
    user: 'Alexandra',
  },
  {
    id: '2',
    imageUrl: '/photostrip-2.jpg',
    location: 'Brooklyn, NY',
    date: '2024',
    user: 'Jascha',
  },
  {
    id: '3',
    imageUrl: '/photostrip-3.jpg',
    location: 'London, UK',
    date: '2024',
  },
  {
    id: '4',
    imageUrl: '/photostrip-4.jpg',
    location: 'Paris, France',
    date: '2024',
  },
  {
    id: '5',
    imageUrl: '/photostrip-5.jpg',
    location: 'Tokyo, Japan',
    date: '2024',
  },
  {
    id: '6',
    imageUrl: '/photostrip-6.jpg',
    location: 'Amsterdam, NL',
    date: '2024',
  },
];

export function PhotoStrips() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white via-secondary to-white relative overflow-hidden film-grain">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 border-4 border-primary rounded-lg transform rotate-12 shadow-photo"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 border-4 border-accent rounded-lg transform -rotate-6 shadow-photo"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6 shadow-photo">
            <Camera className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium">Community Gallery</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-neutral-900 mb-4">
            Real Strips, Real Moments
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Four frames. No filters. Just genuine moments captured in authentic photo booths around the world.
          </p>
        </div>

        {/* Photo Strip Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          {sampleStrips.map((strip) => (
            <div
              key={strip.id}
              className="group relative"
              onMouseEnter={() => setHoveredId(strip.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Photo Strip Container - mimics real photo booth strip */}
              <div className="relative photo-strip-frame rounded-lg p-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:rotate-1">
                {/* Mock photo strip with 4 frames */}
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((frame) => (
                    <div
                      key={frame}
                      className="aspect-square bg-gradient-to-br from-neutral-200 to-neutral-300 rounded relative overflow-hidden"
                    >
                      {/* Placeholder for actual booth photo */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-neutral-400" />
                      </div>
                      {/* Film grain texture overlay */}
                      <div className="absolute inset-0 bg-[url('/film-grain.png')] opacity-20 mix-blend-overlay"></div>
                    </div>
                  ))}
                </div>

                {/* Bottom label on strip */}
                <div className="mt-2 text-center">
                  <div className="text-xs font-mono text-neutral-500 tracking-wider">
                    {strip.date}
                  </div>
                </div>
              </div>

              {/* Hover overlay with location info */}
              {hoveredId === strip.id && (
                <div className="absolute -bottom-2 left-0 right-0 z-20 bg-white rounded-lg shadow-photo border border-neutral-200 p-3 text-center transition-all">
                  <div className="text-sm font-medium text-neutral-900">{strip.location}</div>
                  {strip.user && (
                    <div className="text-xs text-neutral-500 mt-1">by {strip.user}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center card-vintage rounded-xl p-8 max-w-2xl mx-auto">
          <h3 className="font-display text-2xl font-semibold text-neutral-900 mb-3">
            Share Your Strips
          </h3>
          <p className="text-neutral-600 mb-6">
            Taken a memorable photo booth strip? Share it with our community and inspire others to find their next four frames.
          </p>
          <button className="inline-flex items-center gap-2 btn-analog text-white font-medium px-6 py-3 rounded-lg border-0">
            <Heart className="w-5 h-5" />
            Upload Your Strip
          </button>
        </div>
      </div>
    </section>
  );
}
