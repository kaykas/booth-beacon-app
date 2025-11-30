'use client';

import { useEffect, useState, useRef } from 'react';
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
import { BarChart3, Users, Image, MessageSquare, MapPin, CheckCircle, XCircle, Clock, Database, PlayCircle, PauseCircle, RefreshCw, Shield, Wifi, WifiOff, Activity, AlertCircle, Zap, Loader2, FileText, Heart, Recycle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { MetricsDashboard } from '@/components/admin/MetricsDashboard';
import { CrawlPerformanceBreakdown } from '@/components/admin/CrawlPerformanceBreakdown';
import { LogViewer } from '@/components/LogViewer';
import { CrawlJobQueue } from '@/components/admin/CrawlJobQueue';
import { CrawlerHealthDashboard } from '@/components/admin/CrawlerHealthDashboard';
import { ReextractionQueue } from '@/components/admin/ReextractionQueue';
import { CrawlerRegistryTable } from '@/components/admin/CrawlerRegistryTable';

interface Photo {
  id: string;
  [key: string]: unknown;
}

interface CrawlLog {
  id: string;
  [key: string]: unknown;
}

interface CrawlSource {
  id: string;
  source_name: string;
  [key: string]: unknown;
}

interface CrawlerMetric {
  id: string;
  booths_extracted?: number;
  completed_at?: string;
  [key: string]: unknown;
}

// Unused interface ExtendedEventSource - commented for future implementation
// interface ExtendedEventSource extends EventSource {
//   timeoutId?: NodeJS.Timeout;
// }

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const [_loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBooths: 0,
    activeBooths: 0,
    pendingBooths: 0,
    totalUsers: 0,
    pendingPhotos: 0,
    totalReviews: 0,
  });
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([]);
  const [crawlerRunning, setCrawlerRunning] = useState(false);
  const [crawlerStatus, setCrawlerStatus] = useState<string>('Ready');
  const [crawlerLogs, setCrawlerLogs] = useState<CrawlLog[]>([]);
  const [crawlerMetrics, setCrawlerMetrics] = useState({
    crawledToday: 0,
    lastRun: '-',
    errorCount: 0,
  });
  const [crawlSources, setCrawlSources] = useState<CrawlSource[]>([]);
  const [crawlerProgress, setCrawlerProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [currentBoothCount, setCurrentBoothCount] = useState(0);
  const [currentEventSource, setCurrentEventSource] = useState<EventSource | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  const [crawlerState, setCrawlerState] = useState<'idle' | 'connecting' | 'running' | 'error' | 'complete'>('idle');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting'>('disconnected');
  const [currentSource, setCurrentSource] = useState<string>('');
  const [currentStage, setCurrentStage] = useState<'crawling' | 'extracting' | 'validating' | 'saving' | ''>('');
  const [activityFeed, setActivityFeed] = useState<Array<{type: string, message: string, timestamp: Date, status: 'info' | 'success' | 'warning' | 'error'}>>([]);
  const [crawlStartTime, setCrawlStartTime] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string>('');
  const [errorCount, setErrorCount] = useState(0);
  const [_reconnectAttempt, _setReconnectAttempt] = useState(0);
  const [maxReconnectAttempts] = useState(5);
  const [_reconnectTimeoutId, _setReconnectTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [_selectedSource, setSelectedSource] = useState<string>('');
  const stopRef = useRef(false);

  // Discovery Engine environment variables state
  const [envVarsStatus, setEnvVarsStatus] = useState<Record<string, boolean> | null>(null);
  const [envVarsLoading, setEnvVarsLoading] = useState(false);

  // Geocoding state (for future feature)
  // Commented out to fix lint errors until feature is implemented
  // const [geocodingRunning, setGeocodingRunning] = useState(false);
  // Unused geocoding state - commented for future implementation
  // const [geocodingStatus, setGeocodingStatus] = useState('Ready');
  // const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0, percentage: 0 });
  // const [geocodingResults, setGeocodingResults] = useState<unknown[]>([]);
  // const [geocodingStats, setGeocodingStats] = useState({ success: 0, errors: 0, skipped: 0 });
  // const [missingCoordsCount, setMissingCoordsCount] = useState(0);
  // const [currentEventSourceGeocode, setCurrentEventSourceGeocode] = useState<EventSource | null>(null);

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
      const [boothsRes, usersRes, _photosRes, reviewsRes] = await Promise.all([
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

      const crawledToday = todayMetrics?.reduce((sum: number, m: CrawlerMetric) => sum + (m.booths_extracted || 0), 0) || 0;

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

      const lastRunData = (lastRun?.[0] as CrawlerMetric | undefined);
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

  const checkEnvironmentVariables = async () => {
    setEnvVarsLoading(true);
    try {
      const response = await fetch('/api/admin/check-env');
      const data = await response.json();
      setEnvVarsStatus(data.envVars);

      if (data.allSet) {
        toast.success('All environment variables are set');
      } else {
        toast.warning('Some environment variables are missing');
      }
    } catch (error) {
      console.error('Error checking environment variables:', error);
      toast.error('Failed to check environment variables');
    } finally {
      setEnvVarsLoading(false);
    }
  };

  // Helper to add activity to feed
  const addActivity = (type: string, message: string, status: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setActivityFeed(prev => [{type, message, timestamp: new Date(), status}, ...prev].slice(0, 50));
  };

  const stopCrawler = () => {
    stopRef.current = true;
    setCrawlerRunning(false);
    setCrawlerStatus('Stopping...');
    setCrawlerState('idle');
    setConnectionStatus('disconnected');
    addActivity('stop', 'Crawler stop requested', 'warning');
    toast.info('Stopping crawler after current source finishes...');
    
    if (currentEventSource) {
      currentEventSource.close();
      setCurrentEventSource(null);
    }
  };

  const startCrawler = async (sourceName?: string) => {
    if (crawlerRunning) {
      toast.error('Crawler is already running');
      return;
    }

    // Reset all states
    setCrawlerRunning(true);
    stopRef.current = false;
    setCrawlerStatus('Initializing crawler...');
    setCrawlerState('connecting');
    setConnectionStatus('connecting');
    setCurrentSource('');
    setCurrentStage('');
    setActivityFeed([]);
    setCrawlStartTime(new Date());
    setLastError('');
    setErrorCount(0);
    setCurrentBoothCount(0);

    // Get list of sources to run
    // If specific source requested, use that. Otherwise use all enabled sources.
    let sourcesToRun = crawlSources.filter(s => s.enabled);
    if (sourceName) {
      sourcesToRun = sourcesToRun.filter(s => s.source_name === sourceName);
    } else {
      // Refresh sources list to be sure
      try {
        const { data: refreshedSources } = await supabase
          .from('crawl_sources')
          .select('*')
          .eq('enabled', true)
          .order('priority', { ascending: false });
        if (refreshedSources) sourcesToRun = refreshedSources;
      } catch (e) {
        console.error('Failed to refresh sources', e);
      }
    }

    if (sourcesToRun.length === 0) {
      toast.error('No enabled sources found');
      setCrawlerRunning(false);
      setCrawlerState('idle');
      setConnectionStatus('disconnected');
      return;
    }

    setCrawlerProgress({ current: 0, total: sourcesToRun.length, percentage: 0 });
    addActivity('start', `Starting crawl of ${sourcesToRun.length} sources`, 'info');
    setConnectionStatus('connected');
    setCrawlerState('running');

    let completedSources = 0;

    // --- CLIENT SIDE ORCHESTRATION LOOP ---
    for (let i = 0; i < sourcesToRun.length; i++) {
      // Check for stop signal
      if (stopRef.current) {
        addActivity('stop', 'Crawler stopped by user', 'warning');
        break;
      }

      const source = sourcesToRun[i];
      setCurrentSource(source.source_name);
      setCrawlerStatus(`Processing ${source.source_name} (${i + 1}/${sourcesToRun.length})...`);
      addActivity('source', `Starting ${source.source_name}`, 'info');

      try {
        // Process single source via SSE
        await new Promise<void>((resolve, reject) => {
          const es = new EventSource(`/api/crawler/run-source?sourceId=${source.id}`);
          setCurrentEventSource(es);
          
          es.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
              if (data.type === 'progress') {
                setCurrentStage(data.message);
              } else if (data.type === 'info') {
                addActivity('info', data.message, 'info');
              } else if (data.type === 'success') {
                addActivity('success', data.message, 'success');
              } else if (data.type === 'error') {
                addActivity('error', data.message, 'error');
                setLastError(data.message);
                setErrorCount(prev => prev + 1);
              } else if (data.type === 'complete') {
                es.close();
                setCurrentEventSource(null);
                resolve();
              }
            } catch (e) {
              console.error('Parse error', e);
            }
          };

          es.onerror = (err) => {
            console.error('EventSource failed', err);
            es.close();
            setCurrentEventSource(null);
            // Treat network error as failure but don't crash whole crawler
            reject(new Error('Connection lost'));
          };
        });

        addActivity('source', `Completed ${source.source_name}`, 'success');

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addActivity('error', `Failed ${source.source_name}: ${errorMessage}`, 'error');
        setErrorCount(prev => prev + 1);
      }

      completedSources++;
      setCrawlerProgress({ 
        current: completedSources, 
        total: sourcesToRun.length, 
        percentage: Math.round((completedSources / sourcesToRun.length) * 100) 
      });
      
      // Refresh logs/metrics occasionally
      loadCrawlerMetrics();
      loadCrawlerLogs();
    }

    setCrawlerStatus('Crawl complete');
    setCrawlerState('complete');
    setCrawlerRunning(false);
    setConnectionStatus('disconnected');
    setCurrentStage('');
    toast.success('Crawler run finished');
    loadAdminData();
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
                <Image className="w-8 h-8 text-purple-400" alt="Image icon" />
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
          <Tabs defaultValue="crawler" className="w-full">
            <TabsList className="bg-neutral-800 border-neutral-700">
              <TabsTrigger value="crawler" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                <Database className="w-4 h-4 mr-2" />
                Crawler & Data
              </TabsTrigger>
              <TabsTrigger value="moderation" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                <Eye className="w-4 h-4 mr-2" />
                Moderation {stats.pendingPhotos > 0 && `(${stats.pendingPhotos})`}
              </TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                <Activity className="w-4 h-4 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="crawler" className="mt-6">
              <div className="space-y-6">
                {/* Crawler Controls */}
              <Card className="p-6 bg-neutral-800 border-neutral-700">
                <h2 className="font-display text-2xl font-semibold mb-6 text-white">Data Crawler Controls</h2>

                <div className="space-y-6">
                  {/* BIG STATUS BANNER */}
                  <div className={`border-4 rounded-xl p-8 transition-all duration-500 ${
                    crawlerState === 'idle' ? 'bg-neutral-900 border-neutral-700' :
                    crawlerState === 'connecting' ? 'bg-blue-950/30 border-blue-500 animate-pulse' :
                    crawlerState === 'running' ? 'bg-green-950/30 border-green-500' :
                    crawlerState === 'error' ? 'bg-red-950/30 border-red-500' :
                    crawlerState === 'complete' ? 'bg-purple-950/30 border-purple-500' :
                    'bg-neutral-900 border-neutral-700'
                  }`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-6">
                        {/* State Icon */}
                        <div className={`p-4 rounded-full ${
                          crawlerState === 'idle' ? 'bg-neutral-800' :
                          crawlerState === 'connecting' ? 'bg-blue-500/20' :
                          crawlerState === 'running' ? 'bg-green-500/20' :
                          crawlerState === 'error' ? 'bg-red-500/20' :
                          'bg-purple-500/20'
                        }`}>
                          {crawlerState === 'idle' && <Database className="w-12 h-12 text-neutral-400" />}
                          {crawlerState === 'connecting' && <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />}
                          {crawlerState === 'running' && <Activity className="w-12 h-12 text-green-400 animate-pulse" />}
                          {crawlerState === 'error' && <AlertCircle className="w-12 h-12 text-red-400" />}
                          {crawlerState === 'complete' && <CheckCircle className="w-12 h-12 text-purple-400" />}
                        </div>

                        {/* State Text */}
                        <div>
                          <div className="text-4xl font-bold text-white mb-2">
                            {crawlerState === 'idle' && 'IDLE'}
                            {crawlerState === 'connecting' && 'CONNECTING'}
                            {crawlerState === 'running' && 'RUNNING'}
                            {crawlerState === 'error' && 'ERROR'}
                            {crawlerState === 'complete' && 'COMPLETE'}
                          </div>
                          <div className="text-lg text-neutral-300">{crawlerStatus}</div>
                        </div>
                      </div>

                      {/* Connection Status */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-2">
                          {connectionStatus === 'disconnected' && <WifiOff className="w-5 h-5 text-neutral-500" />}
                          {connectionStatus === 'connecting' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                          {connectionStatus === 'connected' && <Wifi className="w-5 h-5 text-green-400" />}
                          {connectionStatus === 'reconnecting' && <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />}
                          {connectionStatus === 'error' && <WifiOff className="w-5 h-5 text-red-400" />}
                          <span className="text-sm font-semibold text-white">
                            {connectionStatus.toUpperCase()}
                            {connectionStatus === 'reconnecting' && reconnectAttempt > 0 && (
                              <span className="text-xs ml-1">({reconnectAttempt}/{maxReconnectAttempts})</span>
                            )}
                          </span>
                        </div>
                        {crawlStartTime && crawlerRunning && (
                          <div className="text-xs text-neutral-400">
                            Running for {Math.floor((new Date().getTime() - crawlStartTime.getTime()) / 1000)}s
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Current Source & Stage */}
                    {crawlerRunning && currentSource && (
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-700">
                          <div className="text-xs text-neutral-400 mb-1">CURRENT SOURCE</div>
                          <div className="text-lg font-semibold text-white truncate">{currentSource}</div>
                        </div>
                        <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-700">
                          <div className="text-xs text-neutral-400 mb-1">STAGE</div>
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
                            <span className="text-lg font-semibold text-white capitalize">
                              {currentStage || 'Initializing'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    {crawlerRunning && crawlerProgress.total > 0 && (
                      <div className="mb-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">
                            Progress: {crawlerProgress.current} / {crawlerProgress.total} sources
                          </span>
                          <span className="text-3xl font-bold text-white">{crawlerProgress.percentage}%</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-6 overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 transition-all duration-500 ease-out flex items-center justify-end px-2"
                            style={{ width: `${crawlerProgress.percentage}%` }}
                          >
                            {crawlerProgress.percentage > 10 && (
                              <span className="text-xs font-bold text-white">{crawlerProgress.percentage}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-neutral-900/50 rounded-lg border border-neutral-700">
                        <div className="text-3xl font-bold text-green-400 mb-1">{currentBoothCount}</div>
                        <div className="text-xs text-neutral-400">Booths Found</div>
                      </div>
                      <div className="text-center p-4 bg-neutral-900/50 rounded-lg border border-neutral-700">
                        <div className="text-3xl font-bold text-white mb-1">{crawlerMetrics.crawledToday}</div>
                        <div className="text-xs text-neutral-400">Crawled Today</div>
                      </div>
                      <div className="text-center p-4 bg-neutral-900/50 rounded-lg border border-neutral-700">
                        <div className="text-sm font-bold text-white mb-1">{crawlerMetrics.lastRun}</div>
                        <div className="text-xs text-neutral-400">Last Run</div>
                      </div>
                      <div className="text-center p-4 bg-neutral-900/50 rounded-lg border border-neutral-700">
                        <div className="text-3xl font-bold text-red-400 mb-1">{errorCount}</div>
                        <div className="text-xs text-neutral-400">Errors This Run</div>
                      </div>
                    </div>

                    {/* Error Display */}
                    {lastError && (
                      <div className="mb-6 p-4 bg-red-950/30 border-2 border-red-500 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-semibold text-red-300 mb-1">Last Error:</div>
                            <div className="text-sm text-red-200">{lastError}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Controls */}
                    <div className="flex gap-3">
                      {!crawlerRunning ? (
                        <Button
                          className="flex-1 h-14 text-lg"
                          onClick={() => startCrawler()}
                        >
                          <PlayCircle className="w-6 h-6 mr-3" />
                          Start Crawler
                        </Button>
                      ) : (
                        <Button
                          className="flex-1 h-14 text-lg"
                          variant="destructive"
                          onClick={stopCrawler}
                        >
                          <PauseCircle className="w-6 h-6 mr-3" />
                          Stop Crawler
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="h-14"
                        disabled={crawlerRunning}
                        onClick={() => {
                          loadCrawlerMetrics();
                          loadCrawlerLogs();
                          toast.success('Refreshed crawler data');
                        }}
                      >
                        <RefreshCw className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>

                  {/* Real-time Activity Feed */}
                  {activityFeed.length > 0 && (
                    <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-green-400" />
                        <h3 className="font-semibold text-white">Live Activity Feed</h3>
                        <Badge variant="secondary" className="ml-auto">{activityFeed.length} events</Badge>
                      </div>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {activityFeed.map((activity, index) => (
                          <div
                            key={index}
                            className={`flex items-start gap-3 p-3 rounded border-l-4 ${
                              activity.status === 'error' ? 'bg-red-950/20 border-red-500' :
                              activity.status === 'warning' ? 'bg-yellow-950/20 border-yellow-500' :
                              activity.status === 'success' ? 'bg-green-950/20 border-green-500' :
                              'bg-blue-950/20 border-blue-500'
                            }`}
                          >
                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                              activity.status === 'error' ? 'bg-red-400' :
                              activity.status === 'warning' ? 'bg-yellow-400' :
                              activity.status === 'success' ? 'bg-green-400' :
                              'bg-blue-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-white font-medium text-sm">{activity.type.toUpperCase()}</span>
                                <span className="text-neutral-500 text-xs flex-shrink-0">
                                  {activity.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-neutral-300 text-sm">{activity.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">Recent Crawler Logs</h3>
                      <select
                        value={logFilter}
                        onChange={(e) => setLogFilter(e.target.value as 'all' | 'info' | 'warning' | 'error')}
                        className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                      >
                        <option value="all">All Logs</option>
                        <option value="info">Info Only</option>
                        <option value="warning">Warnings Only</option>
                        <option value="error">Errors Only</option>
                      </select>
                    </div>
                    {crawlerLogs.filter(log =>
                      logFilter === 'all' || log.operation_status === logFilter
                    ).length === 0 ? (
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
                                  {String(log.operation_type)}
                                </span>
                                <span className="text-neutral-500 text-xs flex-shrink-0">
                                  {new Date(log.timestamp as string).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-neutral-400 text-xs break-words">{String(log.message)}</p>
                              {(log.details as Record<string, unknown> | null) && Object.keys(log.details as Record<string, unknown>).length > 0 && (
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
                                    (source.enabled as boolean)
                                      ? 'bg-green-900 text-green-100'
                                      : 'bg-gray-700 text-gray-300'
                                  }
                                >
                                  {(source.enabled as boolean) ? 'Enabled' : 'Disabled'}
                                </Badge>
                                {(source.status as string) === 'error' && (
                                  <Badge variant="destructive">Error</Badge>
                                )}
                              </div>
                              <p className="text-xs text-neutral-400 truncate">
                                {source.source_url as string}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                                <span>Priority: {String(source.priority)}</span>
                                {(source.total_booths_found as number | null) && (source.total_booths_found as number) > 0 && (
                                  <span>Found: {String(source.total_booths_found)} booths</span>
                                )}
                                {(source.last_successful_crawl as string | null) && (
                                  <span>
                                    Last: {new Date(source.last_successful_crawl as string).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={crawlerRunning || !(source.enabled as boolean)}
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
                                crawlSources.reduce((sum, s) => sum + ((s.average_crawl_duration_seconds as number) || 0), 0) /
                                  crawlSources.length
                              ) + 's'
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

                {/* Discovery Engine */}
                <Card className="p-6 bg-neutral-800 border-neutral-700">
                  <h2 className="font-display text-2xl font-semibold mb-6 text-white">Discovery Engine (Firecrawl + Claude)</h2>

                  <div className="space-y-6">
                    {/* Info Banner */}
                    <div className="bg-blue-950/30 border-2 border-blue-500 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Database className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-blue-300 mb-2">AI-Powered Booth Discovery</div>
                          <p className="text-sm text-blue-200 mb-3">
                            The Discovery Engine uses Firecrawl to search the web and Claude Opus to verify analog booths.
                            It searches Reddit, blogs, and social media for references to analog photo booths.
                          </p>
                          <p className="text-xs text-blue-300">
                            <strong>Note:</strong> These commands must be run from your terminal with the correct environment variables set.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Required Environment Variables */}
                    <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          <Shield className="w-5 h-5 text-yellow-400" />
                          Required Environment Variables
                        </h3>
                        <Button
                          size="sm"
                          onClick={checkEnvironmentVariables}
                          disabled={envVarsLoading}
                          className="flex items-center gap-2"
                        >
                          {envVarsLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Checking...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              Check Status
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm font-mono">
                        <div className="flex items-center justify-between p-2 bg-neutral-800 rounded">
                          <span className="text-neutral-300">NEXT_PUBLIC_SUPABASE_URL</span>
                          {envVarsStatus ? (
                            <Badge
                              variant="secondary"
                              className={envVarsStatus.NEXT_PUBLIC_SUPABASE_URL ? "bg-green-900 text-green-100" : "bg-red-900 text-red-100"}
                            >
                              {envVarsStatus.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-neutral-700 text-neutral-300">Not Checked</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-neutral-800 rounded">
                          <span className="text-neutral-300">SUPABASE_SERVICE_ROLE_KEY</span>
                          {envVarsStatus ? (
                            <Badge
                              variant="secondary"
                              className={envVarsStatus.SUPABASE_SERVICE_ROLE_KEY ? "bg-green-900 text-green-100" : "bg-red-900 text-red-100"}
                            >
                              {envVarsStatus.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Missing"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-neutral-700 text-neutral-300">Not Checked</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-neutral-800 rounded">
                          <span className="text-neutral-300">ANTHROPIC_API_KEY</span>
                          {envVarsStatus ? (
                            <Badge
                              variant="secondary"
                              className={envVarsStatus.ANTHROPIC_API_KEY ? "bg-green-900 text-green-100" : "bg-red-900 text-red-100"}
                            >
                              {envVarsStatus.ANTHROPIC_API_KEY ? "Set" : "Missing"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-neutral-700 text-neutral-300">Not Checked</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-neutral-800 rounded">
                          <span className="text-neutral-300">FIRECRAWL_API_KEY</span>
                          {envVarsStatus ? (
                            <Badge
                              variant="secondary"
                              className={envVarsStatus.FIRECRAWL_API_KEY ? "bg-green-900 text-green-100" : "bg-red-900 text-red-100"}
                            >
                              {envVarsStatus.FIRECRAWL_API_KEY ? "Set" : "Missing"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-neutral-700 text-neutral-300">Not Checked</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 mt-3">
                        Click &quot;Check Status&quot; to verify if all environment variables are properly configured on the server.
                      </p>
                    </div>

                    {/* Step 1: Seed Sources */}
                    <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">1</div>
                        <h3 className="font-semibold text-white">Seed Discovery Sources</h3>
                      </div>
                      <p className="text-sm text-neutral-400 mb-3">
                        Populates the <code className="bg-neutral-800 px-1 py-0.5 rounded">crawl_sources</code> table with 20+ master booth operator sources (Photoautomat, Fotoautomat, etc.)
                      </p>
                      <div className="bg-neutral-950 rounded p-3 border border-neutral-800">
                        <code className="text-sm text-green-400">
                          npx tsx scripts/seed-master-plan.ts
                        </code>
                      </div>
                      <div className="mt-3 text-xs text-neutral-500">
                        Sources: Europe (Photoautomat Berlin, Fotoautomat Paris), North America (Classic Photo Booth NYC, Photomatica SF), Asia/Oceania
                      </div>
                    </div>

                    {/* Step 2: Run Discovery */}
                    <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">2</div>
                        <h3 className="font-semibold text-white">Run Discovery Engine</h3>
                      </div>
                      <p className="text-sm text-neutral-400 mb-3">
                        Searches the web using Firecrawl and validates analog booths with Claude Opus. Auto-saves discoveries with <code className="bg-neutral-800 px-1 py-0.5 rounded">status: &apos;unverified&apos;</code>
                      </p>
                      <div className="bg-neutral-950 rounded p-3 border border-neutral-800">
                        <code className="text-sm text-green-400">
                          npx tsx scripts/run-discovery.ts
                        </code>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-neutral-500">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />
                          <span>Searches Reddit, Lemon8, TikTok, and specialized forums</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />
                          <span>Filters out digital booths (Purikura, Life4Cuts, etc.)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />
                          <span>Extracts booth details with confidence scoring</span>
                        </div>
                      </div>
                    </div>

                    {/* Full Command with Env Vars */}
                    <div className="border-2 border-purple-500/30 bg-purple-950/20 rounded-lg p-4">
                      <h3 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Complete Command (with env vars)
                      </h3>
                      <div className="bg-neutral-950 rounded p-3 border border-neutral-800 overflow-x-auto">
                        <pre className="text-xs text-green-400">
{`export SUPABASE_SERVICE_ROLE_KEY="your_key_here" \\
export ANTHROPIC_API_KEY="your_key_here" \\
export FIRECRAWL_API_KEY="your_key_here" && \\
npx tsx scripts/seed-master-plan.ts && \\
npx tsx scripts/run-discovery.ts`}
                        </pre>
                      </div>
                    </div>

                    {/* Troubleshooting */}
                    <details className="border border-neutral-700 rounded-lg bg-neutral-900">
                      <summary className="p-4 cursor-pointer hover:bg-neutral-850 transition font-semibold text-white">
                        Troubleshooting & Tips
                      </summary>
                      <div className="px-4 pb-4 space-y-3 text-sm text-neutral-400">
                        <div>
                          <strong className="text-neutral-300">Issue: &quot;Missing required environment variables&quot;</strong>
                          <p className="mt-1">Make sure all three API keys are exported in your terminal session before running the scripts.</p>
                        </div>
                        <div>
                          <strong className="text-neutral-300">Issue: &quot;No booths found&quot;</strong>
                          <p className="mt-1">The discovery queries are Reddit/blog-focused. Results may vary based on current web content. Try running during different times or check Firecrawl credits.</p>
                        </div>
                        <div>
                          <strong className="text-neutral-300">Tip: Start with seed-master-plan first</strong>
                          <p className="mt-1">The unified crawler above can crawl these seeded sources. Run seed-master-plan, then use the &quot;Start Crawler&quot; button above to crawl them.</p>
                        </div>
                      </div>
                    </details>
                  </div>
                </Card>

                {/* Crawler Registry */}
                <CrawlerRegistryTable />

                {/* Metrics Dashboard */}
                <MetricsDashboard />
              </div>
            </TabsContent>

            <TabsContent value="moderation" className="mt-6">
              <div className="space-y-6">
                {/* Photo Moderation */}
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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.photo_url as string}
                            alt={(photo.caption as string) || 'User photo'}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="p-4">
                            <p className="font-medium mb-1 text-white">{(photo.booth as { name?: string })?.name}</p>
                            <p className="text-sm text-neutral-400 mb-2">
                              {(photo.booth as { city?: string })?.city}, {(photo.booth as { country?: string })?.country}
                            </p>
                            {(photo.caption as string | null) && (
                              <p className="text-sm text-neutral-300 mb-3 italic">&quot;{String(photo.caption)}&quot;</p>
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

                {/* User Management */}
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
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="mt-6">
              <Tabs defaultValue="analytics" className="w-full">
                <TabsList className="bg-neutral-800 border-neutral-700">
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                    <FileText className="w-4 h-4 mr-2" />
                    Crawler Logs
                  </TabsTrigger>
                  <TabsTrigger value="health" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                    <Heart className="w-4 h-4 mr-2" />
                    Crawler Health
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                    <Zap className="w-4 h-4 mr-2" />
                    Performance
                  </TabsTrigger>
                  <TabsTrigger value="queue" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                    <Clock className="w-4 h-4 mr-2" />
                    Job Queue
                  </TabsTrigger>
                  <TabsTrigger value="reextraction" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                    <Recycle className="w-4 h-4 mr-2" />
                    Re-extraction
                  </TabsTrigger>
                </TabsList>

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

                <TabsContent value="logs" className="mt-6">
                  <LogViewer initialLimit={50} />
                </TabsContent>

                <TabsContent value="health" className="mt-6">
                  <CrawlerHealthDashboard />
                </TabsContent>

                <TabsContent value="performance" className="mt-6">
                  <CrawlPerformanceBreakdown />
                </TabsContent>

                <TabsContent value="queue" className="mt-6">
                  <CrawlJobQueue />
                </TabsContent>

                <TabsContent value="reextraction" className="mt-6">
                  <ReextractionQueue />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
