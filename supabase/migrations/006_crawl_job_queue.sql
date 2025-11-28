-- Create crawl_job_queue table for managing scheduled crawls
CREATE TABLE IF NOT EXISTS public.crawl_job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES crawl_sources(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  priority INTEGER DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  force_crawl BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_crawl_queue_status ON crawl_job_queue(status);
CREATE INDEX IF NOT EXISTS idx_crawl_queue_scheduled ON crawl_job_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_crawl_queue_priority ON crawl_job_queue(priority DESC);

-- Enable RLS
ALTER TABLE public.crawl_job_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crawl_job_queue
CREATE POLICY "Queue viewable by everyone"
  ON public.crawl_job_queue
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create jobs"
  ON public.crawl_job_queue
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update jobs"
  ON public.crawl_job_queue
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete jobs"
  ON public.crawl_job_queue
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Function to update job queue updated_at
CREATE OR REPLACE FUNCTION update_crawl_job_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_crawl_job_queue_timestamp ON public.crawl_job_queue;
CREATE TRIGGER update_crawl_job_queue_timestamp
  BEFORE UPDATE ON public.crawl_job_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_crawl_job_queue_updated_at();
