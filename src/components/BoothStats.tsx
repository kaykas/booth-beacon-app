'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Camera, MessageSquare, Heart, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BoothStatsProps {
  boothId: string;
}

interface Stats {
  photoCount: number;
  reviewCount: number;
  averageRating: number | null;
  bookmarkCount: number;
}

export function BoothStats({ boothId }: BoothStatsProps) {
  const [stats, setStats] = useState<Stats>({
    photoCount: 0,
    reviewCount: 0,
    averageRating: null,
    bookmarkCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        // Fetch photo count
        const { count: photoCount } = await supabase
          .from('booth_user_photos')
          .select('*', { count: 'exact', head: true })
          .eq('booth_id', boothId)
          .eq('moderation_status', 'approved');

        // Fetch review count and average rating
        const { data: reviewData } = await supabase
          .from('booth_comments')
          .select('rating')
          .eq('booth_id', boothId)
          .not('rating', 'is', null);

        const reviewCount = reviewData?.length || 0;
        const averageRating =
          reviewCount > 0
            ? reviewData.reduce((acc, r) => acc + (r.rating || 0), 0) / reviewCount
            : null;

        // Fetch bookmark count
        const { count: bookmarkCount } = await supabase
          .from('booth_bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('booth_id', boothId);

        setStats({
          photoCount: photoCount || 0,
          reviewCount,
          averageRating,
          bookmarkCount: bookmarkCount || 0,
        });
      } catch (error) {
        console.error('Error fetching booth stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();

    // Subscribe to real-time changes for photos
    const photosChannel = supabase
      .channel(`booth-photos-${boothId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booth_user_photos',
          filter: `booth_id=eq.${boothId}`,
        },
        (payload) => {
          // Refetch stats when photos change
          if (payload.new && typeof payload.new === 'object' && 'moderation_status' in payload.new && payload.new.moderation_status === 'approved') {
            fetchStats();
          } else if (payload.eventType === 'DELETE') {
            fetchStats();
          }
        }
      )
      .subscribe();

    // Subscribe to real-time changes for comments/reviews
    const commentsChannel = supabase
      .channel(`booth-comments-${boothId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booth_comments',
          filter: `booth_id=eq.${boothId}`,
        },
        () => {
          // Refetch stats when comments change
          fetchStats();
        }
      )
      .subscribe();

    // Subscribe to real-time changes for bookmarks
    const bookmarksChannel = supabase
      .channel(`booth-bookmarks-${boothId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booth_bookmarks',
          filter: `booth_id=eq.${boothId}`,
        },
        () => {
          // Refetch stats when bookmarks change
          fetchStats();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(photosChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(bookmarksChannel);
    };
  }, [boothId]);

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Community Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 bg-neutral-200 rounded-full mx-auto mb-2 animate-pulse" />
              <div className="h-6 w-16 bg-neutral-200 rounded mx-auto mb-1 animate-pulse" />
              <div className="h-4 w-20 bg-neutral-200 rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Community Stats</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Photos */}
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Camera className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.photoCount}</div>
          <div className="text-sm text-neutral-600">
            {stats.photoCount === 1 ? 'Photo' : 'Photos'}
          </div>
        </div>

        {/* Reviews */}
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <MessageSquare className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.reviewCount}</div>
          <div className="text-sm text-neutral-600">
            {stats.reviewCount === 1 ? 'Review' : 'Reviews'}
          </div>
        </div>

        {/* Average Rating */}
        <div className="text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Star className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            {stats.averageRating ? stats.averageRating.toFixed(1) : '-'}
          </div>
          <div className="text-sm text-neutral-600">Avg Rating</div>
        </div>

        {/* Bookmarks */}
        <div className="text-center">
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Heart className="w-6 h-6 text-pink-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.bookmarkCount}</div>
          <div className="text-sm text-neutral-600">
            {stats.bookmarkCount === 1 ? 'Save' : 'Saves'}
          </div>
        </div>
      </div>
    </Card>
  );
}
