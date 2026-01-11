'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, MapPin, Loader2, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { VerificationType, VERIFICATION_TYPE_LABELS } from '@/types/verification';
import { formatDistanceToNow } from 'date-fns';

interface VerificationButtonProps {
  boothId: string;
  boothName: string;
  lastVerifiedAt?: string | null;
  lastVerificationType?: VerificationType | null;
}

const VERIFICATION_OPTIONS: { type: VerificationType; icon: React.ReactNode; description: string }[] = [
  {
    type: 'working',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    description: 'The booth is working and taking photos',
  },
  {
    type: 'not_working',
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    description: 'The booth is there but not functioning',
  },
  {
    type: 'closed',
    icon: <XCircle className="w-5 h-5 text-red-600" />,
    description: 'The booth has been permanently removed',
  },
  {
    type: 'moved',
    icon: <MapPin className="w-5 h-5 text-blue-600" />,
    description: 'The booth has moved to a different location',
  },
];

export function VerificationButton({
  boothId,
  boothName,
  lastVerifiedAt,
  lastVerificationType,
}: VerificationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<VerificationType | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booth_id: boothId,
          verification_type: selectedType,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit verification');
      }

      setSubmitSuccess(true);
      // Reset form after short delay
      setTimeout(() => {
        setIsOpen(false);
        setSelectedType(null);
        setNotes('');
        setSubmitSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when closing
      setSelectedType(null);
      setNotes('');
      setError(null);
      setSubmitSuccess(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ThumbsUp className="w-4 h-4" />
          <span>I was here</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Booth Status</DialogTitle>
          <DialogDescription>
            Help others by confirming the current status of this photo booth.
          </DialogDescription>
        </DialogHeader>

        {submitSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Thank You!</h3>
            <p className="text-neutral-600">
              Your verification helps keep our community informed.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Last verification info */}
            {lastVerifiedAt && (
              <div className="text-sm text-neutral-500 bg-neutral-50 p-3 rounded-lg">
                Last verified {formatDistanceToNow(new Date(lastVerifiedAt), { addSuffix: true })}
                {lastVerificationType && (
                  <span className="ml-1">
                    as <strong>{VERIFICATION_TYPE_LABELS[lastVerificationType]}</strong>
                  </span>
                )}
              </div>
            )}

            {/* Verification options */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">
                What&apos;s the current status?
              </label>
              <div className="grid grid-cols-1 gap-2">
                {VERIFICATION_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setSelectedType(option.type)}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                      selectedType === option.type
                        ? 'border-primary bg-primary/5'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    {option.icon}
                    <div>
                      <div className="font-medium text-neutral-900">
                        {VERIFICATION_TYPE_LABELS[option.type]}
                      </div>
                      <div className="text-sm text-neutral-500">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium text-neutral-700">
                Additional notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any details that might help others..."
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                maxLength={500}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit button */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedType || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Verification'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
