'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Star,
  ThumbsUp,
  ChevronDown,
  User,
  Calendar,
  Camera,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  booth_id: string;
  user_id: string | null;
  rating: number;
  review_text: string | null;
  photos: string[];
  anonymous_name: string | null;
  helpful_count: number;
  created_at: string;
}

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface ReviewListProps {
  boothId: string;
  boothName: string;
}

type SortOption = 'recent' | 'helpful' | 'highest' | 'lowest';

export function ReviewList({ boothId, boothName }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [expandedPhotos, setExpandedPhotos] = useState<string | null>(null);

  const INITIAL_DISPLAY_COUNT = 5;

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/reviews?booth_id=${boothId}&sort=${sortBy}&limit=50`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Unable to load reviews. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [boothId, sortBy]);

  const handleHelpful = async (reviewId: string) => {
    // Optimistic update
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
      )
    );

    // TODO: Implement helpful vote API
    // For now, just update locally
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-neutral-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingBar = (count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-neutral-600">Loading reviews...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-neutral-600 mb-4">{error}</p>
        <Button variant="outline" onClick={fetchReviews}>
          Try Again
        </Button>
      </Card>
    );
  }

  if (!stats || stats.total_reviews === 0) {
    return (
      <Card className="p-8 text-center bg-neutral-50">
        <Star className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
        <h3 className="font-semibold text-neutral-700 mb-2">No Reviews Yet</h3>
        <p className="text-neutral-500 text-sm">
          Be the first to review {boothName}!
        </p>
      </Card>
    );
  }

  const displayedReviews = showAllReviews
    ? reviews
    : reviews.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overall Rating */}
          <div className="text-center md:text-left">
            <div className="flex items-baseline gap-2 justify-center md:justify-start">
              <span className="text-5xl font-bold text-neutral-900">
                {stats.average_rating.toFixed(1)}
              </span>
              <span className="text-neutral-500">/5</span>
            </div>
            <div className="flex justify-center md:justify-start mt-2">
              {renderStars(Math.round(stats.average_rating), 'lg')}
            </div>
            <p className="text-neutral-600 mt-2">
              Based on {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm text-neutral-600 w-3">{rating}</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {renderRatingBar(
                  stats.rating_distribution[rating as 1 | 2 | 3 | 4 | 5],
                  stats.total_reviews
                )}
                <span className="text-sm text-neutral-500 w-8 text-right">
                  {stats.rating_distribution[rating as 1 | 2 | 3 | 4 | 5]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-neutral-900">
          {stats.total_reviews} Review{stats.total_reviews !== 1 ? 's' : ''}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <Card key={review.id} className="p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-medium text-neutral-900">
                    {review.anonymous_name || 'Anonymous'}
                  </span>
                  {renderStars(review.rating)}
                </div>

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-neutral-500 mb-3">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(review.created_at), {
                    addSuffix: true,
                  })}
                </div>

                {/* Review Text */}
                {review.review_text && (
                  <p className="text-neutral-700 leading-relaxed mb-3">
                    {review.review_text}
                  </p>
                )}

                {/* Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="mb-3">
                    <button
                      onClick={() =>
                        setExpandedPhotos(
                          expandedPhotos === review.id ? null : review.id
                        )
                      }
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Camera className="w-4 h-4" />
                      {review.photos.length} photo{review.photos.length !== 1 ? 's' : ''}
                    </button>

                    {expandedPhotos === review.id && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {review.photos.map((photo, index) => (
                          <a
                            key={index}
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-24 h-24 rounded-lg overflow-hidden hover:opacity-90 transition"
                          >
                            <img
                              src={photo}
                              alt={`Review photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Helpful Button */}
                <button
                  onClick={() => handleHelpful(review.id)}
                  className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary transition"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Helpful
                  {review.helpful_count > 0 && (
                    <span className="text-neutral-400">
                      ({review.helpful_count})
                    </span>
                  )}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Show More Button */}
      {reviews.length > INITIAL_DISPLAY_COUNT && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowAllReviews(!showAllReviews)}
            className="gap-2"
          >
            {showAllReviews ? (
              'Show Less'
            ) : (
              <>
                Show All {reviews.length} Reviews
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
