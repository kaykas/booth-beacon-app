#!/usr/bin/env node

/**
 * Check Crawl Jobs Status - Monitor async crawl progress
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTExOTksImV4cCI6MjA3OTc2NzE5OX0.nVAPKx30OTNSaZ92Koeg_gUonm3Zols3FOTvfO5TrrA';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkJobs() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║          ASYNC CRAWL JOBS STATUS                     ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  try {
    // Get all jobs
    const { data: jobs, error } = await supabase
      .from('crawl_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      if (error.message.includes('relation "public.crawl_jobs" does not exist')) {
        console.log('❌ crawl_jobs table not found\n');
        console.log('Please run the database migration first:');
        console.log('  1. Go to Supabase Dashboard → SQL Editor');
        console.log('  2. Run: supabase/migrations/20260103_add_crawl_jobs_table.sql\n');
        return;
      }
      throw error;
    }

    if (!jobs || jobs.length === 0) {
      console.log('📭 No crawl jobs found yet\n');
      console.log('To start an async crawl:');
      console.log('  node scripts/test-async-crawl.mjs photobooth.net\n');
      return;
    }

    console.log(`📊 Found ${jobs.length} crawl jobs:\n`);

    // Group by status
    const byStatus = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Status Summary:');
    Object.entries(byStatus).forEach(([status, count]) => {
      const emoji = status === 'completed' ? '✅' :
                    status === 'failed' ? '❌' :
                    status === 'crawling' ? '🔄' :
                    status === 'processing' ? '⚙️' : '⏳';
      console.log(`  ${emoji} ${status}: ${count}`);
    });
    console.log('');

    // Show recent jobs
    console.log('Recent Jobs:\n');
    console.log('─'.repeat(80));

    jobs.slice(0, 10).forEach((job, idx) => {
      const emoji = job.status === 'completed' ? '✅' :
                    job.status === 'failed' ? '❌' :
                    job.status === 'crawling' ? '🔄' :
                    job.status === 'processing' ? '⚙️' : '⏳';

      console.log(`${idx + 1}. ${emoji} ${job.source_name}`);
      console.log(`   Job ID: ${job.job_id}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Created: ${new Date(job.created_at).toLocaleString()}`);

      if (job.pages_crawled > 0) {
        console.log(`   Progress: ${job.pages_crawled} pages crawled`);
      }

      if (job.booths_found > 0) {
        console.log(`   Results: ${job.booths_found} found, ${job.booths_added} added, ${job.booths_updated} updated`);
      }

      if (job.status === 'completed' && job.crawl_duration_ms) {
        console.log(`   Duration: ${(job.crawl_duration_ms / 1000).toFixed(1)}s`);
      }

      if (job.error_message) {
        console.log(`   Error: ${job.error_message}`);
      }

      console.log('');
    });

    // Show active jobs
    const activeJobs = jobs.filter(j => ['pending', 'crawling', 'processing'].includes(j.status));
    if (activeJobs.length > 0) {
      console.log('🔄 Active Jobs:\n');
      activeJobs.forEach(job => {
        const elapsed = Date.now() - new Date(job.created_at).getTime();
        const elapsedMin = Math.round(elapsed / 60000);
        console.log(`  • ${job.source_name} (${job.status}) - ${elapsedMin} min ago`);
      });
      console.log('\n💡 Crawls can take 5-10 minutes for large sources\n');
    }

    // Show completed jobs stats
    const completedJobs = jobs.filter(j => j.status === 'completed');
    if (completedJobs.length > 0) {
      const totalBooths = completedJobs.reduce((sum, j) => sum + (j.booths_added || 0), 0);
      const avgDuration = completedJobs.reduce((sum, j) => sum + (j.crawl_duration_ms || 0), 0) / completedJobs.length;

      console.log('✅ Completed Jobs Summary:\n');
      console.log(`  Total jobs: ${completedJobs.length}`);
      console.log(`  Total booths added: ${totalBooths}`);
      console.log(`  Average duration: ${(avgDuration / 1000).toFixed(1)}s\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message, '\n');
  }
}

checkJobs();
