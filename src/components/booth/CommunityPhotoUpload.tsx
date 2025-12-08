'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Check } from 'lucide-react';

interface CommunityPhotoUploadProps {
  boothId: string;
  boothName: string;
}

export function CommunityPhotoUpload({ boothId: _boothId, boothName: _boothName }: CommunityPhotoUploadProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Implement actual upload functionality with Supabase storage
    // This is a placeholder for the future implementation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitSuccess(true);

    setTimeout(() => {
      setSubmitSuccess(false);
      setShowUploadForm(false);
    }, 3000);
  };

  if (submitSuccess) {
    return (
      <Card className="p-8 bg-gradient-to-br from-green-50 to-green-100 text-center border-green-200">
        <Check className="w-12 h-12 mx-auto text-green-600 mb-3" />
        <h3 className="font-semibold text-green-900 mb-2 text-lg">
          Thank you for contributing!
        </h3>
        <p className="text-green-700 text-sm">
          Your photo will be reviewed and added to the booth page soon
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
          onClick={() => setShowUploadForm(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Select Photos
          </label>
          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-primary/50 transition cursor-pointer bg-neutral-50">
            <Camera className="w-10 h-10 mx-auto text-neutral-400 mb-2" />
            <p className="text-sm text-neutral-600 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-neutral-500">
              JPG, PNG or WEBP (max 5MB per image)
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Photo Type
          </label>
          <select
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
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
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            rows={3}
            placeholder="Any helpful context about the photo..."
            disabled={isSubmitting}
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Uploading...' : 'Submit Photos'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowUploadForm(false)}
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
