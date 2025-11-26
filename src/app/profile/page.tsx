'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Camera, Bookmark, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BoothBookmark, BoothUserPhoto } from '@/types';
import Link from 'next/link';

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'bookmarks');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile data
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');

  // Stats
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [photosCount, setPhotosCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);

  // Photos
  const [userPhotos, setUserPhotos] = useState<BoothUserPhoto[]>([]);

  useEffect(() => {
    if (!authLoading && user) {
      loadProfile();
      loadStats();
      loadUserPhotos();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadProfile = async () => {
    try {
      setFullName(user!.user_metadata?.full_name || '');
      setBio(user!.user_metadata?.bio || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Count bookmarks
      const { count: bookmarksCount } = await supabase
        .from('booth_bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      setBookmarksCount(bookmarksCount || 0);

      // Count photos
      const { count: photosCount } = await supabase
        .from('booth_user_photos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      setPhotosCount(photosCount || 0);

      // Count reviews
      const { count: reviewsCount } = await supabase
        .from('booth_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      setReviewsCount(reviewsCount || 0);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUserPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('booth_user_photos')
        .select(`
          *,
          booth:booths(id, name, city, country)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserPhotos((data as BoothUserPhoto[]) || []);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          bio,
        },
      });

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-neutral-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-neutral-200 rounded-lg"></div>
              <div className="h-64 bg-neutral-200 rounded-lg"></div>
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
        <main className="min-h-screen bg-neutral-50 py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <User className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h1 className="font-display text-3xl font-semibold mb-4">Sign in to view profile</h1>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const initials = fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0].toUpperCase() || '?';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Profile Header */}
          <Card className="p-8 mb-8">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-primary text-white text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="font-display text-3xl font-semibold mb-2">
                  {fullName || 'User Profile'}
                </h1>
                <p className="text-neutral-600 mb-4">{user.email}</p>

                {/* Stats */}
                <div className="flex gap-6">
                  <div>
                    <div className="font-semibold text-lg">{bookmarksCount}</div>
                    <div className="text-sm text-neutral-600">Bookmarks</div>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{photosCount}</div>
                    <div className="text-sm text-neutral-600">Photos</div>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{reviewsCount}</div>
                    <div className="text-sm text-neutral-600">Reviews</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="bookmarks">
                <Bookmark className="w-4 h-4 mr-2" />
                Bookmarks
              </TabsTrigger>
              <TabsTrigger value="photos">
                <Camera className="w-4 h-4 mr-2" />
                My Photos
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Bookmarks Tab */}
            <TabsContent value="bookmarks">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-semibold">My Bookmarks</h2>
                  <Link href="/bookmarks">
                    <Button variant="outline">View All</Button>
                  </Link>
                </div>
                <p className="text-neutral-600">
                  You have {bookmarksCount} saved booth{bookmarksCount !== 1 ? 's' : ''}. Visit your{' '}
                  <Link href="/bookmarks" className="text-primary hover:underline">
                    bookmarks page
                  </Link>{' '}
                  to manage them.
                </p>
              </Card>
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos">
              <Card className="p-6">
                <h2 className="font-display text-2xl font-semibold mb-6">My Photos</h2>

                {userPhotos.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-600 mb-4">No photos uploaded yet</p>
                    <Link href="/map">
                      <Button variant="outline">Explore Booths</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {userPhotos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.photo_url}
                          alt={photo.caption || 'User photo'}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center p-4">
                          <div className="text-white text-center">
                            <p className="text-sm font-medium mb-1">
                              {photo.booth?.name || 'Unknown Booth'}
                            </p>
                            {photo.caption && (
                              <p className="text-xs opacity-90">{photo.caption}</p>
                            )}
                            <div className="text-xs mt-2">
                              Status:{' '}
                              <span
                                className={
                                  photo.moderation_status === 'approved'
                                    ? 'text-green-400'
                                    : photo.moderation_status === 'rejected'
                                    ? 'text-red-400'
                                    : 'text-yellow-400'
                                }
                              >
                                {photo.moderation_status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card className="p-6">
                <h2 className="font-display text-2xl font-semibold mb-6">Profile Settings</h2>

                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Email
                    </label>
                    <Input type="email" value={user.email || ''} disabled />
                    <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Bio (optional)
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-24"
                      maxLength={200}
                    />
                    <p className="text-xs text-neutral-500 mt-1">{bio.length}/200 characters</p>
                  </div>

                  {/* Save Button */}
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
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

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="min-h-screen bg-neutral-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-neutral-200 rounded-lg"></div>
              <div className="h-64 bg-neutral-200 rounded-lg"></div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
