'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  moderatePhoto,
  deletePhoto,
  moderateComment,
  deleteComment,
} from './actions';

interface ModerationActionsProps {
  itemId: string;
  itemType: 'photo' | 'comment';
  userId: string;
  onSuccess?: () => void;
}

export function ModerationActions({
  itemId,
  itemType,
  userId,
  onSuccess,
}: ModerationActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const result =
        itemType === 'photo'
          ? await moderatePhoto(itemId, 'approved', userId)
          : await moderateComment(itemId, 'approved', userId);

      if (result.success) {
        toast.success(`${itemType === 'photo' ? 'Photo' : 'Comment'} approved`);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to approve');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const result =
        itemType === 'photo'
          ? await moderatePhoto(itemId, 'rejected', userId)
          : await moderateComment(itemId, 'rejected', userId);

      if (result.success) {
        toast.success(`${itemType === 'photo' ? 'Photo' : 'Comment'} rejected`);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to reject');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const result =
        itemType === 'photo'
          ? await deletePhoto(itemId, userId)
          : await deleteComment(itemId, userId);

      if (result.success) {
        toast.success(`${itemType === 'photo' ? 'Photo' : 'Comment'} deleted`);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={loading}
        className="flex-1"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-1" />
            Approve
          </>
        )}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleReject}
        disabled={loading}
        className="flex-1"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <XCircle className="w-4 h-4 mr-1" />
            Reject
          </>
        )}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleDelete}
        disabled={loading}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
