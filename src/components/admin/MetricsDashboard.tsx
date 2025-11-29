'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Database,
  Image,
  MapPin,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface DashboardMetrics {
  // Booth metrics
  totalBooths: number;
  boothsAddedToday: number;
  boothsAddedThisWeek: number;
  boothsAddedThisMonth: number;
  averageCompleteness: number;
  boothsWithPhotos: number;
  boothsWithPhotosPercentage: number;
  boothsWithCoordinates: number;
  boothsWithCoordinatesPercentage: number;
  activeBooths: number;
  inactiveBooths: number;

  // Crawler performance
  crawlerSuccessRate: number;
  averageCrawlDuration: number;
  failedSources: Array<{
    source_name: string;
    last_error_message: string;
    last_error_timestamp: string;
  }>;
  sourcePerformance: Array<{
    source_name: string;
    success_rate: number;
    avg_duration: number;
    last_crawl: string;
  }>;

  // Data quality
  missingRequiredFields: number;
  duplicatesDetected: number;
  lowCompletenessBooths: number;

  // Trends
  boothsByDay: Array<{ date: string; count: number }>;
  crawlMetricsByDay: Array<{ date: string; booths_extracted: number; duration: number }>;
}

const _COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch all booth data
      const { data: allBooths, error: boothsError } = await supabase
        .from('booths')
        .select('*');

      if (boothsError) {
        console.error('Error fetching booths:', boothsError);
        throw boothsError;
      }

      const booths = (allBooths as Array<Record<string, unknown>>) || [];
      const totalBooths = booths.length;

      // Calculate booth metrics
      const boothsAddedToday = booths.filter(
        (b) => new Date(b.created_at as string) >= todayStart
      ).length || 0;

      const boothsAddedThisWeek = booths.filter(
        (b) => new Date(b.created_at as string) >= weekStart
      ).length || 0;

      const boothsAddedThisMonth = booths.filter(
        (b) => new Date(b.created_at as string) >= monthStart
      ).length || 0;

      const boothsWithPhotos = booths.filter(
        (b) => b.photo_exterior_url || b.photo_interior_url
      ).length || 0;

      const boothsWithCoordinates = booths.filter(
        (b) => b.latitude && b.longitude
      ).length || 0;

      const activeBooths = booths.filter((b) => b.status === 'active').length || 0;
      const inactiveBooths = totalBooths - activeBooths;

      // Calculate completeness score (0-100)
      const calculateCompleteness = (booth: Record<string, unknown>): number => {
        let score = 0;
        const fields = [
          'name',
          'address',
          'city',
          'country',
          'latitude',
          'longitude',
          'photo_exterior_url',
          'description',
          'hours',
          'cost',
          'machine_model',
        ];
        fields.forEach((field) => {
          if (booth[field]) score += 100 / fields.length;
        });
        return score;
      };

      const completenessScores = booths.map(calculateCompleteness) || [];
      const averageCompleteness =
        completenessScores.reduce((sum, score) => sum + score, 0) /
          (completenessScores.length || 1);

      const lowCompletenessBooths = completenessScores.filter((score) => score < 50).length;

      // Missing required fields (name, address, city, country)
      const missingRequiredFields = booths.filter(
        (b) => !b.name || !b.address || !b.city || !b.country
      ).length || 0;

      // Detect potential duplicates (same name and city)
      const duplicatesMap = new Map<string, number>();
      booths.forEach((b) => {
        const key = `${b.name}-${b.city}`.toLowerCase();
        duplicatesMap.set(key, (duplicatesMap.get(key) || 0) + 1);
      });
      const duplicatesDetected = Array.from(duplicatesMap.values()).filter(
        (count) => count > 1
      ).length;

      // Fetch crawler metrics for last 7 days
      const { data: crawlerMetrics, error: metricsError } = await supabase
        .from('crawler_metrics')
        .select('*')
        .gte('started_at', last7Days.toISOString())
        .order('started_at', { ascending: false });

      if (metricsError) {
        console.error('Error fetching crawler metrics:', metricsError);
        // Don't throw - continue with empty metrics
      }

      const metrics = (metricsError ? [] : crawlerMetrics as Array<Record<string, unknown>>) || [];
      const successfulCrawls = metrics.filter(
        (m) => m.status === 'success'
      ).length || 0;
      const totalCrawls = metrics.length || 0;
      const crawlerSuccessRate = totalCrawls > 0 ? (successfulCrawls / totalCrawls) * 100 : 0;

      const durations = metrics
        .filter((m) => m.duration_ms)
        .map((m) => m.duration_ms as number);
      const averageCrawlDuration =
        durations && durations.length > 0
          ? durations.reduce((sum, d) => (sum as number) + (d as number), 0) / durations.length / 1000
          : 0;

      // Fetch crawl sources for performance data
      const { data: crawlSources, error: sourcesError } = await supabase
        .from('crawl_sources')
        .select('*')
        .order('priority', { ascending: false });

      if (sourcesError) {
        console.error('Error fetching crawl sources:', sourcesError);
        // Don't throw - continue with empty sources
      }

      const sources = (sourcesError ? [] : crawlSources as Array<Record<string, unknown>>) || [];
      const failedSources = sources
        .filter((s) => s.status === 'error' && s.last_error_message)
        .map((s) => ({
          source_name: s.source_name as string,
          last_error_message: s.last_error_message as string,
          last_error_timestamp: s.last_error_timestamp as string,
        })) || [];

      // Calculate source performance (last 7 days)
      const sourcePerformance = await Promise.all(
        sources.slice(0, 10).map(async (source) => {
          const { data: sourceMetrics } = await supabase
            .from('crawler_metrics')
            .select('*')
            .eq('source_name', source.source_name as string)
            .gte('started_at', last7Days.toISOString());

          const sourceMetricsArray = (sourceMetrics as Array<Record<string, unknown>>) || [];
          const total = sourceMetricsArray.length || 0;
          const successful = sourceMetricsArray.filter((m) => m.status === 'success').length || 0;
          const success_rate = total > 0 ? (successful / total) * 100 : 0;

          const avgDuration =
            sourceMetricsArray && sourceMetricsArray.length > 0
              ? sourceMetricsArray.reduce((sum, m) => (sum as number) + ((m.duration_ms as number) || 0), 0) /
                sourceMetricsArray.length /
                1000
              : 0;

          return {
            source_name: source.source_name as string,
            success_rate,
            avg_duration: avgDuration,
            last_crawl: (source.last_crawl_timestamp as string) || 'Never',
          };
        }) || []
      );

      // Fetch booths by day (last 30 days)
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const { data: recentBooths } = await supabase
        .from('booths')
        .select('created_at')
        .gte('created_at', last30Days.toISOString());

      const recentBoothsArray = (recentBooths as Array<{ created_at: string }>) || [];
      const boothsByDayMap = new Map<string, number>();
      for (let i = 0; i < 30; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        boothsByDayMap.set(dateStr, 0);
      }

      recentBoothsArray.forEach((booth) => {
        const dateStr = booth.created_at.split('T')[0];
        boothsByDayMap.set(dateStr, (boothsByDayMap.get(dateStr) || 0) + 1);
      });

      const boothsByDay = Array.from(boothsByDayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .reverse();

      // Crawl metrics by day (last 7 days)
      const crawlMetricsByDayMap = new Map<string, { booths: number; duration: number; count: number }>();
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        crawlMetricsByDayMap.set(dateStr, { booths: 0, duration: 0, count: 0 });
      }

      metrics.forEach((metric) => {
        const dateStr = (metric.started_at as string).split('T')[0];
        const current = crawlMetricsByDayMap.get(dateStr);
        if (current) {
          current.booths += (metric.booths_extracted as number) || 0;
          current.duration += (metric.duration_ms as number) || 0;
          current.count += 1;
          crawlMetricsByDayMap.set(dateStr, current);
        }
      });

      const crawlMetricsByDay = Array.from(crawlMetricsByDayMap.entries())
        .map(([date, data]) => ({
          date,
          booths_extracted: data.booths,
          duration: data.count > 0 ? data.duration / data.count / 1000 : 0,
        }))
        .reverse();

      setMetrics({
        totalBooths,
        boothsAddedToday,
        boothsAddedThisWeek,
        boothsAddedThisMonth,
        averageCompleteness,
        boothsWithPhotos,
        boothsWithPhotosPercentage: totalBooths > 0 ? (boothsWithPhotos / totalBooths) * 100 : 0,
        boothsWithCoordinates,
        boothsWithCoordinatesPercentage:
          totalBooths > 0 ? (boothsWithCoordinates / totalBooths) * 100 : 0,
        activeBooths,
        inactiveBooths,
        crawlerSuccessRate,
        averageCrawlDuration,
        failedSources: failedSources.slice(0, 5),
        sourcePerformance: sourcePerformance.slice(0, 10),
        missingRequiredFields,
        duplicatesDetected,
        lowCompletenessBooths,
        boothsByDay,
        crawlMetricsByDay,
      });

      setLastRefresh(new Date());
      setError(null);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 bg-neutral-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-neutral-800 border-neutral-700">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Error Loading Metrics</h3>
            <p className="text-sm text-neutral-400 mt-1">{error}</p>
            <p className="text-xs text-neutral-500 mt-2">
              Check browser console for details. Ensure you have admin access and the database tables exist.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="p-6 bg-neutral-800 border-neutral-700">
        <div className="flex items-center gap-3 text-neutral-400">
          <Database className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">No Metrics Available</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Metrics data could not be loaded. Try refreshing the page.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const statusData = [
    { name: 'Active', value: metrics.activeBooths, color: '#10b981' },
    { name: 'Inactive', value: metrics.inactiveBooths, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">
            Metrics Dashboard
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()} (auto-refresh every 30s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 text-neutral-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Badge variant="secondary" className="bg-green-900 text-green-100">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>
      </div>

      {/* Empty State Notice */}
      {metrics.totalBooths === 0 && (
        <Card className="p-6 bg-blue-950/20 border-blue-500/30">
          <div className="flex items-start gap-3">
            <Database className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-300 mb-1">No Booths in Database</h3>
              <p className="text-sm text-neutral-300 mb-2">
                Your database is currently empty. To populate it with booth data:
              </p>
              <ol className="text-sm text-neutral-400 space-y-1 ml-4 list-decimal">
                <li>Navigate to the &quot;Data Crawler&quot; tab</li>
                <li>Click &quot;Start Crawler&quot; to fetch booth data from configured sources</li>
                <li>Wait for the crawler to complete (this may take several minutes)</li>
                <li>Return here to view comprehensive metrics</li>
              </ol>
            </div>
          </div>
        </Card>
      )}

      {/* Booth Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Booths */}
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-8 h-8 text-primary" />
          </div>
          <div className="text-3xl font-bold text-white">{metrics.totalBooths}</div>
          <div className="text-sm text-neutral-400">Total Booths</div>
        </Card>

        {/* Booths Added Today */}
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <Badge variant="secondary" className="bg-green-900 text-green-100">
              +{metrics.boothsAddedToday}
            </Badge>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.boothsAddedThisWeek}</div>
          <div className="text-sm text-neutral-400">Added This Week</div>
          <div className="text-xs text-neutral-500 mt-1">
            {metrics.boothsAddedThisMonth} this month
          </div>
        </Card>

        {/* Average Completeness */}
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 text-blue-400" />
            <Badge
              variant="secondary"
              className={
                metrics.averageCompleteness >= 70
                  ? 'bg-green-900 text-green-100'
                  : metrics.averageCompleteness >= 50
                  ? 'bg-yellow-900 text-yellow-100'
                  : 'bg-red-900 text-red-100'
              }
            >
              {metrics.averageCompleteness.toFixed(0)}%
            </Badge>
          </div>
          <div className="text-3xl font-bold text-white">
            {metrics.averageCompleteness.toFixed(1)}%
          </div>
          <div className="text-sm text-neutral-400">Avg Completeness</div>
          <div className="text-xs text-neutral-500 mt-1">
            {metrics.lowCompletenessBooths} below 50%
          </div>
        </Card>

        {/* Booths with Photos */}
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <Image className="w-8 h-8 text-purple-400" aria-label="Photos icon" />
            <Badge variant="secondary" className="bg-purple-900 text-purple-100">
              {metrics.boothsWithPhotosPercentage.toFixed(0)}%
            </Badge>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.boothsWithPhotos}</div>
          <div className="text-sm text-neutral-400">With Photos</div>
        </Card>

        {/* Booths with Coordinates */}
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <MapPin className="w-8 h-8 text-accent" />
            <Badge variant="secondary" className="bg-accent/20 text-accent">
              {metrics.boothsWithCoordinatesPercentage.toFixed(0)}%
            </Badge>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.boothsWithCoordinates}</div>
          <div className="text-sm text-neutral-400">With Coordinates</div>
        </Card>

        {/* Active vs Inactive */}
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <Badge variant="secondary" className="bg-green-900 text-green-100">
              {((metrics.activeBooths / metrics.totalBooths) * 100).toFixed(0)}%
            </Badge>
          </div>
          <div className="text-3xl font-bold text-white">{metrics.activeBooths}</div>
          <div className="text-sm text-neutral-400">Active Booths</div>
          <div className="text-xs text-neutral-500 mt-1">
            {metrics.inactiveBooths} inactive
          </div>
        </Card>

        {/* Crawler Success Rate */}
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-8 h-8 text-yellow-400" />
            <Badge
              variant="secondary"
              className={
                metrics.crawlerSuccessRate >= 90
                  ? 'bg-green-900 text-green-100'
                  : metrics.crawlerSuccessRate >= 70
                  ? 'bg-yellow-900 text-yellow-100'
                  : 'bg-red-900 text-red-100'
              }
            >
              {metrics.crawlerSuccessRate.toFixed(0)}%
            </Badge>
          </div>
          <div className="text-3xl font-bold text-white">
            {metrics.crawlerSuccessRate.toFixed(1)}%
          </div>
          <div className="text-sm text-neutral-400">Crawler Success (7d)</div>
        </Card>

        {/* Average Crawl Duration */}
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {metrics.averageCrawlDuration.toFixed(1)}s
          </div>
          <div className="text-sm text-neutral-400">Avg Crawl Time</div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booths Added Over Time */}
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <h3 className="font-semibold text-white mb-4">Booths Added (Last 30 Days)</h3>
          {metrics.boothsByDay.length === 0 || metrics.boothsByDay.every(d => d.count === 0) ? (
            <div className="flex items-center justify-center h-[250px] text-neutral-500">
              <div className="text-center">
                <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No booths added in the last 30 days</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metrics.boothsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Active vs Inactive Pie Chart */}
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <h3 className="font-semibold text-white mb-4">Booth Status Distribution</h3>
          {metrics.totalBooths === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-neutral-500">
              <div className="text-center">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No booths in database</p>
                <p className="text-xs mt-1">Start the crawler to add booths</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) =>
                    `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Crawler Performance */}
      <Card className="p-6 bg-neutral-800 border-neutral-700">
        <h3 className="font-semibold text-white mb-4">
          Crawler Performance by Source (Last 7 Days)
        </h3>
        {metrics.sourcePerformance.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-neutral-500">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No crawler activity in the last 7 days</p>
              <p className="text-xs mt-1">Run the crawler to see performance metrics</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.sourcePerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="source_name" stroke="#9ca3af" fontSize={12} angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey="success_rate" fill="#10b981" name="Success Rate (%)" />
              <Bar dataKey="avg_duration" fill="#3b82f6" name="Avg Duration (s)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Data Quality Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Missing Required Fields */}
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Missing Required Fields</h3>
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="text-4xl font-bold text-red-400 mb-2">
            {metrics.missingRequiredFields}
          </div>
          <p className="text-sm text-neutral-400">
            Booths missing name, address, city, or country
          </p>
        </Card>

        {/* Duplicates Detected */}
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Potential Duplicates</h3>
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="text-4xl font-bold text-yellow-400 mb-2">
            {metrics.duplicatesDetected}
          </div>
          <p className="text-sm text-neutral-400">
            Booths with identical name and city
          </p>
        </Card>

        {/* Low Completeness */}
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Low Completeness</h3>
            <TrendingDown className="w-6 h-6 text-orange-400" />
          </div>
          <div className="text-4xl font-bold text-orange-400 mb-2">
            {metrics.lowCompletenessBooths}
          </div>
          <p className="text-sm text-neutral-400">
            Booths with completeness score below 50%
          </p>
        </Card>
      </div>

      {/* Failed Sources */}
      {metrics.failedSources.length > 0 && (
        <Card className="p-6 bg-neutral-800 border-neutral-700">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="font-semibold text-white">Failed Crawler Sources</h3>
          </div>
          <div className="space-y-3">
            {metrics.failedSources.map((source, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-red-950/20 border border-red-500/30 rounded-lg"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-red-300 mb-1">
                    {source.source_name}
                  </div>
                  <p className="text-sm text-red-200/80">{source.last_error_message}</p>
                  {source.last_error_timestamp && (
                    <p className="text-xs text-red-400/60 mt-1">
                      {new Date(source.last_error_timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
