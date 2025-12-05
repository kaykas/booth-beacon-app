'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Image as ImageIcon,
  MessageSquare,
  Filter,
  Calendar,
  User,
  MapPin,
  Star,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { ModerationActions } from './ModerationActions';
import { BatchActions } from './BatchActions';

interface BoothInfo {
  id: string;
  name: string;
  city: string;
  country: string;
  slug: string;
}

interface ProfileInfo {
  id: string;
  full_name: string | null;
  email: string;
}

interface Photo {
  id: string;
  user_id: string;
  booth_id: string;
  photo_url: string;
  caption: string | null;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  moderated_at: string | null;
  moderated_by: string | null;
  booth: BoothInfo;
  profile: ProfileInfo;
}

interface Comment {
  id: string;
  user_id: string;
  booth_id: string;
  content: string;
  rating: number;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  moderated_at: string | null;
  moderated_by: string | null;
  booth: BoothInfo;
  profile: ProfileInfo;
}

interface ModerationStats {
  photos: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  comments: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

interface ModerationDashboardProps {
  initialPhotos: Photo[];
  initialComments: Comment[];
  stats: ModerationStats;
  userId: string;
}

export function ModerationDashboard({
  initialPhotos,
  initialComments,
  stats,
  userId,
}: ModerationDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [selectedCommentIds, setSelectedCommentIds] = useState<string[]>([]);

  // Filter photos
  const filteredPhotos = useMemo(() => {
    if (statusFilter === 'all') return initialPhotos;
    return initialPhotos.filter((p) => p.moderation_status === statusFilter);
  }, [initialPhotos, statusFilter]);

  // Filter comments
  const filteredComments = useMemo(() => {
    if (statusFilter === 'all') return initialComments;
    return initialComments.filter((c) => c.moderation_status === statusFilter);
  }, [initialComments, statusFilter]);

  // Handle photo selection
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  // Handle comment selection
  const toggleCommentSelection = (commentId: string) => {
    setSelectedCommentIds((prev) =>
      prev.includes(commentId)
        ? prev.filter((id) => id !== commentId)
        : [...prev, commentId]
    );
  };

  // Handle success (refresh page)
  const handleSuccess = () => {
    setSelectedPhotoIds([]);
    setSelectedCommentIds([]);
    window.location.reload();
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-900 text-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="secondary" className="bg-green-900 text-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="secondary" className="bg-red-900 text-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold text-white">
            Moderation Dashboard
          </h1>
          <p className="text-neutral-400 mt-2">
            Review and moderate user-generated content
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Admin</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <ImageIcon className="w-8 h-8 text-purple-400" />
            {stats.photos.pending > 0 && (
              <Badge variant="secondary" className="bg-yellow-900 text-yellow-100">
                {stats.photos.pending} pending
              </Badge>
            )}
          </div>
          <div className="text-3xl font-bold text-white">{stats.photos.total}</div>
          <div className="text-sm text-neutral-400">Total Photos</div>
          <div className="mt-3 text-xs text-neutral-500 space-y-1">
            <div>Approved: {stats.photos.approved}</div>
            <div>Rejected: {stats.photos.rejected}</div>
          </div>
        </Card>

        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8 text-blue-400" />
            {stats.comments.pending > 0 && (
              <Badge variant="secondary" className="bg-yellow-900 text-yellow-100">
                {stats.comments.pending} pending
              </Badge>
            )}
          </div>
          <div className="text-3xl font-bold text-white">
            {stats.comments.total}
          </div>
          <div className="text-sm text-neutral-400">Total Comments</div>
          <div className="mt-3 text-xs text-neutral-500 space-y-1">
            <div>Approved: {stats.comments.approved}</div>
            <div>Rejected: {stats.comments.rejected}</div>
          </div>
        </Card>

        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {stats.photos.pending + stats.comments.pending}
          </div>
          <div className="text-sm text-neutral-400">Items Pending Review</div>
        </Card>

        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {stats.photos.approved + stats.comments.approved}
          </div>
          <div className="text-sm text-neutral-400">Items Approved</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-neutral-800 border-neutral-700">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-neutral-400" />
          <div className="flex-1">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-neutral-900 border-neutral-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="bg-neutral-800 border-neutral-700">
          <TabsTrigger
            value="photos"
            className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            User Photos ({filteredPhotos.length})
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Reviews ({filteredComments.length})
          </TabsTrigger>
        </TabsList>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-6">
          <div className="space-y-4">
            {/* Batch Actions */}
            <BatchActions
              selectedIds={selectedPhotoIds}
              contentType="photos"
              userId={userId}
              onSuccess={handleSuccess}
            />

            {/* Photos Grid */}
            {filteredPhotos.length === 0 ? (
              <Card className="p-12 bg-neutral-800 border-neutral-700">
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400">No photos found</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPhotos.map((photo) => (
                  <Card
                    key={photo.id}
                    className="overflow-hidden bg-neutral-800 border-neutral-700"
                  >
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.photo_url}
                        alt={photo.caption || 'User photo'}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Checkbox
                          checked={selectedPhotoIds.includes(photo.id)}
                          onCheckedChange={() => togglePhotoSelection(photo.id)}
                          className="bg-white/90"
                        />
                      </div>
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(photo.moderation_status)}
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {/* Booth Info */}
                      <div>
                        <Link
                          href={`/booths/${photo.booth.slug}`}
                          className="font-medium text-white hover:text-primary"
                        >
                          {photo.booth.name}
                        </Link>
                        <p className="text-sm text-neutral-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {photo.booth.city}, {photo.booth.country}
                        </p>
                      </div>

                      {/* Caption */}
                      {photo.caption && (
                        <p className="text-sm text-neutral-300 italic">
                          &quot;{photo.caption}&quot;
                        </p>
                      )}

                      {/* User Info */}
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <User className="w-3 h-3" />
                        <span>{photo.profile.full_name || photo.profile.email}</span>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(photo.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Actions */}
                      <ModerationActions
                        itemId={photo.id}
                        itemType="photo"
                        userId={userId}
                        onSuccess={handleSuccess}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="mt-6">
          <div className="space-y-4">
            {/* Batch Actions */}
            <BatchActions
              selectedIds={selectedCommentIds}
              contentType="comments"
              userId={userId}
              onSuccess={handleSuccess}
            />

            {/* Comments List */}
            {filteredComments.length === 0 ? (
              <Card className="p-12 bg-neutral-800 border-neutral-700">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400">No comments found</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredComments.map((comment) => (
                  <Card
                    key={comment.id}
                    className="p-6 bg-neutral-800 border-neutral-700"
                  >
                    <div className="flex gap-4">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <Checkbox
                          checked={selectedCommentIds.includes(comment.id)}
                          onCheckedChange={() =>
                            toggleCommentSelection(comment.id)
                          }
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Link
                              href={`/booths/${comment.booth.slug}`}
                              className="font-medium text-white hover:text-primary"
                            >
                              {comment.booth.name}
                            </Link>
                            <p className="text-sm text-neutral-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {comment.booth.city}, {comment.booth.country}
                            </p>
                          </div>
                          {getStatusBadge(comment.moderation_status)}
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < comment.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-neutral-600'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Comment Text */}
                        <p className="text-neutral-300">{comment.content}</p>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {comment.profile.full_name || comment.profile.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(comment.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Actions */}
                        <ModerationActions
                          itemId={comment.id}
                          itemType="comment"
                          userId={userId}
                          onSuccess={handleSuccess}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
