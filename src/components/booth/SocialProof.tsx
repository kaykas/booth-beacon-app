'use client';

import { Card } from '@/components/ui/card';
import { Users, Eye, Bookmark, TrendingUp } from 'lucide-react';

interface SocialProofProps {
  favoriteCount: number;
  visitCount: number;
}

export function SocialProof({ favoriteCount, visitCount }: SocialProofProps) {
  const totalEngagement = favoriteCount + visitCount;

  if (totalEngagement === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="text-center">
          <Users className="w-8 h-8 mx-auto text-primary mb-2" />
          <h3 className="font-semibold text-sm mb-1">Be the first to discover this booth!</h3>
          <p className="text-xs text-neutral-600">
            Bookmark this location and help others find it
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        Community Activity
      </h3>

      <div className="space-y-4">
        {favoriteCount > 0 && (
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bookmark className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Bookmarked</p>
                <p className="text-xs text-neutral-600">People saved this location</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-primary">{favoriteCount}</span>
          </div>
        )}

        {visitCount > 0 && (
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Page Views</p>
                <p className="text-xs text-neutral-600">Interest in this booth</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-primary">{visitCount}</span>
          </div>
        )}

        {totalEngagement >= 10 && (
          <div className="pt-3 border-t border-neutral-200">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">Popular location!</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
