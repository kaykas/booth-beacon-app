/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Camera, Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoUploadProps {
  boothId: string;
  onUploadComplete?: () => void;
}

export function PhotoUpload({ boothId, onUploadComplete }: PhotoUploadProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('Please sign in to upload photos');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `booth-photos/${boothId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('photos').getPublicUrl(filePath);

      // Create database record
      const { error: dbError } = await supabase.from('booth_user_photos').insert({
        user_id: user.id,
        booth_id: boothId,
        photo_url: publicUrl,
        caption: caption.trim() || null,
        moderation_status: 'pending',
      } as any);

      if (dbError) throw dbError;

      toast.success('Photo uploaded successfully! It will appear after moderation.');

      // Reset state
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      setOpen(false);

      // Callback
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Camera className="w-4 h-4 mr-2" />
          Add Photo
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Photo</DialogTitle>
          <DialogDescription>
            Share your photo booth photo or a photo of this booth. Your upload will be reviewed before
            being published.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Selection */}
          {!previewUrl ? (
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary transition cursor-pointer">
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-700 font-medium mb-1">Click to upload</p>
                <p className="text-sm text-neutral-500">PNG, JPG up to 10MB</p>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Caption */}
          {previewUrl && (
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">
                Caption (optional)
              </label>
              <Input
                type="text"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={200}
                disabled={uploading}
              />
              <p className="text-xs text-neutral-500 mt-1">{caption.length}/200 characters</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline" className="flex-1" disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
