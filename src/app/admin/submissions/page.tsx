'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { isUserAdmin } from '@/lib/adminAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, XCircle, Clock, Loader2, Shield, User, MapPin, Camera, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface BoothSubmission {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postal_code: string | null;
  machine_model: string | null;
  booth_type: string | null;
  photo_type: string | null;
  cost: string | null;
  hours: string | null;
  accepts_cash: boolean;
  accepts_card: boolean;
  description: string | null;
  photo_url: string | null;
  submitted_by: string | null;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  approved_booth_id: string | null;
  submitter?: {
    email: string;
    full_name?: string;
  };
}

export default function SubmissionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const [submissions, setSubmissions] = useState<BoothSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<BoothSubmission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Check admin status
  useEffect(() => {
    async function checkAdmin() {
      if (authLoading) return;

      if (!user) {
        router.push('/');
        return;
      }

      try {
        const adminStatus = await isUserAdmin(user);
        setIsAdmin(adminStatus);
        setAdminCheckComplete(true);

        if (adminStatus) {
          loadSubmissions();
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setAdminCheckComplete(true);
      }
    }

    checkAdmin();
  }, [user, authLoading, router]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('booth_submissions')
        .select(`
          *,
          submitter:submitted_by(email, full_name)
        `)
        .order('submitted_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadSubmissions();
    }
  }, [filterStatus, isAdmin]);

  const openReviewModal = (submission: BoothSubmission, action: 'approve' | 'reject') => {
    setSelectedSubmission(submission);
    setReviewAction(action);
    setAdminNotes(submission.admin_notes || '');
    setRejectionReason(submission.rejection_reason || '');
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedSubmission(null);
    setReviewAction(null);
    setRejectionReason('');
    setAdminNotes('');
  };

  const handleApprove = async () => {
    if (!selectedSubmission || !user) return;

    setProcessing(true);
    try {
      // Call the approve API endpoint
      const response = await fetch('/api/admin/submissions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          adminNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve submission');
      }

      toast.success('Submission approved and added to booths!');
      closeReviewModal();
      loadSubmissions();
    } catch (error) {
      console.error('Error approving submission:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve submission');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !user) return;

    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      // Call the reject API endpoint
      const response = await fetch('/api/admin/submissions/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          rejectionReason,
          adminNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject submission');
      }

      toast.success('Submission rejected');
      closeReviewModal();
      loadSubmissions();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject submission');
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || !adminCheckComplete) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-neutral-900 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-neutral-800 rounded w-1/4"></div>
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-neutral-800 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-neutral-900 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Shield className="w-24 h-24 text-amber-500 mb-6" />
              <h1 className="font-display text-4xl font-semibold mb-4 text-white">Authentication Required</h1>
              <p className="text-neutral-400 text-lg mb-8 text-center max-w-md">
                Please sign in to access the admin dashboard.
              </p>
              <Button onClick={() => router.push('/')}>
                Return to Home
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-neutral-900 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Shield className="w-24 h-24 text-red-500 mb-6" />
              <h1 className="font-display text-4xl font-semibold mb-4 text-white">Access Denied</h1>
              <p className="text-neutral-400 text-lg mb-8 text-center max-w-md">
                You do not have permission to access the admin dashboard.
              </p>
              <Button onClick={() => router.push('/')}>
                Return to Home
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-semibold text-white mb-1">Booth Submissions</h1>
                <p className="text-neutral-400 text-sm">Review and approve community submissions</p>
              </div>
              {pendingCount > 0 && (
                <Badge className="bg-amber-500 text-white text-lg px-4 py-2">
                  {pendingCount} pending
                </Badge>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <Card className="p-4 bg-neutral-800 border-neutral-700 mb-6">
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
                size="sm"
              >
                <Clock className="w-4 h-4 mr-2" />
                Pending
              </Button>
              <Button
                variant={filterStatus === 'approved' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('approved')}
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approved
              </Button>
              <Button
                variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('rejected')}
                size="sm"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejected
              </Button>
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                All
              </Button>
            </div>
          </Card>

          {/* Submissions List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <Card className="p-12 bg-neutral-800 border-neutral-700 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold text-white mb-2">All caught up!</h3>
              <p className="text-neutral-400">No {filterStatus !== 'all' && filterStatus} submissions at this time.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="p-6 bg-neutral-800 border-neutral-700 hover:border-neutral-600 transition-colors">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Photo */}
                    {submission.photo_url ? (
                      <div className="w-full md:w-48 h-48 flex-shrink-0">
                        <img
                          src={submission.photo_url}
                          alt={submission.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-full md:w-48 h-48 flex-shrink-0 bg-neutral-700 rounded-lg flex items-center justify-center">
                        <Camera className="w-12 h-12 text-neutral-500" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-display text-xl font-semibold text-white mb-1">{submission.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-neutral-400">
                            <MapPin className="w-4 h-4" />
                            <span>{submission.city}, {submission.country}</span>
                          </div>
                        </div>
                        <Badge
                          className={
                            submission.status === 'pending' ? 'bg-amber-500 text-white' :
                            submission.status === 'approved' ? 'bg-green-500 text-white' :
                            'bg-red-500 text-white'
                          }
                        >
                          {submission.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-neutral-500">Address:</span>
                          <p className="text-white">{submission.address}</p>
                        </div>
                        {submission.machine_model && (
                          <div>
                            <span className="text-neutral-500">Machine:</span>
                            <p className="text-white">{submission.machine_model}</p>
                          </div>
                        )}
                        {submission.booth_type && (
                          <div>
                            <span className="text-neutral-500">Type:</span>
                            <p className="text-white capitalize">{submission.booth_type}</p>
                          </div>
                        )}
                        {submission.cost && (
                          <div>
                            <span className="text-neutral-500">Cost:</span>
                            <p className="text-white">{submission.cost}</p>
                          </div>
                        )}
                      </div>

                      {submission.description && (
                        <div className="mb-4">
                          <span className="text-neutral-500 text-sm">Description:</span>
                          <p className="text-white text-sm mt-1">{submission.description}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{submission.submitter?.email || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(submission.submitted_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {submission.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => openReviewModal(submission, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openReviewModal(submission, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {submission.status === 'rejected' && submission.rejection_reason && (
                        <div className="mt-4 p-3 bg-red-950/30 border border-red-500/30 rounded text-sm">
                          <span className="text-red-400 font-semibold">Rejection reason:</span>
                          <p className="text-red-300 mt-1">{submission.rejection_reason}</p>
                        </div>
                      )}

                      {submission.admin_notes && (
                        <div className="mt-4 p-3 bg-blue-950/30 border border-blue-500/30 rounded text-sm">
                          <span className="text-blue-400 font-semibold">Admin notes:</span>
                          <p className="text-blue-300 mt-1">{submission.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-neutral-800 border-neutral-700">
            <div className="p-6">
              <h2 className="font-display text-2xl font-semibold text-white mb-4">
                {reviewAction === 'approve' ? 'Approve' : 'Reject'} Submission
              </h2>

              <div className="mb-6 p-4 bg-neutral-900 rounded-lg">
                <h3 className="font-semibold text-white mb-2">{selectedSubmission.name}</h3>
                <p className="text-neutral-400 text-sm">{selectedSubmission.address}, {selectedSubmission.city}</p>
              </div>

              {reviewAction === 'reject' && (
                <div className="mb-4">
                  <Label htmlFor="rejection_reason" className="text-white mb-2 block">
                    Rejection Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="rejection_reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this submission is being rejected..."
                    rows={4}
                    className="bg-neutral-900 border-neutral-700 text-white"
                  />
                </div>
              )}

              <div className="mb-6">
                <Label htmlFor="admin_notes" className="text-white mb-2 block">
                  Admin Notes (optional)
                </Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes about this submission..."
                  rows={3}
                  className="bg-neutral-900 border-neutral-700 text-white"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={closeReviewModal}
                  disabled={processing}
                >
                  Cancel
                </Button>
                {reviewAction === 'approve' ? (
                  <Button
                    onClick={handleApprove}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve & Add to Booths
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleReject}
                    disabled={processing}
                    variant="destructive"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Submission
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
