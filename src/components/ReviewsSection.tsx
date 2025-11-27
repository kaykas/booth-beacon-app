/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { BoothComment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewsSectionProps {
  boothId: string;
}

export function ReviewsSection({ boothId }: ReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<BoothComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [boothId]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('booth_comments')
        .select(`
          *,
          user:profiles(id, email, full_name)
        `)
        .eq('booth_id', boothId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviews = (data as BoothComment[]) || [];
      setReviews(reviews);

      // Check if current user has reviewed
      if (user) {
        const hasReviewed = reviews?.some((review: any) => review.user_id === user.id);
        setUserHasReviewed(!!hasReviewed);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to leave a review');
      return;
    }

    if (!content.trim()) {
      toast.error('Please write a review');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('booth_comments').insert({
        user_id: user.id,
        booth_id: boothId,
        content: content.trim(),
        rating,
      } as any);

      if (error) throw error;

      toast.success('Review posted successfully!');
      setContent('');
      setRating(5);
      setShowForm(false);
      loadReviews();
    } catch (error) {
      console.error('Error posting review:', error);
      toast.error('Failed to post review');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
      : 0;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold mb-2">Reviews & Ratings</h2>

        {/* Average Rating */}
        {reviews.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-neutral-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
            <span className="text-neutral-600">({reviews.length} reviews)</span>
          </div>
        )}

        {/* Add Review Button */}
        {user && !userHasReviewed && !showForm && (
          <Button onClick={() => setShowForm(true)} variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-neutral-200 rounded-lg">
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Your Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-neutral-300 hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Your Review</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience with this booth..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-32"
              required
              disabled={submitting}
              maxLength={1000}
            />
            <p className="text-xs text-neutral-500 mt-1">{content.length}/1000 characters</p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Review'
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-600">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-neutral-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-neutral-900">
                    {review.user?.full_name || review.user?.email || 'Anonymous'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {review.rating && (
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <span className="text-sm text-neutral-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-neutral-700 leading-relaxed">{review.content}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
