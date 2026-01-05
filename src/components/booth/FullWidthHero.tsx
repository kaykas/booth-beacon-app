'use client';

import { MapPin, Navigation, Star, CheckCircle, Clock, Banknote, CreditCard } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { BookmarkButton } from '@/components/BookmarkButton';
import { ShareButton } from '@/components/ShareButton';
import { BoothImage } from '@/components/booth/BoothImage';
import { RenderableBooth } from '@/lib/boothViewModel';

interface FullWidthHeroProps {
  booth: RenderableBooth;
  locationString: string;
  hasValidLocation: boolean;
}

function isRecentlyVerified(lastVerified: string | null | undefined): boolean {
  if (!lastVerified) return false;
  try {
    const verifiedDate = new Date(lastVerified);
    const daysSince = (Date.now() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  } catch {
    return false;
  }
}

function isOpenNow(hours: string | null | undefined): boolean {
  if (!hours) return false;
  try {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = dayNames[now.getDay()];
    const lines = hours.split('\n');
    const todayLine = lines.find(line => line.startsWith(today));
    if (!todayLine) return false;
    if (todayLine.includes('Closed')) return false;
    if (todayLine.includes('Open 24 hours')) return true;
    return true;
  } catch {
    return false;
  }
}

export function FullWidthHero({ booth, locationString, hasValidLocation }: FullWidthHeroProps) {
  const isVerified = isRecentlyVerified(booth.last_verified);
  const isOpen = isOpenNow(booth.hours);
  const isOperational = booth.status === 'active' && !booth.needs_verification;

  return (
    <div className="relative">
      {/* Full-Width Hero Image */}
      <div className="relative h-[60vh] min-h-[500px] max-h-[700px] bg-neutral-100">
        <div className="absolute inset-0">
          <BoothImage booth={booth} size="hero" showAiBadge={false} />
        </div>

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {/* Hero Content - Overlaid on Image */}
      <div className="absolute bottom-0 left-0 right-0 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Location Breadcrumb */}
          <div className="flex items-center gap-2 text-white/90 mb-4">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{locationString}</span>
          </div>

          {/* Booth Name - Large Serif Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight font-serif">
            {booth.name}
          </h1>

          {/* Trust Badges Row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
            {/* Google Rating */}
            {booth.google_rating && (
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(booth.google_rating!)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-neutral-900">
                  {booth.google_rating.toFixed(1)}
                </span>
                {booth.google_user_ratings_total && (
                  <span className="text-sm text-neutral-600">
                    ({booth.google_user_ratings_total})
                  </span>
                )}
              </div>
            )}

            {/* Verified Badge */}
            {isVerified && booth.last_verified && (
              <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  Verified {formatDistanceToNow(new Date(booth.last_verified), { addSuffix: true })}
                </span>
              </div>
            )}

            {/* Operational Status */}
            {isOperational && (
              <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">Currently Operational</span>
              </div>
            )}

            {/* Open Now */}
            {isOpen && (
              <div className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">Open Now</span>
              </div>
            )}
          </div>

          {/* Key Details Row */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            {/* Cost */}
            {booth.cost && (
              <div className="text-white/90">
                <span className="text-2xl font-bold">{booth.cost}</span>
                <span className="text-sm ml-2">per strip</span>
              </div>
            )}

            {/* Payment Methods */}
            {(booth.accepts_cash || booth.accepts_card) && (
              <div className="flex items-center gap-2">
                {booth.accepts_cash && (
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-md">
                    <Banknote className="w-4 h-4" />
                    <span className="text-sm font-medium">Cash</span>
                  </div>
                )}
                {booth.accepts_card && (
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-md">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm font-medium">Card</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Primary CTA - Get Directions */}
            {hasValidLocation && booth.latitude && booth.longitude && (
              <Button
                size="xl"
                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold shadow-2xl hover:shadow-amber-500/50 transition-all duration-200"
                asChild
              >
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${booth.latitude},${booth.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  Get Directions
                </a>
              </Button>
            )}

            {/* Secondary Actions */}
            <BookmarkButton
              boothId={booth.id}
              variant="outline"
              size="lg"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/30 text-white hover:text-white"
            />
            <ShareButton
              title={`${booth.name} - ${locationString}`}
              text={`Check out this photo booth: ${booth.name}`}
              variant="outline"
              size="lg"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/30 text-white hover:text-white"
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
