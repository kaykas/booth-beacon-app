'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Info,
  AlertTriangle,
  XCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface CrawlerLog {
  id: string;
  source_name: string;
  crawl_session_id: string;
  batch_number: number | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  operation_type: string;
  operation_status: string;
  pages_crawled: number;
  booths_extracted: number;
  booths_validated: number;
  booths_deduplicated: number;
  booths_upserted: number;
  urls_processed: string[] | null;
  content_hash: string | null;
  error_message: string | null;
  error_stack: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface LogViewerProps {
  initialLimit?: number;
}

export function LogViewer({ initialLimit = 50 }: LogViewerProps) {
  const [logs, setLogs] = useState<CrawlerLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<CrawlerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Filters
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(initialLimit);

  // Available sources for filter dropdown
  const [availableSources, setAvailableSources] = useState<string[]>([]);

  // Expanded row for metadata
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Fetch logs from database
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('crawl_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply date filters
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedData = (data || []) as CrawlerLog[];
      setLogs(typedData);

      // Extract unique sources for filter
      const sources = Array.from(new Set(typedData.map(log => log.source_name))).sort();
      setAvailableSources(sources);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  // Apply filters to logs
  useEffect(() => {
    let filtered = [...logs];

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.operation_status === levelFilter);
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(log => log.source_name === sourceFilter);
    }

    // Search in messages
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        log =>
          log.operation_type?.toLowerCase().includes(query) ||
          log.error_message?.toLowerCase().includes(query) ||
          log.source_name?.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [logs, levelFilter, sourceFilter, searchQuery]);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefresh) {
      // Initial fetch
      fetchLogs();
      // Set interval
      interval = setInterval(() => {
        fetchLogs();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchLogs]);

  // Pagination calculations
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // CSV Export
  const exportToCSV = () => {
    try {
      const headers = [
        'Timestamp',
        'Level',
        'Source',
        'Operation Type',
        'Message',
        'Duration (ms)',
        'Pages Crawled',
        'Booths Extracted',
        'Session ID',
      ];

      const rows = filteredLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.operation_status,
        log.source_name,
        log.operation_type,
        log.error_message || 'Success',
        log.duration_ms || '',
        log.pages_crawled || 0,
        log.booths_extracted || 0,
        log.crawl_session_id,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row =>
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `crawler-logs-${new Date().toISOString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Logs exported to CSV');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export logs');
    }
  };

  // Get icon and color for log level
  const getLevelDisplay = (status: string) => {
    switch (status) {
      case 'error':
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: 'text-red-400',
          bgColor: 'bg-red-900/20',
          badge: 'bg-red-900 text-red-100',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/20',
          badge: 'bg-yellow-900 text-yellow-100',
        };
      case 'success':
        return {
          icon: <Info className="w-4 h-4" />,
          color: 'text-green-400',
          bgColor: 'bg-green-900/20',
          badge: 'bg-green-900 text-green-100',
        };
      default:
        return {
          icon: <Info className="w-4 h-4" />,
          color: 'text-blue-400',
          bgColor: 'bg-blue-900/20',
          badge: 'bg-blue-900 text-blue-100',
        };
    }
  };

  // Format message
  const formatMessage = (log: CrawlerLog) => {
    if (log.error_message) return log.error_message;
    if (log.operation_type === 'extract') {
      return `Extracted ${log.booths_extracted} booths from ${log.pages_crawled} pages`;
    }
    if (log.operation_type === 'upsert') {
      return `Upserted ${log.booths_upserted} booths`;
    }
    return log.operation_type;
  };

  return (
    <Card className="p-6 bg-neutral-800 border-neutral-700">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">
              Crawler Logs
            </h2>
            <p className="text-neutral-400 text-sm mt-1">
              {filteredLogs.length} logs
              {filteredLogs.length !== logs.length && ` (filtered from ${logs.length})`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                id="auto-refresh"
              />
              <label htmlFor="auto-refresh" className="text-sm text-neutral-300">
                Auto-refresh
              </label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-neutral-400">Level</label>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="bg-neutral-900 border-neutral-700">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="started">Started</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-neutral-400">Source</label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="bg-neutral-900 border-neutral-700">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {availableSources.map(source => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-neutral-400">Date From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-neutral-900 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-neutral-400">Date To</label>
            <Input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-neutral-900 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-neutral-400">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-neutral-900 border-neutral-700 pl-10"
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        {loading && logs.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-neutral-600 mx-auto mb-3 animate-spin" />
            <p className="text-neutral-400">Loading logs...</p>
          </div>
        ) : currentLogs.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400">No logs found</p>
            <p className="text-neutral-500 text-sm mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="border border-neutral-700 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-900 hover:bg-neutral-900">
                  <TableHead className="text-neutral-300">Timestamp</TableHead>
                  <TableHead className="text-neutral-300">Level</TableHead>
                  <TableHead className="text-neutral-300">Source</TableHead>
                  <TableHead className="text-neutral-300">Operation</TableHead>
                  <TableHead className="text-neutral-300">Message</TableHead>
                  <TableHead className="text-neutral-300 text-right">
                    Metrics
                  </TableHead>
                  <TableHead className="text-neutral-300 text-center">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentLogs.map(log => {
                  const levelDisplay = getLevelDisplay(log.operation_status);
                  const isExpanded = expandedRow === log.id;

                  return (
                    <>
                      <TableRow
                        key={log.id}
                        className={`${levelDisplay.bgColor} border-neutral-700`}
                      >
                        <TableCell className="text-neutral-300 text-xs font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`${levelDisplay.badge} flex items-center gap-1 w-fit`}
                          >
                            {levelDisplay.icon}
                            {log.operation_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-neutral-300 text-sm">
                          {log.source_name}
                        </TableCell>
                        <TableCell className="text-neutral-300 text-sm">
                          {log.operation_type}
                        </TableCell>
                        <TableCell className="text-neutral-300 text-sm max-w-xs truncate">
                          {formatMessage(log)}
                        </TableCell>
                        <TableCell className="text-neutral-400 text-xs text-right">
                          <div className="space-y-1">
                            {log.duration_ms && (
                              <div>{log.duration_ms}ms</div>
                            )}
                            {log.booths_extracted > 0 && (
                              <div>{log.booths_extracted} booths</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExpandedRow(isExpanded ? null : log.id)
                            }
                            className="text-neutral-400 hover:text-white"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-neutral-900 border-neutral-700">
                          <TableCell colSpan={7} className="p-4">
                            <div className="space-y-3 text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-neutral-500 text-xs mb-1">
                                    Session ID
                                  </div>
                                  <div className="text-neutral-300 font-mono text-xs">
                                    {log.crawl_session_id}
                                  </div>
                                </div>
                                {log.batch_number && (
                                  <div>
                                    <div className="text-neutral-500 text-xs mb-1">
                                      Batch Number
                                    </div>
                                    <div className="text-neutral-300">
                                      {log.batch_number}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {log.urls_processed && log.urls_processed.length > 0 && (
                                <div>
                                  <div className="text-neutral-500 text-xs mb-1">
                                    URLs Processed ({log.urls_processed.length})
                                  </div>
                                  <div className="bg-neutral-950 rounded p-2 max-h-32 overflow-y-auto">
                                    {log.urls_processed.map((url, i) => (
                                      <div
                                        key={i}
                                        className="text-neutral-400 text-xs font-mono truncate"
                                      >
                                        {url}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {log.error_stack && (
                                <div>
                                  <div className="text-red-400 text-xs mb-1">
                                    Error Stack Trace
                                  </div>
                                  <pre className="bg-neutral-950 rounded p-3 text-xs text-red-300 overflow-x-auto">
                                    {log.error_stack}
                                  </pre>
                                </div>
                              )}

                              {log.metadata &&
                                Object.keys(log.metadata).length > 0 && (
                                  <div>
                                    <div className="text-neutral-500 text-xs mb-1">
                                      Metadata
                                    </div>
                                    <pre className="bg-neutral-950 rounded p-3 text-xs text-neutral-400 overflow-x-auto">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}

                              <div className="grid grid-cols-4 gap-4 pt-2 border-t border-neutral-700">
                                <div>
                                  <div className="text-neutral-500 text-xs mb-1">
                                    Pages Crawled
                                  </div>
                                  <div className="text-neutral-300">
                                    {log.pages_crawled || 0}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-neutral-500 text-xs mb-1">
                                    Booths Extracted
                                  </div>
                                  <div className="text-neutral-300">
                                    {log.booths_extracted || 0}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-neutral-500 text-xs mb-1">
                                    Booths Validated
                                  </div>
                                  <div className="text-neutral-300">
                                    {log.booths_validated || 0}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-neutral-500 text-xs mb-1">
                                    Booths Upserted
                                  </div>
                                  <div className="text-neutral-300">
                                    {log.booths_upserted || 0}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-400">
              Showing {indexOfFirstLog + 1} to{' '}
              {Math.min(indexOfLastLog, filteredLogs.length)} of{' '}
              {filteredLogs.length} logs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm text-neutral-300">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
