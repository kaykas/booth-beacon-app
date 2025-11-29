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
import { BarChart3, Users, Image, MessageSquare, MapPin, CheckCircle, XCircle, Clock, Database, PlayCircle, PauseCircle, RefreshCw, Shield, Wifi, WifiOff, Activity, AlertCircle, Zap, Loader2, FileText, Heart, Recycle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { MetricsDashboard } from '@/components/admin/MetricsDashboard';
import { CrawlPerformanceBreakdown } from '@/components/admin/CrawlPerformanceBreakdown';
import { LogViewer } from '@/components/LogViewer';
import { CrawlJobQueue } from '@/components/admin/CrawlJobQueue';
import { CrawlerHealthDashboard } from '@/components/admin/CrawlerHealthDashboard';
import { ReextractionQueue } from '@/components/admin/ReextractionQueue';

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

interface ExtendedEventSource extends EventSource {
  timeoutId?: NodeJS.Timeout;
}

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
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [maxReconnectAttempts] = useState(5);
  const [reconnectTimeoutId, setReconnectTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [_selectedSource, setSelectedSource] = useState<string>('');

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

  // Helper to add activity to feed
  const addActivity = (type: string, message: string, status: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setActivityFeed(prev => [{type, message, timestamp: new Date(), status}, ...prev].slice(0, 50));
  };

  // Auto-reconnect with exponential backoff
  const attemptReconnect = (_sourceName?: string, _totalBooths?: number, _completedSources?: number) => {
    if (reconnectAttempt >= maxReconnectAttempts) {
      setCrawlerStatus(`Max reconnection attempts (${maxReconnectAttempts}) reached`);
      setConnectionStatus('error');
      setCrawlerState('error');
      setCrawlerRunning(false);
      addActivity('error', `Failed to reconnect after ${maxReconnectAttempts} attempts`, 'error');
      toast.error(`Failed to reconnect after ${maxReconnectAttempts} attempts. Please try again later.`);
      return;
    }

    // Exponential backoff: 3s, 6s, 12s, 24s, 48s
    const delay = Math.min(3000 * Math.pow(2, reconnectAttempt), 48000);
    setReconnectAttempt(prev => prev + 1);
    setConnectionStatus('reconnecting');

    const attemptNum = reconnectAttempt + 1;
    setCrawlerStatus(`Connection lost. Reconnecting in ${delay/1000}s (attempt ${attemptNum}/${maxReconnectAttempts})...`);
    addActivity('reconnect', `Attempting reconnection ${attemptNum}/${maxReconnectAttempts} in ${delay/1000}s`, 'warning');
    toast.warning(`Connection lost. Reconnecting in ${delay/1000}s (attempt ${attemptNum}/${maxReconnectAttempts})...`);

    const timeoutId = setTimeout(() => {
      addActivity('reconnect', `Reconnecting... (attempt ${attemptNum}/${maxReconnectAttempts})`, 'info');
      startCrawler(_sourceName);
    }, delay);

    setReconnectTimeoutId(timeoutId);
  };

  const stopCrawler = () => {
    // Clear reconnection timeout if active
    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
      setReconnectTimeoutId(null);
    }

    if (currentEventSource) {
      currentEventSource.close();
      setCurrentEventSource(null);
      setCrawlerRunning(false);
      setCrawlerStatus('Crawler stopped by user');
      setCrawlerState('idle');
      setConnectionStatus('disconnected');
      setCurrentSource('');
      setCurrentStage('');
      setReconnectAttempt(0);
      addActivity('stop', 'Crawler stopped by user', 'warning');
      toast.info('Crawler stopped');
    }
  };

  const startCrawler = async (sourceName?: string) => {
    if (crawlerRunning) {
      toast.error('Crawler is already running');
      return;
    }

    // Reset all states
    setCrawlerRunning(true);
    setCrawlerStatus('Starting crawler...');
    setCrawlerState('connecting');
    setConnectionStatus('connecting');
    setCrawlerProgress({ current: 0, total: 0, percentage: 0 });
    setCurrentBoothCount(0);
    setCurrentSource('');
    setCurrentStage('');
    if (reconnectAttempt === 0) {
      setActivityFeed([]); // Only clear activity feed on fresh start, not reconnect
    }
    setCrawlStartTime(new Date());
    setLastError('');
    setErrorCount(0);
    addActivity('start', reconnectAttempt > 0 ? 'Reconnecting to crawler...' : 'Initiating crawler connection...', 'info');
    toast.info(reconnectAttempt > 0 ? 'Reconnecting to crawler...' : 'Starting crawler with real-time streaming...');

    let eventSource: EventSource | null = null;
    let totalBooths = 0;
    let completedSources = 0;
    let hasReceivedData = false;

    try {
      // Use EventSource for real-time streaming via secure API proxy
      const params = new URLSearchParams({
        stream: 'true',
        force_crawl: 'true',
        ...(sourceName && { source_name: sourceName }),
      });

      // Call secure Next.js API route (handles SERVICE_ROLE_KEY server-side)
      eventSource = new EventSource(`/api/crawler?${params}`);

      setCurrentEventSource(eventSource);

      // Connection opened
      eventSource.onopen = () => {
        setConnectionStatus('connected');
        setCrawlerState('running');
        addActivity('connection', 'Connected to crawler', 'success');
      };

      eventSource.onmessage = (event) => {
        try {
          hasReceivedData = true;
          const data = JSON.parse(event.data);

          // Handle different event types
          switch (data.type) {
            case 'start':
              setCrawlerStatus(`Starting crawl of ${data.total_sources} sources...`);
              setCrawlerProgress({ current: 0, total: data.total_sources, percentage: 0 });
              setCrawlerState('running');
              addActivity('start', `Starting crawl of ${data.total_sources} sources`, 'info');
              break;

            case 'source_start':
              setCurrentSource(data.source_name);
              setCurrentStage('crawling');
              setCrawlerStatus(`Crawling ${data.source_name}...`);
              addActivity('source', `Started crawling ${data.source_name}`, 'info');
              break;

            case 'batch_crawled':
              setCurrentStage('crawling');
              setCrawlerStatus(`${data.source_name}: Crawled ${data.pages_crawled} pages`);
              addActivity('batch', `Crawled ${data.pages_crawled} pages from ${data.source_name}`, 'info');
              break;

            case 'extraction_progress':
              setCurrentStage('extracting');
              setCrawlerStatus(`${data.source_name}: Extracting page ${data.page_index}/${data.total_pages} (${data.booths_extracted_so_far} booths found)`);
              if (data.page_index === 1 || data.page_index % 5 === 0) {
                addActivity('extract', `Extracting page ${data.page_index}/${data.total_pages} - ${data.booths_extracted_so_far} booths found`, 'info');
              }
              break;

            case 'batch_complete':
              setCurrentStage('saving');
              setCrawlerStatus(`${data.source_name}: Batch ${data.batch_number} complete - ${data.booths_so_far} total booths`);
              totalBooths = data.booths_so_far;
              setCurrentBoothCount(data.booths_so_far);
              addActivity('batch', `Batch ${data.batch_number} complete - ${data.booths_so_far} total booths`, 'success');
              break;

            case 'source_complete':
              completedSources++;
              setCurrentBoothCount(data.booths_found || totalBooths);
              setCrawlerProgress(prev => ({
                current: completedSources,
                total: prev.total,
                percentage: prev.total > 0 ? Math.round((completedSources / prev.total) * 100) : 0
              }));
              setCurrentStage('');
              addActivity('source', `✓ ${data.source_name} complete: ${data.booths_found} booths`, 'success');
              toast.success(`${data.source_name} complete: ${data.booths_found} booths`);
              break;

            case 'batch_error':
            case 'source_error':
              setErrorCount(prev => prev + 1);
              setLastError(data.error);
              addActivity('error', `${data.source_name}: ${data.error}`, 'error');
              toast.error(`${data.source_name}: ${data.error}`);
              break;

            case 'complete':
              setCrawlerStatus('Crawler completed successfully');
              setCrawlerState('complete');
              setCurrentStage('');
              setCurrentSource('');
              setReconnectAttempt(0); // Reset reconnect counter on successful completion
              addActivity('complete', `Crawler complete! Found ${data.summary?.total_booths_found || totalBooths} booths`, 'success');
              toast.success(`Crawler complete! Found ${data.summary?.total_booths_found || totalBooths} booths`);
              if (eventSource) {
                eventSource.close();
                setCurrentEventSource(null);
              }
              setConnectionStatus('disconnected');

              // Reload data
              loadAdminData();
              loadCrawlerMetrics();
              loadCrawlerLogs();
              setCrawlerRunning(false);
              break;

            case 'error':
              setErrorCount(prev => prev + 1);
              setLastError(data.error || 'Crawler failed');
              addActivity('error', data.error || 'Crawler failed', 'error');
              throw new Error(data.error || 'Crawler failed');
          }
        } catch (parseError) {
          console.error('Error parsing event:', parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        if (eventSource) eventSource.close();
        setConnectionStatus('error');
        setCrawlerState('error');
        setCurrentStage('');

        // Provide helpful error message based on what happened
        if (!hasReceivedData) {
          setCrawlerStatus('Failed to connect to crawler');
          setLastError('Failed to connect to crawler. Please check your network connection.');
          addActivity('error', 'Failed to connect to crawler', 'error');

          // Attempt auto-reconnect for connection failures
          attemptReconnect(sourceName, totalBooths, completedSources);
        } else if (totalBooths > 0 || completedSources > 0) {
          setCrawlerStatus(`Crawler stopped (${completedSources} sources completed, ${totalBooths} booths found before disconnect)`);
          setLastError(`Connection lost after processing ${completedSources} sources`);
          addActivity('error', `Connection lost after processing ${completedSources} sources and finding ${totalBooths} booths`, 'warning');

          // Still reload data to show what was completed
          setTimeout(() => {
            loadAdminData();
            loadCrawlerMetrics();
            loadCrawlerLogs();
          }, 1000);

          // Attempt auto-reconnect to continue crawling
          attemptReconnect(sourceName, totalBooths, completedSources);
        } else {
          setCrawlerStatus('Connection error during crawl');
          setLastError('Lost connection to crawler. No data was received.');
          addActivity('error', 'Lost connection to crawler. No data was received.', 'error');

          // Attempt auto-reconnect
          attemptReconnect(sourceName, totalBooths, completedSources);
        }
      };

      // Timeout after 10 minutes
      const timeoutId = setTimeout(() => {
        if (crawlerRunning && eventSource) {
          eventSource.close();
          if (totalBooths > 0 || completedSources > 0) {
            setCrawlerStatus(`Crawler timeout (${completedSources} sources completed, ${totalBooths} booths found)`);
            toast.warning(`Crawler timed out after 10 minutes. ${completedSources} sources completed with ${totalBooths} booths found.`, {
              duration: 10000,
            });
            // Reload data to show what was completed
            loadAdminData();
            loadCrawlerMetrics();
            loadCrawlerLogs();
          } else {
            setCrawlerStatus('Crawler timed out');
            toast.error('Crawler timed out after 10 minutes with no results.');
          }
          setCrawlerRunning(false);
        }
      }, 600000);

      // Store timeout ID to clear it if crawl completes normally
      if (eventSource) {
        (eventSource as ExtendedEventSource).timeoutId = timeoutId;
      }

    } catch (error) {
      console.error('Crawler error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setCrawlerStatus('Error: ' + errorMessage);
      setCrawlerState('error');
      setConnectionStatus('error');
      setLastError(errorMessage);
      setErrorCount(prev => prev + 1);
      addActivity('error', 'Crawler failed: ' + errorMessage, 'error');
      toast.error('Crawler failed: ' + errorMessage);
      setCrawlerRunning(false);
      if (eventSource) eventSource.close();
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
