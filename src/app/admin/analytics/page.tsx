'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { isUserAdmin } from '@/lib/adminAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Users,
  MapPin,
  Camera,
  Star,
  Heart,
  MessageSquare,
  BookOpen,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  CalendarDays,
  BarChart3,
  Activity,
  Award,
  Map as MapIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AnalyticsStats {
  // Booth Statistics
  totalBooths: number;
  activeBooths: number;
  unverifiedBooths: number;
  inactiveBooths: number;
  closedBooths: number;
  boothsAddedThisWeek: number;
  boothsAddedThisMonth: number;

  // Completeness Metrics
  boothsWithPhotos: number;
  boothsWithPhone: number;
  boothsWithWebsite: number;
  boothsWithDescription: number;
  averageCompleteness: number;

  // Top Cities
  topCities: Array<{ city: string; country: string; count: number }>;

  // User Engagement
  totalUsers: number;
  activeUsersLast7Days: number;
  activeUsersLast30Days: number;

  // Community Activity
  totalUserPhotos: number;
  totalReviews: number;
  totalCollections: number;
  averageRating: number;
  photosPendingModeration: number;
  reviewsPendingModeration: number;

  // Top Contributors
  topPhotoContributors: Array<{ user_id: string; photo_count: number; profile?: { username?: string } }>;
  mostBookmarkedBooths: Array<{ booth_id: string; bookmark_count: number; booth?: { name: string; city: string } }>;

  // Growth Metrics
  boothsByMonth: Array<{ month: string; count: number }>;
  usersByMonth: Array<{ month: string; count: number }>;
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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
          await loadAnalytics();
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setAdminCheckComplete(true);
      }
    }

    checkAdmin();
  }, [user, authLoading, router]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date ranges
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Booth Statistics
      const { data: allBooths, count: totalBooths } = await supabase
        .from('booths')
        .select('*', { count: 'exact' }) as {
          data: Array<{
            id: string;
            name: string;
            city: string;
            country: string;
            status: string;
            created_at: string;
            completeness_score: number;
            photo_sample_strips?: string[] | null;
            photo_exterior_url?: string | null;
            photo_interior_url?: string | null;
            phone?: string | null;
            website?: string | null;
            description?: string | null;
          }> | null;
          count: number | null;
        };

      const { count: activeBooths } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: unverifiedBooths } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unverified');

      const { count: inactiveBooths } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'inactive');

      const { count: closedBooths } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'closed');

      const { count: boothsAddedThisWeek } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());

      const { count: boothsAddedThisMonth } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneMonthAgo.toISOString());

      // Completeness Metrics
      const boothsWithPhotos = allBooths?.filter(b =>
        b.photo_exterior_url || b.photo_interior_url || (b.photo_sample_strips && b.photo_sample_strips.length > 0)
      ).length || 0;

      const boothsWithPhone = allBooths?.filter(b => b.phone).length || 0;
      const boothsWithWebsite = allBooths?.filter(b => b.website).length || 0;
      const boothsWithDescription = allBooths?.filter(b => b.description).length || 0;

      // Calculate average completeness
      const completenessScores = allBooths?.map(b => b.completeness_score || 0) || [];
      const averageCompleteness = completenessScores.length > 0
        ? Math.round(completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length)
        : 0;

      // Top Cities
      type CityCountData = { country: string; count: number };
      const cityCount = new Map() as Map<string, CityCountData>;
      allBooths?.forEach(booth => {
        if (booth.city && booth.country) {
          const key = `${booth.city}, ${booth.country}`;
          const existing = cityCount.get(key);
          if (existing) {
            cityCount.set(key, { country: booth.country, count: existing.count + 1 });
          } else {
            cityCount.set(key, { country: booth.country, count: 1 });
          }
        }
      });

      const topCities: Array<{ city: string; country: string; count: number }> = (Array.from(cityCount.entries()) as Array<[string, { country: string; count: number }]>)
        .map(([cityCountry, data]) => ({
          city: cityCountry.split(', ')[0],
          country: data.country,
          count: data.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // User Engagement
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsersLast7Days } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen_at', oneWeekAgo.toISOString());

      const { count: activeUsersLast30Days } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen_at', oneMonthAgo.toISOString());

      // Community Activity
      const { count: totalUserPhotos } = await supabase
        .from('booth_user_photos')
        .select('*', { count: 'exact', head: true });

      const { count: totalReviews } = await supabase
        .from('booth_comments')
        .select('*', { count: 'exact', head: true });

      const { count: totalCollections } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true });

      // Average rating
      const { data: ratingsData } = await supabase
        .from('booth_comments')
        .select('rating') as { data: Array<{ rating: number | null }> | null };

      const averageRating = ratingsData && ratingsData.length > 0
        ? Math.round((ratingsData.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingsData.length) * 10) / 10
        : 0;

      const { count: photosPendingModeration } = await supabase
        .from('booth_user_photos')
        .select('*', { count: 'exact', head: true })
        .eq('moderation_status', 'pending');

      // Reviews don't have moderation status in current schema, set to 0
      const reviewsPendingModeration = 0;

      // Top Photo Contributors
      const { data: photoContributorsData } = await supabase
        .from('booth_user_photos')
        .select('user_id, profiles!inner(username)') as {
          data: Array<{
            user_id: string;
            profiles: { username?: string } | { username?: string }[];
          }> | null;
        };

      type ContributorData = { count: number; username?: string };
      const contributorMap = new Map() as Map<string, ContributorData>;
      photoContributorsData?.forEach(photo => {
        const userId = photo.user_id;
        const username = (photo.profiles as unknown as { username?: string })?.username;
        const existing = contributorMap.get(userId);
        if (existing) {
          contributorMap.set(userId, { count: existing.count + 1, username: username || existing.username });
        } else {
          contributorMap.set(userId, { count: 1, username });
        }
      });

      const topPhotoContributors: Array<{ user_id: string; photo_count: number; profile?: { username?: string } }> = (Array.from(contributorMap.entries()) as Array<[string, { count: number; username?: string }]>)
        .map(([user_id, data]) => ({
          user_id,
          photo_count: data.count,
          profile: { username: data.username },
        }))
        .sort((a, b) => b.photo_count - a.photo_count)
        .slice(0, 5);

      // Most Bookmarked Booths
      const { data: bookmarksData } = await supabase
        .from('booth_bookmarks')
        .select('booth_id, booths!inner(name, city)') as {
          data: Array<{
            booth_id: string;
            booths: { name?: string; city?: string } | { name?: string; city?: string }[];
          }> | null;
        };

      type BookmarkData = { count: number; name?: string; city?: string };
      const bookmarkMap = new Map() as Map<string, BookmarkData>;
      bookmarksData?.forEach(bookmark => {
        const boothId = bookmark.booth_id;
        const booth = bookmark.booths as unknown as { name?: string; city?: string };
        const existing = bookmarkMap.get(boothId);
        if (existing) {
          bookmarkMap.set(boothId, {
            count: existing.count + 1,
            name: booth?.name || existing.name,
            city: booth?.city || existing.city
          });
        } else {
          bookmarkMap.set(boothId, { count: 1, name: booth?.name, city: booth?.city });
        }
      });

      const mostBookmarkedBooths: Array<{ booth_id: string; bookmark_count: number; booth?: { name: string; city: string } }> = (Array.from(bookmarkMap.entries()) as Array<[string, { count: number; name?: string; city?: string }]>)
        .map(([booth_id, data]) => ({
          booth_id,
          bookmark_count: data.count,
          booth: { name: data.name || 'Unknown', city: data.city || 'Unknown' },
        }))
        .sort((a, b) => b.bookmark_count - a.bookmark_count)
        .slice(0, 5);

      // Growth Metrics - Booths by Month (last 6 months)
      const boothsByMonthMap = new Map() as Map<string, number>;
      allBooths?.forEach(booth => {
        const created = new Date(booth.created_at);
        if (created >= threeMonthsAgo) {
          const monthKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
          boothsByMonthMap.set(monthKey, (boothsByMonthMap.get(monthKey) || 0) + 1);
        }
      });

      const boothsByMonth: Array<{ month: string; count: number }> = (Array.from(boothsByMonthMap.entries()) as Array<[string, number]>)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Growth Metrics - Users by Month
      const { data: allUsersData } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', threeMonthsAgo.toISOString()) as {
          data: Array<{ created_at: string }> | null;
        };

      const usersByMonthMap = new Map() as Map<string, number>;
      allUsersData?.forEach(user => {
        const created = new Date(user.created_at);
        const monthKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
        usersByMonthMap.set(monthKey, (usersByMonthMap.get(monthKey) || 0) + 1);
      });

      const usersByMonth: Array<{ month: string; count: number }> = (Array.from(usersByMonthMap.entries()) as Array<[string, number]>)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setStats({
        totalBooths: totalBooths || 0,
        activeBooths: activeBooths || 0,
        unverifiedBooths: unverifiedBooths || 0,
        inactiveBooths: inactiveBooths || 0,
        closedBooths: closedBooths || 0,
        boothsAddedThisWeek: boothsAddedThisWeek || 0,
        boothsAddedThisMonth: boothsAddedThisMonth || 0,
        boothsWithPhotos,
        boothsWithPhone,
        boothsWithWebsite,
        boothsWithDescription,
        averageCompleteness,
        topCities,
        totalUsers: totalUsers || 0,
        activeUsersLast7Days: activeUsersLast7Days || 0,
        activeUsersLast30Days: activeUsersLast30Days || 0,
        totalUserPhotos: totalUserPhotos || 0,
        totalReviews: totalReviews || 0,
        totalCollections: totalCollections || 0,
        averageRating,
        photosPendingModeration: photosPendingModeration || 0,
        reviewsPendingModeration,
        topPhotoContributors,
        mostBookmarkedBooths,
        boothsByMonth,
        usersByMonth,
      });

      setLastUpdated(new Date());
      toast.success('Analytics loaded successfully');
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
  };

  // Loading state
  if (authLoading || !adminCheckComplete || loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-neutral-900 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-neutral-400">Loading analytics...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Not authenticated or not admin
  if (!user || !isAdmin) {
    router.push('/admin');
    return null;
  }

  const completenessPercentage = stats ? Math.round((
    (stats.boothsWithPhotos / stats.totalBooths) * 25 +
    (stats.boothsWithPhone / stats.totalBooths) * 25 +
    (stats.boothsWithWebsite / stats.totalBooths) * 25 +
    (stats.boothsWithDescription / stats.totalBooths) * 25
  )) : 0;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl font-semibold mb-2 text-white">Analytics Dashboard</h1>
              <p className="text-neutral-400">
                Site-wide metrics and insights • Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-neutral-800 border-neutral-700 mb-6">
              <TabsTrigger value="overview" className="data-[state=active]:bg-neutral-700">
                <Activity className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="booths" className="data-[state=active]:bg-neutral-700">
                <MapPin className="w-4 h-4 mr-2" />
                Booths
              </TabsTrigger>
              <TabsTrigger value="community" className="data-[state=active]:bg-neutral-700">
                <Users className="w-4 h-4 mr-2" />
                Community
              </TabsTrigger>
              <TabsTrigger value="growth" className="data-[state=active]:bg-neutral-700">
                <TrendingUp className="w-4 h-4 mr-2" />
                Growth
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <MapPin className="w-8 h-8 text-blue-400" />
                      <Badge className="bg-blue-900 text-blue-100">
                        +{stats?.boothsAddedThisWeek || 0} this week
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{stats?.totalBooths || 0}</div>
                    <p className="text-sm text-blue-300">Total Booths</p>
                    <p className="text-xs text-blue-400 mt-1">{stats?.activeBooths || 0} active</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Users className="w-8 h-8 text-purple-400" />
                      <Badge className="bg-purple-900 text-purple-100">
                        {stats?.activeUsersLast7Days || 0} active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</div>
                    <p className="text-sm text-purple-300">Total Users</p>
                    <p className="text-xs text-purple-400 mt-1">{stats?.activeUsersLast30Days || 0} last 30 days</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Camera className="w-8 h-8 text-green-400" />
                      {(stats?.photosPendingModeration || 0) > 0 && (
                        <Badge className="bg-yellow-900 text-yellow-100">
                          {stats?.photosPendingModeration} pending
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{stats?.totalUserPhotos || 0}</div>
                    <p className="text-sm text-green-300">User Photos</p>
                    <p className="text-xs text-green-400 mt-1">Community contributions</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Star className="w-8 h-8 text-amber-400" />
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= Math.round(stats?.averageRating || 0)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-neutral-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{stats?.averageRating || 0}</div>
                    <p className="text-sm text-amber-300">Average Rating</p>
                    <p className="text-xs text-amber-400 mt-1">{stats?.totalReviews || 0} reviews</p>
                  </CardContent>
                </Card>
              </div>

              {/* Moderation Queue */}
              {((stats?.photosPendingModeration || 0) > 0 || (stats?.reviewsPendingModeration || 0) > 0) && (
                <Card className="bg-yellow-900/20 border-yellow-500/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-200">
                      <AlertCircle className="w-5 h-5" />
                      Moderation Queue
                    </CardTitle>
                    <CardDescription className="text-yellow-300">
                      Items awaiting review
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-6">
                      {(stats?.photosPendingModeration || 0) > 0 && (
                        <div className="flex items-center gap-3">
                          <ImageIcon className="w-8 h-8 text-yellow-400" />
                          <div>
                            <div className="text-2xl font-bold text-white">
                              {stats?.photosPendingModeration}
                            </div>
                            <div className="text-sm text-yellow-300">Photos</div>
                          </div>
                        </div>
                      )}
                      {(stats?.reviewsPendingModeration || 0) > 0 && (
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-8 h-8 text-yellow-400" />
                          <div>
                            <div className="text-2xl font-bold text-white">
                              {stats?.reviewsPendingModeration}
                            </div>
                            <div className="text-sm text-yellow-300">Reviews</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-neutral-800 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Collections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{stats?.totalCollections || 0}</div>
                    <p className="text-sm text-neutral-400 mt-1">User-created collections</p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-800 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-accent" />
                      Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{stats?.totalReviews || 0}</div>
                    <p className="text-sm text-neutral-400 mt-1">Community feedback</p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-800 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-green-400" />
                      Data Quality
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{completenessPercentage}%</div>
                    <p className="text-sm text-neutral-400 mt-1">Average completeness</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Booths Tab */}
            <TabsContent value="booths" className="space-y-6">
              {/* Status Breakdown */}
              <Card className="bg-neutral-800 border-neutral-700">
                <CardHeader>
                  <CardTitle className="text-white">Booth Status Distribution</CardTitle>
                  <CardDescription className="text-neutral-400">
                    Breakdown by verification and operational status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-green-300">Active</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{stats?.activeBooths || 0}</div>
                    </div>
                    <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm text-yellow-300">Unverified</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{stats?.unverifiedBooths || 0}</div>
                    </div>
                    <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-orange-400" />
                        <span className="text-sm text-orange-300">Inactive</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{stats?.inactiveBooths || 0}</div>
                    </div>
                    <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <span className="text-sm text-red-300">Closed</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{stats?.closedBooths || 0}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Completeness Metrics */}
              <Card className="bg-neutral-800 border-neutral-700">
                <CardHeader>
                  <CardTitle className="text-white">Data Completeness</CardTitle>
                  <CardDescription className="text-neutral-400">
                    Percentage of booths with key information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-neutral-300">Photos</span>
                      <span className="text-white font-semibold">
                        {Math.round(((stats?.boothsWithPhotos || 0) / (stats?.totalBooths || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all"
                        style={{ width: `${((stats?.boothsWithPhotos || 0) / (stats?.totalBooths || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-neutral-300">Phone Numbers</span>
                      <span className="text-white font-semibold">
                        {Math.round(((stats?.boothsWithPhone || 0) / (stats?.totalBooths || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all"
                        style={{ width: `${((stats?.boothsWithPhone || 0) / (stats?.totalBooths || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-neutral-300">Websites</span>
                      <span className="text-white font-semibold">
                        {Math.round(((stats?.boothsWithWebsite || 0) / (stats?.totalBooths || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-400 h-3 rounded-full transition-all"
                        style={{ width: `${((stats?.boothsWithWebsite || 0) / (stats?.totalBooths || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-neutral-300">Descriptions</span>
                      <span className="text-white font-semibold">
                        {Math.round(((stats?.boothsWithDescription || 0) / (stats?.totalBooths || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-400 h-3 rounded-full transition-all"
                        style={{ width: `${((stats?.boothsWithDescription || 0) / (stats?.totalBooths || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Cities */}
              <Card className="bg-neutral-800 border-neutral-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-primary" />
                    Top Cities by Booth Count
                  </CardTitle>
                  <CardDescription className="text-neutral-400">
                    Cities with the most booths
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.topCities.slice(0, 10).map((city, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{city.city}</div>
                            <div className="text-xs text-neutral-400">{city.country}</div>
                          </div>
                        </div>
                        <Badge className="bg-neutral-800 text-white">{city.count} booths</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Community Tab */}
            <TabsContent value="community" className="space-y-6">
              {/* User Engagement */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-neutral-800 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-white">Active Users (7d)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{stats?.activeUsersLast7Days || 0}</div>
                    <p className="text-sm text-neutral-400 mt-1">Users active in last week</p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-800 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-white">Active Users (30d)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">{stats?.activeUsersLast30Days || 0}</div>
                    <p className="text-sm text-neutral-400 mt-1">Users active in last month</p>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-800 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-white">Engagement Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {Math.round(((stats?.activeUsersLast30Days || 0) / (stats?.totalUsers || 1)) * 100)}%
                    </div>
                    <p className="text-sm text-neutral-400 mt-1">30-day engagement</p>
                  </CardContent>
                </Card>
              </div>

              {/* Top Contributors */}
              <Card className="bg-neutral-800 border-neutral-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    Top Photo Contributors
                  </CardTitle>
                  <CardDescription className="text-neutral-400">
                    Users who have uploaded the most photos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.topPhotoContributors.map((contributor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                            {index === 0 && <Award className="w-4 h-4 text-amber-400" />}
                            {index !== 0 && <span className="text-amber-400 font-bold">{index + 1}</span>}
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {contributor.profile?.username || 'Anonymous'}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-amber-900 text-amber-100">{contributor.photo_count} photos</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Most Bookmarked Booths */}
              <Card className="bg-neutral-800 border-neutral-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-400" />
                    Most Bookmarked Booths
                  </CardTitle>
                  <CardDescription className="text-neutral-400">
                    Booths saved by the most users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.mostBookmarkedBooths.map((booth, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                            <span className="text-red-400 font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{booth.booth?.name}</div>
                            <div className="text-xs text-neutral-400">{booth.booth?.city}</div>
                          </div>
                        </div>
                        <Badge className="bg-red-900 text-red-100">
                          <Heart className="w-3 h-3 mr-1 fill-red-100" />
                          {booth.bookmark_count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Growth Tab */}
            <TabsContent value="growth" className="space-y-6">
              {/* Recent Growth */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-neutral-800 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Booths Added
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-300">This Week</span>
                        <Badge className="bg-green-900 text-green-100">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {stats?.boothsAddedThisWeek || 0}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-300">This Month</span>
                        <Badge className="bg-blue-900 text-blue-100">
                          <CalendarDays className="w-3 h-3 mr-1" />
                          {stats?.boothsAddedThisMonth || 0}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-800 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-accent" />
                      Growth Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold text-white">
                        {stats?.boothsAddedThisMonth || 0}
                      </div>
                      <p className="text-sm text-neutral-400">Booths per month</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Growth Charts */}
              <Card className="bg-neutral-800 border-neutral-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Booths Added Over Time
                  </CardTitle>
                  <CardDescription className="text-neutral-400">
                    Monthly growth for the last 3 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.boothsByMonth.map((month, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-20 text-sm text-neutral-400">{month.month}</div>
                        <div className="flex-1">
                          <div className="w-full bg-neutral-700 rounded-full h-8 relative overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-primary to-accent h-8 rounded-full flex items-center justify-end px-3 transition-all"
                              style={{
                                width: `${Math.max(
                                  (month.count / Math.max(...(stats?.boothsByMonth.map(m => m.count) || [1]))) * 100,
                                  5
                                )}%`,
                              }}
                            >
                              <span className="text-white font-semibold text-sm">{month.count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-800 border-neutral-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    User Registrations Over Time
                  </CardTitle>
                  <CardDescription className="text-neutral-400">
                    Monthly user sign-ups for the last 3 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.usersByMonth.map((month, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-20 text-sm text-neutral-400">{month.month}</div>
                        <div className="flex-1">
                          <div className="w-full bg-neutral-700 rounded-full h-8 relative overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-8 rounded-full flex items-center justify-end px-3 transition-all"
                              style={{
                                width: `${Math.max(
                                  (month.count / Math.max(...(stats?.usersByMonth.map(m => m.count) || [1]))) * 100,
                                  5
                                )}%`,
                              }}
                            >
                              <span className="text-white font-semibold text-sm">{month.count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
