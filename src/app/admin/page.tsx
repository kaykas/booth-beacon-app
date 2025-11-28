'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isUserAdmin } from '@/lib/adminAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Image, MessageSquare, MapPin, CheckCircle, XCircle, Clock, Database, PlayCircle, PauseCircle, RefreshCw, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const [stats, setStats] = useState({
    totalBooths: 0,
    activeBooths: 0,
    pendingBooths: 0,
    totalUsers: 0,
    pendingPhotos: 0,
    totalReviews: 0,
  });
  const [pendingPhotos, setPendingPhotos] = useState<any[]>([]);
  const [crawlerRunning, setCrawlerRunning] = useState(false);
  const [crawlerStatus, setCrawlerStatus] = useState<string>('Ready');
  const [crawlerLogs, setCrawlerLogs] = useState<any[]>([]);
  const [crawlerMetrics, setCrawlerMetrics] = useState({
    crawledToday: 0,
    lastRun: '-',
    errorCount: 0,
  });
  const [crawlSources, setCrawlSources] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

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
          loadAdminData();
          loadCrawlerMetrics();
          loadCrawlerLogs();
          loadCrawlSources();
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setAdminCheckComplete(true);
      }
    }

    checkAdmin();
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

      const pendingBooths = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

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
        pendingBooths: pendingBooths.count || 0,
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

  const loadCrawlerMetrics = async () => {
    try {
      // Get today's metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayMetrics } = await supabase
        .from('crawler_metrics')
        .select('*')
        .gte('started_at', today.toISOString());

      const crawledToday = todayMetrics?.reduce((sum: number, m: any) => sum + (m.booths_extracted || 0), 0) || 0;

      // Get last successful run
      const { data: lastRun } = await supabase
        .from('crawler_metrics')
        .select('*')
        .eq('status', 'success')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get error count
      const { count: errorCount } = await supabase
        .from('crawler_metrics')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'error')
        .gte('started_at', today.toISOString());

      const lastRunData = lastRun as any;
      setCrawlerMetrics({
        crawledToday,
        lastRun: lastRunData?.completed_at ? new Date(lastRunData.completed_at).toLocaleString() : '-',
        errorCount: errorCount || 0,
      });
    } catch (error) {
      console.error('Error loading crawler metrics:', error);
    }
  };

  const loadCrawlerLogs = async () => {
    try {
      const { data: logs } = await supabase
        .from('crawl_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      setCrawlerLogs(logs || []);
    } catch (error) {
      console.error('Error loading crawler logs:', error);
    }
  };

  const loadCrawlSources = async () => {
    try {
      const { data: sources } = await supabase
        .from('crawl_sources')
        .select('*')
        .order('priority', { ascending: false });

      setCrawlSources(sources || []);
    } catch (error) {
      console.error('Error loading crawl sources:', error);
    }
  };

  const startCrawler = async (sourceName?: string) => {
    if (crawlerRunning) {
      toast.error('Crawler is already running');
      return;
    }

    setCrawlerRunning(true);
    setCrawlerStatus('Starting crawler...');
    toast.info('Starting crawler...');

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/unified-crawler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          source_name: sourceName,
          force_crawl: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start crawler');
      }

      const result = await response.json();

      setCrawlerStatus('Crawler completed successfully');
      toast.success(`Crawler completed! Found ${result.summary?.total_booths_found || 0} booths`);

      // Reload data
      await loadAdminData();
      await loadCrawlerMetrics();
      await loadCrawlerLogs();
    } catch (error: any) {
      console.error('Crawler error:', error);
      setCrawlerStatus('Error: ' + error.message);
      toast.error('Crawler failed: ' + error.message);
    } finally {
      setCrawlerRunning(false);
    }
  };

  // Loading state
  if (authLoading || !adminCheckComplete) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-neutral-900 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-neutral-800 rounded w-1/4"></div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
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

  // Not authenticated
  if (!user) {
    return null;
  }

  // Not admin - show access denied
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
                Please contact an administrator if you believe this is an error.
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-semibold mb-2 text-white">Admin Dashboard</h1>
            <p className="text-neutral-400">Manage content and moderate submissions</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-neutral-800 border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-8 h-8 text-primary" />
                <Badge variant="secondary" className="bg-green-900 text-green-100">{stats.activeBooths} active</Badge>
              </div>
              <div className="text-3xl font-bold text-white">{stats.totalBooths}</div>
              <div className="text-sm text-neutral-400">Total Booths</div>
              {stats.pendingBooths > 0 && (
                <div className="mt-2 text-xs text-yellow-400">
                  {stats.pendingBooths} pending approval
                </div>
              )}
            </Card>

            <Card className="p-6 bg-neutral-800 border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
              <div className="text-sm text-neutral-400">Registered Users</div>
            </Card>

            <Card className="p-6 bg-neutral-800 border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <Image className="w-8 h-8 text-purple-400" />
                {stats.pendingPhotos > 0 && (
                  <Badge variant="secondary" className="bg-yellow-900 text-yellow-100">
                    {stats.pendingPhotos} pending
                  </Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-white">{stats.pendingPhotos}</div>
              <div className="text-sm text-neutral-400">Photos to Review</div>
            </Card>

            <Card className="p-6 bg-neutral-800 border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.totalReviews}</div>
              <div className="text-sm text-neutral-400">Total Reviews</div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="bg-neutral-800 border-neutral-700">
              <TabsTrigger value="photos" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                <Image className="w-4 h-4 mr-2" />
                Photo Moderation ({stats.pendingPhotos})
              </TabsTrigger>
              <TabsTrigger value="crawler" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                <Database className="w-4 h-4 mr-2" />
                Data Crawler
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photos" className="mt-6">
              <Card className="p-6 bg-neutral-800 border-neutral-700">
                <h2 className="font-display text-2xl font-semibold mb-6 text-white">Pending Photo Approvals</h2>

                {pendingPhotos.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-neutral-400">All caught up! No photos pending review.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingPhotos.map((photo) => (
                      <div key={photo.id} className="border border-neutral-700 rounded-lg overflow-hidden bg-neutral-900">
                        <img
                          src={photo.photo_url}
                          alt={photo.caption || 'User photo'}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="p-4">
                          <p className="font-medium mb-1 text-white">{photo.booth?.name}</p>
                          <p className="text-sm text-neutral-400 mb-2">
                            {photo.booth?.city}, {photo.booth?.country}
                          </p>
                          {photo.caption && (
                            <p className="text-sm text-neutral-300 mb-3 italic">"{photo.caption}"</p>
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

            <TabsContent value="crawler" className="mt-6">
              <Card className="p-6 bg-neutral-800 border-neutral-700">
                <h2 className="font-display text-2xl font-semibold mb-6 text-white">Data Crawler Controls</h2>

                <div className="space-y-6">
                  {/* Crawler Status */}
                  <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white mb-1">Crawler Status</h3>
                        <p className="text-sm text-neutral-400">{crawlerStatus}</p>
                      </div>
                      <Badge variant="secondary" className={crawlerRunning ? "bg-yellow-900 text-yellow-100" : "bg-green-900 text-green-100"}>
                        <span className={`inline-block w-2 h-2 ${crawlerRunning ? 'bg-yellow-400' : 'bg-green-400'} rounded-full mr-2 ${crawlerRunning ? 'animate-pulse' : ''}`}></span>
                        {crawlerRunning ? 'Running' : 'Ready'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-neutral-800 rounded">
                        <div className="text-2xl font-bold text-white">{crawlerMetrics.crawledToday}</div>
                        <div className="text-xs text-neutral-400">Crawled Today</div>
                      </div>
                      <div className="text-center p-3 bg-neutral-800 rounded">
                        <div className="text-sm font-bold text-white">{crawlerMetrics.lastRun}</div>
                        <div className="text-xs text-neutral-400">Last Run</div>
                      </div>
                      <div className="text-center p-3 bg-neutral-800 rounded">
                        <div className="text-2xl font-bold text-white">{crawlerMetrics.errorCount}</div>
                        <div className="text-xs text-neutral-400">Error Count</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        disabled={crawlerRunning}
                        onClick={() => startCrawler()}
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        {crawlerRunning ? 'Running...' : 'Start Crawler'}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={crawlerRunning}
                        onClick={() => {
                          loadCrawlerMetrics();
                          loadCrawlerLogs();
                          toast.success('Refreshed crawler data');
                        }}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
                    <h3 className="font-semibold text-white mb-3">Recent Crawler Logs</h3>
                    {crawlerLogs.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                        <p className="text-neutral-400 text-sm">No crawler logs yet</p>
                        <p className="text-neutral-500 text-xs mt-1">Start the crawler to see activity</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {crawlerLogs.map((log, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-neutral-800 rounded text-sm"
                          >
                            <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                              log.operation_status === 'error' ? 'bg-red-400' :
                              log.operation_status === 'warning' ? 'bg-yellow-400' :
                              'bg-green-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-neutral-300 font-medium truncate">
                                  {log.operation_type}
                                </span>
                                <span className="text-neutral-500 text-xs flex-shrink-0">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-neutral-400 text-xs break-words">{log.message}</p>
                              {log.details && Object.keys(log.details).length > 0 && (
                                <details className="mt-2">
                                  <summary className="text-neutral-500 text-xs cursor-pointer hover:text-neutral-400">
                                    View details
                                  </summary>
                                  <pre className="mt-1 text-xs text-neutral-500 overflow-x-auto">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Crawl Sources Management */}
                  <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">Crawl Sources ({crawlSources.length})</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadCrawlSources()}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                    {crawlSources.length === 0 ? (
                      <div className="text-center py-8">
                        <Database className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                        <p className="text-neutral-400 text-sm">No crawl sources configured</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {crawlSources.map((source) => (
                          <div
                            key={source.id}
                            className="flex items-center gap-3 p-3 bg-neutral-800 rounded hover:bg-neutral-750 transition"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white truncate">
                                  {source.source_name}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={
                                    source.enabled
                                      ? 'bg-green-900 text-green-100'
                                      : 'bg-gray-700 text-gray-300'
                                  }
                                >
                                  {source.enabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                                {source.status === 'error' && (
                                  <Badge variant="destructive">Error</Badge>
                                )}
                              </div>
                              <p className="text-xs text-neutral-400 truncate">
                                {source.source_url}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                                <span>Priority: {source.priority}</span>
                                {source.total_booths_found > 0 && (
                                  <span>Found: {source.total_booths_found} booths</span>
                                )}
                                {source.last_successful_crawl && (
                                  <span>
                                    Last: {new Date(source.last_successful_crawl).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={crawlerRunning || !source.enabled}
                              onClick={() => {
                                setSelectedSource(source.source_name);
                                startCrawler(source.source_name);
                              }}
                            >
                              <PlayCircle className="w-4 h-4 mr-1" />
                              Test
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Configuration */}
                  <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
                    <h3 className="font-semibold text-white mb-3">Crawler Configuration</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                        <span className="text-neutral-300">Total Sources</span>
                        <span className="text-neutral-400">{crawlSources.length}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                        <span className="text-neutral-300">Enabled Sources</span>
                        <span className="text-neutral-400">
                          {crawlSources.filter(s => s.enabled).length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                        <span className="text-neutral-300">Sources with Errors</span>
                        <span className="text-error">
                          {crawlSources.filter(s => s.status === 'error').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-neutral-300">Average Crawl Duration</span>
                        <span className="text-neutral-400">
                          {crawlSources.length > 0
                            ? Math.round(
                                crawlSources.reduce((sum, s) => sum + (s.average_crawl_duration_seconds || 0), 0) /
                                  crawlSources.length
                              ) + 's'
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <Card className="p-6 bg-neutral-800 border-neutral-700">
                <h2 className="font-display text-2xl font-semibold mb-6 text-white">User Management</h2>

                <div className="space-y-6">
                  {/* User Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="w-8 h-8 text-blue-400" />
                      </div>
                      <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                      <div className="text-sm text-neutral-400">Total Users</div>
                    </div>
                    <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
                      <div className="flex items-center justify-between mb-2">
                        <Shield className="w-8 h-8 text-purple-400" />
                      </div>
                      <div className="text-2xl font-bold text-white">-</div>
                      <div className="text-sm text-neutral-400">Admin Users</div>
                    </div>
                    <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
                      <div className="flex items-center justify-between mb-2">
                        <MessageSquare className="w-8 h-8 text-green-400" />
                      </div>
                      <div className="text-2xl font-bold text-white">{stats.totalReviews}</div>
                      <div className="text-sm text-neutral-400">User Reviews</div>
                    </div>
                  </div>

                  {/* Admin Management */}
                  <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
                    <h3 className="font-semibold text-white mb-3">Admin User Management</h3>
                    <p className="text-neutral-400 text-sm mb-4">
                      Grant or revoke admin privileges for users
                    </p>
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                      <p className="text-neutral-400 text-sm">Admin user list coming soon</p>
                      <p className="text-neutral-500 text-xs mt-1">Add or remove admin privileges</p>
                    </div>
                  </div>

                  {/* Recent User Activity */}
                  <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
                    <h3 className="font-semibold text-white mb-3">Recent User Activity</h3>
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                      <p className="text-neutral-400 text-sm">Activity log coming soon</p>
                      <p className="text-neutral-500 text-xs mt-1">Track user registrations and actions</p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <Card className="p-6 bg-neutral-800 border-neutral-700">
                <h2 className="font-display text-2xl font-semibold mb-6 text-white">Platform Analytics</h2>
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400">Analytics dashboard coming soon</p>
                  <p className="text-neutral-500 text-xs mt-1">Track booth views, searches, and engagement</p>
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
