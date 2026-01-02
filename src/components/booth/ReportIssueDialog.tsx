'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2, CheckCircle2, XCircle, Flag, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boothId: string;
  boothName: string;
}

type IssueType = 'closed' | 'incorrect_info' | 'inappropriate_photo' | 'other';

interface IssueOption {
  type: IssueType;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
}

const issueOptions: IssueOption[] = [
  {
    type: 'closed',
    label: 'Booth is Closed/Removed',
    description: 'This booth no longer exists or has been permanently removed',
    icon: <XCircle className="w-5 h-5" />,
    iconColor: 'text-red-600',
  },
  {
    type: 'incorrect_info',
    label: 'Information is Incorrect',
    description: 'Hours, address, cost, or other details are wrong',
    icon: <AlertCircle className="w-5 h-5" />,
    iconColor: 'text-orange-600',
  },
  {
    type: 'inappropriate_photo',
    label: 'Photo is Inappropriate',
    description: 'Photo is offensive, incorrect, or violates guidelines',
    icon: <ImageIcon className="w-5 h-5" />,
    iconColor: 'text-purple-600',
  },
  {
    type: 'other',
    label: 'Other Issue',
    description: 'Something else needs attention',
    icon: <Flag className="w-5 h-5" />,
    iconColor: 'text-neutral-600',
  },
];

export function ReportIssueDialog({ open, onOpenChange, boothId, boothName }: ReportIssueDialogProps) {
  const [selectedIssue, setSelectedIssue] = useState<IssueType | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedIssue) {
      toast.error('Please select an issue type');
      return;
    }

    setLoading(true);

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      // Insert the issue report
      const { error } = await supabase.from('booth_issues').insert({
        booth_id: boothId,
        user_id: user?.id || null,
        issue_type: selectedIssue,
        description: description.trim() || null,
        status: 'pending',
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Thank you! Your report has been submitted.');

      // Reset form after 1.5 seconds and close
      setTimeout(() => {
        setSelectedIssue(null);
        setDescription('');
        setSubmitted(false);
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error('Error submitting issue report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedIssue(null);
      setDescription('');
      setSubmitted(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Report an Issue</DialogTitle>
              <DialogDescription>
                Help us keep information about <span className="font-semibold">{boothName}</span> accurate and up-to-date.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Issue Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">What&apos;s the issue?</label>
                <div className="grid grid-cols-1 gap-2">
                  {issueOptions.map((option) => (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => setSelectedIssue(option.type)}
                      disabled={loading}
                      className={`flex items-start gap-3 p-3 text-left rounded-lg border-2 transition-all ${
                        selectedIssue === option.type
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className={`mt-0.5 ${option.iconColor}`}>
                        {option.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-neutral-900">
                          {option.label}
                        </div>
                        <div className="text-xs text-neutral-600 mt-0.5">
                          {option.description}
                        </div>
                      </div>
                      {selectedIssue === option.type && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Description */}
              {selectedIssue && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Additional details (optional)
                  </label>
                  <Textarea
                    placeholder="Provide any additional information that might be helpful..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedIssue || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Success State
          <div className="py-8 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Report Submitted!</DialogTitle>
            <DialogDescription className="text-base">
              Thank you for helping us keep Booth Beacon accurate. We&apos;ll review your report soon.
            </DialogDescription>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
