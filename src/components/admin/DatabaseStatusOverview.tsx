'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  MapPin,
  RefreshCw,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DatabaseStats {
  // Sources
  totalSources: number;
  enabledSources: number;
  disabledSources: number;
  workingSources: number;  // Sources extracting booths
  brokenSources: number;   // Sources with errors

  // Booths
  totalBooths: number;
  activeBooths: number;
  geocodedBooths: number;
  pendingVerification: number;

  // Activity
  boothsAddedToday: number;
  boothsAddedThisWeek: number;
  lastCrawlTime: string | null;
}

export function DatabaseStatusOverview() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadStats = async () => {
    setLoading(true);
    try {
      // Get source statistics
      const { data: allSources } = await supabase
        .from('crawl_sources')
        .select('id, enabled, status, total_booths_found');

      const totalSources = allSources?.length || 0;
      const enabledSources = allSources?.filter(s => s.enabled).length || 0;
      const disabledSources = allSources?.filter(s => !s.enabled).length || 0;
      const workingSources = allSources?.filter(s => s.enabled && (s.total_booths_found || 0) > 0).length || 0;
      const brokenSources = allSources?.filter(s => s.status === 'error').length || 0;

      // Get booth statistics
      const { count: totalBooths } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true });

      const { count: activeBooths } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: geocodedBooths } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      const { count: pendingVerification } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get activity statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const { count: boothsAddedToday } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const { count: boothsAddedThisWeek } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // Get last successful crawl
      const { data: lastCrawl } = await supabase
        .from('crawler_metrics')
        .select('completed_at')
        .eq('status', 'success')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setStats({
        totalSources,
        enabledSources,
        disabledSources,
        workingSources,
        brokenSources,
        totalBooths: totalBooths || 0,
        activeBooths: activeBooths || 0,
        geocodedBooths: geocodedBooths || 0,
        pendingVerification: pendingVerification || 0,
        boothsAddedToday: boothsAddedToday || 0,
        boothsAddedThisWeek: boothsAddedThisWeek || 0,
        lastCrawlTime: lastCrawl?.completed_at || null
      });

      setLastRefresh(new Date());
      toast.success('Database stats refreshed');
    } catch (error) {
      console.error('Error loading database stats:', error);
      toast.error('Failed to load database statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !stats) {
    return (
      <Card className="p-6 bg-neutral-800 border-neutral-700">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-neutral-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  const geocodingPercentage = stats.totalBooths > 0
    ? Math.round((stats.geocodedBooths / stats.totalBooths) * 100)
    : 0;

  const sourcesHealthPercentage = stats.totalSources > 0
    ? Math.round((stats.workingSources / stats.enabledSources) * 100)
    : 0;

  return (
    <Card className="p-6 bg-neutral-800 border-neutral-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white flex items-center gap-2">
            <Database className="w-7 h-7 text-primary" />
            Database Status Overview
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Critical Alert: 66 Disabled Sources */}
      {stats.disabledSources > 50 && (
        <div className="mb-6 p-4 bg-yellow-950/30 border-2 border-yellow-500 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-yellow-300 mb-1">
                Attention: {stats.disabledSources} Disabled Sources
              </div>
              <p className="text-sm text-yellow-200 mb-2">
                You have {stats.disabledSources} disabled crawler sources out of {stats.totalSources} total.
                These sources are not being crawled and may contain valuable booth data.
              </p>
              <div className="text-xs text-yellow-300">
                Recommendation: Review disabled sources to identify which can be re-enabled or need URL updates.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Crawler Sources */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Crawler Sources</h3>
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Total</span>
              <span className="text-2xl font-bold text-white">{stats.totalSources}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-neutral-800">
              <span className="text-sm text-neutral-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Enabled
              </span>
              <span className="text-lg font-semibold text-green-400">{stats.enabledSources}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-neutral-800">
              <span className="text-sm text-neutral-400 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                Disabled
              </span>
              <span className="text-lg font-semibold text-red-400">{stats.disabledSources}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-neutral-800">
              <span className="text-sm text-neutral-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Working
              </span>
              <span className="text-lg font-semibold text-purple-400">{stats.workingSources}</span>
            </div>
            {stats.brokenSources > 0 && (
              <div className="flex items-center justify-between py-2 border-t border-neutral-800">
                <span className="text-sm text-neutral-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Errors
                </span>
                <span className="text-lg font-semibold text-yellow-400">{stats.brokenSources}</span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-800">
            <div className="text-xs text-neutral-500 mb-2">Source Health</div>
            <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  sourcesHealthPercentage >= 70 ? 'bg-green-500' :
                  sourcesHealthPercentage >= 40 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${sourcesHealthPercentage}%` }}
              />
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              {sourcesHealthPercentage}% of enabled sources are working
            </div>
          </div>
        </div>

        {/* Booth Database */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Booth Database</h3>
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Total Booths</span>
              <span className="text-3xl font-bold text-white">{stats.totalBooths}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-neutral-800">
              <span className="text-sm text-neutral-400">Active</span>
              <Badge variant="secondary" className="bg-green-900 text-green-100">
                {stats.activeBooths}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-neutral-800">
              <span className="text-sm text-neutral-400">Geocoded</span>
              <span className="text-lg font-semibold text-blue-400">{stats.geocodedBooths}</span>
            </div>
            {stats.pendingVerification > 0 && (
              <div className="flex items-center justify-between py-2 border-t border-neutral-800">
                <span className="text-sm text-neutral-400">Pending</span>
                <Badge variant="secondary" className="bg-yellow-900 text-yellow-100">
                  {stats.pendingVerification}
                </Badge>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-800">
            <div className="text-xs text-neutral-500 mb-2">Geocoding Coverage</div>
            <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  geocodingPercentage >= 70 ? 'bg-green-500' :
                  geocodingPercentage >= 40 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${geocodingPercentage}%` }}
              />
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              {geocodingPercentage}% have coordinates
            </div>
          </div>
        </div>

        {/* Activity & Growth */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Activity</h3>
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Added Today</span>
              <span className="text-2xl font-bold text-accent">{stats.boothsAddedToday}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-neutral-800">
              <span className="text-sm text-neutral-400">Added This Week</span>
              <span className="text-lg font-semibold text-purple-400">{stats.boothsAddedThisWeek}</span>
            </div>
            <div className="py-2 border-t border-neutral-800">
              <span className="text-sm text-neutral-400 block mb-1">Last Successful Crawl</span>
              <span className="text-xs text-neutral-300">
                {stats.lastCrawlTime
                  ? new Date(stats.lastCrawlTime).toLocaleString()
                  : 'Never'
                }
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-800">
            <div className="text-xs text-neutral-500 mb-2">Database Health</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-neutral-800 rounded">
                <div className="text-xs text-neutral-400">Data Quality</div>
                <div className={`text-sm font-bold ${geocodingPercentage >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {geocodingPercentage >= 70 ? 'Good' : 'Fair'}
                </div>
              </div>
              <div className="text-center p-2 bg-neutral-800 rounded">
                <div className="text-xs text-neutral-400">Growth</div>
                <div className="text-sm font-bold text-blue-400">
                  {stats.boothsAddedThisWeek > 0 ? 'Active' : 'Slow'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      {(stats.disabledSources > 50 || geocodingPercentage < 70 || stats.workingSources < stats.enabledSources * 0.5) && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Recommended Actions
          </h3>
          <div className="space-y-2 text-sm">
            {stats.disabledSources > 50 && (
              <div className="flex items-start gap-2 text-neutral-300">
                <span className="text-yellow-400">•</span>
                <span>Review and re-enable {stats.disabledSources} disabled sources to increase data coverage</span>
              </div>
            )}
            {geocodingPercentage < 70 && (
              <div className="flex items-start gap-2 text-neutral-300">
                <span className="text-yellow-400">•</span>
                <span>Run geocoding on {stats.totalBooths - stats.geocodedBooths} booths missing coordinates</span>
              </div>
            )}
            {stats.workingSources < stats.enabledSources * 0.5 && (
              <div className="flex items-start gap-2 text-neutral-300">
                <span className="text-yellow-400">•</span>
                <span>Investigate {stats.enabledSources - stats.workingSources} enabled sources that aren't extracting data</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
