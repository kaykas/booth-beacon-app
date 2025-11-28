'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle2, Clock, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface HealthStats {
  source_id: string;
  source_name: string;
  enabled: boolean;
  total_runs: number;
  success_count: number;
  error_count: number;
  timeout_count: number;
  avg_duration_ms: number;
  avg_api_duration_ms: number;
  last_run_at: string | null;
  success_rate_percent: number;
}

export const CrawlerHealthDashboard = () => {
  const [healthStats, setHealthStats] = useState<HealthStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealthStats = async () => {
    try {
      const { data, error } = await supabase
        .from('crawler_health_stats')
        .select('*')
        .order('success_rate_percent', { ascending: true });

      if (error) {
        console.error('Error fetching health stats:', error);
        toast.error('Failed to load crawler health stats');
        throw error;
      }

      setHealthStats(data || []);
    } catch (error) {
      console.error('Error fetching health stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (rate: number) => {
    if (rate >= 90) return 'text-green-400';
    if (rate >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthIcon = (rate: number) => {
    if (rate >= 90) return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (rate >= 70) return <Clock className="w-4 h-4 text-yellow-400" />;
    return <AlertCircle className="w-4 h-4 text-red-400" />;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getTotalStats = () => {
    const totals = healthStats.reduce((acc, stat) => ({
      total_runs: acc.total_runs + stat.total_runs,
      success_count: acc.success_count + stat.success_count,
      error_count: acc.error_count + stat.error_count,
      timeout_count: acc.timeout_count + stat.timeout_count,
    }), { total_runs: 0, success_count: 0, error_count: 0, timeout_count: 0 });

    const overallRate = totals.total_runs > 0
      ? (totals.success_count / totals.total_runs) * 100
      : 0;

    return { ...totals, overallRate };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 w-full bg-neutral-800 rounded-lg animate-pulse" />
        <div className="h-64 w-full bg-neutral-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  const totalStats = getTotalStats();
  const problematicSources = healthStats.filter(s => s.success_rate_percent < 70);
  const avgResponseTime = healthStats.length > 0
    ? healthStats.reduce((sum, s) => sum + s.avg_api_duration_ms, 0) / healthStats.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              Overall Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">
                {totalStats.overallRate.toFixed(1)}%
              </div>
              {totalStats.overallRate >= 90 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            {/* Custom Progress Bar */}
            <div className="mt-2 w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  totalStats.overallRate >= 90
                    ? 'bg-green-500'
                    : totalStats.overallRate >= 70
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${totalStats.overallRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">
                {formatDuration(avgResponseTime)}
              </div>
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              API call duration
            </p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              Total Timeouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">
                {totalStats.timeout_count}
              </div>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              Problematic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">
                {problematicSources.length}
              </div>
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Below 70% success
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Health Table */}
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white">Source Health Details</CardTitle>
          <CardDescription className="text-neutral-400">
            Performance metrics for each crawler source over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-700 hover:bg-neutral-750">
                <TableHead className="text-neutral-300">Source</TableHead>
                <TableHead className="text-neutral-300">Status</TableHead>
                <TableHead className="text-right text-neutral-300">Success Rate</TableHead>
                <TableHead className="text-right text-neutral-300">Total Runs</TableHead>
                <TableHead className="text-right text-neutral-300">Errors</TableHead>
                <TableHead className="text-right text-neutral-300">Timeouts</TableHead>
                <TableHead className="text-right text-neutral-300">Avg Duration</TableHead>
                <TableHead className="text-right text-neutral-300">API Time</TableHead>
                <TableHead className="text-neutral-300">Last Run</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {healthStats.length === 0 ? (
                <TableRow className="border-neutral-700">
                  <TableCell colSpan={9} className="text-center py-8 text-neutral-400">
                    No health data available yet. Run the crawler to generate stats.
                  </TableCell>
                </TableRow>
              ) : (
                healthStats.map((stat) => (
                  <TableRow key={stat.source_id} className="border-neutral-700 hover:bg-neutral-750">
                    <TableCell className="font-medium text-white">
                      {stat.source_name}
                    </TableCell>
                    <TableCell>
                      {stat.enabled ? (
                        <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-700">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-neutral-700 text-neutral-400 border-neutral-600">
                          Disabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {getHealthIcon(stat.success_rate_percent)}
                        <span className={getHealthColor(stat.success_rate_percent)}>
                          {stat.success_rate_percent.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-white">{stat.total_runs}</TableCell>
                    <TableCell className="text-right">
                      {stat.error_count > 0 ? (
                        <span className="text-red-400 font-medium">{stat.error_count}</span>
                      ) : (
                        <span className="text-neutral-500">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {stat.timeout_count > 0 ? (
                        <span className="text-yellow-400 font-medium">{stat.timeout_count}</span>
                      ) : (
                        <span className="text-neutral-500">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-white">
                      {formatDuration(stat.avg_duration_ms)}
                    </TableCell>
                    <TableCell className="text-right text-white">
                      {formatDuration(stat.avg_api_duration_ms)}
                    </TableCell>
                    <TableCell>
                      {stat.last_run_at ? (
                        <span className="text-xs text-neutral-400">
                          {new Date(stat.last_run_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-500">Never</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
