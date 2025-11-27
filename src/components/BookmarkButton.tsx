/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';

interface BookmarkButtonProps {
  boothId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
}

export function BookmarkButton({
  boothId,
  variant = 'outline',
  size = 'default',
  showText = true,
}: BookmarkButtonProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkBookmark();
    }
  }, [user, boothId]);

  const checkBookmark = async () => {
    try {
      const { data, error } = await supabase
        .from('booth_bookmarks')
        .select('id')
        .eq('user_id', user!.id)
        .eq('booth_id', boothId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setIsBookmarked(!!data);
      setBookmarkId((data as any)?.id || null);
    } catch (error) {
      console.error('Error checking bookmark:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      toast.error('Please sign in to bookmark booths');
      return;
    }

    setLoading(true);

    try {
      if (isBookmarked && bookmarkId) {
        // Remove bookmark
        const { error } = await supabase
          .from('booth_bookmarks')
          .delete()
          .eq('id', bookmarkId);

        if (error) throw error;

        setIsBookmarked(false);
        setBookmarkId(null);
        toast.success('Bookmark removed');
      } else {
        // Add bookmark
        const { data, error } = await supabase
          .from('booth_bookmarks')
          .insert({
            user_id: user.id,
            booth_id: boothId,
            visited: false,
          } as any)
          .select()
          .single();

        if (error) throw error;

        setIsBookmarked(true);
        setBookmarkId((data as any).id);
        toast.success('Booth bookmarked');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isBookmarked ? 'default' : variant}
      size={size}
      onClick={toggleBookmark}
      disabled={loading}
    >
      <Bookmark className={`w-4 h-4 ${showText ? 'mr-2' : ''} ${isBookmarked ? 'fill-current' : ''}`} />
      {showText && (isBookmarked ? 'Bookmarked' : 'Bookmark')}
    </Button>
  );
}
