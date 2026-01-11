'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Star,
  Camera,
  X,
  Loader2,
  Check,
  AlertCircle,
  Upload,
} from 'lucide-react';

interface ReviewFormProps {
  boothId: string;
  boothName: string;
  onReviewSubmitted?: () => void;
}

interface UploadedPhoto {
  file: File;
  preview: string;
  error?: string;
}

export function ReviewForm({ boothId, boothName, onReviewSubmitted }: ReviewFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [anonymousName, setAnonymousName] = useState('');
  const [anonymousEmail, setAnonymousEmail] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_PHOTOS = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Only JPG, PNG, and WEBP are allowed.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size exceeds 5MB limit.`;
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed per review`);
      return;
    }

    const newPhotos: UploadedPhoto[] = [];
    for (const file of files) {
      const validationError = validateFile(file);
      const preview = URL.createObjectURL(file);
      newPhotos.push({
        file,
        preview,
        error: validationError || undefined,
      });
    }

    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    URL.revokeObjectURL(newPhotos[index].preview);
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }

    // Filter out photos with errors
    const validPhotos = photos.filter((p) => !p.error);

    setIsSubmitting(true);

    try {
      // If there are photos, upload them first
      let uploadedPhotoUrls: string[] = [];

      if (validPhotos.length > 0) {
        const formData = new FormData();
        formData.append('boothId', boothId);
        formData.append('photoType', 'review');
        validPhotos.forEach(({ file }) => {
          formData.append('files', file);
        });

        const uploadResponse = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          uploadedPhotoUrls = uploadResult.urls || [];
        }
        // Continue even if photo upload fails
      }

      // Submit the review
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booth_id: boothId,
          rating,
          review_text: reviewText.trim() || undefined,
          photos: uploadedPhotoUrls,
          anonymous_name: anonymousName.trim() || undefined,
          anonymous_email: anonymousEmail.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit review');
      }

      // Success
      setSubmitSuccess(true);
      setRating(0);
      setReviewText('');
      setAnonymousName('');
      setAnonymousEmail('');
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPhotos([]);

      onReviewSubmitted?.();

      setTimeout(() => {
        setSubmitSuccess(false);
        setShowForm(false);
      }, 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (interactive = true) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = interactive
            ? star <= (hoverRating || rating)
            : star <= rating;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive || isSubmitting}
              onClick={() => interactive && setRating(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`p-1 transition-transform ${
                interactive ? 'hover:scale-110 cursor-pointer' : ''
              }`}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-neutral-300'
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  if (submitSuccess) {
    return (
      <Card className="p-8 bg-gradient-to-br from-green-50 to-green-100 text-center border-green-200">
        <Check className="w-12 h-12 mx-auto text-green-600 mb-3" />
        <h3 className="font-semibold text-green-900 mb-2 text-lg">
          Thank you for your review!
        </h3>
        <p className="text-green-700 text-sm mb-3">
          Your review of {boothName} has been submitted and is pending approval.
        </p>
        <p className="text-green-600 text-xs">
          Reviews are typically approved within 24-48 hours.
        </p>
      </Card>
    );
  }

  if (!showForm) {
    return (
      <Card className="p-8 bg-gradient-to-br from-amber-50 to-amber-100/50 text-center border-amber-200">
        <Star className="w-12 h-12 mx-auto text-amber-500 mb-3" />
        <h3 className="font-semibold text-neutral-900 mb-2 text-lg">
          Share Your Experience
        </h3>
        <p className="text-neutral-700 text-sm mb-4">
          Have you visited this booth? Help others by leaving a review!
        </p>
        <Button
          onClick={() => setShowForm(true)}
          className="gap-2 bg-amber-600 hover:bg-amber-700"
        >
          <Star className="w-4 h-4" />
          Write a Review
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-xl">Write a Review</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowForm(false);
            setError(null);
            setRating(0);
            setReviewText('');
            setAnonymousName('');
            setAnonymousEmail('');
            photos.forEach((p) => URL.revokeObjectURL(p.preview));
            setPhotos([]);
          }}
          disabled={isSubmitting}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating */}
        <div className="text-center">
          <Label className="block text-sm font-medium text-neutral-700 mb-3">
            Your Rating <span className="text-red-500">*</span>
          </Label>
          {renderStars()}
          {rating > 0 && (
            <p className="text-sm text-neutral-600 mt-2">
              {rating === 5 && 'Excellent!'}
              {rating === 4 && 'Great!'}
              {rating === 3 && 'Good'}
              {rating === 2 && 'Fair'}
              {rating === 1 && 'Poor'}
            </p>
          )}
        </div>

        {/* Review Text */}
        <div>
          <Label htmlFor="review-text" className="block text-sm font-medium text-neutral-700 mb-2">
            Your Review (Optional)
          </Label>
          <Textarea
            id="review-text"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience... Was the booth easy to find? How was the photo quality?"
            rows={4}
            maxLength={5000}
            disabled={isSubmitting}
            className="resize-none"
          />
          <p className="text-xs text-neutral-500 mt-1 text-right">
            {reviewText.length}/5000 characters
          </p>
        </div>

        {/* Photo Upload */}
        <div>
          <Label className="block text-sm font-medium text-neutral-700 mb-2">
            Add Photos (Optional)
          </Label>
          <div
            className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary/50 transition cursor-pointer bg-neutral-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
            <p className="text-sm text-neutral-600 mb-1">
              Click to upload photos
            </p>
            <p className="text-xs text-neutral-500">
              JPG, PNG or WEBP (max 5MB, up to {MAX_PHOTOS} images)
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

          {photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden ${
                    photo.error ? 'ring-2 ring-red-500' : ''
                  }`}
                >
                  <img
                    src={photo.preview}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition"
                    disabled={isSubmitting}
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                  {photo.error && (
                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anonymous Info */}
        <div className="space-y-4 p-4 bg-neutral-50 rounded-lg">
          <p className="text-sm text-neutral-600">
            Your review will be posted anonymously unless you provide a name.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="anonymous-name" className="block text-sm font-medium text-neutral-700 mb-2">
                Display Name (Optional)
              </Label>
              <Input
                id="anonymous-name"
                value={anonymousName}
                onChange={(e) => setAnonymousName(e.target.value)}
                placeholder="Your name"
                maxLength={100}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="anonymous-email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email (Optional, private)
              </Label>
              <Input
                id="anonymous-email"
                type="email"
                value={anonymousEmail}
                onChange={(e) => setAnonymousEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={isSubmitting}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Only used to notify you if there are questions about your review
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="flex-1 gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Submit Review
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowForm(false);
              setError(null);
              setRating(0);
              setReviewText('');
              setAnonymousName('');
              setAnonymousEmail('');
              photos.forEach((p) => URL.revokeObjectURL(p.preview));
              setPhotos([]);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>

        <p className="text-xs text-neutral-500 text-center">
          By submitting, you agree that your review will be publicly visible after moderation.
          Reviews must follow our community guidelines.
        </p>
      </form>
    </Card>
  );
}
