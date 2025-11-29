'use client';

import { useState } from 'react';
import { Camera, Heart } from 'lucide-react';

type VintageStyle = 'vintage-sepia' | 'vintage-bw' | 'vintage-faded' | 'vintage-warm' | 'vintage-cool' | 'vintage-polaroid';

interface PhotoStrip {
  id: string;
  frames: string[];
  location: string;
  date: string;
  user?: string;
  vintageStyle: VintageStyle;
}

// Sample photo strips with real images - in production these would come from Supabase
const sampleStrips: PhotoStrip[] = [
  {
    id: '1',
    frames: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face',
    ],
    location: 'Berlin, Germany',
    date: '2024',
    user: 'Alexandra',
    vintageStyle: 'vintage-sepia',
  },
  {
    id: '2',
    frames: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    ],
    location: 'Brooklyn, NY',
    date: '2024',
    user: 'Jascha',
    vintageStyle: 'vintage-bw',
  },
  {
    id: '3',
    frames: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    ],
    location: 'London, UK',
    date: '2024',
    vintageStyle: 'vintage-faded',
  },
  {
    id: '4',
    frames: [
      'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=150&h=150&fit=crop&crop=face',
    ],
    location: 'Paris, France',
    date: '2024',
    user: 'Marie',
    vintageStyle: 'vintage-warm',
  },
  {
    id: '5',
    frames: [
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    ],
    location: 'Tokyo, Japan',
    date: '2024',
    user: 'Yuki',
    vintageStyle: 'vintage-cool',
  },
  {
    id: '6',
    frames: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=150&h=150&fit=crop&crop=face',
    ],
    location: 'Amsterdam, NL',
    date: '2024',
    vintageStyle: 'vintage-polaroid',
  },
];

export function PhotoStrips() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background via-card to-background relative overflow-hidden film-grain">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 border-4 border-primary rounded-lg transform rotate-12"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 border-4 border-primary rounded-lg transform -rotate-6"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-2 mb-6 shadow-glow">
            <Camera className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium">Community Gallery</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Real Strips, Real Moments
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
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
              {/* Photo Strip Container - mimics real photo booth strip with vintage filter */}
              <div className={`relative photo-strip-frame rounded-lg p-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:rotate-1 ${strip.vintageStyle}`}>
                {/* Photo strip with 4 frames using actual images */}
                <div className="space-y-2">
                  {strip.frames.map((frameUrl, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded relative overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={frameUrl}
                        alt={`${strip.location} frame ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Film grain texture overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10 mix-blend-overlay"></div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Hover overlay with location info */}
              {hoveredId === strip.id && (
                <div className="absolute -bottom-2 left-0 right-0 z-20 bg-card rounded-lg shadow-glow border border-primary/20 p-3 text-center transition-all">
                  <div className="text-sm font-medium text-foreground">{strip.location}</div>
                  {strip.user && (
                    <div className="text-xs text-muted-foreground mt-1">by {strip.user}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center card-vintage rounded-xl p-8 max-w-2xl mx-auto">
          <h3 className="font-display text-2xl font-semibold text-foreground mb-3">
            Share Your Strips
          </h3>
          <p className="text-muted-foreground mb-6">
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
