'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react';

interface CommunityPhotoUploadProps {
  boothId: string;
  boothName: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  error?: string;
}

export function CommunityPhotoUpload({ boothId, boothName }: CommunityPhotoUploadProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState('exterior');
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_FILES = 5;

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Invalid file type. Only JPG, PNG, and WEBP are allowed.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size exceeds 5MB limit.`;
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    if (selectedFiles.length + files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed per upload`);
      return;
    }

    const newFiles: UploadedFile[] = [];

    for (const file of files) {
      const validationError = validateFile(file);
      const preview = URL.createObjectURL(file);

      newFiles.push({
        file,
        preview,
        error: validationError || undefined,
      });
    }

    setSelectedFiles([...selectedFiles, ...newFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    URL.revokeObjectURL(newFiles[index].preview);
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Filter out files with validation errors
    const validFiles = selectedFiles.filter(f => !f.error);

    if (validFiles.length === 0) {
      setError('Please select at least one valid image file');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('boothId', boothId);
      formData.append('photoType', photoType);
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      validFiles.forEach(({ file }) => {
        formData.append('files', file);
      });

      setUploadProgress(30);

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(90);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadProgress(100);
      setIsSubmitting(false);
      setSubmitSuccess(true);

      // Clean up
      selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
      setSelectedFiles([]);
      setPhotoType('exterior');
      setNotes('');

      setTimeout(() => {
        setSubmitSuccess(false);
        setShowUploadForm(false);
        setUploadProgress(0);
      }, 4000);
    } catch (err) {
      setIsSubmitting(false);
      setUploadProgress(0);
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    }
  };

  if (submitSuccess) {
    return (
      <Card className="p-8 bg-gradient-to-br from-green-50 to-green-100 text-center border-green-200">
        <Check className="w-12 h-12 mx-auto text-green-600 mb-3" />
        <h3 className="font-semibold text-green-900 mb-2 text-lg">
          Thank you for contributing!
        </h3>
        <p className="text-green-700 text-sm mb-3">
          Your {selectedFiles.length > 1 ? 'photos are' : 'photo is'} being reviewed and will be added to {boothName} soon
        </p>
        <p className="text-green-600 text-xs">
          Photos are typically reviewed within 24 hours
        </p>
      </Card>
    );
  }

  if (!showUploadForm) {
    return (
      <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 text-center border-primary/20">
        <Camera className="w-12 h-12 mx-auto text-primary mb-3" />
        <h3 className="font-semibold text-neutral-900 mb-2 text-lg">
          Help others discover this booth!
        </h3>
        <p className="text-neutral-700 text-sm mb-4">
          Share photos of the exterior or interior to help the community find and identify this booth
        </p>
        <Button
          onClick={() => setShowUploadForm(true)}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Share Photos
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Upload Photos</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowUploadForm(false);
            setSelectedFiles([]);
            setError(null);
          }}
          disabled={isSubmitting}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Select Photos ({selectedFiles.length}/{MAX_FILES})
          </label>
          <div
            className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary/50 transition cursor-pointer bg-neutral-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-10 h-10 mx-auto text-neutral-400 mb-2" />
            <p className="text-sm text-neutral-600 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-neutral-500">
              JPG, PNG or WEBP (max 5MB per image, up to {MAX_FILES} images)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              disabled={isSubmitting}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 border rounded-lg ${
                    file.error ? 'bg-red-50 border-red-200' : 'bg-white border-neutral-200'
                  }`}
                >
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Photo Type
          </label>
          <select
            value={photoType}
            onChange={(e) => setPhotoType(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSubmitting}
          >
            <option value="exterior">Exterior View</option>
            <option value="interior">Interior View</option>
            <option value="strips">Photo Strips</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Any helpful context about the photo..."
            disabled={isSubmitting}
          />
        </div>

        {isSubmitting && (
          <div className="space-y-2">
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-neutral-600 text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting || selectedFiles.length === 0}
            className="flex-1 gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Submit Photos
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowUploadForm(false);
              setSelectedFiles([]);
              setError(null);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>

        <p className="text-xs text-neutral-500 text-center">
          By uploading, you agree that your photos will be publicly visible and help others find this booth
        </p>
      </form>
    </Card>
  );
}
