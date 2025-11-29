'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Recycle, Eye, RefreshCw, AlertCircle, CheckCircle, Clock, Database, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface RawContent {
  id: string;
  source_id: string;
  url: string;
  raw_markdown: string | null;
  raw_html: string | null;
  metadata: Record<string, unknown> | null;
  crawled_at: string;
  content_hash: string | null;
  source_name?: string;
  extractor_type?: string;
}

interface SourceStats {
  source_name: string;
  total_crawls: number;
  successful_extractions: number;
  success_rate: number;
}

interface ContentChange {
  url: string;
  version_count: number;
  last_crawl: string;
  content_hashes: string[];
}

export function ReextractionQueue() {
  const [loading, setLoading] = useState(true);
  const [reextracting, setReextracting] = useState(false);
  const [unextractedContent, setUnextractedContent] = useState<RawContent[]>([]);
  const [sourceStats, setSourceStats] = useState<SourceStats[]>([]);
  const [contentChanges, setContentChanges] = useState<ContentChange[]>([]);
  const [selectedContent, setSelectedContent] = useState<RawContent | null>(null);
  const [activeView, setActiveView] = useState<'queue' | 'stats' | 'changes'>('queue');
  const [totalCrawled, setTotalCrawled] = useState(0);
  const [totalExtracted, setTotalExtracted] = useState(0);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadUnextractedContent(),
      loadSourceStats(),
      loadContentChanges(),
    ]);
    setLoading(false);
  };

  const loadUnextractedContent = async () => {
    try {
      // Query the content_needing_reextraction view
      const { data, error } = await supabase
        .from('crawl_raw_content')
        .select(`
          id,
          source_id,
          url,
          raw_markdown,
          raw_html,
          metadata,
          crawled_at,
          content_hash,
          crawl_sources!inner(
            source_name,
            extractor_type
          )
        `)
        .is('booths.extracted_from_content_id', null)
        .order('crawled_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform the data to flatten the nested source info
      const transformedData = (data || []).map((item: unknown) => {
        const typedItem = item as {
          id: string;
          source_id: string;
          url: string;
          raw_markdown: string | null;
          raw_html: string | null;
          metadata: Record<string, unknown> | null;
          crawled_at: string;
          content_hash: string | null;
          crawl_sources: { source_name: string; extractor_type: string };
        };
        return {
          id: typedItem.id,
          source_id: typedItem.source_id,
          url: typedItem.url,
          raw_markdown: typedItem.raw_markdown,
          raw_html: typedItem.raw_html,
          metadata: typedItem.metadata,
          crawled_at: typedItem.crawled_at,
          content_hash: typedItem.content_hash,
          source_name: typedItem.crawl_sources.source_name,
          extractor_type: typedItem.crawl_sources.extractor_type,
        };
      });

      setUnextractedContent(transformedData);
    } catch (error) {
      console.error('Error loading unextracted content:', error);
      toast.error('Failed to load unextracted content');
    }
  };

  const loadSourceStats = async () => {
    try {
      // Calculate extraction success rates by source
      const { data: rawContent } = await supabase
        .from('crawl_raw_content')
        .select(`
          id,
          source_id,
          crawl_sources!inner(source_name)
        `);

      const { data: extractedBooths } = await supabase
        .from('booths')
        .select('extracted_from_content_id, crawl_raw_content!inner(source_id)');

      if (!rawContent) return;

      // Group by source
      const sourceMap = new Map<string, { total: number; extracted: number }>();

      rawContent.forEach((item: unknown) => {
        const typedItem = item as {
          crawl_sources: { source_name: string };
        };
        const sourceName = typedItem.crawl_sources.source_name;
        if (!sourceMap.has(sourceName)) {
          sourceMap.set(sourceName, { total: 0, extracted: 0 });
        }
        sourceMap.get(sourceName)!.total++;
      });

      extractedBooths?.forEach((booth: unknown) => {
        const typedBooth = booth as {
          crawl_raw_content: { source_id: string };
        };
        // Find source name for this source_id
        const sourceItem = rawContent.find((rc: unknown) =>
          (rc as { source_id: string }).source_id === typedBooth.crawl_raw_content.source_id
        );
        if (sourceItem) {
          const sourceName = (sourceItem as { crawl_sources: { source_name: string } }).crawl_sources.source_name;
          const stats = sourceMap.get(sourceName);
          if (stats) stats.extracted++;
        }
      });

      // Convert to array and calculate success rates
      const stats: SourceStats[] = Array.from(sourceMap.entries()).map(([source_name, data]) => ({
        source_name,
        total_crawls: data.total,
        successful_extractions: data.extracted,
        success_rate: data.total > 0 ? Math.round((data.extracted / data.total) * 100) : 0,
      })).sort((a, b) => b.success_rate - a.success_rate);

      setSourceStats(stats);

      // Calculate totals
      setTotalCrawled(rawContent.length);
      setTotalExtracted(extractedBooths?.length || 0);
    } catch (error) {
      console.error('Error loading source stats:', error);
      toast.error('Failed to load source statistics');
    }
  };

  const loadContentChanges = async () => {
    try {
      // Find URLs with multiple versions (content changed)
      const { data } = await supabase
        .from('crawl_raw_content')
        .select('url, crawled_at, content_hash')
        .order('url')
        .order('crawled_at', { ascending: false });

      if (!data) return;

      // Group by URL
      const urlMap = new Map<string, { crawls: Array<{ date: string; hash: string }> }>();

      data.forEach((item: unknown) => {
        const typedItem = item as { url: string; crawled_at: string; content_hash: string | null };
        if (!urlMap.has(typedItem.url)) {
          urlMap.set(typedItem.url, { crawls: [] });
        }
        urlMap.get(typedItem.url)!.crawls.push({
          date: typedItem.crawled_at,
          hash: typedItem.content_hash || '',
        });
      });

      // Find URLs with multiple unique hashes
      const changes: ContentChange[] = [];
      urlMap.forEach((value, url) => {
        const uniqueHashes = new Set(value.crawls.map(c => c.hash).filter(Boolean));
        if (uniqueHashes.size > 1) {
          changes.push({
            url,
            version_count: value.crawls.length,
            last_crawl: value.crawls[0].date,
            content_hashes: Array.from(uniqueHashes),
          });
        }
      });

      setContentChanges(changes.sort((a, b) =>
        new Date(b.last_crawl).getTime() - new Date(a.last_crawl).getTime()
      ));
    } catch (error) {
      console.error('Error loading content changes:', error);
      toast.error('Failed to load content changes');
    }
  };

  const triggerReextraction = async (contentId?: string) => {
    setReextracting(true);
    try {
      // Use Next.js API route as secure proxy (handles SERVICE_ROLE_KEY server-side)
      const endpoint = '/api/reextract';

      const body = contentId
        ? { content_id: contentId }
        : { limit: 10 }; // Batch re-extract 10 items at a time

      toast.info(contentId ? 'Re-extracting content...' : 'Starting batch re-extraction...', {
        description: 'Using stored raw content without API costs'
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Re-extraction failed');
      }

      const result = await response.json();

      if (contentId) {
        // Single item result
        toast.success(`Re-extraction complete!`, {
          description: `Extracted ${result.booths_extracted || 0} booths, saved ${result.booths_saved || 0}`
        });
      } else {
        // Batch result
        toast.success(`Batch re-extraction complete!`, {
          description: `Processed ${result.processed} items, extracted ${result.total_booths_extracted} booths, saved ${result.total_booths_saved}`
        });
      }

      // Reload data to show new extractions
      await loadAllData();
    } catch (error) {
      console.error('Error triggering re-extraction:', error);
      toast.error('Failed to trigger re-extraction', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setReextracting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-neutral-800 border-neutral-700">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-3 text-neutral-300">Loading re-extraction queue...</span>
        </div>
      </Card>
    );
  }

  const overallSuccessRate = totalCrawled > 0 ? Math.round((totalExtracted / totalCrawled) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-neutral-800 border-neutral-700">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-white">{totalCrawled}</div>
              <div className="text-xs text-neutral-400">Total Crawled</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-neutral-800 border-neutral-700">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <div className="text-2xl font-bold text-white">{totalExtracted}</div>
              <div className="text-xs text-neutral-400">Successfully Extracted</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-neutral-800 border-neutral-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-yellow-400" />
            <div>
              <div className="text-2xl font-bold text-white">{unextractedContent.length}</div>
              <div className="text-xs text-neutral-400">Needs Extraction</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-neutral-800 border-neutral-700">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-white">{overallSuccessRate}%</div>
              <div className="text-xs text-neutral-400">Success Rate</div>
            </div>
          </div>
        </Card>
      </div>

      {/* View Tabs */}
      <Card className="p-6 bg-neutral-800 border-neutral-700">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant={activeView === 'queue' ? 'default' : 'outline'}
            onClick={() => setActiveView('queue')}
          >
            <Recycle className="w-4 h-4 mr-2" />
            Re-extraction Queue ({unextractedContent.length})
          </Button>
          <Button
            variant={activeView === 'stats' ? 'default' : 'outline'}
            onClick={() => setActiveView('stats')}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Source Statistics
          </Button>
          <Button
            variant={activeView === 'changes' ? 'default' : 'outline'}
            onClick={() => setActiveView('changes')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Content Changes ({contentChanges.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            disabled={loading}
            className="ml-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Re-extraction Queue View */}
        {activeView === 'queue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-neutral-300">
                Content that has been crawled but not yet extracted into booths. Re-extract without API costs!
              </p>
              <Button
                onClick={() => triggerReextraction()}
                disabled={reextracting || unextractedContent.length === 0}
              >
                {reextracting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Recycle className="w-4 h-4 mr-2" />
                )}
                Re-extract All
              </Button>
            </div>

            {unextractedContent.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-neutral-400">All content has been extracted!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {unextractedContent.map((content) => (
                  <div
                    key={content.id}
                    className="flex items-start gap-3 p-4 bg-neutral-900 rounded border border-neutral-700 hover:border-primary/50 transition"
                  >
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-white truncate">{content.url}</span>
                        <Badge variant="secondary" className="flex-shrink-0">
                          {content.source_name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-neutral-400">
                        <span>Crawled: {new Date(content.crawled_at).toLocaleString()}</span>
                        <span>Type: {content.extractor_type || 'generic'}</span>
                        {content.content_hash && (
                          <span className="font-mono">Hash: {content.content_hash.substring(0, 8)}...</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedContent(content)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => triggerReextraction(content.id)}
                        disabled={reextracting}
                      >
                        <Recycle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Source Statistics View */}
        {activeView === 'stats' && (
          <div className="space-y-2">
            <p className="text-neutral-300 mb-4">
              Extraction success rates by source. Shows which sources produce the most booths.
            </p>
            {sourceStats.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400">No source statistics available</p>
              </div>
            ) : (
              sourceStats.map((source) => (
                <div
                  key={source.source_name}
                  className="flex items-center gap-4 p-4 bg-neutral-900 rounded border border-neutral-700"
                >
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1">{source.source_name}</div>
                    <div className="flex items-center gap-4 text-xs text-neutral-400">
                      <span>Crawled: {source.total_crawls}</span>
                      <span>Extracted: {source.successful_extractions}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      source.success_rate >= 80 ? 'text-green-400' :
                      source.success_rate >= 50 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {source.success_rate}%
                    </div>
                    <div className="text-xs text-neutral-400">Success Rate</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Content Changes View */}
        {activeView === 'changes' && (
          <div className="space-y-2">
            <p className="text-neutral-300 mb-4">
              URLs where content has changed between crawls. Re-extract to get updated booth information.
            </p>
            {contentChanges.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400">No content changes detected</p>
              </div>
            ) : (
              contentChanges.map((change, index) => (
                <div
                  key={index}
                  className="p-4 bg-neutral-900 rounded border border-neutral-700"
                >
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white mb-2 break-words">{change.url}</div>
                      <div className="flex items-center gap-4 text-xs text-neutral-400">
                        <span>{change.version_count} versions</span>
                        <span>{change.content_hashes.length} unique content hashes</span>
                        <span>Last: {new Date(change.last_crawl).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Raw Content Viewer Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[80vh] overflow-y-auto bg-neutral-900 border-neutral-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Raw Content Viewer</h3>
                <Button variant="outline" onClick={() => setSelectedContent(null)}>
                  Close
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-neutral-400 mb-1">URL</div>
                  <div className="text-white break-words">{selectedContent.url}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-neutral-400 mb-1">Source</div>
                  <Badge>{selectedContent.source_name}</Badge>
                </div>

                <div>
                  <div className="text-sm font-medium text-neutral-400 mb-1">Metadata</div>
                  <pre className="text-xs text-neutral-300 bg-neutral-800 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedContent.metadata, null, 2)}
                  </pre>
                </div>

                <div>
                  <div className="text-sm font-medium text-neutral-400 mb-1">Raw Markdown (First 2000 chars)</div>
                  <pre className="text-xs text-neutral-300 bg-neutral-800 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                    {selectedContent.raw_markdown?.substring(0, 2000) || 'No markdown content'}
                  </pre>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
