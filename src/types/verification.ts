// Verification types for crowd-sourced booth verification system

export type VerificationType = 'working' | 'not_working' | 'closed' | 'moved';

export interface BoothVerification {
  id: string;
  booth_id: string;
  user_id: string | null;
  verification_type: VerificationType;
  notes: string | null;
  photo_url: string | null;
  verified_at: string;
  created_at: string;
}

export interface VerificationSummary {
  total_verifications: number;
  working_count: number;
  not_working_count: number;
  closed_count: number;
  moved_count: number;
  last_verified_at: string | null;
  last_verification_type: VerificationType | null;
  days_since_verification: number | null;
}

export interface VerificationSubmission {
  booth_id: string;
  verification_type: VerificationType;
  notes?: string;
  photo_url?: string;
}

// Labels for verification types
export const VERIFICATION_TYPE_LABELS: Record<VerificationType, string> = {
  working: 'Working',
  not_working: 'Not Working',
  closed: 'Permanently Closed',
  moved: 'Moved/Relocated',
};

// Icons and colors for verification types
export const VERIFICATION_TYPE_CONFIG: Record<VerificationType, { color: string; bgColor: string; icon: string }> = {
  working: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: 'check-circle'
  },
  not_working: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: 'alert-triangle'
  },
  closed: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: 'x-circle'
  },
  moved: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: 'map-pin'
  },
};
