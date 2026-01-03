#!/usr/bin/env tsx

/**
 * View Crawler Results
 *
 * Display recent crawler execution results with detailed metrics
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface MetricsBySource {
  source_name: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  total_booths_extracted: number;
  avg_duration_ms: number;
  last_run: string;
}

async function getRecentMetrics(hours: number = 24) {
  const since = new Date(Date.now() - hours * 3600000).toISOString();

  const { data, error } = await supabase
    .from('crawler_metrics')
    .select('*')
    .gte('started_at', since)
    .order('started_at', { ascending: false });

  if (error) {
    console.error('Error fetching metrics:', error.message);
    return [];
  }

  return data || [];
}

async function getBoothStats() {
  // Total booths
  const { count: total, error: totalError } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  // Booths with coordinates
  const { count: withCoords, error: coordsError } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  // Booths added today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: addedToday, error: todayError } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString());

  return {
    total: total || 0,
    withCoords: withCoords || 0,
    addedToday: addedToday || 0,
    geocodedPercent: total ? ((withCoords || 0) / total * 100).toFixed(1) : '0.0'
  };
}

function aggregateMetricsBySource(metrics: any[]): MetricsBySource[] {
  const grouped = new Map<string, any[]>();

  metrics.forEach(m => {
    const existing = grouped.get(m.source_name) || [];
    existing.push(m);
    grouped.set(m.source_name, existing);
  });

  const results: MetricsBySource[] = [];

  grouped.forEach((sourceMetrics, sourceName) => {
    const successful = sourceMetrics.filter(m => m.status === 'success');
    const failed = sourceMetrics.filter(m => m.status === 'error');
    const totalBooths = sourceMetrics.reduce((sum, m) => sum + (m.booths_extracted || 0), 0);
    const avgDuration = sourceMetrics.reduce((sum, m) => sum + (m.duration_ms || 0), 0) / sourceMetrics.length;
    const lastRun = sourceMetrics[0].started_at; // Already sorted DESC

    results.push({
      source_name: sourceName,
      total_runs: sourceMetrics.length,
      successful_runs: successful.length,
      failed_runs: failed.length,
      total_booths_extracted: totalBooths,
      avg_duration_ms: Math.round(avgDuration),
      last_run: lastRun
    });
  });

  return results.sort((a, b) => b.total_booths_extracted - a.total_booths_extracted);
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║   CRAWLER RESULTS DASHBOARD               ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Get booth statistics
  console.log('📊 Database Statistics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const stats = await getBoothStats();
  console.log(`Total booths:           ${stats.total}`);
  console.log(`With coordinates:       ${stats.withCoords} (${stats.geocodedPercent}%)`);
  console.log(`Added today:            ${stats.addedToday}`);
  console.log('');

  // Get metrics for last 24 hours
  console.log('📈 Crawler Activity (Last 24 Hours)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const metrics24h = await getRecentMetrics(24);
  const aggregated24h = aggregateMetricsBySource(metrics24h);

  if (aggregated24h.length === 0) {
    console.log('⚠️  No crawler activity in last 24 hours\n');
  } else {
    console.log(`Total crawl operations: ${metrics24h.length}`);
    console.log(`Unique sources crawled: ${aggregated24h.length}`);
    console.log(`Total booths extracted: ${aggregated24h.reduce((sum, a) => sum + a.total_booths_extracted, 0)}`);
    console.log('');

    console.log('Performance by Source:');
    console.log('─────────────────────────────────────────\n');

    aggregated24h.forEach((agg, idx) => {
      const successRate = ((agg.successful_runs / agg.total_runs) * 100).toFixed(0);
      const lastRunTime = new Date(agg.last_run).toLocaleString();

      console.log(`${idx + 1}. ${agg.source_name}`);
      console.log(`   Runs: ${agg.total_runs} (${agg.successful_runs} success, ${agg.failed_runs} failed)`);
      console.log(`   Success rate: ${successRate}%`);
      console.log(`   Booths extracted: ${agg.total_booths_extracted}`);
      console.log(`   Avg duration: ${(agg.avg_duration_ms / 1000).toFixed(1)}s`);
      console.log(`   Last run: ${lastRunTime}`);
      console.log('');
    });
  }

  // Get metrics for last hour (recent activity)
  console.log('🔥 Recent Activity (Last Hour)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const metrics1h = await getRecentMetrics(1);

  if (metrics1h.length === 0) {
    console.log('⚠️  No recent activity\n');
  } else {
    console.log(`Recent operations: ${metrics1h.length}\n`);

    metrics1h.slice(0, 10).forEach((metric, idx) => {
      const time = new Date(metric.started_at).toLocaleTimeString();
      const duration = ((metric.duration_ms || 0) / 1000).toFixed(1);
      const statusIcon = metric.status === 'success' ? '✅' : '❌';

      console.log(`${idx + 1}. ${statusIcon} ${metric.source_name}`);
      console.log(`   Time: ${time}`);
      console.log(`   Status: ${metric.status}`);
      console.log(`   Booths: ${metric.booths_extracted || 0}`);
      console.log(`   Pages: ${metric.pages_crawled || 0}`);
      console.log(`   Duration: ${duration}s`);
      if (metric.error_message) {
        console.log(`   Error: ${metric.error_message.substring(0, 80)}...`);
      }
      console.log('');
    });
  }

  // Success/failure summary
  console.log('📊 Health Summary (Last 24h)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const successCount = metrics24h.filter(m => m.status === 'success').length;
  const errorCount = metrics24h.filter(m => m.status === 'error').length;
  const timeoutCount = metrics24h.filter(m => m.status === 'timeout').length;

  const totalOps = metrics24h.length;
  const successRate = totalOps > 0 ? ((successCount / totalOps) * 100).toFixed(1) : '0.0';

  console.log(`✅ Successful operations: ${successCount}`);
  console.log(`❌ Failed operations:     ${errorCount}`);
  console.log(`⏱️  Timeout operations:    ${timeoutCount}`);
  console.log(`📈 Success rate:          ${successRate}%`);
  console.log('');

  // Health status
  const healthStatus = successRate === '0.0' ? 'NEEDS ATTENTION' :
                       parseFloat(successRate) >= 80 ? 'HEALTHY' :
                       parseFloat(successRate) >= 50 ? 'FAIR' : 'POOR';

  const healthIcon = healthStatus === 'HEALTHY' ? '✅' :
                     healthStatus === 'FAIR' ? '⚠️' : '❌';

  console.log(`${healthIcon} System health: ${healthStatus}\n`);

  // Recommendations
  if (stats.addedToday > 0) {
    console.log('💡 Next Steps:');
    console.log('─────────────────────────────────────────');
    console.log(`• ${stats.addedToday} new booths added today need geocoding`);
    console.log('• Run: bash scripts/geocode-all-batches.sh');
    console.log('• Check: node scripts/check-missing-coordinates.js');
    console.log('');
  }

  if (parseFloat(stats.geocodedPercent) < 80) {
    console.log(`⚠️  Geocoding progress: ${stats.geocodedPercent}% (target: 80%+)`);
    console.log('   Run geocoding to improve map functionality\n');
  }

  console.log('═══════════════════════════════════════════\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
