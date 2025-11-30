#!/usr/bin/env node
/*
 * Simple CLI to inspect crawler_registry health for NOT IN DATABASE sources.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Export it before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tierArg = process.argv.find((arg) => arg.startsWith('--tier='));
const jsonMode = process.argv.includes('--json');
const filterTier = tierArg ? tierArg.split('=')[1].toUpperCase() : undefined;

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return isNaN(date.getTime()) ? '-' : date.toISOString().split('T')[0];
}

function isStale(entry) {
  if (!entry.last_run) return true;
  const cadenceMs = (entry.cadence_days || 7) * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(entry.last_run).getTime() > cadenceMs;
}

function dropDetected(entry) {
  if (!entry.previous_result_count) return false;
  return entry.last_result_count < entry.previous_result_count * 0.8;
}

(async () => {
  const { data, error } = await supabase
    .from('crawler_registry')
    .select('*')
    .eq('enabled', true)
    .order('tier', { ascending: true })
    .order('source_name', { ascending: true });

  if (error) {
    console.error('Failed to fetch crawler_registry rows:', error.message);
    process.exit(1);
  }

  const rows = (data || []).filter((row) => (filterTier ? row.tier === filterTier : true));

  if (jsonMode) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  console.log('Crawler Registry (NOT IN DATABASE focus)');
  console.log('====================================================');
  rows.forEach((row) => {
    const status = [
      isStale(row) ? 'STALE' : 'fresh',
      dropDetected(row) ? 'DROP>20%' : 'steady',
      row.error_rate ? `${row.error_rate}% errors` : 'clean'
    ].join(' | ');

    console.log(
      `- [${row.tier}] ${row.source_name}\n` +
        `    cadence: every ${row.cadence_days}d | last run: ${formatDate(row.last_run)} | last success: ${formatDate(row.last_success)}\n` +
        `    counts: ${row.last_result_count || 0} (prev ${row.previous_result_count || 0}) | ${status}\n` +
        (row.notes ? `    notes: ${row.notes}\n` : '')
    );
  });
})();
