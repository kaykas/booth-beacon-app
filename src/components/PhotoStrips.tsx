'use client';

import { useState } from 'react';
import { Camera, Heart, Users } from 'lucide-react';
import Link from 'next/link';

interface PhotoStrip {
  id: string;
  location: string;
  date: string;
  user?: string;
  // Vintage color themes for different strips
  theme: 'sepia' | 'bw' | 'warm' | 'cool' | 'faded' | 'classic';
}

// Sample photo strips with vintage themes
const sampleStrips: PhotoStrip[] = [
  {
    id: '1',
    location: 'Berlin, Germany',
    date: 'DEC 2024',
    user: 'Alexandra',
    theme: 'sepia',
  },
  {
    id: '2',
    location: 'Brooklyn, NY',
    date: 'NOV 2024',
    user: 'Jascha',
    theme: 'bw',
  },
  {
    id: '3',
    location: 'London, UK',
    date: 'OCT 2024',
    theme: 'warm',
  },
  {
    id: '4',
    location: 'Paris, France',
    date: 'SEP 2024',
    theme: 'faded',
  },
  {
    id: '5',
    location: 'Tokyo, Japan',
    date: 'AUG 2024',
    theme: 'cool',
  },
  {
    id: '6',
    location: 'Amsterdam, NL',
    date: 'JUL 2024',
    theme: 'classic',
  },
];

// Vintage theme gradients for photo frames
const themeStyles: Record<PhotoStrip['theme'], { bg: string; accent: string }> = {
  sepia: {
    bg: 'from-amber-100 via-amber-50 to-orange-100',
    accent: 'bg-amber-800/20',
  },
  bw: {
    bg: 'from-neutral-200 via-neutral-100 to-neutral-300',
    accent: 'bg-neutral-800/30',
  },
  warm: {
    bg: 'from-orange-100 via-rose-50 to-amber-100',
    accent: 'bg-rose-800/20',
  },
  cool: {
    bg: 'from-slate-200 via-blue-50 to-slate-100',
    accent: 'bg-slate-700/20',
  },
  faded: {
    bg: 'from-stone-200 via-stone-100 to-zinc-200',
    accent: 'bg-stone-600/20',
  },
  classic: {
    bg: 'from-yellow-100 via-amber-50 to-yellow-100',
    accent: 'bg-yellow-900/20',
  },
};

// Simulated vintage photo content for each frame
const frameContents = [
  { emoji: '😊', label: 'smile' },
  { emoji: '😄', label: 'laugh' },
  { emoji: '🤪', label: 'silly' },
  { emoji: '😎', label: 'cool' },
];

export function PhotoStrips() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white via-secondary to-white relative overflow-hidden">
      {/* Film grain overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}></div>

      {/* Decorative floating frames */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[5%] w-24 h-32 border-4 border-primary/20 rounded-lg transform rotate-12"></div>
        <div className="absolute top-40 right-[8%] w-20 h-28 border-4 border-accent/20 rounded-lg transform -rotate-6"></div>
        <div className="absolute bottom-32 left-[12%] w-16 h-24 border-4 border-primary/15 rounded-lg transform rotate-3"></div>
        <div className="absolute bottom-20 right-[15%] w-28 h-36 border-4 border-accent/15 rounded-lg transform -rotate-12"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-5 py-2.5 mb-6 shadow-lg border border-neutral-200">
            <Camera className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">Community Gallery</span>
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
          {sampleStrips.map((strip, stripIndex) => (
            <div
              key={strip.id}
              className="group relative"
              onMouseEnter={() => setHoveredId(strip.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Photo Strip Container - authentic photo booth strip styling */}
              <div
                className="relative bg-white rounded-lg p-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 hover:rotate-1"
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(0,0,0,0.05)',
                }}
              >
                {/* Perforation holes at top */}
                <div className="flex justify-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-neutral-200"></div>
                  <div className="w-2 h-2 rounded-full bg-neutral-200"></div>
                </div>

                {/* 4 photo frames */}
                <div className="space-y-1.5">
                  {frameContents.map((frame, frameIndex) => (
                    <div
                      key={frameIndex}
                      className={`aspect-square rounded-sm relative overflow-hidden bg-gradient-to-br ${themeStyles[strip.theme].bg}`}
                    >
                      {/* Vintage photo effect layers */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                      <div className={`absolute inset-0 ${themeStyles[strip.theme].accent}`}></div>

                      {/* Vignette effect */}
                      <div className="absolute inset-0" style={{
                        background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.15) 100%)',
                      }}></div>

                      {/* Content placeholder - stylized silhouette */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neutral-400/40 to-neutral-500/40 flex items-center justify-center">
                          <Users className="w-6 h-6 text-neutral-500/60" />
                        </div>
                      </div>

                      {/* Light leak effect on some frames */}
                      {frameIndex === 0 && (
                        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-amber-200/30 to-transparent"></div>
                      )}
                      {frameIndex === 2 && (
                        <div className="absolute bottom-0 left-0 w-1/2 h-1/4 bg-gradient-to-tr from-rose-200/20 to-transparent"></div>
                      )}

                      {/* Film grain texture */}
                      <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                      }}></div>
                    </div>
                  ))}
                </div>

                {/* Bottom label - authentic photo booth style */}
                <div className="mt-2 pt-1.5 border-t border-neutral-100">
                  <div className="text-[10px] font-mono text-neutral-400 tracking-widest text-center uppercase">
                    {strip.date}
                  </div>
                </div>

                {/* Perforation holes at bottom */}
                <div className="flex justify-center gap-3 mt-1.5">
                  <div className="w-2 h-2 rounded-full bg-neutral-200"></div>
                  <div className="w-2 h-2 rounded-full bg-neutral-200"></div>
                </div>
              </div>

              {/* Hover tooltip with location info */}
              <div
                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 bg-neutral-900 text-white rounded-lg px-3 py-2 text-center transition-all duration-200 whitespace-nowrap ${
                  hoveredId === strip.id ? 'opacity-100 translate-y-full' : 'opacity-0 translate-y-[80%] pointer-events-none'
                }`}
              >
                <div className="text-sm font-medium">{strip.location}</div>
                {strip.user && (
                  <div className="text-xs text-neutral-400 mt-0.5">by {strip.user}</div>
                )}
                {/* Arrow */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-neutral-900 rotate-45"></div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-block bg-white rounded-2xl p-8 shadow-xl border border-neutral-100">
            <h3 className="font-display text-2xl font-semibold text-neutral-900 mb-3">
              Share Your Strips
            </h3>
            <p className="text-neutral-600 mb-6 max-w-md">
              Taken a memorable photo booth strip? Share it with our community and inspire others to find their next four frames.
            </p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              <Heart className="w-5 h-5" />
              Upload Your Strip
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
