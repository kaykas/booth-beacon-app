'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Image, MessageSquare, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBooths: 0,
    activeBooths: 0,
    totalUsers: 0,
    pendingPhotos: 0,
    totalReviews: 0,
  });
  interface PendingPhoto {
    id: string;
    image_url: string;
    caption?: string;
    booth_id: string;
    booth?: {
      name: string;
      city?: string;
      country: string;
    };
  }
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (user) {
      loadAdminData();
    }
  }, [user, authLoading, router]);

  const loadAdminData = async () => {
    try {
      // Load stats
      const [boothsRes, usersRes, photosRes, reviewsRes] = await Promise.all([
        supabase.from('booths').select('status', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('booth_user_photos').select('moderation_status', { count: 'exact', head: true }),
        supabase.from('booth_comments').select('*', { count: 'exact', head: true }),
      ]);

      const activeBooths = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const pendingPhotosData = await supabase
        .from('booth_user_photos')
        .select(`
          *,
          booth:booths(name, city, country)
        `)
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalBooths: boothsRes.count || 0,
        activeBooths: activeBooths.count || 0,
        totalUsers: usersRes.count || 0,
        pendingPhotos: pendingPhotosData.data?.length || 0,
        totalReviews: reviewsRes.count || 0,
      });

      setPendingPhotos(pendingPhotosData.data || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const moderatePhoto = async (photoId: string, status: 'approved' | 'rejected') => {
    // TODO: Fix Supabase type inference issue
    toast.info('Photo moderation coming soon');
    console.log(`Would moderate photo ${photoId} with status ${status}`);
  };

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-neutral-50 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 bg-neutral-200 rounded"></div>
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
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-semibold mb-2">Admin Dashboard</h1>
            <p className="text-neutral-600">Manage content and moderate submissions</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-8 h-8 text-primary" />
                <Badge variant="secondary">{stats.activeBooths} active</Badge>
              </div>
              <div className="text-3xl font-bold">{stats.totalBooths}</div>
              <div className="text-sm text-neutral-600">Total Booths</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <div className="text-sm text-neutral-600">Registered Users</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Image className="w-8 h-8 text-purple-500" />
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {stats.pendingPhotos} pending
                </Badge>
              </div>
              <div className="text-3xl font-bold">{stats.pendingPhotos}</div>
              <div className="text-sm text-neutral-600">Photos to Review</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-3xl font-bold">{stats.totalReviews}</div>
              <div className="text-sm text-neutral-600">Total Reviews</div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="photos">
            <TabsList>
              <TabsTrigger value="photos">
                <Image className="w-4 h-4 mr-2" />
                Photo Moderation ({stats.pendingPhotos})
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photos" className="mt-6">
              <Card className="p-6">
                <h2 className="font-display text-2xl font-semibold mb-6">Pending Photo Approvals</h2>
                
                {pendingPhotos.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-neutral-600">All caught up! No photos pending review.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingPhotos.map((photo) => (
                      <div key={photo.id} className="border rounded-lg overflow-hidden">
                        <img
                          src={photo.photo_url}
                          alt={photo.caption || 'User photo'}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="p-4">
                          <p className="font-medium mb-1">{photo.booth?.name}</p>
                          <p className="text-sm text-neutral-600 mb-2">
                            {photo.booth?.city}, {photo.booth?.country}
                          </p>
                          {photo.caption && (
                            <p className="text-sm text-neutral-700 mb-3 italic">&quot;{photo.caption}&quot;</p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => moderatePhoto(photo.id, 'approved')}
                              className="flex-1"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => moderatePhoto(photo.id, 'rejected')}
                              className="flex-1"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <Card className="p-6">
                <h2 className="font-display text-2xl font-semibold mb-6">Platform Analytics</h2>
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600">Analytics dashboard coming soon</p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
