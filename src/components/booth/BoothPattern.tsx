'use client';

import React, { useMemo } from 'react';

interface BoothPatternProps {
  boothId: string;
  className?: string;
}

export function BoothPattern({ boothId, className = '' }: BoothPatternProps) {
  // Deterministically select a pattern based on boothId
  const patternIndex = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < boothId.length; i++) {
      hash = boothId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 4; // 4 pattern variations
  }, [boothId]);

  // Brand colors: #C73E3A (Primary Red), #D4A853 (Gold), #1A1A1A (Black), #F5F0E8 (Cream)
  // We use muted versions for backgrounds to ensure text readability if overlaid

  const renderPattern = () => {
    switch (patternIndex) {
      case 0: // Film Strips
        return (
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect width="100%" height="100%" fill="#F5F0E8" />
            <path d="M0 0 L100 100 M20 0 L120 100 M-20 0 L80 100" stroke="#E8E0D4" strokeWidth="20" />
            <circle cx="50" cy="50" r="15" fill="#D4A853" fillOpacity="0.2" />
          </svg>
        );
      case 1: // Aperture
        return (
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect width="100%" height="100%" fill="#1A1A1A" />
            <circle cx="50" cy="50" r="40" stroke="#333" strokeWidth="2" fill="none" />
            <circle cx="50" cy="50" r="30" stroke="#333" strokeWidth="2" fill="none" />
            <circle cx="50" cy="50" r="20" stroke="#C73E3A" strokeWidth="4" fillOpacity="0.1" />
          </svg>
        );
      case 2: // Halftone
        return (
          <svg width="100%" height="100%" viewBox="0 0 40 40" preserveAspectRatio="xMidYMid slice">
            <rect width="100%" height="100%" fill="#C73E3A" />
            <pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#9A2E2B" />
              <circle cx="7" cy="7" r="1" fill="#9A2E2B" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        );
      case 3: // Darkroom
        return (
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#2a2a2a', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#1a1a1a', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad)" />
            <path d="M0 50 Q 50 0 100 50" stroke="#333" fill="none" strokeWidth="2" />
            <path d="M0 70 Q 50 20 100 70" stroke="#333" fill="none" strokeWidth="2" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`w-full h-full overflow-hidden ${className}`}>
      {renderPattern()}
    </div>
  );
}
