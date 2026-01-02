'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { isUserAdmin } from '@/lib/adminAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, MessageSquare, CheckCircle, XCircle, Clock, Database, PlayCircle, PauseCircle, RefreshCw, Shield, Wifi, Activity, AlertCircle, Zap, Loader2, FileText, Heart, Recycle, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { MetricsDashboard } from '@/components/admin/MetricsDashboard';
import { CrawlPerformanceBreakdown } from '@/components/admin/CrawlPerformanceBreakdown';
import { LogViewer } from '@/components/LogViewer';
import { CrawlJobQueue } from '@/components/admin/CrawlJobQueue';
import { CrawlerHealthDashboard } from '@/components/admin/CrawlerHealthDashboard';
import { ReextractionQueue } from '@/components/admin/ReextractionQueue';
import { DatabaseStatusOverview } from '@/components/admin/DatabaseStatusOverview';

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
  const [_connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting'>('disconnected');
  const [currentSource, setCurrentSource] = useState<string>('');
  const [_currentStage, setCurrentStage] = useState<'crawling' | 'extracting' | 'validating' | 'saving' | ''>('');
  const [activityFeed, setActivityFeed] = useState<Array<{type: string, message: string, timestamp: Date, status: 'info' | 'success' | 'warning' | 'error'}>>([]);
  const [_crawlStartTime, setCrawlStartTime] = useState<Date | null>(null);
  const [_lastError, setLastError] = useState<string>('');
  const [errorCount, setErrorCount] = useState(0);
  const [_reconnectAttempt, _setReconnectAttempt] = useState(0);
  const [_reconnectTimeoutId, _setReconnectTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [_selectedSource, setSelectedSource] = useState<string>('');
  const stopRef = useRef(false);

  // UI state
  const [showSourcesList, setShowSourcesList] = useState(false);
  const [_showActivityFeed, setShowActivityFeed] = useState(false);
  const [showCrawlerDetails, setShowCrawlerDetails] = useState(false);

  // Discovery Engine environment variables state
  const [_envVarsStatus, setEnvVarsStatus] = useState<Record<string, boolean> | null>(null);
  const [envVarsLoading, setEnvVarsLoading] = useState(false);

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
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
      }

      const data = await response.json();

      setStats({
        totalBooths: data.booths.total,
        activeBooths: data.booths.active,
        pendingBooths: data.booths.pending,
        totalUsers: data.users.total,
        pendingPhotos: data.photos.pending,
        totalReviews: data.reviews.total,
      });

      setCrawlerMetrics({
        crawledToday: data.crawler.crawledToday,
        lastRun: data.crawler.lastRun,
        errorCount: data.crawler.errorCount,
      });

      const pendingPhotosData = await supabase
        .from('booth_user_photos')
        .select(`
          *,
          booth:booths(name, city, country)
        `)
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      setPendingPhotos(pendingPhotosData.data || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const moderatePhoto = async (photoId: string, status: 'approved' | 'rejected') => {
    toast.info('Photo moderation coming soon');
    console.log(`Would moderate photo ${photoId} with status ${status}`);
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
    setShowActivityFeed(true);

    let sourcesToRun = crawlSources.filter(s => s.enabled);
    if (sourceName) {
      sourcesToRun = sourcesToRun.filter(s => s.source_name === sourceName);
    } else {
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

    for (let i = 0; i < sourcesToRun.length; i++) {
      if (stopRef.current) {
        addActivity('stop', 'Crawler stopped by user', 'warning');
        break;
      }

      const source = sourcesToRun[i];
      setCurrentSource(source.source_name);
      setCrawlerStatus(`Processing ${source.source_name} (${i + 1}/${sourcesToRun.length})...`);
      addActivity('source', `Starting ${source.source_name}`, 'info');

      try {
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

      loadAdminData();
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
      <main className="min-h-screen bg-neutral-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-white mb-1">Admin Dashboard</h1>
            <p className="text-neutral-400 text-sm">What would you like to do?</p>
          </div>

          {/* Primary Actions - Simple and Clear */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Run Crawler */}
            <Card className="p-8 bg-neutral-800 border-neutral-700 hover:border-primary/50 transition-all">
              <div className="text-center">
                <Database className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="font-display text-xl font-semibold text-white mb-2">Run Crawler</h2>
                <p className="text-neutral-400 text-sm mb-6">
                  Discover new photo booths from configured sources
                </p>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => startCrawler()}
                  disabled={crawlerRunning}
                >
                  {crawlerRunning ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-5 h-5 mr-2" />
                      Start Crawler
                    </>
                  )}
                </Button>
                {crawlerRunning && (
                  <div className="mt-4 text-xs text-neutral-400">
                    {currentSource || 'Initializing...'}
                  </div>
                )}
              </div>
            </Card>

            {/* Enrich Data */}
            <Card className="p-8 bg-neutral-800 border-neutral-700 hover:border-purple-500/50 transition-all">
              <div className="text-center">
                <Zap className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h2 className="font-display text-xl font-semibold text-white mb-2">Enrich Data</h2>
                <p className="text-neutral-400 text-sm mb-6">
                  Add venue info, photos, and AI-generated content
                </p>
                <Link href="/admin/enrichment">
                  <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700">
                    <Zap className="w-5 h-5 mr-2" />
                    Open Enrichment
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Moderate Content */}
            <Card className={`p-8 border-2 transition-all ${
              stats.pendingPhotos > 0
                ? 'bg-amber-900/20 border-amber-500/50 hover:border-amber-400'
                : 'bg-neutral-800 border-neutral-700 hover:border-accent/50'
            }`}>
              <div className="text-center">
                <Eye className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h2 className="font-display text-xl font-semibold text-white mb-2">Moderate Content</h2>
                <p className="text-neutral-400 text-sm mb-6">
                  Review photos, manage users, and moderate content
                </p>
                <Link href="/admin/moderation">
                  <Button
                    size="lg"
                    className={`w-full ${stats.pendingPhotos > 0 ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    {stats.pendingPhotos > 0 ? `Review ${stats.pendingPhotos} Photos` : 'Open Moderation'}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Quick Stats Bar */}
          <Card className="p-4 bg-neutral-800 border-neutral-700 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalBooths}</div>
                <div className="text-xs text-neutral-400">Total Booths</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                <div className="text-xs text-neutral-400">Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{crawlerMetrics.crawledToday}</div>
                <div className="text-xs text-neutral-400">Crawled Today</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${stats.pendingPhotos > 0 ? 'text-amber-400' : 'text-white'}`}>
                  {stats.pendingPhotos}
                </div>
                <div className="text-xs text-neutral-400">Pending Review</div>
              </div>
            </div>
          </Card>

          {/* Tabs Navigation */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-neutral-800 border-neutral-700 mb-6">
              <TabsTrigger value="overview" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                <Activity className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="data" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                <Database className="w-4 h-4 mr-2" />
                Data Collection
              </TabsTrigger>
              <TabsTrigger value="moderation" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                <Eye className="w-4 h-4 mr-2" />
                Content Review
                {stats.pendingPhotos > 0 && (
                  <Badge className="ml-2 bg-amber-500 text-white">{stats.pendingPhotos}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="system" className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white">
                <Heart className="w-4 h-4 mr-2" />
                System
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Quick Actions */}
              <Card className="p-6 bg-neutral-800 border-neutral-700">
                <h2 className="font-display text-xl font-semibold mb-4 text-white">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Run Crawler */}
                  <Button
                    size="lg"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => startCrawler()}
                    disabled={crawlerRunning}
                  >
                    {crawlerRunning ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Crawler Running...</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-6 h-6" />
                        <span>Run Crawler</span>
                      </>
                    )}
                  </Button>

                  {/* Data Enrichment */}
                  <Link href="/admin/enrichment" className="block">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-24 w-full flex flex-col items-center justify-center gap-2"
                    >
                      <Zap className="w-6 h-6" />
                      <span>Enrich Data</span>
                    </Button>
                  </Link>

                  {/* Review Photos */}
                  <Button
                    size="lg"
                    variant={stats.pendingPhotos > 0 ? "default" : "outline"}
                    className={`h-24 flex flex-col items-center justify-center gap-2 ${
                      stats.pendingPhotos > 0 ? 'bg-amber-600 hover:bg-amber-700' : ''
                    }`}
                    onClick={() => {
                      const tabs = document.querySelector('[value="moderation"]') as HTMLElement;
                      tabs?.click();
                    }}
                  >
                    <Eye className="w-6 h-6" />
                    <span>Review Photos</span>
                    {stats.pendingPhotos > 0 && (
                      <Badge className="bg-white text-amber-900">{stats.pendingPhotos}</Badge>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Database Status */}
              <DatabaseStatusOverview />

              {/* System Health at a Glance */}
              <Card className="p-6 bg-neutral-800 border-neutral-700">
                <h2 className="font-display text-xl font-semibold mb-4 text-white">System Health</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-neutral-900 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Wifi className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-sm text-neutral-400">API Status</div>
                    <div className="text-lg font-bold text-green-400">Online</div>
                  </div>
                  <div className="text-center p-4 bg-neutral-900 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Database className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-sm text-neutral-400">Database</div>
                    <div className="text-lg font-bold text-blue-400">Healthy</div>
                  </div>
                  <div className="text-center p-4 bg-neutral-900 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Activity className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="text-sm text-neutral-400">Crawled Today</div>
                    <div className="text-lg font-bold text-purple-400">{crawlerMetrics.crawledToday}</div>
                  </div>
                  <div className="text-center p-4 bg-neutral-900 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <AlertCircle className={`w-6 h-6 ${crawlerMetrics.errorCount > 0 ? 'text-red-400' : 'text-green-400'}`} />
                    </div>
                    <div className="text-sm text-neutral-400">Errors Today</div>
                    <div className={`text-lg font-bold ${crawlerMetrics.errorCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {crawlerMetrics.errorCount}
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* DATA COLLECTION TAB */}
            <TabsContent value="data" className="mt-6 space-y-6">
              {/* Crawler Control - Simplified */}
              <Card className="p-6 bg-neutral-800 border-neutral-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-semibold text-white">Crawler Control</h2>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      loadAdminData();
                      loadCrawlerLogs();
                      toast.success('Refreshed');
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Compact Status Bar */}
                <div className={`flex items-center justify-between p-4 rounded-lg mb-4 ${
                  crawlerRunning ? 'bg-blue-900/30 border-2 border-blue-500' :
                  crawlerState === 'error' ? 'bg-red-900/30 border-2 border-red-500' :
                  'bg-neutral-900 border-2 border-neutral-700'
                }`}>
                  <div className="flex items-center gap-3">
                    {crawlerRunning ? (
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    ) : (
                      <Database className="w-8 h-8 text-neutral-400" />
                    )}
                    <div>
                      <div className="font-semibold text-white">
                        {crawlerRunning ? 'Crawler Running' : 'Crawler Idle'}
                      </div>
                      <div className="text-sm text-neutral-400">{crawlerStatus}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!crawlerRunning ? (
                      <Button onClick={() => startCrawler()}>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    ) : (
                      <Button variant="destructive" onClick={stopCrawler}>
                        <PauseCircle className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Bar - Only show when running */}
                {crawlerRunning && crawlerProgress.total > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-300">
                        {crawlerProgress.current} / {crawlerProgress.total} sources
                      </span>
                      <span className="text-xl font-bold text-white">{crawlerProgress.percentage}%</span>
                    </div>
                    <div className="w-full bg-neutral-900 rounded-full h-3">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${crawlerProgress.percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Stats Grid - Compact */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-3 bg-neutral-900 rounded">
                    <div className="text-2xl font-bold text-green-400">{currentBoothCount}</div>
                    <div className="text-xs text-neutral-400">Found</div>
                  </div>
                  <div className="text-center p-3 bg-neutral-900 rounded">
                    <div className="text-2xl font-bold text-white">{crawlerMetrics.crawledToday}</div>
                    <div className="text-xs text-neutral-400">Today</div>
                  </div>
                  <div className="text-center p-3 bg-neutral-900 rounded">
                    <div className="text-sm font-bold text-white">{crawlerMetrics.lastRun}</div>
                    <div className="text-xs text-neutral-400">Last Run</div>
                  </div>
                  <div className="text-center p-3 bg-neutral-900 rounded">
                    <div className="text-2xl font-bold text-red-400">{errorCount}</div>
                    <div className="text-xs text-neutral-400">Errors</div>
                  </div>
                </div>

                {/* Collapsible Details */}
                <button
                  onClick={() => setShowCrawlerDetails(!showCrawlerDetails)}
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  {showCrawlerDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span>Advanced Crawler Details</span>
                </button>

                {showCrawlerDetails && (
                  <div className="mt-4 space-y-4 pt-4 border-t border-neutral-700">
                    {/* Activity Feed */}
                    {activityFeed.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Live Activity Feed
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {activityFeed.slice(0, 10).map((activity, index) => (
                            <div
                              key={index}
                              className={`flex items-start gap-2 p-2 rounded text-xs ${
                                activity.status === 'error' ? 'bg-red-950/20 text-red-300' :
                                activity.status === 'warning' ? 'bg-yellow-950/20 text-yellow-300' :
                                activity.status === 'success' ? 'bg-green-950/20 text-green-300' :
                                'bg-blue-950/20 text-blue-300'
                              }`}
                            >
                              <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                activity.status === 'error' ? 'bg-red-400' :
                                activity.status === 'warning' ? 'bg-yellow-400' :
                                activity.status === 'success' ? 'bg-green-400' :
                                'bg-blue-400'
                              }`} />
                              <span className="flex-1">{activity.message}</span>
                              <span className="text-neutral-500">{activity.timestamp.toLocaleTimeString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Logs */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Recent Logs
                        </h3>
                        <select
                          value={logFilter}
                          onChange={(e) => setLogFilter(e.target.value as 'all' | 'info' | 'warning' | 'error')}
                          className="px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-white text-xs"
                        >
                          <option value="all">All</option>
                          <option value="info">Info</option>
                          <option value="warning">Warnings</option>
                          <option value="error">Errors</option>
                        </select>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {crawlerLogs.filter(log => logFilter === 'all' || log.operation_status === logFilter).slice(0, 5).map((log, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-neutral-900 rounded text-xs">
                            <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              log.operation_status === 'error' ? 'bg-red-400' :
                              log.operation_status === 'warning' ? 'bg-yellow-400' :
                              'bg-green-400'
                            }`} />
                            <span className="flex-1 text-neutral-300">{String(log.message)}</span>
                            <span className="text-neutral-500">{new Date(log.timestamp as string).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Sources List - Collapsible */}
              <Card className="p-6 bg-neutral-800 border-neutral-700">
                <button
                  onClick={() => setShowSourcesList(!showSourcesList)}
                  className="flex items-center justify-between w-full mb-4"
                >
                  <h2 className="font-display text-xl font-semibold text-white flex items-center gap-2">
                    {showSourcesList ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    Crawl Sources ({crawlSources.length})
                  </h2>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); loadCrawlSources(); }}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </button>

                {showSourcesList && (
                  <div className="space-y-2">
                    {crawlSources.map((source) => (
                      <div key={source.id} className="flex items-center gap-3 p-3 bg-neutral-900 rounded hover:bg-neutral-850 transition">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white truncate">{source.source_name}</span>
                            <Badge
                              variant="secondary"
                              className={(source.enabled as boolean) ? 'bg-green-900 text-green-100' : 'bg-gray-700 text-gray-300'}
                            >
                              {(source.enabled as boolean) ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <p className="text-xs text-neutral-400 truncate">{source.source_url as string}</p>
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
                          <PlayCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Data Enrichment Card */}
              <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Zap className="w-8 h-8 text-purple-400" />
                      <div>
                        <h2 className="font-display text-xl font-semibold text-white">Data Enrichment</h2>
                        <p className="text-purple-300 text-sm">Enhance booth data with Google Places & AI</p>
                      </div>
                    </div>
                    <p className="text-neutral-300 text-sm mb-4">
                      Automatically enrich booth data with venue information and generate AI images. Target: 80% data quality.
                    </p>
                    <Link href="/admin/enrichment">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Zap className="w-4 h-4 mr-2" />
                        Open Enrichment Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              {/* Discovery Engine */}
              <Card className="p-6 bg-neutral-800 border-neutral-700">
                <h2 className="font-display text-xl font-semibold mb-4 text-white">Discovery Engine (Firecrawl + Claude)</h2>
                <div className="space-y-4">
                  <div className="bg-blue-950/30 border border-blue-500/50 rounded-lg p-4">
                    <p className="text-sm text-blue-200 mb-2">
                      AI-powered booth discovery using Firecrawl and Claude Opus. Searches Reddit, blogs, and social media.
                    </p>
                    <p className="text-xs text-blue-300">
                      <strong>Note:</strong> Run these commands from your terminal with environment variables set.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={checkEnvironmentVariables}
                      disabled={envVarsLoading}
                      variant="outline"
                    >
                      {envVarsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                      Check Environment Variables
                    </Button>
                  </div>

                  <div className="bg-neutral-950 rounded p-3 border border-neutral-800">
                    <code className="text-sm text-green-400">npx tsx scripts/seed-master-plan.ts</code>
                  </div>
                  <div className="bg-neutral-950 rounded p-3 border border-neutral-800">
                    <code className="text-sm text-green-400">npx tsx scripts/run-discovery.ts</code>
                  </div>
                </div>
              </Card>

              <MetricsDashboard />
            </TabsContent>

            {/* MODERATION TAB */}
            <TabsContent value="moderation" className="mt-6 space-y-6">
              {/* Photo Moderation */}
              <Card className="p-6 bg-neutral-800 border-neutral-700">
                <h2 className="font-display text-xl font-semibold mb-4 text-white">Pending Photos ({stats.pendingPhotos})</h2>
                {pendingPhotos.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-neutral-400">All caught up! No photos pending review.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingPhotos.map((photo) => (
                      <div key={photo.id} className="border border-neutral-700 rounded-lg overflow-hidden bg-neutral-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.photo_url as string}
                          alt={(photo.caption as string) || 'User photo'}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="p-4">
                          <p className="font-medium mb-1 text-white text-sm">{(photo.booth as { name?: string })?.name}</p>
                          <p className="text-xs text-neutral-400 mb-3">
                            {(photo.booth as { city?: string })?.city}, {(photo.booth as { country?: string })?.country}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => moderatePhoto(photo.id, 'approved')}
                              className="flex-1"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => moderatePhoto(photo.id, 'rejected')}
                              className="flex-1"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
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
                <h2 className="font-display text-xl font-semibold mb-4 text-white">User Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-neutral-900 rounded-lg">
                    <Users className="w-6 h-6 text-blue-400 mb-2" />
                    <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                    <div className="text-sm text-neutral-400">Total Users</div>
                  </div>
                  <div className="p-4 bg-neutral-900 rounded-lg">
                    <Shield className="w-6 h-6 text-purple-400 mb-2" />
                    <div className="text-2xl font-bold text-white">-</div>
                    <div className="text-sm text-neutral-400">Admin Users</div>
                  </div>
                  <div className="p-4 bg-neutral-900 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-green-400 mb-2" />
                    <div className="text-2xl font-bold text-white">{stats.totalReviews}</div>
                    <div className="text-sm text-neutral-400">User Reviews</div>
                  </div>
                </div>
                <div className="text-center py-8 bg-neutral-900 rounded-lg">
                  <Shield className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm">Admin management coming soon</p>
                </div>
              </Card>
            </TabsContent>

            {/* SYSTEM TAB */}
            <TabsContent value="system" className="mt-6 space-y-6">
              <Tabs defaultValue="health" className="w-full">
                <TabsList className="bg-neutral-800 border-neutral-700">
                  <TabsTrigger value="health"><Heart className="w-4 h-4 mr-2" />Health</TabsTrigger>
                  <TabsTrigger value="logs"><FileText className="w-4 h-4 mr-2" />Logs</TabsTrigger>
                  <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-2" />Analytics</TabsTrigger>
                  <TabsTrigger value="performance"><Zap className="w-4 h-4 mr-2" />Performance</TabsTrigger>
                  <TabsTrigger value="queue"><Clock className="w-4 h-4 mr-2" />Queue</TabsTrigger>
                  <TabsTrigger value="reextraction"><Recycle className="w-4 h-4 mr-2" />Re-extraction</TabsTrigger>
                </TabsList>

                <TabsContent value="health" className="mt-6">
                  <CrawlerHealthDashboard />
                </TabsContent>

                <TabsContent value="logs" className="mt-6">
                  <LogViewer initialLimit={50} />
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                  <Card className="p-6 bg-neutral-800 border-neutral-700">
                    <h2 className="font-display text-2xl font-semibold mb-6 text-white">Platform Analytics</h2>
                    <div className="text-center py-12">
                      <BarChart3 className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                      <p className="text-neutral-400">Analytics dashboard coming soon</p>
                    </div>
                  </Card>
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
