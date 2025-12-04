'use client';

/**
 * Google Maps Button Component
 *
 * Opens a shareable Google Maps tour for a specific city.
 * Can be used on tour pages, city pages, or any booth listing.
 */

import { MapPin, ExternalLink } from 'lucide-react';
import { Booth } from '@/types';
import { generateCityTourMapUrl } from '@/lib/googleMapsUtils';

interface GoogleMapsButtonProps {
  city: string;
  booths?: Booth[];
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  showIcon?: boolean;
}

export function GoogleMapsButton({
  city,
  booths,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  showIcon = true,
}: GoogleMapsButtonProps) {
  const handleClick = () => {
    if (booths && booths.length > 0) {
      // Generate URL directly from provided booths (faster)
      const mapUrl = generateCityTourMapUrl({ booths, city });
      window.open(mapUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Fetch from API endpoint
      const citySlug = city.toLowerCase().replace(/\s+/g, '-');
      const apiUrl = `/api/maps/city/${citySlug}`;

      fetch(apiUrl)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.mapUrl) {
            window.open(data.mapUrl, '_blank', 'noopener,noreferrer');
          } else {
            console.error('Failed to generate map URL:', data.error);
            alert('Unable to generate map. Please try again.');
          }
        })
        .catch((error) => {
          console.error('API error:', error);
          alert('Unable to generate map. Please try again.');
        });
    }
  };

  // Styling based on variant and size
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded transition-all';

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-darker shadow-sm hover:shadow',
    secondary: 'bg-secondary text-neutral-900 hover:bg-secondary-dark active:bg-secondary-darker',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  const className = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle}`.trim();

  return (
    <button
      onClick={handleClick}
      className={className}
      title={`Open ${city} photo booth tour in Google Maps`}
      aria-label={`Open ${city} photo booth tour in Google Maps`}
    >
      {showIcon && <MapPin className="w-5 h-5" />}
      <span>Open in Google Maps</span>
      <ExternalLink className="w-4 h-4 opacity-70" />
    </button>
  );
}
