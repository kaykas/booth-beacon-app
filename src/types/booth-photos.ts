/**
 * Type definitions for Community Photo Uploads
 * Generated: 2026-01-02
 */

export type PhotoType = 'exterior' | 'interior' | 'strips' | 'other';

export type PhotoStatus = 'pending' | 'approved' | 'rejected';

export interface BoothPhoto {
  id: string;
  booth_id: string;
  user_id: string | null;
  photo_url: string;
  thumbnail_url: string | null;
  photo_type: PhotoType;
  notes: string | null;
  status: PhotoStatus;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BoothPhotoInsert {
  booth_id: string;
  user_id?: string | null;
  photo_url: string;
  thumbnail_url?: string | null;
  photo_type: PhotoType;
  notes?: string | null;
  status?: PhotoStatus;
}

export interface BoothPhotoUpdate {
  photo_url?: string;
  thumbnail_url?: string | null;
  photo_type?: PhotoType;
  notes?: string | null;
  status?: PhotoStatus;
  approved_at?: string | null;
  approved_by?: string | null;
}

export interface BoothPhotoModerationQueueItem extends BoothPhoto {
  booth_name: string;
  booth_city: string;
  booth_country: string;
  user_email: string | null;
  user_name: string | null;
}

export interface BoothPhotoStats {
  booth_id: string;
  total_photos: number;
  approved_photos: number;
  pending_photos: number;
  rejected_photos: number;
  exterior_photos: number;
  interior_photos: number;
  strip_photos: number;
  unique_contributors: number;
  last_photo_at: string;
}

export interface PhotoUploadConfig {
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[];
  bucketName: string;
}

export const PHOTO_UPLOAD_CONFIG: PhotoUploadConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  bucketName: 'booth-community-photos',
};

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  exterior: 'Exterior',
  interior: 'Interior',
  strips: 'Photo Strips',
  other: 'Other',
};

export const PHOTO_STATUS_LABELS: Record<PhotoStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};
