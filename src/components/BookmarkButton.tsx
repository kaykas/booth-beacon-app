'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useBookmark, useToggleBookmark } from '@/hooks/useBookmarks';
import { toast } from 'sonner';

interface BookmarkButtonProps {
  boothId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
  className?: string;
}

export function BookmarkButton({
  boothId,
  variant = 'outline',
  size = 'default',
  showText = true,
  className,
}: BookmarkButtonProps) {
  const { user } = useAuth();
  const { bookmark, isBookmarked, refetch } = useBookmark(boothId);
  const { toggleBookmark, loading } = useToggleBookmark();
  const [optimisticBookmarked, setOptimisticBookmarked] = useState<boolean | null>(null);

  // Use optimistic state if available, otherwise use actual state
  const displayBookmarked = optimisticBookmarked !== null ? optimisticBookmarked : isBookmarked;

  const handleToggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to bookmark booths');
      return;
    }

    // Optimistic update
    const _newState = !displayBookmarked;
    setOptimisticBookmarked(_newState);

    // Perform actual toggle
    await toggleBookmark(boothId, bookmark);

    // Refetch to ensure sync
    await refetch();

    // Clear optimistic state
    setOptimisticBookmarked(null);
  }, [user, displayBookmarked, boothId, bookmark, toggleBookmark, refetch]);

  return (
    <Button
      variant={displayBookmarked ? 'default' : variant}
      size={size}
      onClick={handleToggle}
      disabled={loading}
      className={`${displayBookmarked ? 'bg-pink-600 hover:bg-pink-700' : ''} ${className || ''}`}
    >
      <Heart
        className={`w-4 h-4 ${showText ? 'mr-2' : ''} ${displayBookmarked ? 'fill-current' : ''}`}
      />
      {showText && (displayBookmarked ? 'Saved' : 'Save')}
    </Button>
  );
}
