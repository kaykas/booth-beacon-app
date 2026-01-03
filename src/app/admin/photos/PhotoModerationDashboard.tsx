'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Image as ImageIcon,
  Filter,
  Calendar,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  AlertCircle,
  Eye,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

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
  photo_type: string | null;
  notes: string | null;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  moderated_at: string | null;
  moderated_by: string | null;
  booth: BoothInfo;
  profile: ProfileInfo;
}

interface PhotoModerationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface PhotoModerationDashboardProps {
  initialPhotos: Photo[];
  stats: PhotoModerationStats;
  userId: string;
}

export function PhotoModerationDashboard({
  initialPhotos,
  stats,
  userId,
}: PhotoModerationDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [processing, setProcessing] = useState<string[]>([]);

  // Filter and search photos
  const filteredPhotos = useMemo(() => {
    let filtered = initialPhotos;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.moderation_status === statusFilter);
    }

    // Search by booth name
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.booth.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [initialPhotos, statusFilter, searchQuery]);

  // Handle photo selection
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  // Moderate single photo
  const moderatePhoto = async (photoId: string, status: 'approved' | 'rejected') => {
    setProcessing((prev) => [...prev, photoId]);

    try {
      const response = await fetch('/api/admin/photos/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, status, userId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to moderate photo');
      }

      toast.success(
        status === 'approved' ? 'Photo approved' : 'Photo rejected'
      );

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error moderating photo:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to moderate photo');
    } finally {
      setProcessing((prev) => prev.filter((id) => id !== photoId));
    }
  };

  // Batch moderate
  const batchModerate = async (status: 'approved' | 'rejected') => {
    if (selectedPhotoIds.length === 0) {
      toast.error('Please select photos to moderate');
      return;
    }

    setProcessing((prev) => [...prev, ...selectedPhotoIds]);

    try {
      const response = await fetch('/api/admin/photos/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds: selectedPhotoIds, status, userId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to moderate photos');
      }

      toast.success(
        `${selectedPhotoIds.length} photo${selectedPhotoIds.length > 1 ? 's' : ''} ${status}`
      );

      setSelectedPhotoIds([]);
      window.location.reload();
    } catch (error) {
      console.error('Error batch moderating:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to moderate photos');
    } finally {
      setProcessing((prev) =>
        prev.filter((id) => !selectedPhotoIds.includes(id))
      );
    }
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

  // Get photo type badge
  const getPhotoTypeBadge = (type: string | null) => {
    if (!type) return null;

    const colors: Record<string, string> = {
      exterior: 'bg-blue-900 text-blue-100',
      interior: 'bg-purple-900 text-purple-100',
      strips: 'bg-pink-900 text-pink-100',
      other: 'bg-neutral-700 text-neutral-300',
    };

    return (
      <Badge variant="secondary" className={colors[type] || colors.other}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold text-white">
            Photo Moderation
          </h1>
          <p className="text-neutral-400 mt-2">
            Review and moderate community-uploaded photos
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
          </div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-neutral-400">Total Photos</div>
        </Card>

        <Card className={`p-6 ${stats.pending > 0 ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-neutral-800 border-neutral-700'}`}>
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-400" />
            {stats.pending > 0 && (
              <Badge variant="secondary" className="bg-yellow-900 text-yellow-100">
                {stats.pending} pending
              </Badge>
            )}
          </div>
          <div className="text-3xl font-bold text-white">{stats.pending}</div>
          <div className="text-sm text-neutral-400">Pending Review</div>
        </Card>

        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.approved}</div>
          <div className="text-sm text-neutral-400">Approved</div>
        </Card>

        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.rejected}</div>
          <div className="text-sm text-neutral-400">Rejected</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-neutral-800 border-neutral-700">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <Filter className="w-5 h-5 text-neutral-400 mt-2 md:mt-0" />

          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search by booth name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-neutral-900 border-neutral-700 text-white"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 bg-neutral-900 border-neutral-700 text-white">
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
      </Card>

      {/* Batch Actions */}
      {selectedPhotoIds.length > 0 && (
        <Card className="p-4 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-white">
              {selectedPhotoIds.length} photo{selectedPhotoIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => batchModerate('approved')}
                disabled={processing.length > 0}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve All
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => batchModerate('rejected')}
                disabled={processing.length > 0}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedPhotoIds([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <Card className="p-12 bg-neutral-800 border-neutral-700">
          <div className="text-center">
            <ImageIcon className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400">
              {searchQuery
                ? 'No photos found matching your search'
                : 'No photos found'}
            </p>
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
                <div className="relative aspect-square bg-neutral-900">
                  <Image
                    src={photo.photo_url}
                    alt={photo.caption || 'User photo'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="absolute top-2 left-2">
                  <Checkbox
                    checked={selectedPhotoIds.includes(photo.id)}
                    onCheckedChange={() => togglePhotoSelection(photo.id)}
                    className="bg-white/90"
                  />
                </div>
                <div className="absolute top-2 right-2 flex gap-2">
                  {getStatusBadge(photo.moderation_status)}
                </div>
                <button
                  onClick={() => setViewingPhoto(photo)}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/50 transition-colors group"
                >
                  <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {/* Booth Info */}
                <div>
                  <Link
                    href={`/booth/${photo.booth.slug}`}
                    className="font-medium text-white hover:text-primary flex items-center gap-2"
                    target="_blank"
                  >
                    {photo.booth.name}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <p className="text-sm text-neutral-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {photo.booth.city}, {photo.booth.country}
                  </p>
                </div>

                {/* Photo Type */}
                {photo.photo_type && (
                  <div>{getPhotoTypeBadge(photo.photo_type)}</div>
                )}

                {/* Caption */}
                {photo.caption && (
                  <p className="text-sm text-neutral-300 italic">
                    &quot;{photo.caption}&quot;
                  </p>
                )}

                {/* Notes */}
                {photo.notes && (
                  <div className="text-xs text-neutral-400 bg-neutral-900 p-2 rounded">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    {photo.notes}
                  </div>
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
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => moderatePhoto(photo.id, 'approved')}
                    disabled={
                      processing.includes(photo.id) ||
                      photo.moderation_status === 'approved'
                    }
                    className="flex-1"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => moderatePhoto(photo.id, 'rejected')}
                    disabled={
                      processing.includes(photo.id) ||
                      photo.moderation_status === 'rejected'
                    }
                    className="flex-1"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Full Image Modal */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <button
              onClick={() => setViewingPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <XCircle className="w-6 h-6 text-white" />
            </button>
            <div className="relative w-full h-full">
              <Image
                src={viewingPhoto.photo_url}
                alt={viewingPhoto.caption || 'Photo preview'}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
