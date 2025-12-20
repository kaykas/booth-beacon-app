'use client';

import { useState } from 'react';
import { Camera, Upload } from 'lucide-react';

interface VintageBoothPlaceholderProps {
  onAddPhoto?: () => void;
  className?: string;
  showUploadButton?: boolean;
}

/**
 * Vintage Photo Booth Illustration Placeholder
 *
 * A custom SVG illustration of a vintage photo booth with warm colors,
 * retro styling, and classic elements like curtain, stool, and flash.
 *
 * Design Philosophy:
 * - Intentional and brand-aligned, not like missing content
 * - Warm vintage color palette (amber, sepia, burgundy)
 * - SVG-based for scalability
 * - Interactive with hover effects
 */
export function VintageBoothPlaceholder({
  onAddPhoto,
  className = '',
  showUploadButton = true,
}: VintageBoothPlaceholderProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient Background with Vintage Feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50" />

      {/* Subtle Film Grain Texture */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vintage Photo Booth SVG Illustration */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <svg
          width="160"
          height="200"
          viewBox="0 0 160 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-300 ${isHovered ? 'scale-105' : 'scale-100'}`}
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))' }}
        >
          {/* Main Booth Body */}
          <rect
            x="20"
            y="40"
            width="120"
            height="140"
            rx="8"
            fill="#8B4513"
            opacity="0.9"
          />

          {/* Front Panel (Lighter) */}
          <rect
            x="25"
            y="45"
            width="110"
            height="130"
            rx="6"
            fill="#A0522D"
            opacity="0.95"
          />

          {/* Curtain Rod */}
          <rect
            x="30"
            y="55"
            width="100"
            height="4"
            rx="2"
            fill="#654321"
          />

          {/* Curtain Left */}
          <path
            d="M 30 59 Q 40 70, 35 90 L 30 130 L 30 59 Z"
            fill="#C41E3A"
            opacity="0.85"
          />
          <path
            d="M 40 59 Q 50 70, 45 90 L 40 130 L 40 59 Z"
            fill="#8B1538"
            opacity="0.75"
          />

          {/* Curtain Right */}
          <path
            d="M 130 59 Q 120 70, 125 90 L 130 130 L 130 59 Z"
            fill="#C41E3A"
            opacity="0.85"
          />
          <path
            d="M 120 59 Q 110 70, 115 90 L 120 130 L 120 59 Z"
            fill="#8B1538"
            opacity="0.75"
          />

          {/* Screen/Opening */}
          <rect
            x="55"
            y="70"
            width="50"
            height="50"
            rx="4"
            fill="#2C2416"
            opacity="0.8"
          />

          {/* Screen Highlight */}
          <rect
            x="60"
            y="75"
            width="40"
            height="35"
            rx="2"
            fill="#3C3426"
            opacity="0.6"
          />

          {/* Camera Lens */}
          <circle cx="80" cy="95" r="8" fill="#1a1a1a" />
          <circle cx="80" cy="95" r="5" fill="#333" />
          <circle cx="82" cy="93" r="2" fill="#666" opacity="0.8" />

          {/* Flash/Light */}
          <circle cx="80" cy="130" r="6" fill="#FFD700" opacity="0.7" />
          <circle cx="80" cy="130" r="4" fill="#FFA500" opacity="0.8" />

          {/* Coin Slot */}
          <rect
            x="70"
            y="145"
            width="20"
            height="8"
            rx="2"
            fill="#2C2416"
            opacity="0.7"
          />

          {/* Stool */}
          <ellipse cx="80" cy="185" rx="25" ry="5" fill="#654321" opacity="0.6" />
          <rect
            x="75"
            y="180"
            width="10"
            height="15"
            rx="2"
            fill="#8B4513"
            opacity="0.7"
          />

          {/* Photo Strip Coming Out */}
          <g opacity={isHovered ? "1" : "0.7"} className="transition-opacity duration-300">
            <rect
              x="100"
              y="160"
              width="18"
              height="35"
              rx="2"
              fill="#FFFEF7"
              stroke="#2C2416"
              strokeWidth="1"
            />
            {/* Photo frames on strip */}
            <rect x="102" y="162" width="14" height="9" fill="#E8E8E8" />
            <rect x="102" y="172" width="14" height="9" fill="#E8E8E8" />
            <rect x="102" y="182" width="14" height="9" fill="#E8E8E8" />
          </g>

          {/* Decorative vintage details */}
          <circle cx="40" cy="165" r="3" fill="#654321" opacity="0.5" />
          <circle cx="120" cy="165" r="3" fill="#654321" opacity="0.5" />
        </svg>

        {/* Badge */}
        <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-amber-200">
          <Camera className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-medium text-amber-900">No photo yet</span>
        </div>

        {/* Upload Button */}
        {showUploadButton && onAddPhoto && (
          <button
            onClick={onAddPhoto}
            className={`mt-4 px-4 py-2 bg-white border-2 border-amber-600 text-amber-900 rounded-lg font-semibold hover:bg-amber-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 ${
              isHovered ? 'scale-105' : 'scale-100'
            }`}
          >
            <Upload className="w-4 h-4" />
            Add First Photo
          </button>
        )}

        {/* Encouraging Text */}
        {!showUploadButton && (
          <p className="mt-4 text-xs text-amber-700 text-center max-w-[200px] leading-relaxed">
            Help the community by adding a real photo of this booth
          </p>
        )}
      </div>

      {/* Hover Overlay */}
      {onAddPhoto && isHovered && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none transition-opacity duration-300" />
      )}
    </div>
  );
}
