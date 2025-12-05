'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { batchModerate } from './actions';

interface BatchActionsProps {
  selectedIds: string[];
  contentType: 'photos' | 'comments';
  userId: string;
  onSuccess?: () => void;
}

export function BatchActions({
  selectedIds,
  contentType,
  userId,
  onSuccess,
}: BatchActionsProps) {
  const [loading, setLoading] = useState(false);

  if (selectedIds.length === 0) {
    return null;
  }

  const handleBatchApprove = async () => {
    setLoading(true);
    try {
      const result = await batchModerate(
        selectedIds,
        'approved',
        contentType,
        userId
      );

      if (result.success) {
        toast.success(
          `${selectedIds.length} ${contentType} approved successfully`
        );
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to approve items');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchReject = async () => {
    setLoading(true);
    try {
      const result = await batchModerate(
        selectedIds,
        'rejected',
        contentType,
        userId
      );

      if (result.success) {
        toast.success(
          `${selectedIds.length} ${contentType} rejected successfully`
        );
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to reject items');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-blue-950/30 border-2 border-blue-500 rounded-lg">
      <div className="flex-1">
        <p className="text-sm font-semibold text-blue-300">
          {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
        </p>
        <p className="text-xs text-blue-200">
          Batch actions will be applied to all selected items
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleBatchApprove}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve All
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleBatchReject}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Reject All
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
