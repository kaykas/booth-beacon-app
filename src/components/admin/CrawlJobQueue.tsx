'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, RefreshCw, Pause, Trash2, Calendar, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface QueueJob {
  id: string;
  source_name: string;
  source_id: string;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  scheduled_for: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  force_crawl: boolean;
  created_at: string;
}

interface CrawlSource {
  id: string;
  name: string;
  enabled: boolean;
}

export const CrawlJobQueue = () => {
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [sources, setSources] = useState<CrawlSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [selectedSource, setSelectedSource] = useState("");
  const [priority, setPriority] = useState("50");
  const [forceCrawl, setForceCrawl] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
    fetchSources();

    // Refresh every 10 seconds
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('crawl_job_queue')
        .select('*')
        .order('priority', { ascending: false })
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      setJobs((data || []) as QueueJob[]);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const { data, error } = await supabase
        .from('crawl_sources')
        .select('id, name, enabled')
        .eq('enabled', true)
        .order('name');

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const addJob = async () => {
    if (!selectedSource) {
      toast.error("Please select a source");
      return;
    }

    setIsAddingJob(true);
    try {
      const source = sources.find(s => s.id === selectedSource);
      const { error } = await supabase
        .from('crawl_job_queue')
        .insert({
          source_id: selectedSource,
          source_name: source?.name || '',
          priority: parseInt(priority),
          force_crawl: forceCrawl,
          status: 'pending' as const,
          scheduled_for: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success(`Added ${source?.name} to the queue`);

      setSelectedSource("");
      setPriority("50");
      setForceCrawl(false);
      setDialogOpen(false);
      fetchJobs();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add job";
      toast.error(errorMessage);
    } finally {
      setIsAddingJob(false);
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('crawl_job_queue')
        .update({ status: 'cancelled' as const })
        .eq('id', jobId);

      if (error) throw error;

      toast.success("Job cancelled");
      fetchJobs();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to cancel job";
      toast.error(errorMessage);
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('crawl_job_queue')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      toast.success("Job deleted");
      fetchJobs();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete job";
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status: QueueJob['status']) => {
    const variants: Record<QueueJob['status'], { variant: string; label: string; className: string }> = {
      pending: { variant: "outline", label: "Pending", className: "bg-yellow-950/30 text-yellow-300 border-yellow-500/50" },
      running: { variant: "default", label: "Running", className: "bg-blue-950/30 text-blue-300 border-blue-500/50" },
      completed: { variant: "outline", label: "Completed", className: "bg-green-950/30 text-green-300 border-green-500/50" },
      failed: { variant: "destructive", label: "Failed", className: "bg-red-950/30 text-red-300 border-red-500/50" },
      cancelled: { variant: "outline", label: "Cancelled", className: "bg-neutral-700 text-neutral-300 border-neutral-600" },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const pendingJobs = jobs.filter(j => j.status === 'pending').length;
  const runningJobs = jobs.filter(j => j.status === 'running').length;

  return (
    <div className="space-y-6">
      {/* Queue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              Pending Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingJobs}</div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              Running Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{runningJobs}</div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              Total Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{jobs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Job Queue Table */}
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Crawl Job Queue</CardTitle>
              <CardDescription className="text-neutral-400">
                Manage scheduled and pending crawler jobs
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Job
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-neutral-800 border-neutral-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add Crawl Job</DialogTitle>
                  <DialogDescription className="text-neutral-400">
                    Schedule a new crawl job for a source
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-white">Source</Label>
                    <Select value={selectedSource} onValueChange={setSelectedSource}>
                      <SelectTrigger className="bg-neutral-900 border-neutral-700 text-white">
                        <SelectValue placeholder="Select a source" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-700">
                        {sources.map(source => (
                          <SelectItem key={source.id} value={source.id} className="text-white hover:bg-neutral-800">
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Priority (0-100)</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="bg-neutral-900 border-neutral-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-700">
                        <SelectItem value="100" className="text-white hover:bg-neutral-800">High (100)</SelectItem>
                        <SelectItem value="75" className="text-white hover:bg-neutral-800">Medium-High (75)</SelectItem>
                        <SelectItem value="50" className="text-white hover:bg-neutral-800">Medium (50)</SelectItem>
                        <SelectItem value="25" className="text-white hover:bg-neutral-800">Low (25)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="force-crawl"
                      checked={forceCrawl}
                      onCheckedChange={(checked) => setForceCrawl(checked as boolean)}
                    />
                    <Label htmlFor="force-crawl" className="cursor-pointer text-white">
                      Force crawl (ignore frequency limits)
                    </Label>
                  </div>

                  <Button
                    onClick={addJob}
                    disabled={isAddingJob || !selectedSource}
                    className="w-full"
                  >
                    {isAddingJob ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Queue
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-700 hover:bg-neutral-750">
                  <TableHead className="text-neutral-300">Source</TableHead>
                  <TableHead className="text-neutral-300">Status</TableHead>
                  <TableHead className="text-right text-neutral-300">Priority</TableHead>
                  <TableHead className="text-neutral-300">Scheduled</TableHead>
                  <TableHead className="text-neutral-300">Started</TableHead>
                  <TableHead className="text-neutral-300">Completed</TableHead>
                  <TableHead className="text-right text-neutral-300">Retries</TableHead>
                  <TableHead className="text-neutral-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow className="border-neutral-700">
                    <TableCell colSpan={8} className="text-center text-neutral-400 py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="w-12 h-12 text-neutral-600" />
                        <p>No jobs in queue. Add a job to get started.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id} className="border-neutral-700 hover:bg-neutral-750">
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-2">
                          {job.source_name}
                          {job.force_crawl && (
                            <Badge variant="outline" className="text-xs bg-purple-950/30 text-purple-300 border-purple-500/50">
                              Force
                            </Badge>
                          )}
                        </div>
                        {job.error_message && (
                          <div className="flex items-start gap-1 mt-1 text-xs text-red-400">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{job.error_message}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-right text-white">{job.priority}</TableCell>
                      <TableCell>
                        <span className="text-xs text-neutral-400">
                          {formatDateTime(job.scheduled_for)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-neutral-400">
                          {formatDateTime(job.started_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-neutral-400">
                          {formatDateTime(job.completed_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm ${job.retry_count >= job.max_retries ? 'text-red-400' : 'text-neutral-400'}`}>
                          {job.retry_count}/{job.max_retries}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {job.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelJob(job.id)}
                              title="Cancel job"
                            >
                              <Pause className="w-3 h-3" />
                            </Button>
                          )}
                          {(job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteJob(job.id)}
                              title="Delete job"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
