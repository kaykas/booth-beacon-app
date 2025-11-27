'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { BoothBookmark, Booth } from '@/types';
import { toast } from 'sonner';

export interface BookmarkWithBooth extends BoothBookmark {
  booth?: Booth;
}

/**
 * Hook to get all user's bookmarks
 * @returns Object with bookmarks array, loading state, error, and refetch function
 */
export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkWithBooth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('booth_bookmarks')
        .select(`
          id,
          user_id,
          booth_id,
          collection_id,
          notes,
          visited,
          visited_at,
          created_at,
          booth:booths (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setBookmarks((data as BookmarkWithBooth[]) || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return { bookmarks, loading, error, refetch: fetchBookmarks };
}

/**
 * Hook to get a single bookmark for a specific booth
 * @param boothId - The booth ID to check
 * @returns Object with bookmark data, loading state, and refetch function
 */
export function useBookmark(boothId: string) {
  const { user } = useAuth();
  const [bookmark, setBookmark] = useState<BoothBookmark | null>(null);
  const [loading, setLoading] = useState(true);

  const checkBookmark = useCallback(async () => {
    if (!user || !boothId) {
      setBookmark(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('booth_bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .eq('booth_id', boothId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setBookmark(data as BoothBookmark | null);
    } catch (error) {
      console.error('Error checking bookmark:', error);
    } finally {
      setLoading(false);
    }
  }, [user, boothId]);

  useEffect(() => {
    checkBookmark();
  }, [checkBookmark]);

  return { bookmark, isBookmarked: !!bookmark, loading, refetch: checkBookmark };
}

/**
 * Hook to toggle a bookmark (add or remove)
 * @returns Toggle function and loading state
 */
export function useToggleBookmark() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const toggleBookmark = async (boothId: string, currentBookmark?: BoothBookmark | null): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in to bookmark booths');
      return false;
    }

    setLoading(true);

    try {
      if (currentBookmark) {
        // Remove bookmark
        const { error } = await supabase
          .from('booth_bookmarks')
          .delete()
          .eq('id', currentBookmark.id);

        if (error) throw error;

        toast.success('Bookmark removed');
        return false;
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('booth_bookmarks')
          // @ts-ignore - Supabase typing issue
          .insert({
            user_id: user.id,
            booth_id: boothId,
            visited: false,
          })
          .select()
          .single();

        if (error) throw error;

        toast.success('Booth bookmarked');
        return true;
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
      return !!currentBookmark;
    } finally {
      setLoading(false);
    }
  };

  return { toggleBookmark, loading };
}

/**
 * Hook to mark a bookmark as visited/not visited
 * @returns Function to update visited status and loading state
 */
export function useMarkVisited() {
  const [loading, setLoading] = useState(false);

  const markVisited = async (bookmarkId: string, visited: boolean): Promise<boolean> => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('booth_bookmarks')
        // @ts-ignore - Supabase typing issue
        .update({
          visited,
          visited_at: visited ? new Date().toISOString() : null,
        })
        .eq('id', bookmarkId);

      if (error) throw error;

      toast.success(visited ? 'Marked as visited' : 'Marked as not visited');
      return true;
    } catch (error) {
      console.error('Error updating visited status:', error);
      toast.error('Failed to update visited status');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { markVisited, loading };
}

/**
 * Hook to update bookmark notes
 * @returns Function to update notes and loading state
 */
export function useUpdateNotes() {
  const [loading, setLoading] = useState(false);

  const updateNotes = async (bookmarkId: string, notes: string): Promise<boolean> => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('booth_bookmarks')
        // @ts-ignore - Supabase typing issue
        .update({ notes })
        .eq('id', bookmarkId);

      if (error) throw error;

      toast.success('Notes saved');
      return true;
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to save notes');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateNotes, loading };
}
