'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Zap, Database, Code } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PerformanceMetrics {
  source_name: string;
  total_duration_ms: number;
  api_call_duration_ms: number;
  extraction_duration_ms: number;
  database_duration_ms: number;
  pages_crawled: number;
  booths_extracted: number;
  completed_at: string;
}

interface PhaseBreakdown {
  api_calls: { duration: number; percentage: number };
  extraction: { duration: number; percentage: number };
  database: { duration: number; percentage: number };
  other: { duration: number; percentage: number };
}

export const CrawlPerformanceBreakdown = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [sources, setSources] = useState<string[]>([]);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('crawler_metrics')
        .select('*')
        .eq('status', 'success')
        .order('completed_at', { ascending: false })
        .limit(20);

      if (selectedSource !== 'all') {
        query = query.eq('source_name', selectedSource);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const formattedData: PerformanceMetrics[] = data.map((m) => {
          const metric = m as Record<string, unknown>;
          return {
            source_name: metric.source_name as string,
            total_duration_ms: (metric.duration_ms as number) || 0,
            api_call_duration_ms: (metric.api_call_duration_ms as number) || 0,
            extraction_duration_ms: (metric.extraction_duration_ms as number) || 0,
            database_duration_ms: Math.max(
              0,
              ((metric.duration_ms as number) || 0) -
                ((metric.api_call_duration_ms as number) || 0) -
                ((metric.extraction_duration_ms as number) || 0)
            ),
            pages_crawled: (metric.pages_crawled as number) || 0,
            booths_extracted: (metric.booths_extracted as number) || 0,
            completed_at: (metric.completed_at as string) || '',
          };
        });

        setMetrics(formattedData);

        // Extract unique sources
        const uniqueSources = Array.from(
          new Set(data.map((m: Record<string, unknown>) => m.source_name))
        ).filter(Boolean) as string[];
        setSources(uniqueSources);
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSource]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const calculateAverages = (): PhaseBreakdown | null => {
    if (metrics.length === 0) return null;

    const totals = metrics.reduce(
      (acc, m) => ({
        total: acc.total + m.total_duration_ms,
        api: acc.api + m.api_call_duration_ms,
        extraction: acc.extraction + m.extraction_duration_ms,
        database: acc.database + m.database_duration_ms,
      }),
      { total: 0, api: 0, extraction: 0, database: 0 }
    );

    const avgTotal = totals.total / metrics.length;
    const avgApi = totals.api / metrics.length;
    const avgExtraction = totals.extraction / metrics.length;
    const avgDatabase = totals.database / metrics.length;
    const avgOther = avgTotal - avgApi - avgExtraction - avgDatabase;

    return {
      api_calls: {
        duration: avgApi,
        percentage: (avgApi / avgTotal) * 100,
      },
      extraction: {
        duration: avgExtraction,
        percentage: (avgExtraction / avgTotal) * 100,
      },
      database: {
        duration: avgDatabase,
        percentage: (avgDatabase / avgTotal) * 100,
      },
      other: {
        duration: avgOther,
        percentage: (avgOther / avgTotal) * 100,
      },
    };
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const calculateEfficiency = () => {
    if (metrics.length === 0) return null;

    const totalPages = metrics.reduce((sum, m) => sum + m.pages_crawled, 0);
    const totalBooths = metrics.reduce((sum, m) => sum + m.booths_extracted, 0);
    const totalTime = metrics.reduce((sum, m) => sum + m.total_duration_ms, 0);

    return {
      avgTimePerPage: totalTime / totalPages,
      avgTimePerBooth: totalTime / totalBooths,
      avgBoothsPerPage: totalBooths / totalPages,
      totalPages,
      totalBooths,
    };
  };

  const breakdown = calculateAverages();
  const efficiency = calculateEfficiency();

  if (loading) {
    return (
      <Card className="bg-neutral-800 border-neutral-700">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!breakdown || !efficiency) {
    return (
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white">Performance Breakdown</CardTitle>
          <CardDescription>No performance data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Crawl Performance Breakdown</CardTitle>
              <CardDescription>
                Analysis of {metrics.length} recent successful crawls
              </CardDescription>
            </div>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-[200px] bg-neutral-900 border-neutral-700 text-white">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-700">
                <SelectItem value="all" className="text-white">
                  All Sources
                </SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source} value={source} className="text-white">
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Phase Breakdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">Time Distribution (Average)</h3>

            {/* Visual Progress Bars */}
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-white">API Calls</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-400">
                      {formatDuration(breakdown.api_calls.duration)}
                    </span>
                    <Badge variant="outline" className="border-neutral-600 text-neutral-300">
                      {breakdown.api_calls.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="h-3 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all duration-300"
                    style={{ width: `${breakdown.api_calls.percentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-blue-500" />
                    <span className="text-white">AI Extraction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-400">
                      {formatDuration(breakdown.extraction.duration)}
                    </span>
                    <Badge variant="outline" className="border-neutral-600 text-neutral-300">
                      {breakdown.extraction.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="h-3 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${breakdown.extraction.percentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-green-500" />
                    <span className="text-white">Database Operations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-400">
                      {formatDuration(breakdown.database.duration)}
                    </span>
                    <Badge variant="outline" className="border-neutral-600 text-neutral-300">
                      {breakdown.database.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="h-3 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${breakdown.database.percentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span className="text-white">Other (Dedup, Validation)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-400">
                      {formatDuration(breakdown.other.duration)}
                    </span>
                    <Badge variant="outline" className="border-neutral-600 text-neutral-300">
                      {breakdown.other.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="h-3 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${breakdown.other.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Efficiency Metrics */}
          <div className="border-t border-neutral-700 pt-6">
            <h3 className="text-sm font-medium mb-4 text-white">Efficiency Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-neutral-400">Avg Time / Page</p>
                <p className="text-2xl font-bold font-mono text-white">
                  {formatDuration(efficiency.avgTimePerPage)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-400">Avg Time / Booth</p>
                <p className="text-2xl font-bold font-mono text-white">
                  {formatDuration(efficiency.avgTimePerBooth)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-400">Booths / Page</p>
                <p className="text-2xl font-bold font-mono text-white">
                  {efficiency.avgBoothsPerPage.toFixed(1)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-400">Total Pages</p>
                <p className="text-2xl font-bold font-mono text-white">
                  {efficiency.totalPages}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-400">Total Booths</p>
                <p className="text-2xl font-bold font-mono text-white">
                  {efficiency.totalBooths}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-400">Sample Size</p>
                <p className="text-2xl font-bold font-mono text-white">
                  {metrics.length}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Crawls */}
          <div className="border-t border-neutral-700 pt-6">
            <h3 className="text-sm font-medium mb-4 text-white">Recent Crawls</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {metrics.slice(0, 10).map((metric, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg text-sm"
                >
                  <div className="space-y-1 flex-1">
                    <p className="font-medium text-white">{metric.source_name}</p>
                    <p className="text-xs text-neutral-400">
                      {metric.pages_crawled} pages • {metric.booths_extracted} booths
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-mono font-medium text-white">
                      {formatDuration(metric.total_duration_ms)}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {new Date(metric.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white">Performance Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {breakdown.api_calls.percentage > 50 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-neutral-200">
                <span className="font-medium text-yellow-400">High API Call Time:</span> API calls are taking{' '}
                {breakdown.api_calls.percentage.toFixed(0)}% of total time. Consider implementing
                caching or batching requests.
              </p>
            </div>
          )}
          {breakdown.extraction.percentage > 40 && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-neutral-200">
                <span className="font-medium text-blue-400">AI Extraction Dominant:</span> Extraction is taking{' '}
                {breakdown.extraction.percentage.toFixed(0)}% of time. This is expected for AI-powered
                crawls but consider using faster models for simpler content.
              </p>
            </div>
          )}
          {efficiency.avgBoothsPerPage < 2 && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-sm text-neutral-200">
                <span className="font-medium text-orange-400">Low Yield:</span> Only{' '}
                {efficiency.avgBoothsPerPage.toFixed(1)} booths per page on average. Consider targeting
                more booth-dense sources.
              </p>
            </div>
          )}
          {breakdown.database.percentage > 30 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-neutral-200">
                <span className="font-medium text-red-400">Database Bottleneck:</span> Database operations are
                taking {breakdown.database.percentage.toFixed(0)}% of time. Consider optimizing queries
                or implementing bulk inserts.
              </p>
            </div>
          )}
          {breakdown.api_calls.percentage <= 50 &&
            breakdown.extraction.percentage <= 40 &&
            efficiency.avgBoothsPerPage >= 2 &&
            breakdown.database.percentage <= 30 && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-neutral-200">
                  <span className="font-medium text-green-400">Optimal Performance:</span> All metrics are
                  within healthy ranges. The crawler is operating efficiently.
                </p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};
